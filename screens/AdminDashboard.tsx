
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { subjectsInfo, ADMIN_PASSWORDS, TEACHER_INFO, curriculumData } from '../data';
import { Subject } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Key, User, 
  MessageSquare, Loader2, X, Save, 
  ChevronDown, ChevronUp, CheckCircle2,
  ArrowLeft, Send, RefreshCw, LayoutGrid, LogOut,
  BellRing, ChevronLeft, ShieldCheck, Trash2, Settings,
  FileSpreadsheet, Search, Filter, Mail, Award, StickyNote, Clock, History, Plus
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loggedSubject, setLoggedSubject] = useState<Subject | 'SUPER_ADMIN' | null>(null);
  const [pass, setPass] = useState('');
  const [email, setEmail] = useState(''); 
  const [selectedAccess, setSelectedAccess] = useState<Subject | 'SUPER_ADMIN'>('filosofia');
  
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'students' | 'submissions' | 'photos' | 'messages' | 'evaluations' | 'manage'>('submissions');
  
  const [selectedStudentForObs, setSelectedStudentForObs] = useState<any | null>(null);
  const [newObs, setNewObs] = useState('');
  const [savingObs, setSavingObs] = useState(false);

  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);

  const [activeChatStudent, setActiveChatStudent] = useState<string | null>(null);
  const [activeChatSubject, setActiveChatSubject] = useState<Subject>('filosofia');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const checkAdmin = () => {
    if (selectedAccess === 'SUPER_ADMIN') {
        if (email === 'divinoviana@gmail.com' && pass === '3614526312') {
            setLoggedSubject('SUPER_ADMIN');
            setTab('manage');
            fetchAllData();
        } else {
            alert("Credenciais de Super Admin inválidas.");
        }
        return;
    }

    if (pass === ADMIN_PASSWORDS[selectedAccess as Subject]) {
      setLoggedSubject(selectedAccess as Subject);
      setActiveChatSubject(selectedAccess as Subject);
      fetchData(selectedAccess as Subject);
    } else {
      alert("Senha incorreta para esta disciplina.");
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [stRes, subRes, msgRes, obsRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('student_observations').select('*').order('created_at', { ascending: false })
      ]);
      setStudents(stRes.data || []);
      setSubmissions(subRes.data || []);
      setMessages(msgRes.data || []);
      setObservations(obsRes.data || []);
    } finally { setLoading(false); }
  };

  const fetchData = async (subject: Subject) => {
    setLoading(true);
    try {
      const [stRes, subRes, msgRes, obsRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('submissions').select('*').eq('subject', subject).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').eq('subject', subject).order('created_at', { ascending: true }),
        supabase.from('student_observations').select('*').eq('subject', subject).order('created_at', { ascending: false })
      ]);
      setStudents(stRes.data || []);
      setSubmissions(subRes.data || []);
      setMessages(msgRes.data || []);
      setObservations(obsRes.data || []);
      
      const initialFeedbacks: Record<string, string> = {};
      subRes.data?.forEach(s => { if (s.teacher_feedback) initialFeedbacks[s.id] = s.teacher_feedback; });
      setFeedbacks(initialFeedbacks);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!loggedSubject) return;
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (loggedSubject === 'SUPER_ADMIN') fetchAllData();
        else fetchData(loggedSubject as Subject);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_observations' }, () => {
        if (loggedSubject === 'SUPER_ADMIN') fetchAllData();
        else fetchData(loggedSubject as Subject);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loggedSubject]);

  useEffect(() => {
    if (tab === 'messages' && activeChatStudent) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatStudent, tab]);

  const handleSaveFeedback = async (submissionId: string) => {
    setSavingFeedback(submissionId);
    try {
      const { error } = await supabase.from('submissions').update({ teacher_feedback: feedbacks[submissionId] }).eq('id', submissionId);
      if (error) throw error;
      alert("Feedback enviado!");
      if (loggedSubject === 'SUPER_ADMIN') fetchAllData(); else fetchData(loggedSubject as Subject);
    } finally { setSavingFeedback(null); }
  };

  const handleSaveObservation = async () => {
    if (!newObs.trim() || !selectedStudentForObs || !loggedSubject) return;
    setSavingObs(true);
    try {
      const { error } = await supabase.from('student_observations').insert([{
        student_id: selectedStudentForObs.id,
        subject: loggedSubject === 'SUPER_ADMIN' ? 'GERAL' : loggedSubject,
        content: newObs.trim()
      }]);
      if (error) throw error;
      setNewObs('');
    } catch (e: any) { alert("Erro ao salvar observação: " + e.message); }
    finally { setSavingObs(false); }
  };

  const handleDeleteObservation = async (id: string) => {
    if (!confirm("Remover esta anotação do histórico?")) return;
    await supabase.from('student_observations').delete().eq('id', id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatStudent) return;
    setSendingMsg(true);
    const studentData = students.find(s => s.id === activeChatStudent);
    try {
      await supabase.from('messages').insert([{
        sender_id: activeChatStudent,
        sender_name: studentData?.name || "Estudante",
        school_class: studentData?.school_class || "N/A",
        grade: studentData?.grade || "N/A",
        content: newMessage.trim(),
        is_from_teacher: true,
        subject: loggedSubject === 'SUPER_ADMIN' ? activeChatSubject : loggedSubject
      }]);
      setNewMessage('');
    } finally { setSendingMsg(false); }
  };

  const handleLogout = () => {
    if (confirm("Deseja sair do painel administrativo?")) {
      setLoggedSubject(null);
      setPass('');
      setEmail('');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchGrade = filterGrade === 'all' || String(st.grade) === filterGrade;
      const matchClass = filterClass === 'all' || st.school_class === filterClass;
      const matchSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGrade && matchClass && matchSearch;
    });
  }, [students, filterGrade, filterClass, searchTerm]);

  const evaluationReport = useMemo(() => {
    return filteredStudents.map(st => {
      const stSubmissions = submissions.filter(s => s.student_name === st.name);
      const gradesByBimester = [1, 2, 3, 4].map(b => {
          const bSubmissions = stSubmissions.filter(s => {
              return s.lesson_title.toLowerCase().includes(`${b}º bimestre`) || 
                     s.lesson_title.toLowerCase().includes(`b${b}`);
          });
          if (bSubmissions.length === 0) return '-';
          const avg = bSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / bSubmissions.length;
          return avg.toFixed(1);
      });
      return { ...st, grades: gradesByBimester };
    });
  }, [filteredStudents, submissions]);

  const chatGroups = useMemo(() => {
    const relevantMsgs = loggedSubject === 'SUPER_ADMIN' 
        ? messages.filter(m => m.subject === activeChatSubject)
        : messages;

    return Array.from(new Set(relevantMsgs.map(m => m.sender_id)))
      .filter(id => id !== null)
      .map(studentId => {
        const studentMsgs = relevantMsgs.filter(m => m.sender_id === studentId);
        const student = students.find(s => s.id === studentId);
        return {
          studentId,
          studentName: student?.name || studentMsgs[0]?.sender_name || "Estudante",
          schoolClass: student?.school_class || studentMsgs[0]?.school_class || "N/A",
          lastMsg: studentMsgs[studentMsgs.length - 1],
        };
      })
      .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime());
  }, [messages, students, activeChatSubject, loggedSubject]);

  if (!loggedSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
        <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-sm w-full border border-slate-100">
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-tocantins-blue rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
                <ShieldCheck className="text-white" size={40}/>
             </div>
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Área Restrita</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Acesso para Docentes e Gestão</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Acesso</label>
              <select className="w-full p-4 border rounded-2xl mt-1 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-tocantins-blue" value={selectedAccess} onChange={e => setSelectedAccess(e.target.value as any)}>
                <option value="SUPER_ADMIN">👑 Super Admin (Divino Viana)</option>
                <option disabled>──────────</option>
                {Object.entries(subjectsInfo).map(([k, v]) => <option key={k} value={k}>Prof. de {v.name}</option>)}
              </select>
            </div>

            {selectedAccess === 'SUPER_ADMIN' && (
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Admin</label>
                    <input type="email" placeholder="nome@exemplo.com" className="w-full p-4 border rounded-2xl mt-1 bg-slate-50 outline-none focus:ring-2 focus:ring-tocantins-blue" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <input type="password" placeholder="••••••••" className="w-full p-4 border rounded-2xl mt-1 bg-slate-50 outline-none focus:ring-2 focus:ring-tocantins-blue" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAdmin()} />
            </div>
            
            <button onClick={checkAdmin} className="w-full bg-tocantins-blue text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-800 transition-all active:scale-95">Entrar no Painel</button>
            <button onClick={() => navigate('/')} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest pt-2 hover:text-slate-600 transition">Voltar ao Portal</button>
          </div>
        </div>
      </div>
    );
  }

  const isSuper = loggedSubject === 'SUPER_ADMIN';
  const currentSubInfo = !isSuper ? subjectsInfo[loggedSubject as Subject] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* SIDEBAR (Desktop) */}
      <aside className="w-72 bg-slate-900 text-white p-6 hidden lg:flex flex-col shrink-0">
        <div className="mb-10">
           <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black mb-8 uppercase tracking-widest transition-colors">
             <ArrowLeft size={14}/> Sair do Painel
           </button>
           <div className="bg-white/5 p-5 rounded-[24px] border border-white/10 text-center">
             {isSuper ? (
                 <>
                    <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-amber-900/20">👑</div>
                    <h2 className="font-bold text-sm">Super Admin</h2>
                    <p className="text-[9px] text-amber-400/80 font-black uppercase tracking-widest mt-1">Gestor do Sistema</p>
                 </>
             ) : (
                 <>
                    <div className={`w-14 h-14 ${currentSubInfo?.color} rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg`}>{currentSubInfo?.icon}</div>
                    <h2 className="font-bold text-sm">Prof. de {currentSubInfo?.name}</h2>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Sessão Ativa</p>
                 </>
             )}
           </div>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setTab('submissions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${tab === 'submissions' ? 'bg-tocantins-blue text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><BookOpen size={18}/> Atividades</button>
          <button onClick={() => setTab('evaluations')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${tab === 'evaluations' ? 'bg-tocantins-blue text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><Award size={18}/> Avaliações</button>
          <button onClick={() => setTab('messages')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${tab === 'messages' ? 'bg-tocantins-blue text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><MessageSquare size={18}/> Mensagens</button>
          <button onClick={() => setTab('students')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${tab === 'students' ? 'bg-tocantins-blue text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><Users size={18}/> Alunos</button>
          <button onClick={() => setTab('photos')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${tab === 'photos' ? 'bg-tocantins-blue text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><LayoutGrid size={18}/> Carômetro</button>
          {isSuper && <button onClick={() => setTab('manage')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${tab === 'manage' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}><Settings size={18}/> Gerenciar</button>}
        </nav>
        
        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition text-xs font-bold uppercase tracking-widest"><LogOut size={16}/> Sair</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="bg-white border-b p-4 lg:p-8 flex flex-col gap-6 shadow-sm z-10">
           <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tighter">
                   {isSuper ? 'Console Super Admin' : `Painel: ${currentSubInfo?.name}`}
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   Docente: {TEACHER_INFO.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-tocantins-blue w-48 lg:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>
                 <button onClick={() => isSuper ? fetchAllData() : fetchData(loggedSubject as Subject)} className="p-3 text-slate-400 hover:text-tocantins-blue bg-slate-50 rounded-xl transition-all hover:rotate-180 duration-500"><RefreshCw size={20}/></button>
              </div>
           </div>

           {/* Mobile Navigation Bar */}
           <div className="flex gap-2 lg:hidden overflow-x-auto no-scrollbar pb-1 border-b border-slate-100">
              <button onClick={() => setTab('submissions')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${tab === 'submissions' ? 'bg-tocantins-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>Atividades</button>
              <button onClick={() => setTab('evaluations')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${tab === 'evaluations' ? 'bg-tocantins-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>Notas</button>
              <button onClick={() => setTab('messages')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${tab === 'messages' ? 'bg-tocantins-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>Chat</button>
              <button onClick={() => setTab('students')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${tab === 'students' ? 'bg-tocantins-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>Alunos</button>
              <button onClick={() => setTab('photos')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${tab === 'photos' ? 'bg-tocantins-blue text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>Carômetro</button>
              {isSuper && <button onClick={() => setTab('manage')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${tab === 'manage' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>Gestão</button>}
           </div>
           
           <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                 <Filter size={14} className="text-slate-400"/>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros:</span>
              </div>
              <select className="bg-white border-none rounded-xl text-[10px] font-bold px-4 py-2 shadow-sm outline-none focus:ring-2 focus:ring-tocantins-blue" value={filterGrade} onChange={e => {setFilterGrade(e.target.value); setFilterClass('all');}}>
                 <option value="all">Todas as Séries</option>
                 <option value="1">1ª Série</option>
                 <option value="2">2ª Série</option>
                 <option value="3">3ª Série</option>
              </select>
              <select className="bg-white border-none rounded-xl text-[10px] font-bold px-4 py-2 shadow-sm outline-none focus:ring-2 focus:ring-tocantins-blue" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                 <option value="all">Todas as Turmas</option>
                 {filterGrade === '1' && Array.from({length: 6}, (_, i) => `13.0${i+1}`).map(c => <option key={c} value={c}>{c}</option>)}
                 {filterGrade === '2' && Array.from({length: 8}, (_, i) => `23.0${i+1}`).map(c => <option key={c} value={c}>{c}</option>)}
                 {filterGrade === '3' && Array.from({length: 9}, (_, i) => `33.0${i+1}`).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 scroll-smooth">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-tocantins-blue rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Banco...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
               
               {/* TAB: SUBMISSIONS (ATIVIDADES) */}
               {tab === 'submissions' && (
                 <div className="space-y-4">
                    {submissions.filter(s => {
                        const student = students.find(st => st.name === s.student_name);
                        const matchGrade = filterGrade === 'all' || String(student?.grade) === filterGrade;
                        const matchClass = filterClass === 'all' || s.school_class === filterClass;
                        const matchSearch = s.student_name.toLowerCase().includes(searchTerm.toLowerCase());
                        return matchGrade && matchClass && matchSearch;
                    }).map(sub => (
                        <div key={sub.id} className={`bg-white rounded-3xl border transition-all duration-300 ${expandedSub === sub.id ? 'ring-4 ring-tocantins-blue/10 shadow-2xl scale-[1.01]' : 'shadow-sm hover:shadow-md'}`}>
                          <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}>
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-100 overflow-hidden shadow-inner">
                                  {sub.student_photo ? <img src={sub.student_photo} className="w-full h-full object-cover" /> : <User size={24}/>}
                               </div>
                               <div className="min-w-0">
                                  <h3 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{sub.student_name}</h3>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sub.school_class} • {sub.lesson_title}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-right hidden sm:block">
                                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Nota</p>
                                  <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black text-xs">{(sub.score || 0).toFixed(1)}</div>
                               </div>
                               {expandedSub === sub.id ? <ChevronUp className="text-slate-300" size={20}/> : <ChevronDown className="text-slate-300" size={20}/>}
                            </div>
                          </div>
                          {expandedSub === sub.id && (
                            <div className="p-8 border-t bg-slate-50/30 rounded-b-3xl space-y-8 animate-in slide-in-from-top-4">
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                  <div className="space-y-6">
                                     <h4 className="font-black text-slate-700 text-xs uppercase tracking-widest">Respostas enviadas</h4>
                                     {sub.content?.map((item: any, i: number) => (
                                       <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                          <p className="text-[9px] font-black text-slate-300 mb-1 uppercase">P: {item.question}</p>
                                          <p className="text-sm text-slate-800 font-medium leading-relaxed">{item.answer}</p>
                                       </div>
                                     ))}
                                  </div>
                                  <div className="space-y-6">
                                     <h4 className="font-black text-slate-700 text-xs uppercase tracking-widest">Avaliação do Docente</h4>
                                     <textarea className="w-full p-5 h-40 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-tocantins-blue" placeholder="Escreva seu Feedback..." value={feedbacks[sub.id] || ''} onChange={(e) => setFeedbacks({...feedbacks, [sub.id]: e.target.value})}/>
                                     <button onClick={() => handleSaveFeedback(sub.id)} disabled={savingFeedback === sub.id} className="w-full bg-tocantins-blue text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-200 disabled:opacity-50">{savingFeedback === sub.id ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar Avaliação</button>
                                  </div>
                               </div>
                            </div>
                          )}
                        </div>
                    ))}
                 </div>
               )}

               {/* TAB: EVALUATIONS (NOTAS) */}
               {tab === 'evaluations' && (
                 <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in">
                    <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Planilha de Rendimento</h3>
                        <button onClick={() => window.print()} className="bg-white border px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition">Exportar PDF</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Estudante</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">1º B</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">2º B</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">3º B</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">4º B</th>
                                    <th className="p-6 text-[10px] font-black text-slate-800 uppercase text-center">Média</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {evaluationReport.map(st => {
                                    const validGrades = st.grades.filter(g => g !== '-').map(Number);
                                    const finalAvg = validGrades.length > 0 ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length).toFixed(1) : '-';
                                    return (
                                        <tr key={st.id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-6 font-bold text-slate-700 text-sm">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100">{st.photo_url && <img src={st.photo_url} className="w-full h-full object-cover"/>}</div>
                                                {st.name}
                                              </div>
                                            </td>
                                            {st.grades.map((grade, idx) => (
                                                <td key={idx} className={`p-6 text-center font-black text-sm ${grade === '-' ? 'text-slate-300' : 'text-tocantins-blue'}`}>{grade}</td>
                                            ))}
                                            <td className="p-6 text-center font-black text-sm text-green-600">{finalAvg}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 </div>
               )}

               {/* TAB: MESSAGES (MENSAGENS) */}
               {tab === 'messages' && (
                 <div className="flex bg-white rounded-[40px] border shadow-2xl h-[70vh] overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className={`${activeChatStudent ? 'hidden lg:block' : 'w-full'} lg:w-80 border-r overflow-y-auto bg-slate-50`}>
                       <div className="p-4 border-b font-black text-slate-400 text-[10px] uppercase">Recentes</div>
                       {chatGroups.map(group => (
                           <div key={group.studentId} onClick={() => setActiveChatStudent(group.studentId)} className={`p-4 border-b cursor-pointer transition-all flex items-center gap-3 ${activeChatStudent === group.studentId ? 'bg-white border-l-4 border-l-tocantins-blue' : 'hover:bg-white'}`}>
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 border shrink-0">{group.studentName?.charAt(0)}</div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-bold text-slate-800 text-xs truncate">{group.studentName}</h4>
                                 <p className="text-[9px] text-slate-400 truncate">{group.lastMsg?.content}</p>
                              </div>
                           </div>
                       ))}
                    </div>
                    <div className="flex-1 flex flex-col bg-white">
                        {activeChatStudent ? (
                            <>
                               <div className="p-4 border-b flex items-center gap-3 bg-slate-50/50">
                                  <button onClick={() => setActiveChatStudent(null)} className="lg:hidden text-slate-400"><ChevronLeft/></button>
                                  <div>
                                     <h3 className="font-bold text-sm">{students.find(s => s.id === activeChatStudent)?.name}</h3>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase">{students.find(s => s.id === activeChatStudent)?.school_class}</p>
                                  </div>
                               </div>
                               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                  {messages.filter(m => m.sender_id === activeChatStudent && (isSuper ? m.subject === activeChatSubject : true)).map(msg => (
                                    <div key={msg.id} className={`flex ${msg.is_from_teacher ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.is_from_teacher ? 'bg-tocantins-blue text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                                         <p>{msg.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                  <div ref={chatEndRef} />
                               </div>
                               <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Responder aluno..." className="flex-1 p-3 bg-slate-50 rounded-xl text-xs outline-none" />
                                  <button type="submit" disabled={sendingMsg || !newMessage.trim()} className="bg-tocantins-blue text-white w-12 rounded-xl flex items-center justify-center shadow-lg"><Send size={18}/></button>
                               </form>
                            </>
                        ) : <div className="flex-1 flex items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest">Selecione um chat para começar</div>}
                    </div>
                 </div>
               )}

               {/* TAB: STUDENTS (ALUNOS) */}
               {tab === 'students' && (
                 <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in">
                    <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Relação de Estudantes</h3>
                        <span className="text-[10px] font-black bg-slate-200 px-3 py-1 rounded-full uppercase">{filteredStudents.length} matriculados</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Aluno</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turma</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Atividade</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {filteredStudents.map(st => (
                             <tr key={st.id} className="hover:bg-slate-50 transition group">
                                <td className="p-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center font-black text-slate-300 overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                          {st.photo_url ? <img src={st.photo_url} className="w-full h-full object-cover" /> : st.name?.charAt(0)}
                                      </div>
                                      <span className="font-black text-slate-800 text-sm uppercase">{st.name}</span>
                                   </div>
                                </td>
                                <td className="p-6 text-[10px] font-black text-slate-500 uppercase">{st.school_class}</td>
                                <td className="p-6 text-center">
                                   <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                      {submissions.filter(s => s.student_name === st.name).length} envios
                                   </span>
                                </td>
                                <td className="p-6 text-center">
                                   <div className="flex justify-center gap-2">
                                     <button onClick={() => { setActiveChatStudent(st.id); setTab('messages'); }} className="p-2 text-tocantins-blue hover:bg-blue-50 rounded-xl transition shadow-sm"><MessageSquare size={18}/></button>
                                     <button onClick={() => { setSelectedStudentForObs(st); }} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition shadow-sm"><StickyNote size={18}/></button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {/* TAB: PHOTOS (CARÔMETRO) */}
               {tab === 'photos' && (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in duration-500">
                    {filteredStudents.map(st => {
                      const stObs = observations.filter(o => o.student_id === st.id);
                      return (
                        <div key={st.id} onClick={() => setSelectedStudentForObs(st)} className="bg-white p-4 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer relative overflow-hidden">
                           <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-slate-100 shadow-inner group-hover:scale-95 transition-transform duration-500 relative">
                              {st.photo_url ? (
                                  <img src={st.photo_url} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500" alt={st.name} />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><User size={40}/></div>
                              )}
                              {stObs.length > 0 && (
                                <div className="absolute top-2 right-2 bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">
                                  <StickyNote size={12}/>
                                </div>
                              )}
                           </div>
                           <div className="text-center">
                              <h4 className="text-[10px] font-black text-slate-800 uppercase truncate mb-1 tracking-tighter">{st.name}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{st.school_class}</p>
                           </div>
                           <div className="absolute inset-0 bg-tocantins-blue/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300 p-4 text-center">
                              <History size={24} className="mb-2"/>
                              <p className="text-[10px] font-black uppercase tracking-widest">Ver Prontuário</p>
                              {stObs.length > 0 && <p className="text-[8px] mt-1 font-bold">{stObs.length} anotações</p>}
                           </div>
                        </div>
                      );
                    })}
                 </div>
               )}

               {/* TAB: MANAGE (SUPER ADMIN) */}
               {tab === 'manage' && isSuper && (
                 <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="bg-amber-500 p-8 rounded-[40px] text-white shadow-xl flex items-center gap-6">
                        <ShieldCheck size={48}/>
                        <div>
                            <h3 className="text-2xl font-black uppercase">Gestão de Sistema</h3>
                            <p className="opacity-90 font-medium">Controle total de usuários e credenciais de acesso.</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
                       <table className="w-full text-left">
                         <thead className="bg-slate-50 border-b">
                           <tr>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Estudante</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Credenciais</th>
                             <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Ações</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y">
                           {filteredStudents.map(st => (
                             <tr key={st.id} className="hover:bg-slate-50 transition">
                               <td className="p-6">
                                 <p className="font-black text-xs uppercase">{st.name}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase">{st.school_class}</p>
                               </td>
                               <td className="p-6">
                                 <p className="text-[10px] font-medium text-slate-600">{st.email}</p>
                                 <p className="text-[9px] font-black text-amber-600 font-mono">Senha: {st.password}</p>
                               </td>
                               <td className="p-6 text-center">
                                 <button onClick={() => handleDeleteStudent(st.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={20}/></button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                 </div>
               )}

            </div>
          )}
        </div>

        {/* MODAL DE OBSERVAÇÕES (PRONTUÁRIO) */}
        {selectedStudentForObs && (
          <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStudentForObs(null)}></div>
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20">
                         {selectedStudentForObs.photo_url ? <img src={selectedStudentForObs.photo_url} className="w-full h-full object-cover"/> : <User className="m-auto mt-2"/>}
                      </div>
                      <div>
                         <h3 className="font-black text-sm uppercase tracking-tight">{selectedStudentForObs.name}</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedStudentForObs.school_class}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedStudentForObs(null)} className="p-2 hover:bg-white/10 rounded-full"><X/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <History size={14}/> Histórico Pedagógico / Comportamental
                       </h4>
                       
                       {observations.filter(o => o.student_id === selectedStudentForObs.id).length === 0 ? (
                         <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs italic">
                            Nenhuma observação registrada para este aluno em {isSuper ? 'Geral' : currentSubInfo?.name}.
                         </div>
                       ) : (
                         observations.filter(o => o.student_id === selectedStudentForObs.id).map(obs => (
                           <div key={obs.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                              <div className="flex items-center gap-2 mb-2 text-slate-400">
                                 <Clock size={10}/>
                                 <span className="text-[8px] font-black uppercase">
                                    {new Date(obs.created_at).toLocaleDateString('pt-BR')} às {new Date(obs.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                                 {isSuper && <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded ml-auto">{obs.subject}</span>}
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{obs.content}</p>
                              <button onClick={() => handleDeleteObservation(obs.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Trash2 size={14}/>
                              </button>
                           </div>
                         ))
                       )}
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-slate-100">
                   <div className="flex items-center gap-2 mb-3">
                      <Plus size={14} className="text-tocantins-blue"/>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Nova Anotação</h4>
                   </div>
                   <textarea 
                     value={newObs}
                     onChange={e => setNewObs(e.target.value)}
                     className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-tocantins-blue outline-none transition-all h-32 resize-none shadow-inner"
                     placeholder="Ex: Usou celular durante a explicação, faltou com material, realizou excelente contribuição oral..."
                   />
                   <button 
                     onClick={handleSaveObservation}
                     disabled={savingObs || !newObs.trim()}
                     className="w-full mt-4 bg-tocantins-blue text-white font-black uppercase text-[11px] tracking-widest py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                   >
                     {savingObs ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                     Salvar no Prontuário
                   </button>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  async function handleDeleteStudent(id: string) {
      if (!confirm("🚨 ATENÇÃO: Esta ação é irreversível. Todas as atividades, notas e mensagens deste aluno serão excluídas permanentemente. Confirmar exclusão?")) return;
      setLoading(true);
      try {
          const { error } = await supabase.from('students').delete().eq('id', id);
          if (error) throw error;
          alert("Aluno removido com sucesso.");
          if (isSuper) fetchAllData(); else fetchData(loggedSubject as Subject);
      } catch (e: any) { alert("Erro ao excluir: " + e.message); }
      finally { setLoading(false); }
  }
};
