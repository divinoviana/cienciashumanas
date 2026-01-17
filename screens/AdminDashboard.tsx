
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { subjectsInfo } from '../data';
import { Subject } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, BookOpen, Key, UserSquare2, 
  MessageSquare, Loader2, X, Save, 
  ChevronDown, ChevronUp, Star, CheckCircle2,
  ArrowLeft
} from 'lucide-react';

const ADMIN_PASSWORDS: Record<string, string> = {
  filosofia: '3614526312',
  geografia: 'geo2026',
  historia: 'his2026',
  sociologia: 'soc2026'
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loggedSubject, setLoggedSubject] = useState<Subject | null>(null);
  const [pass, setPass] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subject>('filosofia');
  
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'students' | 'submissions' | 'photos'>('submissions');
  
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);

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
      const [stRes, subRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('submissions').select('*').eq('subject', subject).order('created_at', { ascending: false })
      ]);
      setStudents(stRes.data || []);
      setSubmissions(subRes.data || []);
      
      const initialFeedbacks: Record<string, string> = {};
      subRes.data?.forEach(s => {
        if (s.teacher_feedback) initialFeedbacks[s.id] = s.teacher_feedback;
      });
      setFeedbacks(initialFeedbacks);

    } catch (e) { alert("Erro ao carregar dados."); }
    finally { setLoading(false); }
  };

  const handleSaveFeedback = async (submissionId: string) => {
    setSavingFeedback(submissionId);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ teacher_feedback: feedbacks[submissionId] })
        .eq('id', submissionId);

      if (error) throw error;
      alert("Feedback enviado com sucesso ao aluno!");
      fetchData(loggedSubject!);
    } catch (e) {
      alert("Erro ao salvar feedback.");
    } finally {
      setSavingFeedback(null);
    }
  };

  if (!loggedSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
          <div className="text-center mb-6">
             <Key className="mx-auto text-tocantins-blue mb-2" size={32}/>
             <h2 className="text-xl font-bold">Acesso do Professor</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Disciplina</label>
              <select className="w-full p-4 border rounded-xl mt-1 outline-none" value={selectedSub} onChange={e => setSelectedSub(e.target.value as Subject)}>
                {Object.entries(subjectsInfo).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Senha Mestra</label>
              <input type="password" placeholder="••••••••" className="w-full p-4 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-tocantins-blue" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAdmin()} />
            </div>
            <button onClick={checkAdmin} className="w-full bg-tocantins-blue text-white p-4 rounded-xl font-bold hover:bg-blue-800 transition">Entrar no Painel</button>
            
            <button 
              onClick={() => navigate('/')} 
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition pt-2"
            >
              <ArrowLeft size={16}/> Voltar ao Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subjectInfo = subjectsInfo[loggedSubject];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col shrink-0">
        <div className="mb-8">
           <button 
             onClick={() => navigate('/')}
             className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold mb-6 transition uppercase tracking-widest"
           >
             <ArrowLeft size={14}/> Voltar ao Início
           </button>

           <div className="text-center">
             <div className={`w-12 h-12 ${subjectInfo.color} rounded-xl flex items-center justify-center mx-auto mb-2 text-2xl shadow-lg`}>{subjectInfo.icon}</div>
             <h2 className="font-bold">Prof. de {subjectInfo.name}</h2>
           </div>
        </div>
        
        <nav className="space-y-1 flex-1">
          <button onClick={() => setTab('submissions')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition ${tab === 'submissions' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><BookOpen size={18}/> Atividades Recebidas</button>
          <button onClick={() => setTab('students')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition ${tab === 'students' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><Users size={18}/> Lista de Alunos</button>
          <button onClick={() => setTab('photos')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition ${tab === 'photos' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><UserSquare2 size={18}/> Carômetro</button>
        </nav>
        
        <button onClick={() => setLoggedSubject(null)} className="mt-auto p-4 text-slate-400 hover:text-white text-xs flex items-center gap-2 border-t border-white/10"><X size={14}/> Sair da Sessão</button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{tab === 'submissions' ? 'Atividades Recebidas' : tab === 'students' ? 'Lista de Alunos' : 'Carômetro'}</h1>
           <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-500 shadow-sm">
             Disciplina Ativa: <span className="text-tocantins-blue">{subjectInfo.name}</span>
           </div>
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center p-20 gap-4">
            <Loader2 className="animate-spin text-tocantins-blue" size={40}/>
            <p className="text-slate-400 font-medium">Sincronizando dados...</p>
          </div>
        ) : (
          <div className="space-y-4">
             {tab === 'submissions' && (
               submissions.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400">
                    Nenhuma atividade enviada para esta disciplina até o momento.
                 </div>
               ) : (
                 submissions.map(sub => (
                    <div key={sub.id} className={`bg-white rounded-2xl border transition-all ${expandedSub === sub.id ? 'ring-2 ring-tocantins-blue shadow-xl' : 'shadow-sm hover:shadow-md'}`}>
                       <div 
                         className="p-5 flex items-center justify-between cursor-pointer"
                         onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 overflow-hidden">
                                {sub.student_photo ? <img src={sub.student_photo} className="w-full h-full object-cover" /> : sub.student_name.charAt(0)}
                             </div>
                             <div>
                                <h3 className="font-bold text-slate-800">{sub.student_name}</h3>
                                <p className="text-xs text-slate-400">{sub.school_class} • {sub.lesson_title}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-[10px] font-black text-slate-300 uppercase">Nota IA</p>
                                <p className={`font-black text-lg ${sub.score >= 7 ? 'text-green-600' : 'text-amber-600'}`}>
                                   {sub.score?.toFixed(1)}
                                </p>
                             </div>
                             {sub.teacher_feedback ? (
                               <div className="text-green-500 flex items-center gap-1 text-xs font-bold">
                                 <CheckCircle2 size={16}/> Corrigido
                               </div>
                             ) : (
                               <div className="text-amber-500 text-xs font-bold animate-pulse">
                                 Pendente
                               </div>
                             )}
                             {expandedSub === sub.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                          </div>
                       </div>

                       {expandedSub === sub.id && (
                         <div className="p-6 border-t bg-slate-50/50 rounded-b-2xl animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                               <div className="space-y-4">
                                  <h4 className="font-bold text-slate-700 flex items-center gap-2"><BookOpen size={16}/> Respostas Enviadas</h4>
                                  <div className="space-y-3">
                                     {sub.content?.map((item: any, i: number) => (
                                       <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                          <p className="text-xs font-bold text-slate-400 mb-2">Questão: {item.question}</p>
                                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.answer}</p>
                                       </div>
                                     ))}
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                                     <h5 className="text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center gap-1">
                                       <Star size={12} className="fill-indigo-500"/> Comentário da IA
                                     </h5>
                                     <p className="text-xs text-slate-600 italic">"{sub.ai_feedback?.generalComment}"</p>
                                  </div>
                               </div>

                               <div className="space-y-4">
                                  <h4 className="font-bold text-slate-700 flex items-center gap-2"><MessageSquare size={16}/> Feedback do Professor</h4>
                                  <textarea 
                                    className="w-full p-4 h-40 bg-white border border-slate-300 rounded-xl shadow-inner outline-none focus:ring-2 focus:ring-tocantins-blue transition-all text-sm"
                                    placeholder="Escreva aqui as orientações para o aluno. Se ele precisar refazer, especifique o que deve ser melhorado..."
                                    value={feedbacks[sub.id] || ''}
                                    onChange={(e) => setFeedbacks({...feedbacks, [sub.id]: e.target.value})}
                                  />
                                  <button 
                                    onClick={() => handleSaveFeedback(sub.id)}
                                    disabled={savingFeedback === sub.id}
                                    className="w-full bg-tocantins-blue hover:bg-blue-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    {savingFeedback === sub.id ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                                    Salvar Feedback e Notificar Aluno
                                  </button>
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                 ))
               )
             )}

             {tab === 'students' && (
               <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase">Estudante</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase">Série/Turma</th>
                        <th className="p-4 text-xs font-black text-slate-400 uppercase text-center">Atividades</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                       {students.map(st => (
                         <tr key={st.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 flex items-center gap-3">
                               <img src={st.photo_url} className="w-8 h-8 rounded-full object-cover border" />
                               <span className="font-bold text-slate-700">{st.name}</span>
                            </td>
                            <td className="p-4 text-sm text-slate-500">{st.grade}ª Série • {st.school_class}</td>
                            <td className="p-4 text-center">
                               <span className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold text-slate-600">
                                  {submissions.filter(s => s.student_name === st.name).length} enviadas
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
             )}

             {tab === 'photos' && (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {students.map(st => (
                    <div key={st.id} className="bg-white p-2 rounded-2xl border shadow-sm text-center">
                       <img src={st.photo_url} className="w-full aspect-square object-cover rounded-xl mb-2" />
                       <p className="text-[10px] font-black truncate">{st.name}</p>
                       <p className="text-[9px] text-slate-400">{st.school_class}</p>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
};
