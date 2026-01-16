
import React from 'react';
import { BookOpen, LogOut, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem('student') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('student');
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition">
          <BookOpen className="w-8 h-8 text-tocantins-yellow" />
          <div>
            <h1 className="text-xl font-bold leading-tight">Ciências Humanas</h1>
            <p className="text-xs text-slate-400">Ensino Médio • Tocantins</p>
          </div>
        </Link>

        {student && (
          <div className="flex items-center gap-4">
            <Link 
              to="/my-activities" 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-bold"
            >
              <History size={16} />
              <span className="hidden sm:inline">Minhas Atividades</span>
            </Link>
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-white">{student.name}</span>
              <span className="text-[10px] text-slate-400">{student.school_class}</span>
            </div>
            <img src={student.photo_url} className="w-8 h-8 rounded-full border-2 border-tocantins-yellow object-cover" alt="User" />
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
