
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { curriculumData, subjectsInfo } from '../data';
import { Book, ArrowLeft, ShieldAlert, ChevronRight } from 'lucide-react';
import { Subject } from '../types';
import { useAuth } from '../context/AuthContext';

export const GradeView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { student, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  const subjectKey = searchParams.get('subject') as Subject || 'filosofia';
  const grade = curriculumData.find(g => g.id === Number(id));
  const subject = subjectsInfo[subjectKey];

  useEffect(() => {
    if (!isLoading) {
      if (!student) {
        navigate('/login');
      } else if (Number(student.grade) !== Number(id)) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [id, student, isLoading, navigate]);

  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-tocantins-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthorized === false) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md border border-red-100">
        <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Série Incorreta</h2>
        <p className="text-slate-500 mb-6">Você está cadastrado na {student?.grade}ª Série e tentou acessar a {id}ª Série.</p>
        <Link to="/" className="block bg-slate-900 text-white p-4 rounded-xl font-bold">Voltar ao Meu Painel</Link>
      </div>
    </div>
  );

  if (!grade || !subject) return null;

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-500">
      <div className={`${subject.color} py-16 text-white`}>
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-bold">
            <ArrowLeft size={16}/> Mudar Disciplina
          </Link>
          <div className="flex items-center gap-4">
             <span className="text-4xl">{subject.icon}</span>
             <div>
                <h1 className="text-3xl font-bold">{subject.name} - {grade.title}</h1>
                <p className="text-white/70">Aulas e atividades do semestre</p>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl -mt-8">
        <div className="space-y-8">
          {grade.bimesters.map((bimester) => {
            const filteredLessons = bimester.lessons.filter(l => l.subject === subjectKey);
            if (filteredLessons.length === 0) return null;

            const displayTitle = bimester.subjectTitles?.[subjectKey] || bimester.title;

            return (
              <div key={bimester.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 px-8 py-4 border-b">
                   <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{displayTitle}</h3>
                </div>
                <div className="divide-y">
                  {filteredLessons.map((lesson) => (
                    <Link key={lesson.id} to={`/lesson/${lesson.id}`} className="flex items-center p-6 hover:bg-slate-50 transition group">
                       <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-tocantins-blue group-hover:text-white transition-all mr-4">
                         <Book size={20}/>
                       </div>
                       <span className="font-bold text-slate-700 flex-1">{lesson.title}</span>
                       <ChevronRight size={18} className="text-slate-300"/>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
