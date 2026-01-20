
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { subjectsInfo, ADMIN_PASSWORDS, curriculumData } from '../data';
import { Subject } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateBimonthlyEvaluation, GeneratedEvaluation, generatePedagogicalSummary } from '../services/aiService';
import { 
  Users, BookOpen, User, 
  MessageSquare, Loader2, X, Save, 
  RefreshCw, Home, ShieldCheck, Trash2, Settings,
  Search, Award, StickyNote, Clock, Send, UserCircle, BrainCircuit, Sparkles, FileText, CheckCircle2,
  Filter, Download, GraduationCap, ChevronRight, ClipboardEdit, BarChart3, Printer, Wand2,
  Library, ListChecks
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { teacherSubject, loginTeacher, logoutTeacher } = useAuth();
  
  const [pass, setPass] = useState('');
  const [email, setEmail] = useState(''); 
  const [selectedAccess, setSelectedAccess] = useState<Subject | 'SUPER_ADMIN'>('filosofia');
  
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'submissions' | 'evaluations' | 'messages' | 'students' | 'manage' | 'exam_generator' | 'reports' | 'lessons_list'>('submissions');
  
  // Estados do Carômetro
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [studentNotesHistory, setStudentNotesHistory] = useState<any[]>([]);

  // Estados de Relatórios
  const [reportTarget, setReportTarget] = useState<'student' | 'class'>('student');
  const [selectedReportStudent, setSelectedReportStudent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReportResult, setAiReportResult] = useState<string | null>(null);

  // Gerador de Avaliação
  const [examGrade, setExamGrade] = useState('1');
  const [examBimester, setExamBimester] = useState('1');
  const [examClass, setExamClass] = useState('all');
  const [generatedExam, setGeneratedExam] = useState<GeneratedEvaluation | null>(null);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isPublishingExam, setIsPublishingExam] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterBimester, setFilterBimester] = useState<string>('all');

  const isSuper = teacherSubject === 'SUPER_ADMIN';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccess === 'SUPER_ADMIN') {
        if (email === 'divinoviana@gmail.com' && pass === '3614526312') {
            loginTeacher('SUPER_ADMIN');
            setActiveTab('submissions');
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

      if (teacherSubject !== 'SUPER_ADMIN') {
        subQuery = subQuery.eq('subject', teacherSubject);
        msgQuery = msgQuery.eq('subject', teacherSubject);
      }

      const [stRes, subRes, msgRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        subQuery,
        msgQuery
      ]);

      setStudents(stRes.data || []);
      setSubmissions(subRes.data || []);
      setMessages(msgRes.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (teacherSubject) {
      loadData();
    }
  }, [teacherSubject]);

  useEffect(() => {
    if (selectedStudent && teacherSubject) {
        fetchStudentNotes(selectedStudent.id);
    }
  }, [selectedStudent, teacherSubject]);

  const fetchStudentNotes = async (studentId: string) => {
    const { data } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_subject', teacherSubject)
        .order('created_at', { ascending: false });
    setStudentNotesHistory(data || []);
  };

  const handleSaveNote = async () => {
    if (!studentNote.trim() || !selectedStudent || !teacherSubject) return;
    setIsSavingNote(true);
    try {
        const { error } = await supabase.from('student_notes').insert([{
            student_id: selectedStudent.id,
            teacher_subject: teacherSubject,
            content: studentNote.trim()
        }]);
        if (error) throw error;
        setStudentNote('');
        fetchStudentNotes(selectedStudent.id);
    } catch (e: any) {
        alert("Erro ao salvar nota: " + e.message);
    } finally {
        setIsSavingNote(false);
    }
  };

  const handleGenerateExam = async () => {
    if (!teacherSubject || teacherSubject === 'SUPER_ADMIN') return;
    
    setIsGeneratingExam(true);
    setGeneratedExam(null);

    try {
      const subjectName = subjectsInfo[teacherSubject as Subject]?.name || "";
      const gradeData = curriculumData.find(g => g.id === Number(examGrade));
      const bimesterData = gradeData?.bimesters.find(b => b.id === Number(examBimester));
      
      const topics = bimesterData?.lessons
        .filter(l => l.subject === teacherSubject)
        .map(l => l.title) || [];

      if (topics.length === 0) {
        throw new Error("Não há conteúdos cadastrados para esta disciplina no bimestre selecionado.");
      }

      const result = await generateBimonthlyEvaluation(
        subjectName,
        examGrade,
        examBimester,
        topics
      );

      setGeneratedExam(result);
    } catch (e: any) {
      alert("Erro ao gerar avaliação: " + e.message);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handlePublishExam = async () => {
    if (!generatedExam || !teacherSubject) return;
    
    setIsPublishingExam(true);
    try {
      const { error } = await supabase.from('bimonthly_exams').insert([{
        subject: teacherSubject,
        grade: Number(examGrade),
        bimester: Number(examBimester),
        school_class: examClass === 'all' ? null : examClass,
        questions: generatedExam.questions
      }]);

      if (error) throw error;

      alert("Avaliação publicada com sucesso!");
      setGeneratedExam(null);
      setActiveTab('submissions');
    } catch (e: any) {
      alert("Erro ao publicar: " + e.message);
    } finally {
      setIsPublishingExam(false);
    }
  };

  const handleGenerateFullReport = async () => {
    if (!teacherSubject) return;
    setIsGeneratingReport(true);
    setAiReportResult(null);

    try {
      let targetGrades: number[] = [];
      let targetNotes: string[] = [];
      let studentName = "";
      let schoolClass = filterClass !== 'all' ? filterClass : "Turma não selecionada";

      if (reportTarget === 'student') {
        const student = students.find(s => s.id === selectedReportStudent);
        if (!student) {
          alert("Selecione um estudante.");
          setIsGeneratingReport(false);
          return;
        }
        studentName = student.name;
        schoolClass = student.school_class;
        
        targetGrades = submissions
          .filter(s => s.student_name === student.name)
          .map(s => Number(s.score));

        const { data: notes } = await supabase
          .from('student_notes')
          .select('content')
          .eq('student_id', student.id)
          .eq('teacher_subject', teacherSubject);
        
        targetNotes = (notes || []).map(n => n.content);
      } else {
        if (filterClass === 'all') {
          alert("Selecione uma turma nos filtros acima para gerar o relatório do grupo.");
          setIsGeneratingReport(false);
          return;
        }
        targetGrades = submissions
          .filter(s => s.school_class === filterClass)
          .map(s => Number(s.score));
        
        targetNotes = ["Relatório coletivo de desempenho e engajamento da turma."];
      }

      const summary = await generatePedagogicalSummary(
        reportTarget === 'student' ? 'INDIVIDUAL' : 'TURMA',
        {
          subject: subjectsInfo[teacherSubject as Subject]?.name || "Geral",
          grades: targetGrades,
          notes: targetNotes,
          studentName: studentName || undefined,
          schoolClass: schoolClass
        }
      );

      setAiReportResult(summary);
    } catch (e: any) {
      alert("Erro ao gerar relatório: " + e.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const classOptions = useMemo(() => {
    const grade = filterGrade === 'all' ? examGrade : filterGrade;
    if (grade === '1') return Array.from({length: 6}, (_, i) => `13.0${i+1}`);
    if (grade === '2') return Array.from({length: 8}, (_, i) => `23.0${i+1}`);
    if (grade === '3') return Array.from({length: 9}, (_, i) => `33.0${i+1}`);
    return [];
  }, [examGrade, filterGrade]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchName = sub.student_name.toLowerCase().includes(searchTerm.toLowerCase());
      const subGrade = sub.school_class.substring(0, 1);
      const matchGrade = filterGrade === 'all' || subGrade === filterGrade;
      const matchClass = filterClass === 'all' || sub.school_class === filterClass;
      
      if (activeTab === 'evaluations') {
        const isExam = sub.lesson_title.startsWith('Avaliação Bimestral');
        const matchBimester = filterBimester === 'all' || sub.lesson_title.includes(`${filterBimester}º Bimestre`);
        return matchName && matchGrade && matchClass && isExam && matchBimester;
      }
      return matchName && matchGrade && matchClass;
    });
  }, [submissions, searchTerm, filterGrade, filterClass, filterBimester, activeTab]);

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchName = st.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = filterGrade === 'all' || st.grade === filterGrade;
      const matchClass = filterClass === 'all' || st.school_class === filterClass;
      return matchName && matchGrade && matchClass;
    });
  }, [students, searchTerm, filterGrade, filterClass]);

  if (!teacherSubject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm border border-slate-100">
          <div className="text-center mb-8">
             <div className="w-20 h-20 bg-tocantins-blue rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
                <ShieldCheck className="text-white" size={40}/>
             </div>
             <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Área Docente</h2>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <select className="w-full p-4 border rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none" value={selectedAccess} onChange={e => setSelectedAccess(e.target.value as any)}>
              <option value="SUPER_ADMIN">👑 Gestão Geral (Super Admin)</option>
              {Object.entries(subjectsInfo).map(([k, v]) => <option key={k} value={k}>Professor de {v.name}</option>)}
            </select>
            {selectedAccess === 'SUPER_ADMIN' && <input required type="email" placeholder="Email Administrativo" className="w-full p-4 border rounded-2xl bg-slate-50 outline-none" value={email} onChange={e => setEmail(e.target.value)} />}
            <input required type="password" placeholder="Senha de Acesso" className="w-full p-4 border rounded-2xl bg-slate-50 outline-none" value={pass} onChange={e => setPass(e.target.value)} />
            <button type="submit" className="w-full bg-tocantins-blue text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">Acessar Painel</button>
          </form>
        </div>
      </div>
    );
  }

  const currentSubInfo = !isSuper ? subjectsInfo[teacherSubject as Subject] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-hidden">
      
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-slate-800 uppercase tracking-tighter">Ficha do Estudante</h3>
                    <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                            <img src={selectedStudent.photo_url} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{selectedStudent.name}</h4>
                            <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">{selectedStudent.grade}ª Série • Turma {selectedStudent.school_class}</p>
                            <button 
                                onClick={() => {
                                    setActiveTab('messages');
                                    setSearchTerm(selectedStudent.name);
                                    setSelectedStudent(null);
                                }}
                                className="mt-4 flex items-center gap-2 bg-tocantins-blue text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                            >
                                <MessageSquare size={16}/> Chamar no Chat
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h5 className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <ClipboardEdit size={14}/> Anotações Pedagógicas (Somente você vê)
                        </h5>
                        <div className="flex gap-2">
                            <textarea 
                                value={studentNote} 
                                onChange={e => setStudentNote(e.target.value)}
                                placeholder="Registre observações sobre comportamento, dificuldades ou avanços..." 
                                className="flex-1 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-tocantins-blue outline-none text-sm font-medium h-24"
                            />
                            <button 
                                onClick={handleSaveNote}
                                disabled={isSavingNote || !studentNote.trim()}
                                className="bg-slate-900 text-white px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-800 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1"
                            >
                                {isSavingNote ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                                Salvar
                            </button>
                        </div>
                        
                        <div className="space-y-3 mt-6">
                            {studentNotesHistory.map((n: any) => (
                                <div key={n.id} className="bg-amber-50 p-4 rounded-2xl border border-amber-100 relative">
                                    <p className="text-sm text-slate-700 italic">"{n.content}"</p>
                                    <p className="text-[8px] font-black text-amber-600 uppercase mt-2">{new Date(n.created_at).toLocaleDateString('pt-BR')} às {new Date(n.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                            ))}
                            {studentNotesHistory.length === 0 && <p className="text-center py-6 text-slate-300 text-xs font-bold uppercase">Nenhuma anotação registrada ainda.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <aside className="w-full lg:w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0 border-r border-white/5">
        <div className="mb-10 text-center">
           <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl shadow-2xl ${isSuper ? 'bg-amber-500' : currentSubInfo?.color}`}>
             {isSuper ? '👑' : currentSubInfo?.icon}
           </div>
           <h2 className="font-black text-sm uppercase tracking-tight">{isSuper ? 'Super Admin' : `Prof. ${currentSubInfo?.name}`}</h2>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab('submissions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'submissions' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <BookOpen size={18}/> Atividades Diárias
          </button>
          
          <button onClick={() => setActiveTab('lessons_list')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'lessons_list' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <Library size={18}/> Plano de Aulas
          </button>

          {!isSuper && (
            <button onClick={() => setActiveTab('exam_generator')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'exam_generator' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
              <BrainCircuit size={18}/> Gerar Avaliação
            </button>
          )}
          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'students' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={18}/> Carômetro
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'reports' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <BarChart3 size={18}/> Relatórios (IA)
          </button>
          <button onClick={() => setActiveTab('evaluations')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'evaluations' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <Award size={18}/> Notas Bimestrais
          </button>
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'messages' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}>
            <MessageSquare size={18}/> Chat e Alertas
          </button>
        </nav>
        
        <button onClick={handleExitAdmin} className="w-full flex items-center justify-center gap-2 p-5 text-slate-300 bg-white/5 hover:bg-red-500/20 hover:text-red-300 rounded-2xl transition-all text-xs font-black uppercase mt-8 border border-white/10 shadow-sm cursor-pointer">
          <Home size={18}/> Sair do Painel
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b p-6 flex justify-between items-center z-10 shadow-sm no-print">
           <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
             {activeTab === 'reports' ? 'Relatórios Pedagógicos' : 
              activeTab === 'lessons_list' ? 'Roteiro de Conteúdos' : 
              'Gestão Pedagógica'}
           </h1>
           <button onClick={loadData} className="p-3 text-slate-400 hover:text-tocantins-blue bg-slate-100 rounded-xl transition-all cursor-pointer">
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50/50">
           
           {/* FILTROS GERAIS */}
           {activeTab !== 'exam_generator' && activeTab !== 'lessons_list' && (
              <div className="mb-8 bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end animate-in fade-in no-print">
                 <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Buscar por Nome</label>
                    <div className="relative">
                       <Search className="absolute left-4 top-3.5 text-slate-300" size={18}/>
                       <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nome do aluno..." className="w-full pl-12 p-3.5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-tocantins-blue/20 text-sm font-medium" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Série</label>
                    <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="p-3.5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-tocantins-blue/20 text-sm font-bold min-w-[120px]">
                       <option value="all">Todas</option>
                       <option value="1">1ª Série</option>
                       <option value="2">2ª Série</option>
                       <option value="3">3ª Série</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block">Turma</label>
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-3.5 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-tocantins-blue/20 text-sm font-bold min-w-[120px]">
                       <option value="all">Todas</option>
                       {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
           )}

           {/* ABA: PLANO DE AULAS */}
           {activeTab === 'lessons_list' && (
              <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-4">
                 <div className="bg-amber-500 p-8 rounded-[40px] text-white shadow-xl flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Minha Sequência Didática</h2>
                        <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mt-1">
                            {isSuper ? 'Visualização Geral (Super Admin)' : `Disciplina: ${subjectsInfo[teacherSubject as Subject].name}`}
                        </p>
                    </div>
                    <Library size={48} className="opacity-20" />
                 </div>

                 {curriculumData.map(grade => (
                    <div key={grade.id} className="space-y-6">
                        <div className="flex items-center gap-3 ml-4">
                            <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">{grade.id}º</span>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{grade.title}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {grade.bimesters.map(bimester => {
                                const filteredLessons = isSuper 
                                    ? bimester.lessons 
                                    : bimester.lessons.filter(l => l.subject === teacherSubject);

                                if (filteredLessons.length === 0) return null;

                                return (
                                    <div key={bimester.id} className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-50 px-6 py-4 border-b">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bimester.title}</h4>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {filteredLessons.map((lesson, idx) => (
                                                <div key={lesson.id} className="p-5 hover:bg-amber-50/30 transition-colors group flex items-start gap-4">
                                                    <span className="text-[10px] font-black text-amber-500 mt-1">{String(idx + 1).padStart(2, '0')}</span>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 group-hover:text-amber-600 transition-colors leading-tight">
                                                            {lesson.title.replace(/^L\d+:\s*/, '')}
                                                        </p>
                                                        <div className="flex gap-2 mt-2">
                                                            <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase">ID: {lesson.id}</span>
                                                            {isSuper && (
                                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${subjectsInfo[lesson.subject].color.replace('bg-', 'bg-opacity-10 text-')}`}>
                                                                    {subjectsInfo[lesson.subject].name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 ))}
                 
                 <div className="py-10 text-center">
                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 mx-auto hover:bg-slate-800 transition-all">
                        <Printer size={18}/> Baixar Roteiro em PDF
                    </button>
                 </div>
              </div>
           )}

           {/* ABA DE RELATÓRIOS */}
           {activeTab === 'reports' && (
             <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 no-print">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-6 flex items-center gap-2">
                     <Wand2 className="text-tocantins-blue" /> Gerador de Síntese Pedagógica
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <p className="text-xs font-black text-slate-400 uppercase">1. Escopo do Relatório</p>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => setReportTarget('student')}
                              className={`flex-1 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${reportTarget === 'student' ? 'border-tocantins-blue bg-blue-50 text-tocantins-blue' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                            >
                              Individual (Estudante)
                            </button>
                            <button 
                              onClick={() => setReportTarget('class')}
                              className={`flex-1 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${reportTarget === 'class' ? 'border-tocantins-blue bg-blue-50 text-tocantins-blue' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                            >
                              Coletivo (Turma)
                            </button>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <p className="text-xs font-black text-slate-400 uppercase">2. Alvo da Análise</p>
                         {reportTarget === 'student' ? (
                            <select 
                              value={selectedReportStudent}
                              onChange={e => setSelectedReportStudent(e.target.value)}
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-tocantins-blue"
                            >
                               <option value="">Selecione um aluno...</option>
                               {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.school_class})</option>)}
                            </select>
                         ) : (
                            <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl text-xs font-bold border border-amber-100">
                               A análise será feita baseada na turma <b>{filterClass === 'all' ? 'Selecione uma turma no filtro topo' : filterClass}</b>.
                            </div>
                         )}
                      </div>
                   </div>
                   <button 
                    onClick={handleGenerateFullReport}
                    disabled={isGeneratingReport || (reportTarget === 'student' && !selectedReportStudent) || (reportTarget === 'class' && filterClass === 'all')}
                    className="mt-8 w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all"
                   >
                      {isGeneratingReport ? <Loader2 className="animate-spin" /> : <Sparkles size={18}/>}
                      {isGeneratingReport ? 'Processando dados...' : 'Gerar Relatório Analítico com IA'}
                   </button>
                </div>

                {aiReportResult && (
                  <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-100 relative print:shadow-none print:border-none print:p-0">
                     <div className="flex justify-between items-start mb-10 no-print">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                              <CheckCircle2 />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 uppercase text-sm">Relatório Pronto</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Documento gerado em {new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        <button onClick={() => window.print()} className="bg-slate-100 hover:bg-slate-200 p-4 rounded-2xl text-slate-600 transition-all flex items-center gap-2 font-black text-xs uppercase">
                           <Printer size={18}/> Imprimir / PDF
                        </button>
                     </div>

                     <div className="prose prose-slate max-w-none">
                        <div className="mb-8 border-b pb-8 flex flex-col items-center text-center">
                           <h2 className="text-2xl font-black text-slate-800 uppercase mb-2">Relatório Pedagógico Analítico</h2>
                           <p className="text-xs font-bold text-tocantins-blue uppercase tracking-widest">Colégio Estadual Frederico Pedreira Neto • Disciplina: {subjectsInfo[teacherSubject as Subject]?.name}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 mb-8 whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-sm shadow-inner">
                           {aiReportResult}
                        </div>

                        <div className="mt-12 pt-12 border-t flex justify-around text-center grayscale opacity-50 no-print">
                            <div>
                               <p className="text-[10px] font-black uppercase mb-1">Docente</p>
                               <div className="w-40 h-px bg-slate-300 mx-auto mb-2"></div>
                               <p className="text-xs font-bold text-slate-500">Assinatura</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase mb-1">Coordenação</p>
                               <div className="w-40 h-px bg-slate-300 mx-auto mb-2"></div>
                               <p className="text-xs font-bold text-slate-500">Assinatura</p>
                            </div>
                        </div>
                     </div>
                  </div>
                )}
             </div>
           )}

           {/* CARÔMETRO */}
           {activeTab === 'students' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 animate-in slide-in-from-bottom-4">
                 {filteredStudents.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-300 font-bold uppercase">Nenhum aluno encontrado para este filtro.</div>
                 ) : (
                    filteredStudents.map(st => (
                        <div 
                            key={st.id} 
                            onClick={() => setSelectedStudent(st)}
                            className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                        >
                            <div className="aspect-square rounded-[24px] overflow-hidden mb-4 border-2 border-white shadow-inner bg-slate-100">
                                <img src={st.photo_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                            </div>
                            <h4 className="font-black text-slate-800 uppercase text-[10px] leading-tight text-center truncate">{st.name}</h4>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center mt-1">{st.school_class}</p>
                        </div>
                    ))
                 )}
              </div>
           )}

           {activeTab === 'evaluations' && (
              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-900 text-white">
                          <tr>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Estudante</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Turma</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Disciplina</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest">Avaliação</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest text-center">Nota Final</th>
                             <th className="p-6 text-[10px] font-black uppercase tracking-widest text-right">Data</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {filteredSubmissions.length === 0 ? (
                             <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold">Nenhuma nota encontrada para os filtros selecionados.</td></tr>
                          ) : (
                             filteredSubmissions.map(sub => (
                                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                   <td className="p-6">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 overflow-hidden">
                                            {sub.student_photo ? <img src={sub.student_photo} /> : sub.student_name.charAt(0)}
                                         </div>
                                         <span className="font-bold text-slate-800">{sub.student_name}</span>
                                      </div>
                                   </td>
                                   <td className="p-6"><span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600">{sub.school_class}</span></td>
                                   <td className="p-6">
                                      <span className={`text-[10px] font-black uppercase ${subjectsInfo[sub.subject as Subject]?.color.replace('bg-', 'text-')}`}>
                                         {subjectsInfo[sub.subject as Subject]?.name}
                                      </span>
                                   </td>
                                   <td className="p-6 text-sm font-medium text-slate-600">{sub.lesson_title}</td>
                                   <td className="p-6">
                                      <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border ${Number(sub.score) >= 6 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                         {Number(sub.score).toFixed(1)}
                                      </div>
                                   </td>
                                   <td className="p-6 text-right text-[10px] font-bold text-slate-400">
                                      {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

           {activeTab === 'submissions' && (
              <div className="max-w-6xl mx-auto space-y-6">
                {filteredSubmissions.length === 0 ? <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-400 font-bold">Nenhum envio recebido ainda.</div> : 
                  filteredSubmissions.map(sub => (
                    <div key={sub.id} className="bg-white rounded-[32px] border shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
                       <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                                {sub.student_photo ? <img src={sub.student_photo} className="w-full h-full object-cover" /> : <User className="m-auto mt-3 text-slate-300"/>}
                             </div>
                             <div>
                                <h3 className="font-black text-slate-800 uppercase">{sub.student_name}</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase">{sub.school_class} • {sub.lesson_title}</p>
                             </div>
                             <div className={`ml-auto px-4 py-2 rounded-2xl font-black text-sm ${sub.lesson_title.startsWith('Avaliação') ? 'bg-indigo-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                {sub.lesson_title.startsWith('Avaliação') ? 'AVALIAÇÃO' : 'ATIVIDADE'}
                             </div>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                             {sub.content?.map((item: any, i: number) => (
                               <div key={i}><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Questão {i+1}</p><p className="text-sm font-medium text-slate-700 italic">"{item.answer}"</p></div>
                             ))}
                          </div>
                       </div>
                    </div>
                  ))
                }
              </div>
           )}

           {/* MENSAGENS / CHAT */}
           {activeTab === 'messages' && (
              <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in">
                 <div className="bg-tocantins-blue p-8 rounded-[40px] text-white shadow-xl mb-6">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Central de Mensagens</h3>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Envie alertas gerais ou responda dúvidas individuais</p>
                 </div>
                 <div className="bg-white rounded-[32px] p-6 border text-center text-slate-400 py-20 font-black uppercase text-xs">
                    Selecione um aluno no Carômetro para iniciar uma conversa direta ou use os filtros acima para ver mensagens enviadas.
                 </div>
              </div>
           )}

           {activeTab === 'exam_generator' && !isSuper && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                 <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                    <Sparkles className="absolute -top-4 -right-4 w-32 h-32 opacity-10" />
                    <div className="relative z-10">
                       <h3 className="text-2xl font-black uppercase mb-2">Simulado Estilo ENEM</h3>
                       <p className="text-indigo-100 text-sm opacity-80 font-medium">As questões serão baseadas no currículo oficial da BNCC.</p>
                       
                       <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 ml-1">Série</label>
                             <select value={examGrade} onChange={e => setExamGrade(e.target.value)} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none font-bold">
                                <option className="text-slate-800" value="1">1ª Série</option>
                                <option className="text-slate-800" value="2">2ª Série</option>
                                <option className="text-slate-800" value="3">3ª Série</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 ml-1">Bimestre</label>
                             <select value={examBimester} onChange={e => setExamBimester(e.target.value)} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none font-bold">
                                <option className="text-slate-800" value="1">1º Bimestre</option>
                                <option className="text-slate-800" value="2">2º Bimestre</option>
                                <option className="text-slate-800" value="3">3º Bimestre</option>
                                <option className="text-slate-800" value="4">4º Bimestre</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200 ml-1">Público</label>
                             <select value={examClass} onChange={e => setExamClass(e.target.value)} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl outline-none font-bold">
                                <option className="text-slate-800" value="all">Todas as turmas</option>
                                {classOptions.map(c => <option key={c} className="text-slate-800" value={c}>{c}</option>)}
                             </select>
                          </div>
                       </div>

                       <button 
                         onClick={handleGenerateExam} 
                         disabled={isGeneratingExam}
                         className="mt-8 w-full bg-white text-indigo-700 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                       >
                          {isGeneratingExam ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                          {isGeneratingExam ? 'A IA está elaborando as questões...' : 'Gerar Nova Avaliação'}
                       </button>
                    </div>
                 </div>

                 {generatedExam && (
                    <div className="bg-white rounded-[40px] shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                       <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                          <div>
                             <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl">Prévia para {examClass === 'all' ? `todas as turmas` : `Turma ${examClass}`}</h4>
                          </div>
                          <button 
                            onClick={handlePublishExam}
                            disabled={isPublishingExam}
                            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 shadow-lg flex items-center gap-2 cursor-pointer"
                          >
                             {isPublishingExam ? <Loader2 className="animate-spin" /> : <Send size={18}/>}
                             Confirmar e Enviar
                          </button>
                       </div>
                       <div className="p-8 space-y-10">
                          {generatedExam.questions.map((q, idx) => (
                             <div key={idx} className="space-y-4">
                                <div className="flex items-center gap-2">
                                   <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">{idx + 1}</span>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-slate-200 italic text-sm text-slate-600 leading-relaxed">
                                   "{q.textFragment}"
                                </div>
                                <p className="font-bold text-slate-800 leading-snug">{q.questionText}</p>
                                <div className="grid grid-cols-1 gap-2 pl-4">
                                   {Object.entries(q.options).map(([key, val]) => (
                                      <div key={key} className={`p-4 rounded-xl border text-sm ${key === q.correctOption ? 'border-green-500 bg-green-50 font-bold' : 'border-slate-100 bg-slate-50'}`}>
                                         <span className="uppercase mr-2 font-black">{key})</span> {val}
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           )}

        </div>
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { overflow: visible !important; height: auto !important; }
          .overflow-y-auto { overflow: visible !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
};
