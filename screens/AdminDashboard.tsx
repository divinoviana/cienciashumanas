
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { subjectsInfo, ADMIN_PASSWORDS, TEACHER_INFO } from '../data';
import { Subject } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Key, User, 
  MessageSquare, Loader2, X, Save, 
  ChevronDown, ChevronUp, Star, CheckCircle2,
  ArrowLeft, Send, RefreshCw, LayoutGrid
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loggedSubject, setLoggedSubject] = useState<Subject | null>(null);
  const [pass, setPass] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subject>('filosofia');
  
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'students' | 'submissions' | 'photos' | 'messages'>('submissions');
  
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);

  const [activeChatStudent, setActiveChatStudent] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const checkAdmin = () => {
    if (pass === ADMIN_PASSWORDS[selectedSub]) {
      setLoggedSubject(selectedSub);
      fetchData(selectedSub);
    } else {
      alert("Senha incorreta para esta disciplina");
    }
  };

  const fetchData = async (subject: Subject) => {
    setLoading(true);
    try {
      const [stRes, subRes, msgRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('submissions').select('*').eq('subject', subject).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: true })
      ]);

      setStudents(stRes.data || []);
      setSubmissions(subRes.data || []);
      setMessages(msgRes.data || []);
      
      const initialFeedbacks: Record<string, string> = {};
      subRes.data?.forEach(s => {
        if (s.teacher_feedback) initialFeedbacks[s.id] = s.teacher_feedback;
      });
      setFeedbacks(initialFeedbacks);
    } catch (e) { 
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'messages' && activeChatStudent) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChatStudent, tab]);

  const handleSaveFeedback = async (submissionId: string) => {
    setSavingFeedback(submissionId);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ teacher_feedback: feedbacks[submissionId] })
        .eq('id', submissionId);
      if (error) throw error;
      alert("Feedback enviado!");
      fetchData(loggedSubject!);
    } catch (e) {
      alert("Erro ao salvar feedback.");
    } finally {
      setSavingFeedback(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatStudent) return;
    setSendingMsg(true);
    const studentData = students.find(s => s.id === activeChatStudent);
    try {
      const { error } = await supabase.from('messages').insert([{
        sender_id: activeChatStudent,
        sender_name: studentData?.name || "Estudante",
        school_class: studentData?.school_class || "N/A",
        grade: studentData?.grade || "N/A",
        content: newMessage.trim(),
        is_from_teacher: true
      }]);
      if (error) throw error;
      setNewMessage('');
      fetchData(loggedSubject!);
    } catch (err) {
      alert("Erro ao enviar.");
    } finally {
      setSendingMsg(false);
    }
  };

  const chatGroups = Array.from(new Set(messages.map(m => m.sender_id)))
    .filter(id => id !== null)
    .map(studentId => {
      const studentMsgs = messages.filter(m => m.sender_id === studentId);
      const student = students.find(s => s.id === studentId);
      return {
        studentId,
        studentName: student?.name || studentMsgs[0]?.sender_name || "Estudante",
        schoolClass: student?.school_class || studentMsgs[0]?.school_class || "N/A",
        lastMsg: studentMsgs[studentMsgs.length - 1],
      };
    })
    .sort((a, b) => new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime());

  if (!loggedSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
          <div className="text-center mb-6">
             <Key className="mx-auto text-tocantins-blue mb-2" size={32}/>
             <h2 className="text-xl font-bold">Painel do Professor</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disciplina</label>
              <select className="w-full p-4 border rounded-xl mt-1 bg-slate-50 font-bold" value={selectedSub} onChange={e => setSelectedSub(e.target.value as Subject)}>
                {Object.entries(subjectsInfo).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
              <input type="password" placeholder="••••••••" className="w-full p-4 border rounded-xl mt-1 bg-slate-50" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAdmin()} />
            </div>
            <button onClick={checkAdmin} className="w-full bg-tocantins-blue text-white p-4 rounded-xl font-bold shadow-lg">Entrar</button>
            <button onClick={() => navigate('/')} className="w-full text-slate-400 text-sm font-bold pt-2">Voltar ao Portal</button>
          </div>
        </div>
      </div>
    );
  }

  const subjectInfo = subjectsInfo[loggedSubject];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:flex flex-col shrink-0">
        <div className="mb-8">
           <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white text-[10px] font-black mb-6 uppercase tracking-widest">
             <ArrowLeft size={14}/> Sair do Painel
           </button>
           <div className="text-center bg-white/5 p-4 rounded-2xl border border-white/10">
             <div className={`w-12 h-12 ${subjectInfo.color} rounded-xl flex items-center justify-center mx-auto mb-2 text-2xl shadow-lg`}>{subjectInfo.icon}</div>
             <h2 className="font-bold text-sm">Prof. de {subjectInfo.name}</h2>
             <p className="text-[9px] text-slate-500 truncate mt-1">{TEACHER_INFO.name}</p>
           </div>
        </div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setTab('submissions')} className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${tab === 'submissions' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><BookOpen size={16}/> Atividades</button>
          <button onClick={() => setTab('messages')} className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${tab === 'messages' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><MessageSquare size={16}/> Mensagens</button>
          <button onClick={() => setTab('students')} className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${tab === 'students' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><Users size={16}/> Estudantes</button>
          <button onClick={() => setTab('photos')} className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition ${tab === 'photos' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><LayoutGrid size={16}/> Carômetro</button>
        </nav>
        <button onClick={() => setLoggedSubject(null)} className="mt-auto p-3 bg-red-500/10 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Desconectar</button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b p-4 lg:p-6 flex flex-col gap-4 shadow-sm z-10">
           <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">Painel de Gestão</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subjectInfo.name}</p>
              </div>
              <button onClick={() => fetchData(loggedSubject)} className="p-2 text-slate-400 hover:text-tocantins-blue transition"><RefreshCw size={18}/></button>
           </div>
           
           <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
              <button onClick={() => setTab('submissions')} className={`flex-1 min-w-fit px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tab === 'submissions' ? 'bg-white text-tocantins-blue shadow-sm' : 'text-slate-500'}`}>Atividades</button>
              <button onClick={() => setTab('messages')} className={`flex-1 min-w-fit px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tab === 'messages' ? 'bg-white text-tocantins-blue shadow-sm' : 'text-slate-500'}`}>Mensagens</button>
              <button onClick={() => setTab('students')} className={`flex-1 min-w-fit px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tab === 'students' ? 'bg-white text-tocantins-blue shadow-sm' : 'text-slate-500'}`}>Alunos</button>
              <button onClick={() => setTab('photos')} className={`flex-1 min-w-fit px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tab === 'photos' ? 'bg-white text-tocantins-blue shadow-sm' : 'text-slate-500'}`}>Fotos</button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="animate-spin text-tocantins-blue" size={32}/>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sincronizando...</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto pb-10">
               {tab === 'submissions' && (
                 <div className="space-y-4">
                    {submissions.length === 0 ? (
                      <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed border-slate-200 text-slate-400 text-sm font-bold">Nenhum envio recebido ainda.</div>
                    ) : (
                      submissions.map(sub => (
                        <div key={sub.id} className={`bg-white rounded-2xl border transition-all ${expandedSub === sub.id ? 'ring-2 ring-tocantins-blue shadow-xl' : 'shadow-sm'}`}>
                          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 border overflow-hidden">
                                {sub.student_photo ? <img src={sub.student_photo} className="w-full h-full object-cover" /> : sub.student_name?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 text-sm truncate">{sub.student_name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{sub.school_class} • {sub.lesson_title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                               <div className="text-right">
                                  <p className="text-[9px] font-black text-slate-300 uppercase">Nota</p>
                                  <p className="font-black text-sm text-tocantins-blue">{(sub.score || 0).toFixed(1)}</p>
                               </div>
                               {sub.teacher_feedback ? <CheckCircle2 className="text-green-500" size={18}/> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>}
                               {expandedSub === sub.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </div>
                          </div>
                          {expandedSub === sub.id && (
                            <div className="p-6 border-t bg-slate-50/50 rounded-b-2xl animate-in slide-in-from-top-2 duration-300">
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  <div className="space-y-4">
                                     <h4 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2"><BookOpen size={14}/> Respostas</h4>
                                     {sub.content?.map((item: any, i: number) => (
                                       <div key={i} className="bg-white p-4 rounded-xl border shadow-sm">
                                          <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">P: {item.question}</p>
                                          <p className="text-sm text-slate-700 font-medium">{item.answer}</p>
                                       </div>
                                     ))}
                                  </div>
                                  <div className="space-y-4">
                                     <h4 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14}/> Correção</h4>
                                     <div className="bg-white p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm mb-4">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">IA Gemini</p>
                                        <p className="text-xs text-slate-600 italic">"{sub.ai_feedback?.generalComment || "Sem comentário."}"</p>
                                     </div>
                                     <textarea className="w-full p-4 h-32 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-tocantins-blue" placeholder="Escreva seu feedback aqui..." value={feedbacks[sub.id] || ''} onChange={(e) => setFeedbacks({...feedbacks, [sub.id]: e.target.value})}/>
                                     <button onClick={() => handleSaveFeedback(sub.id)} disabled={savingFeedback === sub.id} className="w-full bg-tocantins-blue text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-95">{savingFeedback === sub.id ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Enviar Feedback</button>
                                  </div>
                               </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                 </div>
               )}

               {tab === 'messages' && (
                 <div className="flex bg-white rounded-3xl border shadow-xl h-[65vh] overflow-hidden">
                    <div className="w-full lg:w-80 border-r overflow-y-auto bg-slate-50">
                       <div className="p-4 border-b font-black text-slate-400 text-[10px] uppercase">Conversas Recentes</div>
                       {chatGroups.length === 0 ? (
                         <div className="p-10 text-center text-slate-400 text-xs italic">Nenhuma mensagem.</div>
                       ) : (
                         chatGroups.map(group => (
                           <div key={group.studentId} onClick={() => setActiveChatStudent(group.studentId)} className={`p-4 border-b cursor-pointer transition-all flex items-center gap-3 ${activeChatStudent === group.studentId ? 'bg-white border-l-4 border-l-tocantins-blue' : 'hover:bg-white'}`}>
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 border shrink-0">{group.studentName?.charAt(0)}</div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-bold text-slate-800 text-xs truncate">{group.studentName}</h4>
                                 <p className="text-[10px] text-slate-500 truncate">{group.lastMsg?.content}</p>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                    <div className="hidden lg:flex flex-1 flex-col bg-white">
                       {activeChatStudent ? (
                         <>
                           <div className="p-4 border-b flex items-center gap-3 bg-slate-50/50">
                              <div className="w-8 h-8 rounded-full bg-tocantins-blue text-white flex items-center justify-center font-bold text-xs">{students.find(s => s.id === activeChatStudent)?.name?.charAt(0)}</div>
                              <h3 className="font-bold text-slate-800 text-sm">{students.find(s => s.id === activeChatStudent)?.name}</h3>
                           </div>
                           <div className="flex-1 overflow-y-auto p-6 space-y-4">
                              {messages.filter(m => m.sender_id === activeChatStudent).map(msg => (
                                <div key={msg.id} className={`flex ${msg.is_from_teacher ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.is_from_teacher ? 'bg-tocantins-blue text-white rounded-tr-none' : 'bg-slate-100 border text-slate-700 rounded-tl-none'}`}>
                                     <p className="leading-tight">{msg.content}</p>
                                     <p className={`text-[8px] mt-1 font-bold ${msg.is_from_teacher ? 'text-blue-200' : 'text-slate-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                              ))}
                              <div ref={chatEndRef} />
                           </div>
                           <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t flex gap-2">
                              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreva sua resposta..." className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-tocantins-blue" />
                              <button type="submit" disabled={sendingMsg || !newMessage.trim()} className="bg-tocantins-blue text-white w-12 rounded-xl flex items-center justify-center hover:bg-blue-800 shadow-md transition disabled:opacity-50"><Send size={16}/></button>
                           </form>
                         </>
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <MessageSquare size={48} className="mb-2 opacity-10"/>
                            <p className="font-black text-[10px] uppercase tracking-widest">Selecione uma conversa</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {tab === 'students' && (
                 <div className="bg-white rounded-3xl border shadow-xl overflow-hidden border-slate-200">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudante</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turma</th>
                          <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Atividades</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                         {students.map(st => (
                           <tr key={st.id} className="hover:bg-slate-50/50 transition">
                              <td className="p-4 flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full border overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">{st.photo_url ? <img src={st.photo_url} className="w-full h-full object-cover" /> : st.name?.charAt(0)}</div>
                                 <span className="font-bold text-slate-700 text-xs">{st.name}</span>
                              </td>
                              <td className="p-4 text-[10px] font-bold text-slate-500 uppercase">{st.school_class}</td>
                              <td className="p-4 text-center">
                                 <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black text-slate-500 border uppercase">
                                    {submissions.filter(s => s.student_name === st.name).length} envios
                                 </span>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                 </div>
               )}

               {tab === 'photos' && (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {students.map(st => (
                      <div key={st.id} className="bg-white p-3 rounded-2xl border shadow-sm text-center">
                         <div className="w-full aspect-square overflow-hidden rounded-xl mb-2 bg-slate-100 flex items-center justify-center">
                            {st.photo_url ? <img src={st.photo_url} className="w-full h-full object-cover" /> : <User size={24} className="text-slate-300"/>}
                         </div>
                         <p className="text-[10px] font-black text-slate-800 truncate mb-1">{st.name}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{st.school_class}</p>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
