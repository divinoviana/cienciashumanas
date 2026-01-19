
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { subjectsInfo, ADMIN_PASSWORDS, TEACHER_INFO } from '../data';
import { Subject } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, BookOpen, User, 
  MessageSquare, Loader2, X, Save, 
  ChevronDown, ChevronUp,
  ArrowLeft, Send, RefreshCw, LayoutGrid, Home,
  ShieldCheck, Trash2, Settings,
  Search, Filter, Award, StickyNote, Clock, History, Plus, UserCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { teacherSubject, loginTeacher, logoutTeacher } = useAuth();
  
  // Estados de Login
  const [pass, setPass] = useState('');
  const [email, setEmail] = useState(''); 
  const [selectedAccess, setSelectedAccess] = useState<Subject | 'SUPER_ADMIN'>('filosofia');
  
  // Estados de Dados
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Controle de Abas e Chats
  const [activeTab, setActiveTab] = useState<'submissions' | 'evaluations' | 'messages' | 'students' | 'manage'>('submissions');
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Estados de UI
  const [selectedStudentForObs, setSelectedStudentForObs] = useState<any | null>(null);
  const [newObs, setNewObs] = useState('');
  const [savingObs, setSavingObs] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  const isSuper = teacherSubject === 'SUPER_ADMIN';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccess === 'SUPER_ADMIN') {
        if (email === 'divinoviana@gmail.com' && pass === '3614526312') {
            loginTeacher('SUPER_ADMIN');
            setActiveTab('manage');
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
      let obsQuery = supabase.from('student_observations').select('*').order('created_at', { ascending: false });

      if (teacherSubject !== 'SUPER_ADMIN') {
        subQuery = subQuery.eq('subject', teacherSubject);
        msgQuery = msgQuery.eq('subject', teacherSubject);
        obsQuery = obsQuery.eq('subject', teacherSubject);
      }

      // Fix: removed incorrect assignment to 'obsRes' which was causing variable declaration errors
      const [stRes, subRes, msgRes, obsRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        subQuery,
        msgQuery,
        obsQuery
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
    if (teacherSubject) {
      loadData();
    }
  }, [teacherSubject]);

  const handleSaveFeedback = async (id: string) => {
    setSavingFeedback(id);
    try {
      await supabase.from('submissions').update({ teacher_feedback: feedbacks[id] }).eq('id', id);
      alert("Feedback salvo!");
      loadData();
    } finally { setSavingFeedback(null); }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatStudentId || !teacherSubject) return;
    
    setSendingReply(true);
    try {
      const student = students.find(s => s.id === selectedChatStudentId);
      const { error } = await supabase.from('messages').insert([{
        sender_id: selectedChatStudentId,
        sender_name: student?.name || 'Sistema',
        school_class: student?.school_class || 'N/A',
        grade: student?.grade || '1',
        content: replyText.trim(),
        is_from_teacher: true,
        subject: teacherSubject === 'SUPER_ADMIN' ? 'filosofia' : teacherSubject
      }]);
      
      if (error) throw error;
      setReplyText('');
      loadData();
    } catch (err) {
      alert("Erro ao enviar resposta.");
    } finally {
      setSendingReply(false);
    }
  };

  // Filtros
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = filterGrade === 'all' || String(s.grade) === filterGrade;
      const matchClass = filterClass === 'all' || s.school_class === filterClass;
      return matchName && matchGrade && matchClass;
    });
  }, [students, searchTerm, filterGrade, filterClass]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchName = sub.student_name.toLowerCase().includes(searchTerm.toLowerCase());
      const subGrade = sub.school_class.substring(0, 1);
      const matchGrade = filterGrade === 'all' || subGrade === filterGrade;
      const matchClass = filterClass === 'all' || sub.school_class === filterClass;
      return matchName && matchGrade && matchClass;
    });
  }, [submissions, searchTerm, filterGrade, filterClass]);

  // Agrupamento de Mensagens por Estudante
  const chatGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    messages.forEach(msg => {
      if (!groups[msg.sender_id]) groups[msg.sender_id] = [];
      groups[msg.sender_id].push(msg);
    });
    return groups;
  }, [messages]);

  const classOptions = useMemo(() => {
    if (filterGrade === '1') return Array.from({length: 6}, (_, i) => `13.0${i+1}`);
    if (filterGrade === '2') return Array.from({length: 8}, (_, i) => `23.0${i+1}`);
    if (filterGrade === '3') return Array.from({length: 9}, (_, i) => `33.0${i+1}`);
    return [];
  }, [filterGrade]);

  if (!teacherSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm border border-slate-100">
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-tocantins-blue rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
                <ShieldCheck className="text-white" size={40}/>
             </div>
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Área Docente</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Identifique-se para gerenciar</p>
          </div>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disciplina</label>
              <select className="w-full p-4 border rounded-2xl mt-1 bg-slate-50 font-bold text-slate-700 outline-none" value={selectedAccess} onChange={e => setSelectedAccess(e.target.value as any)}>
                <option value="SUPER_ADMIN">👑 Gestão Geral (Super Admin)</option>
                <option disabled>──────────</option>
                {Object.entries(subjectsInfo).map(([k, v]) => <option key={k} value={k}>Professor de {v.name}</option>)}
              </select>
            </div>

            {selectedAccess === 'SUPER_ADMIN' && (
                <input required type="email" placeholder="Email Administrativo" className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-tocantins-blue" value={email} onChange={e => setEmail(e.target.value)} />
            )}

            <input required type="password" placeholder="Senha de Acesso" className="w-full p-4 border rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-tocantins-blue" value={pass} onChange={e => setPass(e.target.value)} />
            
            <button type="submit" className="w-full bg-tocantins-blue text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-800 transition-all cursor-pointer">Acessar Painel</button>
            <button type="button" onClick={() => navigate('/')} className="w-full text-slate-400 text-[10px] font-black uppercase pt-2 hover:text-slate-600 transition cursor-pointer">Voltar ao Site</button>
          </form>
        </div>
      </div>
    );
  }

  const currentSubInfo = !isSuper ? subjectsInfo[teacherSubject as Subject] : null;

  const FilterBar = () => (
    <div className="bg-white p-4 rounded-[24px] border shadow-sm flex flex-col md:flex-row gap-4 items-center mb-6">
      <div className="flex-1 w-full md:hidden">
        <input placeholder="Buscar por nome..." className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
      </div>
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex-1 md:w-40">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Série</label>
          <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-tocantins-blue" value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterClass('all'); }}>
            <option value="all">Todas</option>
            <option value="1">1ª Série</option>
            <option value="2">2ª Série</option>
            <option value="3">3ª Série</option>
          </select>
        </div>
        <div className="flex-1 md:w-40">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 block mb-1">Turma</label>
          <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-tocantins-blue" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="all">Todas</option>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="text-[10px] font-black text-slate-400 uppercase md:ml-auto">
        {activeTab === 'students' ? `${filteredStudents.length} Estudantes` : 
         activeTab === 'submissions' ? `${filteredSubmissions.length} Atividades` :
         activeTab === 'messages' ? `${Object.keys(chatGroups).length} Conversas` : ''}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-hidden">
      
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0 border-r border-white/5">
        <div className="mb-10 text-center">
           <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl shadow-2xl ${isSuper ? 'bg-amber-500' : currentSubInfo?.color}`}>
             {isSuper ? '👑' : currentSubInfo?.icon}
           </div>
           <h2 className="font-black text-sm uppercase tracking-tight">{isSuper ? 'Super Admin' : `Prof. ${currentSubInfo?.name}`}</h2>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sessão Docente Ativa</p>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
          <button onClick={() => setActiveTab('submissions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all cursor-pointer ${activeTab === 'submissions' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <BookOpen size={18}/> Atividades
          </button>
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all cursor-pointer ${activeTab === 'messages' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <MessageSquare size={18}/> Mensagens
          </button>
          <button onClick={() => setActiveTab('evaluations')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all cursor-pointer ${activeTab === 'evaluations' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <Award size={18}/> Notas Gerais
          </button>
          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all cursor-pointer ${activeTab === 'students' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={18}/> Lista de Alunos
          </button>
          {isSuper && (
            <button onClick={() => setActiveTab('manage')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all cursor-pointer ${activeTab === 'manage' ? 'bg-amber-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <Settings size={18}/> Gestão de Contas
            </button>
          )}
        </nav>
        
        <button 
          onClick={handleExitAdmin} 
          className="w-full flex items-center justify-center gap-2 p-5 text-slate-300 bg-white/5 hover:bg-red-500/20 hover:text-red-300 rounded-2xl transition-all text-xs font-black uppercase tracking-widest mt-8 border border-white/10 shadow-sm cursor-pointer"
        >
          <Home size={18}/> Voltar ao Início
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b p-6 lg:p-8 flex justify-between items-center z-10 shadow-sm">
           <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tighter">
                {isSuper ? 'Console de Gestão' : `Painel: ${currentSubInfo?.name}`}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeTab === 'submissions' ? 'Correção de Exercícios' : 
                 activeTab === 'messages' ? 'Suporte ao Estudante' :
                 activeTab === 'evaluations' ? 'Quadro de Médias' : 
                 activeTab === 'students' ? 'Gerenciamento de Estudantes' : 'Configurações do Sistema'}
              </p>
           </div>
           <div className="flex gap-2">
             <div className="relative hidden md:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                <input placeholder="Buscar por nome..." className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-tocantins-blue w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
             </div>
             <button onClick={loadData} className="p-3 text-slate-400 hover:text-tocantins-blue bg-slate-100 rounded-xl transition-all cursor-pointer" title="Atualizar dados">
               <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
             </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50/50">
           {loading && submissions.length === 0 && messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="animate-spin text-tocantins-blue" size={40}/>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Banco...</p>
             </div>
           ) : (
             <div className="max-w-6xl mx-auto pb-20">
                
                {activeTab === 'messages' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh] animate-in fade-in">
                    {/* Lista de Chats */}
                    <div className="bg-white rounded-3xl border shadow-sm flex flex-col overflow-hidden">
                       <div className="p-5 border-b bg-slate-50">
                          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Conversas Ativas</h4>
                       </div>
                       <div className="flex-1 overflow-y-auto divide-y">
                          {Object.keys(chatGroups).length === 0 ? (
                            <div className="p-10 text-center text-slate-300 italic text-xs">Nenhuma mensagem recebida.</div>
                          ) : (
                            Object.keys(chatGroups).map(studentId => {
                               const studentMessages = chatGroups[studentId];
                               const lastMsg = studentMessages[studentMessages.length - 1];
                               const student = students.find(s => s.id === studentId);
                               return (
                                 <button 
                                   key={studentId} 
                                   onClick={() => setSelectedChatStudentId(studentId)}
                                   className={`w-full p-4 text-left hover:bg-slate-50 transition flex items-center gap-3 ${selectedChatStudentId === studentId ? 'bg-blue-50 border-r-4 border-tocantins-blue' : ''}`}
                                 >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border">
                                       {student?.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover"/> : <User className="m-auto mt-2 text-slate-300"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="font-bold text-xs text-slate-800 uppercase truncate">{student?.name || 'Aluno'}</p>
                                       <p className="text-[10px] text-slate-400 truncate">{lastMsg.content}</p>
                                    </div>
                                 </button>
                               )
                            })
                          )}
                       </div>
                    </div>

                    {/* Janela de Chat */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm flex flex-col overflow-hidden relative">
                       {selectedChatStudentId ? (
                         <>
                           <div className="p-5 border-b flex items-center gap-3 bg-slate-50">
                              <UserCircle size={24} className="text-tocantins-blue" />
                              <h4 className="font-bold text-xs uppercase text-slate-700">Chat: {students.find(s => s.id === selectedChatStudentId)?.name}</h4>
                           </div>
                           <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                              {chatGroups[selectedChatStudentId].map(msg => (
                                <div key={msg.id} className={`flex ${msg.is_from_teacher ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[80%] p-4 rounded-2xl text-xs shadow-sm ${msg.is_from_teacher ? 'bg-tocantins-blue text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none'}`}>
                                      <p className="font-medium leading-relaxed">{msg.content}</p>
                                      <p className={`text-[8px] mt-1 font-bold ${msg.is_from_teacher ? 'text-blue-200' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleTimeString()}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                           <form onSubmit={handleSendReply} className="p-4 border-t bg-white flex gap-2">
                              <input 
                                value={replyText} 
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Digite sua resposta..." 
                                className="flex-1 p-3 bg-slate-100 rounded-xl text-xs outline-none focus:ring-1 focus:ring-tocantins-blue"
                              />
                              <button disabled={sendingReply || !replyText.trim()} className="bg-tocantins-blue text-white p-3 rounded-xl hover:bg-blue-800 disabled:opacity-50 transition cursor-pointer">
                                 {sendingReply ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                              </button>
                           </form>
                         </>
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                            <MessageSquare size={48} className="opacity-20"/>
                            <p className="text-sm font-bold uppercase tracking-widest opacity-50">Selecione um aluno para conversar</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'students' && (
                  <div className="space-y-6 animate-in fade-in">
                    <FilterBar />
                    {filteredStudents.length === 0 ? (
                       <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-400 font-bold">Nenhum aluno encontrado com estes filtros.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map(st => (
                          <div key={st.id} className="bg-white p-5 rounded-[32px] border shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                               {st.photo_url ? <img src={st.photo_url} className="w-full h-full object-cover" /> : <User className="m-auto mt-4 text-slate-300"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-xs font-black uppercase text-slate-800 truncate">{st.name}</h4>
                               <p className="text-[9px] text-slate-400 font-black uppercase">{st.grade}ª Série • Turma {st.school_class}</p>
                               <p className="text-[8px] text-slate-300 truncate mt-1">{st.email}</p>
                            </div>
                            <button onClick={() => setSelectedStudentForObs(st)} className="p-3 text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-2xl transition cursor-pointer" title="Ver Prontuário">
                               <StickyNote size={18}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'submissions' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <FilterBar />
                    {filteredSubmissions.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-400 font-bold">Nenhuma atividade encontrada com estes filtros.</div>
                    ) : (
                      filteredSubmissions.map(sub => (
                        <div key={sub.id} className="bg-white rounded-[32px] border shadow-sm p-6 flex flex-col md:flex-row gap-6">
                           <div className="flex-1">
                              <div className="flex items-center gap-4 mb-4">
                                 <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                                    {sub.student_photo ? <img src={sub.student_photo} className="w-full h-full object-cover" /> : <User className="m-auto mt-3 text-slate-300"/>}
                                 </div>
                                 <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-tight">{sub.student_name}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase">{sub.school_class} • {sub.lesson_title}</p>
                                 </div>
                                 <div className="ml-auto bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl font-black text-sm">Nota: {(sub.score || 0).toFixed(1)}</div>
                              </div>
                              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                 {sub.content?.map((item: any, i: number) => (
                                   <div key={i}>
                                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Questão {i+1}</p>
                                      <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{item.answer}"</p>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           <div className="w-full md:w-80 flex flex-col gap-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Feedback do Professor</label>
                              <textarea 
                                className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-tocantins-blue resize-none min-h-[120px]"
                                placeholder="Elogie, corrija ou dê sugestões..."
                                value={feedbacks[sub.id] || ''}
                                onChange={(e) => setFeedbacks({...feedbacks, [sub.id]: e.target.value})}
                              />
                              <button onClick={() => handleSaveFeedback(sub.id)} disabled={savingFeedback === sub.id} className="w-full bg-tocantins-blue text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer">
                                {savingFeedback === sub.id ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Salvar Avaliação'}
                              </button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'evaluations' && (
                  <div className="bg-white rounded-[40px] shadow-xl border overflow-hidden animate-in fade-in">
                     <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 uppercase">Boletim de {currentSubInfo?.name || 'Geral'}</h3>
                        <div className="text-[10px] font-black bg-slate-200 px-3 py-1 rounded-full">{filteredStudents.length} Alunos na visualização</div>
                     </div>
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-50/50">
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Estudante</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Atividades</th>
                              <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Média</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y">
                           {filteredStudents.map(st => {
                               const stSubmissions = submissions.filter(s => s.student_name === st.name);
                               const avg = stSubmissions.length > 0 
                                 ? (stSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / stSubmissions.length).toFixed(1) 
                                 : '-';
                               return (
                                   <tr key={st.id} className="hover:bg-slate-50/50 transition">
                                       <td className="p-6">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">{st.photo_url && <img src={st.photo_url} className="w-full h-full object-cover"/>}</div>
                                             <div>
                                                <span className="font-bold text-slate-700 text-sm uppercase block">{st.name}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase">{st.school_class}</span>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="p-6 text-center font-bold text-slate-400 text-sm">{stSubmissions.length}</td>
                                       <td className="p-6 text-center font-black text-sm text-tocantins-blue">{avg}</td>
                                   </tr>
                               );
                           })}
                        </tbody>
                     </table>
                  </div>
                )}

                {activeTab === 'manage' && isSuper && (
                  <div className="space-y-6 animate-in slide-in-from-right-2">
                     <div className="bg-amber-500 p-8 rounded-[40px] text-white shadow-xl flex items-center gap-6">
                        <ShieldCheck size={48}/>
                        <div>
                           <h3 className="text-2xl font-black uppercase tracking-tight">Segurança e Contas</h3>
                           <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Controle mestre de usuários</p>
                        </div>
                     </div>
                     <div className="bg-white rounded-[40px] shadow-xl border overflow-hidden">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50">
                              <tr>
                                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Usuário</th>
                                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Credenciais</th>
                                 <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Gestão</th>
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
                                     <p className="text-[9px] font-black text-amber-600 font-mono">SENHA: {st.password}</p>
                                  </td>
                                  <td className="p-6 text-center">
                                     <button onClick={() => { if(confirm("Excluir conta permanentemente?")) supabase.from('students').delete().eq('id', st.id).then(loadData); }} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition cursor-pointer">
                                        <Trash2 size={20}/>
                                     </button>
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

        {selectedStudentForObs && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStudentForObs(null)}></div>
             <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex-shrink-0">
                         {selectedStudentForObs.photo_url ? <img src={selectedStudentForObs.photo_url} className="w-full h-full object-cover"/> : <User className="m-auto mt-2"/>}
                      </div>
                      <div>
                         <h3 className="font-black text-sm uppercase">Prontuário: {selectedStudentForObs.name.split(' ')[0]}</h3>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedStudentForObs.school_class}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedStudentForObs(null)} className="p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors"><X/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/80">
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Clock size={12}/> Histórico Comportamental</h4>
                   {observations.filter(o => o.student_id === selectedStudentForObs.id).length === 0 ? (
                     <div className="py-10 text-center text-slate-300 italic text-xs">Nenhuma anotação registrada ainda.</div>
                   ) : (
                     observations.filter(o => o.student_id === selectedStudentForObs.id).map(obs => (
                       <div key={obs.id} className="bg-white p-5 rounded-2xl border text-sm shadow-sm relative group">
                          <p className="text-slate-700 leading-relaxed font-medium">{obs.content}</p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                             <span className="text-[8px] text-slate-400 font-black uppercase">{new Date(obs.created_at).toLocaleString()}</span>
                             {isSuper && <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{obs.subject}</span>}
                          </div>
                          <button onClick={() => { if(confirm("Apagar nota?")) supabase.from('student_observations').delete().eq('id', obs.id).then(loadData); }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                             <Trash2 size={14}/>
                          </button>
                       </div>
                     ))
                   )}
                </div>

                <div className="p-6 bg-white border-t space-y-3">
                   <textarea 
                     className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-medium outline-none focus:ring-1 focus:ring-tocantins-blue h-24 shadow-inner" 
                     placeholder="Adicionar nota sobre rendimento, comportamento ou atraso..." 
                     value={newObs} 
                     onChange={e => setNewObs(e.target.value)} 
                   />
                   <button 
                     onClick={async () => {
                       if(!newObs.trim()) return;
                       setSavingObs(true);
                       await supabase.from('student_observations').insert([{
                         student_id: selectedStudentForObs.id,
                         subject: isSuper ? 'GERAL' : teacherSubject,
                         content: newObs.trim()
                       }]);
                       setNewObs('');
                       loadData();
                       setSavingObs(false);
                     }} 
                     disabled={savingObs || !newObs.trim()} 
                     className="w-full bg-tocantins-blue text-white font-black uppercase text-[11px] py-4 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
};
