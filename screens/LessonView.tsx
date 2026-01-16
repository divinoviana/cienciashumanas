
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { curriculumData } from '../data';
import { ActivityInput } from '../components/ActivityInput';
import { SubmissionBar, SubmissionItem } from '../components/SubmissionBar';
import { ArrowLeft, BookOpen, PenTool, Sparkles, Home } from 'lucide-react';
import { evaluateActivities, AIResponse } from '../services/aiService';
import { AIFeedbackModal } from '../components/AIFeedbackModal';

export const LessonView: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);

  // Estados principais
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<AIResponse | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('student');
    if (!saved) {
      navigate('/login');
    } else {
      const data = JSON.parse(saved);
      setStudent(data);
    }
  }, [navigate]);

  // Reset de estado quando a aula muda (ex: vindo do botão "Refazer")
  useEffect(() => {
    setAnswers({});
    setAiData(null);
    setIsAIModalOpen(false);
  }, [lessonId]);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  if (!foundLesson) return <div className="p-8 text-center">Aula não encontrada.</div>;

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const getSubmissionData = (): SubmissionItem[] => {
    if (!foundLesson) return [];
    const data: SubmissionItem[] = [];
    foundLesson.activities.forEach(activity => {
      activity.questions?.forEach((q, idx) => {
        const key = `${activity.id}-${idx}`;
        const answer = answers[key];
        if (answer && answer.trim()) {
          data.push({ activityTitle: activity.title, question: q, answer: answer });
        }
      });
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
      alert("Erro na correção da IA. Você pode enviar a atividade mesmo assim."); 
      setIsAIModalOpen(false); 
    }
    finally { setAiLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <AIFeedbackModal isOpen={isAIModalOpen} isLoading={aiLoading} data={aiData} onClose={() => setIsAIModalOpen(false)} />
      
      {/* Botão Flutuante de Voltar para Home - Útil para scrolls longos */}
      <Link 
        to="/" 
        className="fixed top-20 left-4 z-40 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-200 text-slate-600 hover:text-tocantins-blue hover:scale-110 transition-all md:hidden"
        title="Voltar ao Início"
      >
        <Home size={20} />
      </Link>

      <div className="relative h-60 w-full overflow-hidden bg-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-slate-50"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center max-w-4xl">
           <div className="flex gap-2 mb-4">
              <Link to="/" className="inline-flex items-center text-white/90 bg-black/30 hover:bg-black/50 px-4 py-2 rounded-full backdrop-blur-md transition-colors border border-white/10 text-sm font-bold">
                <Home className="w-4 h-4 mr-2" /> Início
              </Link>
              <Link to={`/grade/${parentGradeId}`} className="inline-flex items-center text-white/90 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition-colors border border-white/10 text-sm font-bold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Grade
              </Link>
           </div>
          <h1 className="text-3xl font-bold text-white">{foundLesson.title}</h1>
          {student && (
            <div className="flex items-center gap-2 mt-4 text-white/90 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
               <img src={student.photo_url} className="w-6 h-6 rounded-full object-cover" />
               <span className="text-xs font-bold uppercase">{student.name} • {student.school_class}</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-10 mb-8">
          <div className="prose prose-slate prose-lg max-w-none mb-12">
            <h3 className="flex items-center text-2xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">
              <BookOpen className="w-7 h-7 mr-3 text-indigo-600" /> Teoria
            </h3>
            <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-indigo-500 whitespace-pre-wrap text-slate-700 leading-relaxed">
              {foundLesson.theory}
            </div>
          </div>

          <div className="mb-12">
            <h3 className="flex items-center text-2xl font-bold text-slate-800 mb-8">
              <PenTool className="w-7 h-7 mr-3 text-green-600" /> Atividades
            </h3>
            <div className="space-y-8">
              {foundLesson.activities.map((activity) => (
                <div key={activity.id} className="p-6 bg-slate-50/50 rounded-xl border border-slate-200">
                  <h4 className="font-bold mb-4 text-slate-800 border-b pb-2">{activity.title}</h4>
                  {activity.questions?.map((q, idx) => (
                    <ActivityInput key={`${activity.id}-${idx}`} questionId={`${activity.id}-${idx}`} questionText={q} value={answers[`${activity.id}-${idx}`] || ''} onChange={(val) => handleAnswerChange(`${activity.id}-${idx}`, val)} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleAICorrection} 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-1 mb-4"
          >
            <Sparkles size={20} /> Analisar Respostas com IA (Opcional)
          </button>
          
          <p className="text-center text-xs text-slate-400">
            Você pode revisar suas respostas com a IA antes de enviar definitivamente para o professor.
          </p>
        </div>

        {/* Botão de retorno adicional no fim do conteúdo */}
        <div className="flex justify-center pb-8">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-tocantins-blue transition-colors font-bold text-sm">
            <Home size={18} /> Voltar para a Página Inicial
          </Link>
        </div>
      </div>

      {student && (
        <SubmissionBar 
          studentName={student.name} 
          schoolClass={student.school_class} 
          submissionDate={getTodayString()} 
          lessonTitle={foundLesson.title} 
          submissionData={getSubmissionData()} 
          aiData={aiData} 
          theory={foundLesson.theory} 
        />
      )}
    </div>
  );
};
