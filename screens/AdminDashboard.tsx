
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { subjectsInfo, ADMIN_PASSWORDS, curriculumData } from '../data';
import { Subject } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateBimonthlyEvaluation, GeneratedEvaluation } from '../services/aiService';
import { 
  Users, BookOpen, User, 
  MessageSquare, Loader2, X, Save, 
  RefreshCw, Home, ShieldCheck, Trash2, Settings,
  Search, Award, StickyNote, Clock, Send, UserCircle, BrainCircuit, Sparkles, FileText, CheckCircle2,
  Filter, Download
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { teacherSubject, loginTeacher, logoutTeacher } = useAuth();
  
  const [pass, setPass] = useState('');
  const [email, setEmail] = useState(''); 
  const [selectedAccess, setSelectedAccess] = useState<Subject | 'SUPER_ADMIN'>('filosofia');
  
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'submissions' | 'evaluations' | 'messages' | 'students' | 'manage' | 'exam_generator'>('submissions');
  
  // Gerador de Avaliação
  const [examGrade, setExamGrade] = useState('1');
  const [examBimester, setExamBimester] = useState('1');
  const [examClass, setExamClass] = useState('all');
  const [generatedExam, setGeneratedExam] = useState<GeneratedEvaluation | null>(null);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isPublishingExam, setIsPublishingExam] = useState(false);

  // Filtros de Relatório
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterBimester, setFilterBimester] = useState<string>('all');

  const isSuper = teacherSubject === 'SUPER_ADMIN';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccess === 'SUPER_ADMIN') {
        if (email === 'divinoviana@gmail.com' && pass === '3614526312') {
            loginTeacher('SUPER_ADMIN');
            setActiveTab('submissions');
        } else {
            alert("Credenciais de Super Admin incorretas.");
        }
    } else {
        if (pass === ADMIN_PASSWORDS[selectedAccess as Subject]) {
          loginTeacher(selectedAccess);
          setActiveTab('submissions');
        } else {
          alert("Senha incorreta.");
        }
    }
  };

  const handleExitAdmin = () => {
    logoutTeacher();
    navigate('/admin');
  };

  const loadData = async () => {
    if (!teacherSubject) return;
    setLoading(true);
    try {
      let subQuery = supabase.from('submissions').select('*').order('created_at', { ascending: false });
      let msgQuery = supabase.from('messages').select('*').order('created_at', { ascending: true });

      if (teacherSubject !== 'SUPER_ADMIN') {
        subQuery = subQuery.eq('subject', teacherSubject);
        msgQuery = msgQuery.eq('subject', teacherSubject);
      }

      const [stRes, subRes, msgRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        subQuery,
        msgQuery
      ]);

      setStudents(stRes.data || []);
      setSubmissions(subRes.data || []);
      setMessages(msgRes.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (teacherSubject) {
      loadData();
    }
  }, [teacherSubject]);

  const handleGenerateExam = async () => {
    if (!teacherSubject || teacherSubject === 'SUPER_ADMIN') {
      alert("Apenas professores de disciplina podem gerar avaliações.");
      return;
    }

    setIsGeneratingExam(true);
    try {
      const gradeData = curriculumData.find(g => g.id === Number(examGrade));
      const bimesterData = gradeData?.bimesters.find(b => b.id === Number(examBimester));
      const lessons = bimesterData?.lessons.filter(l => l.subject === teacherSubject) || [];
      const topics = lessons.map(l => l.title);

      if (topics.length === 0) {
        alert("Não foram encontrados conteúdos para esta série/bimestre nesta disciplina.");
        setIsGeneratingExam(false);
        return;
      }

      const exam = await generateBimonthlyEvaluation(
        subjectsInfo[teacherSubject as Subject].name,
        examGrade,
        examBimester,
        topics
      );
      setGeneratedExam(exam);
    } catch (err: any) {
      alert("Erro ao gerar prova: " + err.message);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handlePublishExam = async () => {
    if (!generatedExam || !teacherSubject) return;
    setIsPublishingExam(true);
    try {
      const { error } = await supabase.from('bimonthly_exams').insert([{
        subject: teacherSubject,
        grade: Number(examGrade),
        bimester: Number(examBimester),
        school_class: examClass === 'all' ? null : examClass,
        questions: generatedExam.questions,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      alert(`Avaliação de ${subjectsInfo[teacherSubject as Subject].name} publicada!`);
      setGeneratedExam(null);
    } catch (err: any) {
      alert("Erro ao publicar: " + err.message);
    } finally {
      setIsPublishingExam(false);
    }
  };

  const classOptions = useMemo(() => {
    const grade = filterGrade === 'all' ? examGrade : filterGrade;
    if (grade === '1') return Array.from({length: 6}, (_, i) => `13.0${i+1}`);
    if (grade === '2') return Array.from({length: 8}, (_, i) => `23.0${i+1}`);
    if (grade === '3') return Array.from({length: 9}, (_, i) => `33.0${i+1}`);
    return [];
  }, [examGrade, filterGrade]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchName = sub.student_name.toLowerCase().includes(searchTerm.toLowerCase());
      const subGrade = sub.school_class.substring(0, 1);
      const matchGrade = filterGrade === 'all' || subGrade === filterGrade;
      const matchClass = filterClass === 'all' || sub.school_class === filterClass;
      
      // Filtro específico para o Relatório de Notas (Avaliações Bimestrais)
      if (activeTab === 'evaluations') {
        const isExam = sub.lesson_title.startsWith('Avaliação Bimestral');
        const matchBimester = filterBimester === 'all' || sub.lesson_title.includes(`${filterBimester}º Bimestre`);
        return matchName && matchGrade && matchClass && isExam && matchBimester;
      }

      return matchName && matchGrade && matchClass;
    });
  }, [submissions, searchTerm, filterGrade, filterClass, filterBimester, activeTab]);

  if (!teacherSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm border border-slate-100">
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-tocantins-blue rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
                <ShieldCheck className="text-white" size={40}/>
             </div>
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Área Docente</h2>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none" value={selectedAccess} onChange={e => setSelectedAccess(e.target.value as any)}>
              <option value="SUPER_ADMIN">👑 Gestão Geral (Super Admin)</option>
              {Object.entries(subjectsInfo).map(([k, v]) => <option key={k} value={k}>Professor de {v.name}</option>)}
            </select>
            {selectedAccess === 'SUPER_ADMIN' && <input required type="email" placeholder="Email Administrativo" className="w-full p-4 border rounded-2xl bg-slate-50 outline-none" value={email} onChange={e => setEmail(e.target.value)} />}
            <input required type="password" placeholder="Senha de Acesso" className="w-full p-4 border rounded-2xl bg-slate-50 outline-none" value={pass} onChange={e => setPass(e.target.value)} />
            <button type="submit" className="w-full bg-tocantins-blue text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">Acessar Painel</button>
          </form>
        </div>
      </div>
    );
  }

  const currentSubInfo = !isSuper ? subjectsInfo[teacherSubject as Subject] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-hidden">
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0 border-r border-white/5">
        <div className="mb-10 text-center">
           <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl shadow-2xl ${isSuper ? 'bg-amber-500' : currentSubInfo?.color}`}>
             {isSuper ? '👑' : currentSubInfo?.icon}
           </div>
           <h2 className="font-black text-sm uppercase tracking-tight">{isSuper ? 'Super Admin' : `Prof. ${currentSubInfo?.name}`}</h2>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('submissions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'submissions' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <BookOpen size={18}/> Atividades Diárias
          </button>
          {!isSuper && (
            <button onClick={() => setActiveTab('exam_generator')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'exam_generator' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <BrainCircuit size={18}/> Gerar Avaliação
            </button>
          )}
          <button onClick={() => setActiveTab('evaluations')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'evaluations' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <Award size={18}/> Relatório de Notas
          </button>
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'messages' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <MessageSquare size={18}/> Chat e Alertas
          </button>
        </nav>
        
        <button onClick={handleExitAdmin} className="w-full flex items-center justify-center gap-2 p-5 text-slate-300 bg-white/5 hover:bg-red-500/20 hover:text-red-300 rounded-2xl transition-all text-xs font-black uppercase mt-8 border border-white/10 shadow-sm cursor-pointer">
          <Home size={18}/> Sair do Painel
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b p-6 flex justify-between items-center z-10 shadow-sm">
           <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
             {activeTab === 'evaluations' ? 'Relatório de Notas Bimestrais' : activeTab === 'exam_generator' ? 'Gerador de Simulados' : 'Gestão Pedagógica'}
           </h1>
           <button onClick={loadData} className="p-3 text-slate-400 hover:text-tocantins-blue bg-slate-100 rounded-xl transition-all cursor-pointer">
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50/50">
           
           {/* FILTROS GERAIS (Aparecem em quase todas as abas) */}
           {activeTab !== 'exam_generator' && (
              <div className="mb-8 bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end animate-in fade-in">
                 <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Buscar Estudante</label>
                    <div className="relative">
                       <Search className="absolute left-4 top-3.5 text-slate-300" size={18}/>
                       <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nome do aluno..." className="w-full pl-12 p-3.5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-tocantins-blue/20 text-sm font-medium" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Série</label>
                    <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="p-3.5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-tocantins-blue/20 text-sm font-bold min-w-[120px]">
                       <option value="all">Todas</option>
                       <option value="1">1ª Série</option>
                       <option value="2">2ª Série</option>
                       <option value="3">3ª Série</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Turma</label>
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-3.5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-tocantins-blue/20 text-sm font-bold min-w-[120px]">
                       <option value="all">Todas</option>
                       {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 {activeTab === 'evaluations' && (
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Bimestre</label>
                      <select value={filterBimester} onChange={e => setFilterBimester(e.target.value)} className="p-3.5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-tocantins-blue/20 text-sm font-bold min-w-[120px]">
                         <option value="all">Todos</option>
                         <option value="1">1º Bim</option>
                         <option value="2">2º Bim</option>
                         <option value="3">3º Bim</option>
                         <option value="4">4º Bim</option>
                      </select>
                    </div>
                 )}
              </div>
           )}

           {activeTab === 'evaluations' && (
              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-900 text-white">
                          <tr>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Estudante</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Turma</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Disciplina</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Avaliação</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Nota Final</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Data</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {filteredSubmissions.length === 0 ? (
                             <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold">Nenhuma nota encontrada para os filtros selecionados.</td></tr>
                          ) : (
                             filteredSubmissions.map(sub => (
                                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                   <td className="p-6">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                                            {sub.student_name.charAt(0)}
                                         </div>
                                         <span className="font-bold text-slate-800">{sub.student_name}</span>
                                      </div>
                                   </td>
                                   <td className="p-6"><span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600">{sub.school_class}</span></td>
                                   <td className="p-6">
                                      <span className={`text-[10px] font-black uppercase ${subjectsInfo[sub.subject as Subject]?.color.replace('bg-', 'text-')}`}>
                                         {subjectsInfo[sub.subject as Subject]?.name}
                                      </span>
                                   </td>
                                   <td className="p-6 text-sm font-medium text-slate-600">{sub.lesson_title}</td>
                                   <td className="p-6">
                                      <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border ${Number(sub.score) >= 6 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                         {Number(sub.score).toFixed(1)}
                                      </div>
                                   </td>
                                   <td className="p-6 text-right text-[10px] font-bold text-slate-400">
                                      {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {activeTab === 'submissions' && (
              <div className="max-w-6xl mx-auto space-y-6">
                {filteredSubmissions.length === 0 ? <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-400 font-bold">Nenhum envio recebido ainda.</div> : 
                  filteredSubmissions.map(sub => (
                    <div key={sub.id} className="bg-white rounded-[32px] border shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
                       <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                                {sub.student_photo ? <img src={sub.student_photo} className="w-full h-full object-cover" /> : <User className="m-auto mt-3 text-slate-300"/>}
                             </div>
                             <div>
                                <h3 className="font-black text-slate-800 uppercase">{sub.student_name}</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase">{sub.school_class} • {sub.lesson_title}</p>
                             </div>
                             <div className={`ml-auto px-4 py-2 rounded-2xl font-black text-sm ${sub.lesson_title.startsWith('Avaliação') ? 'bg-indigo-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                {sub.lesson_title.startsWith('Avaliação') ? 'AVALIAÇÃO' : 'ATIVIDADE'}
                             </div>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                             {sub.content?.map((item: any, i: number) => (
                               <div key={i}><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Questão {i+1}</p><p className="text-sm font-medium text-slate-700 italic">"{item.answer}"</p></div>
                             ))}
                          </div>
                       </div>
                    </div>
                  ))
                }
              </div>
           )}

           {activeTab === 'exam_generator' && !isSuper && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                 <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                    <Sparkles className="absolute -top-4 -right-4 w-32 h-32 opacity-10" />
                    <div className="relative z-10">
                       <h3 className="text-2xl font-black uppercase mb-2">Simulado Estilo ENEM</h3>
                       <p className="text-indigo-100 text-sm opacity-80 font-medium">As questões serão baseadas no currículo oficial da BNCC.</p>
                       
                       <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 ml-1">Série</label>
                             <select value={examGrade} onChange={e => setExamGrade(e.target.value)} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none font-bold">
                                <option className="text-slate-800" value="1">1ª Série</option>
                                <option className="text-slate-800" value="2">2ª Série</option>
                                <option className="text-slate-800" value="3">3ª Série</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 ml-1">Bimestre</label>
                             <select value={examBimester} onChange={e => setExamBimester(e.target.value)} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none font-bold">
                                <option className="text-slate-800" value="1">1º Bimestre</option>
                                <option className="text-slate-800" value="2">2º Bimestre</option>
                                <option className="text-slate-800" value="3">3º Bimestre</option>
                                <option className="text-slate-800" value="4">4º Bimestre</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 ml-1">Público</label>
                             <select value={examClass} onChange={e => setExamClass(e.target.value)} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none font-bold">
                                <option className="text-slate-800" value="all">Todas as turmas</option>
                                {classOptions.map(c => <option key={c} className="text-slate-800" value={c}>{c}</option>)}
                             </select>
                          </div>
                       </div>

                       <button 
                         onClick={handleGenerateExam} 
                         disabled={isGeneratingExam}
                         className="mt-8 w-full bg-white text-indigo-700 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                       >
                          {isGeneratingExam ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                          {isGeneratingExam ? 'A IA está elaborando as questões...' : 'Gerar Nova Avaliação'}
                       </button>
                    </div>
                 </div>

                 {generatedExam && (
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                       <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                          <div>
                             <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl">Prévia para {examClass === 'all' ? `todas as turmas` : `Turma ${examClass}`}</h4>
                          </div>
                          <button 
                            onClick={handlePublishExam}
                            disabled={isPublishingExam}
                            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 shadow-lg flex items-center gap-2 cursor-pointer"
                          >
                             {isPublishingExam ? <Loader2 className="animate-spin" /> : <Send size={18}/>}
                             Confirmar e Enviar
                          </button>
                       </div>
                       <div className="p-8 space-y-10">
                          {generatedExam.questions.map((q, idx) => (
                             <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-2">
                                   <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">{idx + 1}</span>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-slate-200 italic text-sm text-slate-600 leading-relaxed">
                                   "{q.textFragment}"
                                </div>
                                <p className="font-bold text-slate-800 leading-snug">{q.questionText}</p>
                                <div className="grid grid-cols-1 gap-2 pl-4">
                                   {Object.entries(q.options).map(([key, val]) => (
                                      <div key={key} className={`p-4 rounded-xl border text-sm ${key === q.correctOption ? 'border-green-500 bg-green-50 font-bold' : 'border-slate-100 bg-slate-50'}`}>
                                         <span className="uppercase mr-2 font-black">{key})</span> {val}
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           )}

        </div>
      </main>
    </div>
  );
};
