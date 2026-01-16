
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, MessageCircle, CheckCircle, Loader2, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Contact: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('student');
    if (!saved) {
      navigate('/login');
      return;
    }
    const studentData = JSON.parse(saved);
    setStudent(studentData);
    fetchMessages(studentData.id);

    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${studentData.id}` }, 
        () => fetchMessages(studentData.id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (studentId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', studentId)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
    setLoadingMessages(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !student) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert([{
        sender_id: student.id,
        sender_name: student.name,
        school_class: student.school_class,
        grade: student.grade,
        content: newMessage.trim(),
        is_from_teacher: false
      }]);

      if (error) throw error;
      setNewMessage('');
      fetchMessages(student.id);
    } catch (err) {
      alert("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  if (!student) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-tocantins-blue font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Link>
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-xs font-bold text-slate-600">Canal Direto com Prof. Divino</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[70vh]">
        {/* Chat Header */}
        <div className="bg-slate-900 p-4 text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-tocantins-blue flex items-center justify-center border border-white/20">
            <UserCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Prof. Me. Divino Ribeiro Viana</h3>
            <p className="text-[10px] text-slate-400">Geralmente responde em até 24h</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {loadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-slate-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 text-sm italic">Inicie uma conversa com o professor.<br/>Tire dúvidas sobre as aulas ou atividades.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_from_teacher ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm ${
                  msg.is_from_teacher 
                    ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none' 
                    : 'bg-tocantins-blue text-white rounded-tr-none'
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-2 ${msg.is_from_teacher ? 'text-slate-400' : 'text-blue-200'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.is_from_teacher && <span className="ml-2 font-bold text-tocantins-blue">• Professor</span>}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui..."
            className="flex-1 p-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-tocantins-blue outline-none transition"
            disabled={sending}
          />
          <button 
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-tocantins-blue text-white p-3 rounded-2xl hover:bg-blue-800 transition disabled:opacity-50 disabled:scale-95 flex items-center justify-center"
          >
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>

      <p className="text-center text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-bold">
        Este é um canal pedagógico oficial. Mantenha o respeito e a ética.
      </p>
    </div>
  );
};
