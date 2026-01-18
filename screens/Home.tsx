
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subjectsInfo } from '../data';
import { BookOpen, GraduationCap, ChevronRight, UserCircle } from 'lucide-react';
import { Subject } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('student');
    if (!saved) {
      navigate('/login');
    } else {
      setStudent(JSON.parse(saved));
    }
  }, [navigate]);

  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-serif font-bold mb-4">Olá, {student.name.split(' ')[0]}!</h2>
          <p className="text-slate-400">Selecione uma disciplina para acessar as atividades da <span className="text-tocantins-yellow font-bold">{student.grade}ª Série</span>.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.keys(subjectsInfo) as Subject[]).map((key) => {
            const info = subjectsInfo[key];
            return (
              <Link 
                key={key}
                to={`/grade/${student.grade}?subject=${key}`}
                className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200 hover:-translate-y-2 transition-all group"
              >
                <div className={`w-16 h-16 ${info.color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg`}>
                  {info.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-tocantins-blue transition-colors">{info.name}</h3>
                <p className="text-slate-500 text-sm mb-6">Acesse o conteúdo e envie suas atividades.</p>
                <div className="flex items-center text-tocantins-blue font-bold text-xs uppercase tracking-widest">
                  Entrar <ChevronRight size={14} className="ml-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Professor - Imagem Removida para Privacidade */}
        <div className="mt-16 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
          <div className="max-w-2xl mx-auto">
            <h4 className="text-2xl font-bold text-slate-800 mb-4">Coordenação Pedagógica</h4>
            <p className="text-slate-500 leading-relaxed">
              Este portal integra as disciplinas de Ciências Humanas sob orientação do Prof. Me. Divino Ribeiro Viana e equipe docente do Colégio Estadual Frederico Pedreira Neto. 
              O objetivo é facilitar o acesso ao material didático e o envio de atividades de forma organizada e segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
