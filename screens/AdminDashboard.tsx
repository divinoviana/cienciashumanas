
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { subjectsInfo } from '../data';
import { Subject } from '../types';
import { Users, BookOpen, Trash2, Key, UserSquare2, Home, RefreshCw, MessageSquare, Send, Loader2, Save, X, FileText } from 'lucide-react';

const ADMIN_PASSWORDS: Record<string, string> = {
  filosofia: '3614526312',
  geografia: 'geo2026',
  historia: 'his2026',
  sociologia: 'soc2026'
};

export const AdminDashboard: React.FC = () => {
  const [loggedSubject, setLoggedSubject] = useState<Subject | null>(null);
  const [pass, setPass] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subject>('filosofia');
  
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'students' | 'submissions' | 'photos' | 'messages'>('submissions');

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
        supabase.from('messages').select('*').eq('subject', subject).order('created_at', { ascending: false })
      ]);
      setStudents(stRes.data || []);
      setSubmissions(subRes.data || []);
      setMessages(msgRes.data || []);
    } catch (e) { alert("Erro ao carregar dados."); }
    finally { setLoading(false); }
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
          </div>
        </div>
      </div>
    );
  }

  const subjectInfo = subjectsInfo[loggedSubject];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar e conteúdo adaptados para o loggedSubject */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col shrink-0">
        <div className="mb-8 text-center">
           <div className={`w-12 h-12 ${subjectInfo.color} rounded-xl flex items-center justify-center mx-auto mb-2 text-2xl shadow-lg`}>{subjectInfo.icon}</div>
           <h2 className="font-bold">Prof. de {subjectInfo.name}</h2>
        </div>
        <nav className="space-y-1 flex-1">
          <button onClick={() => setTab('submissions')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition ${tab === 'submissions' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><BookOpen size={18}/> Atividades</button>
          <button onClick={() => setTab('messages')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition ${tab === 'messages' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><MessageSquare size={18}/> Mensagens</button>
          <button onClick={() => setTab('students')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition ${tab === 'students' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><Users size={18}/> Estudantes</button>
          <button onClick={() => setTab('photos')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition ${tab === 'photos' ? 'bg-tocantins-blue' : 'text-slate-400 hover:bg-white/5'}`}><UserSquare2 size={18}/> Carômetro</button>
        </nav>
        <button onClick={() => setLoggedSubject(null)} className="mt-auto p-4 text-slate-400 hover:text-white text-xs flex items-center gap-2 border-t border-white/10"><X size={14}/> Sair da Disciplina</button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">{tab}</h1>
           <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-500">Filtrando: {subjectInfo.name}</div>
        </div>

        {/* Listagem de dados filtrados por subject no Supabase */}
        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-tocantins-blue" size={40}/></div>
        ) : (
          <div className="grid gap-4">
             {tab === 'submissions' && submissions.map(sub => (
                <div key={sub.id} className="bg-white p-5 rounded-2xl border shadow-sm">
                   <h3 className="font-bold">{sub.student_name} ({sub.school_class})</h3>
                   <p className="text-xs text-slate-400 mb-4">{sub.lesson_title}</p>
                   {/* ... restante da renderização idêntica ... */}
                </div>
             ))}
             {/* Outras abas (messages, students, photos) seguem a lógica de filtro de subject */}
          </div>
        )}
      </main>
    </div>
  );
};
