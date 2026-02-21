
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { curriculumData } from '../data';
import { ActivityInput } from '../components/ActivityInput';
import { SubmissionBar, SubmissionItem } from '../components/SubmissionBar';
import { ArrowLeft, BookOpen, PenTool, Sparkles, Home, Loader2, ListChecks, HelpCircle } from 'lucide-react';
import { evaluateActivities, AIResponse, generateLessonActivity, LessonActivity } from '../services/aiService';
import { AIFeedbackModal } from '../components/AIFeedbackModal';
import { useAuth } from '../context/AuthContext';
import { VisualActivityRenderer } from '../components/VisualActivityRenderer';

export const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { student, isLoading } = useAuth();

  const [lessonActivity, setLessonActivity] = useState<LessonActivity | null>(null);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);

  useEffect(() => {
    if (!isLoading && !student) {
      navigate('/login');
    }
  }, [student, isLoading, navigate]);

  useEffect(() => {
    setAnswers({});
    setAiData(null);
    setIsAIModalOpen(false);
    setLessonActivity(null);
  }, [lessonId]);

  // Busca a lição e gera atividade via IA
  useEffect(() => {
    const fetchActivity = async () => {
      if (!foundLesson) return;
      setIsActivityLoading(true);
      try {
        const activity = await generateLessonActivity(foundLesson.title, foundLesson.theory);
        setLessonActivity(activity);
      } catch (e) {
        console.error("Erro ao gerar atividade:", e);
      } finally {
        setIsActivityLoading(false);
      }
    };
    if (lessonId) fetchActivity();
  }, [lessonId]);

  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  let foundLesson = null;
  let parentGradeId = 1;
  for (const g of curriculumData) {
    for (const b of g.bimesters) {
      const l = b.lessons.find(l => l.id === lessonId);
      if (l) {
        foundLesson = l;
        parentGradeId = g.id;
        break;
      }
    }
    if (foundLesson) break;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-tocantins-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!foundLesson) return <div className="p-8 text-center">Aula não encontrada.</div>;

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [`obj-${questionId}`]: option }));
  };

  const handleDiscursiveChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [`disc-${questionId}`]: value }));
  };

  const getSubmissionData = (): SubmissionItem[] => {
    if (!lessonActivity) return [];
    const data: SubmissionItem[] = [];

    lessonActivity.objectives.forEach(q => {
      const ans = answers[`obj-${q.id}`];
      if (ans) {
        data.push({ 
          activityTitle: "Questões Objetivas", 
          question: q.question, 
          answer: `Opção ${ans.toUpperCase()}: ${q.options[ans as keyof typeof q.options]}` 
        });
      }
    });

    lessonActivity.discursives.forEach(q => {
      const ans = answers[`disc-${q.id}`];
      if (ans && ans.trim()) {
        data.push({ 
          activityTitle: "Questão Discursiva", 
          question: q.question, 
          answer: ans 
        });
      }
    });

    return data;
  };

  const handleAICorrection = async () => {
    const subData = getSubmissionData();
    if (subData.length === 0) {
      alert("Por favor, responda as atividades antes de pedir uma análise da IA.");
      return;
    }
    setIsAIModalOpen(true);
    setAiLoading(true);
    try {
      const result = await evaluateActivities(foundLesson!.title, foundLesson!.theory, subData.map(d => ({question: d.question, answer: d.answer})));
      setAiData(result);
    } catch (e) { 
      alert("Erro na correção da IA."); 
      setIsAIModalOpen(false); 
    }
    finally { setAiLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 animate-in fade-in duration-500">
      <AIFeedbackModal isOpen={isAIModalOpen} isLoading={aiLoading} data={aiData} onClose={() => setIsAIModalOpen(false)} />
      
      <div className="relative h-60 w-full overflow-hidden bg-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-slate-50"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center max-w-4xl">
           <div className="flex gap-2 mb-4">
              <Link to="/" className="inline-flex items-center text-white/90 bg-black/30 hover:bg-black/50 px-4 py-2 rounded-full backdrop-blur-md transition-colors border border-white/10 text-sm font-bold">
                <Home className="w-4 h-4 mr-2" /> Início
              </Link>
              <Link to={`/grade/${parentGradeId}?subject=${foundLesson.subject}`} className="inline-flex items-center text-white/90 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-colors border border-white/10 text-sm font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Grade
              </Link>
           </div>
          <h1 className="text-3xl font-bold text-white">{foundLesson.title}</h1>
          {student && (
            <div className="flex items-center gap-2 mt-4 text-white/90 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
               <img src={student.photo_url} className="w-6 h-6 rounded-full object-cover" alt="User" />
               <span className="text-xs font-bold uppercase">{student.name} • {student.school_class}</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-10 mb-8">
          
          {/* SEÇÃO: TEORIA */}
          <div className="prose prose-slate prose-lg max-w-none mb-12">
            <h3 className="flex items-center text-2xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">
              <BookOpen className="w-7 h-7 mr-3 text-indigo-600" /> Teoria
            </h3>
            <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-indigo-500 whitespace-pre-wrap text-slate-700 leading-relaxed">
              {foundLesson.theory}
            </div>
          </div>

          {/* SEÇÃO: ATIVIDADES DINÂMICAS IA */}
          <div className="mb-12">
            <h3 className="flex items-center text-2xl font-bold text-slate-800 mb-8">
              <PenTool className="w-7 h-7 mr-3 text-green-600" /> Atividades
            </h3>

            {isActivityLoading ? (
              <div className="bg-slate-50 p-20 rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-center">
                 <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center animate-bounce">
                    <Sparkles className="text-tocantins-blue" size={32}/>
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">IA está criando sua atividade...</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gerando 5 objetivas, 2 discursivas e recursos visuais agora</p>
                 </div>
                 <Loader2 className="animate-spin text-tocantins-blue" size={24}/>
              </div>
            ) : (lessonActivity && lessonActivity.objectives && lessonActivity.discursives) ? (
              <div className="space-y-12">
                
                {/* RECURSO VISUAL DINÂMICO */}
                {lessonActivity.visualContent && (
                  <VisualActivityRenderer content={lessonActivity.visualContent} />
                )}

                {/* QUESTÕES OBJETIVAS */}
                <div className="space-y-8">
                   <div className="flex items-center gap-2 mb-4">
                      <ListChecks className="text-tocantins-blue" size={20}/>
                      <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Parte 1: Questões Objetivas</h4>
                   </div>
                   {lessonActivity.objectives.map((q, idx) => (
                     <div key={q.id} className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-200 space-y-6">
                        <div className="flex items-start gap-4">
                           <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black flex-shrink-0 text-sm">{idx + 1}</span>
                           <p className="text-lg font-bold text-slate-800 leading-tight">{q.question}</p>
                        </div>
                        <div className="space-y-3">
                           {Object.entries(q.options).map(([opt, text]) => (
                             <button 
                               key={opt}
                               onClick={() => handleOptionSelect(q.id, opt)}
                               className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${answers[`obj-${q.id}`] === opt ? 'border-tocantins-blue bg-blue-50 shadow-md ring-2 ring-blue-100' : 'border-white bg-white hover:bg-slate-50 hover:border-slate-100'}`}
                             >
                                <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 font-black uppercase text-[10px] ${answers[`obj-${q.id}`] === opt ? 'bg-tocantins-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                                   {opt}
                                </span>
                                <span className={`text-sm font-medium ${answers[`obj-${q.id}`] === opt ? 'text-blue-900' : 'text-slate-600'}`}>
                                   {text}
                                </span>
                             </button>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>

                {/* QUESTÕES DISCURSIVAS */}
                <div className="space-y-8">
                   <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="text-amber-500" size={20}/>
                      <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Parte 2: Questões Discursivas</h4>
                   </div>
                   {lessonActivity.discursives.map((q, idx) => (
                     <div key={q.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <ActivityInput 
                          questionId={q.id} 
                          questionText={`${idx + 6}. ${q.question}`} 
                          value={answers[`disc-${q.id}`] || ''} 
                          onChange={(val) => handleDiscursiveChange(q.id, val)} 
                        />
                     </div>
                   ))}
                </div>

                <button 
                  type="button"
                  onClick={handleAICorrection} 
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-6 rounded-3xl flex items-center justify-center gap-3 shadow-2xl hover:shadow-indigo-200 transition-all hover:-translate-y-1 mb-4 cursor-pointer"
                >
                  <Sparkles size={24} /> Analisar Meu Desempenho com IA
                </button>

              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">Clique para carregar as atividades.</div>
            )}
          </div>
        </div>
      </div>

      {student && (
        <SubmissionBar 
          studentName={student.name} 
          schoolClass={student.school_class} 
          submissionDate={getTodayString()} 
          lessonTitle={foundLesson.title} 
          subject={foundLesson.subject} 
          submissionData={getSubmissionData()} 
          aiData={aiData} 
          theory={foundLesson.theory} 
        />
      )}
    </div>
  );
};
