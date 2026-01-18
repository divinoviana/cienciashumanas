
import React, { useState, useEffect } from 'react';
import { BookOpen, LogOut, History, MessageCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('student');
    if (saved) {
      const studentData = JSON.parse(saved);
      setStudent(studentData);
      fetchUnreadCount(studentData.id);

      // Listener para novas mensagens do professor
      const channel = supabase
        .channel('header-notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${studentData.id}` }, 
          (payload) => {
            if (payload.new.is_from_teacher && location.pathname !== '/contact') {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [location.pathname]);

  const fetchUnreadCount = async (studentId: string) => {
    // Como não temos uma coluna 'read', vamos apenas checar se há mensagens do professor
    // Para simplificar, se o usuário não está na página de contato, mostramos o alerta
    const { data } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', studentId)
      .eq('is_from_teacher', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0 && location.pathname !== '/contact') {
      setUnreadCount(1); // Indica que há mensagens do prof
    } else {
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student');
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition">
          <BookOpen className="w-7 h-7 text-tocantins-yellow" />
          <div className="hidden xs:block">
            <h1 className="text-lg font-bold leading-tight">Ciências Humanas</h1>
            <p className="text-[10px] text-slate-400">Portal Pedagógico</p>
          </div>
        </Link>

        {student && (
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/contact" 
              className={`relative p-2 rounded-lg transition-colors ${location.pathname === '/contact' ? 'bg-tocantins-blue text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
              title="Mensagens do Professor"
            >
              <MessageCircle size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-black flex items-center justify-center rounded-full animate-bounce border-2 border-slate-900">
                  !
                </span>
              )}
            </Link>

            <Link 
              to="/my-activities" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs font-bold"
            >
              <History size={16} />
              <span className="hidden md:inline">Histórico</span>
            </Link>

            <div className="flex items-center gap-2 border-l border-white/10 pl-2 sm:pl-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{student.name.split(' ')[0]}</span>
                <span className="text-[8px] text-slate-500">{student.school_class}</span>
              </div>
              <img src={student.photo_url} className="w-8 h-8 rounded-full border border-tocantins-yellow object-cover" alt="User" />
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition text-slate-400 hover:text-red-400"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
