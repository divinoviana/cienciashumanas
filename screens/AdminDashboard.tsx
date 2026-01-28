
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Library, ListChecks, Reply, Key, UserMinus, AlertTriangle, Camera, Upload
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
  
  const [activeTab, setActiveTab] = useState<'submissions' | 'evaluations' | 'messages' | 'students' | 'manage' | 'exam_generator' | 'reports' | 'lessons_list' | 'teacher_profile'>('submissions');
  
  // Perfil do Professor
  const [teacherPhoto, setTeacherPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carômetro e Notas
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [studentNotesHistory, setStudentNotesHistory] = useState<any[]>([]);

  // Chat
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string | null>(null);
  const [teacherReplyText, setTeacherReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Feedback
  const [feedbackingId, setFeedbackingId] = useState<string | null>(null);
  const [teacherFeedbackText, setTeacherFeedbackText] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // Relatórios IA
  const [reportTarget, setReportTarget] = useState<'student' | 'class'>('student');
  const [selectedReportStudent, setSelectedReportStudent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [aiReportResult, setAiReportResult] = useState<string | null>(null);

  // Gerador de Provas IA
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

  const loadTeacherProfile = async () => {
    if (!teacherSubject || isSuper) return;
    const { data } = await supabase
      .from('teacher_profiles')
      .select('photo_url')
      .eq('subject', teacherSubject)
      .maybeSingle();
    
    if (data) setTeacherPhoto(data.photo_url);
  };

  const handleSaveTeacherProfile = async () => {
    if (!teacherPhoto || !teacherSubject) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .upsert({ 
          subject: teacherSubject, 
          photo_url: teacherPhoto,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'subject' });

      if (error) throw error;
      alert("Foto de perfil atualizada!");
      setActiveTab('submissions');
    } catch (e: any) {
      alert("Erro ao salvar perfil: " + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Câmera indisponível.");
      setShowCamera(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setTeacherPhoto(canvas.toDataURL('image/jpeg'));
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      setShowCamera(false);
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

      if (!isSuper) {
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
      loadTeacherProfile();
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!teacherSubject) return;
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: !isSuper ? `subject=eq.${teacherSubject}` : undefined
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teacherSubject, isSuper]);

  useEffect(() => {
    if (teacherSubject) { loadData(); }
  }, [teacherSubject]);

  useEffect(() => {
    if (selectedStudent && teacherSubject) { fetchStudentNotes(selectedStudent.id); }
  }, [selectedStudent, teacherSubject]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChatStudentId]);

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

  const handleResetPassword = async () => {
    if (!selectedStudent || !isSuper) return;
    const newPass = prompt("Digite a nova senha para o estudante:", "123456");
    if (!newPass) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('students').update({ password: newPass }).eq('id', selectedStudent.id);
      if (error) throw error;
      alert("Senha resetada!");
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent || !isSuper) return;
    if (!confirm(`TEM CERTEZA? Excluirá ${selectedStudent.name}.`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('students').delete().eq('id', selectedStudent.id);
      if (error) throw error;
      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
      setSelectedStudent(null);
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherReplyText.trim() || !selectedChatStudentId || !teacherSubject) return;
    setIsSendingReply(true);
    const studentObj = students.find(s => s.id === selectedChatStudentId);
    try {
      const { error } = await supabase.from('messages').insert([{
        sender_id: selectedChatStudentId,
        sender_name: studentObj?.name || 'Estudante',
        school_class: studentObj?.school_class || 'N/A',
        grade: studentObj?.grade || 'N/A',
        content: teacherReplyText.trim(),
        is_from_teacher: true,
        subject: teacherSubject
      }]);
      if (error) throw error;
      setTeacherReplyText('');
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSaveFeedback = async (submissionId: string) => {
    if (!teacherFeedbackText.trim()) return;
    setIsSavingFeedback(true);
    try {
      const { error } = await supabase.from('submissions').update({ teacher_feedback: teacherFeedbackText.trim() }).eq('id', submissionId);
      if (error) throw error;
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, teacher_feedback: teacherFeedbackText.trim() } : s));
      setFeedbackingId(null);
      setTeacherFeedbackText('');
      alert("Feedback enviado!");
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const handleGenerateExam = async () => {
    if (!teacherSubject || isSuper) return;
    setIsGeneratingExam(true);
    setGeneratedExam(null);
    try {
      const subjectName = subjectsInfo[teacherSubject as Subject]?.name || "";
      const gradeData = curriculumData.find(g => g.id === Number(examGrade));
      const bimesterData = gradeData?.bimesters.find(b => b.id === Number(examBimester));
      const topics = bimesterData?.lessons.filter(l => l.subject === teacherSubject).map(l => l.title) || [];
      if (topics.length === 0) throw new Error("Sem lições para este período.");
      const result = await generateBimonthlyEvaluation(subjectName, examGrade, examBimester, topics);
      setGeneratedExam(result);
    } catch (e: any) {
      alert("IA Falhou: " + e.message);
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handlePublishExam = async () => {
    if (!generatedExam || !teacherSubject) return;
    setIsPublishingExam(true);
    try {
      const { error } = await supabase.from('bimonthly_exams').insert([{
        subject: teacherSubject, grade: Number(examGrade), bimester: Number(examBimester),
        school_class: examClass === 'all' ? null : examClass, questions: generatedExam.questions
      }]);
      if (error) throw error;
      alert("Publicada!");
      setGeneratedExam(null);
      setActiveTab('submissions');
    } catch (e: any) {
      alert("Erro: " + e.message);
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
        if (!student) throw new Error("Selecione um aluno.");
        studentName = student.name;
        schoolClass = student.school_class;
        targetGrades = submissions.filter(s => s.student_name === student.name).map(s => Number(s.score));
        const { data: notes } = await supabase.from('student_notes').select('content').eq('student_id', student.id).eq('teacher_subject', teacherSubject);
        targetNotes = (notes || []).map(n => n.content);
      } else {
        if (filterClass === 'all') throw new Error("Selecione uma turma.");
        targetGrades = submissions.filter(s => s.school_class === filterClass).map(s => Number(s.score));
        targetNotes = ["Relatório coletivo da turma " + filterClass];
      }
      const summary = await generatePedagogicalSummary(reportTarget === 'student' ? 'INDIVIDUAL' : 'TURMA', {
        subject: subjectsInfo[teacherSubject as Subject]?.name || "Ciências Humanas",
        grades: targetGrades, notes: targetNotes, studentName: studentName || undefined, schoolClass: schoolClass
      });
      setAiReportResult(summary);
    } catch (e: any) {
      alert("Erro: " + e.message);
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

  const chatSessions = useMemo(() => {
    const groups: Record<string, any> = {};
    messages.forEach(m => {
        if (!groups[m.sender_id]) {
            const student = students.find(s => s.id === m.sender_id);
            groups[m.sender_id] = { studentId: m.sender_id, studentName: m.sender_name, schoolClass: m.school_class, photoUrl: student?.photo_url, lastMessage: m.content, timestamp: m.created_at, unread: !m.is_from_teacher };
        } else {
            groups[m.sender_id].lastMessage = m.content;
            groups[m.sender_id].timestamp = m.created_at;
            if (!m.is_from_teacher) groups[m.sender_id].unread = true;
        }
    });
    return Object.values(groups).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, students]);

  const selectedChatMessages = useMemo(() => messages.filter(m => m.sender_id === selectedChatStudentId), [messages, selectedChatStudentId]);

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
      
      {/* MODAL FICHA DO ESTUDANTE (CARÔMETRO) */}
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
                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{selectedStudent.name}</h4>
                            <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">{selectedStudent.grade}ª Série • Turma {selectedStudent.school_class}</p>
                            <p className="text-slate-400 text-xs font-bold mt-1">E-mail: {selectedStudent.email}</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                <button onClick={() => { setActiveTab('messages'); setSelectedChatStudentId(selectedStudent.id); setSelectedStudent(null); }} className="flex items-center gap-2 bg-tocantins-blue text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg"> <MessageSquare size={16}/> Chat </button>
                                {isSuper && (
                                    <>
                                        <button onClick={handleResetPassword} className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg"> <Key size={16}/> Resetar Senha </button>
                                        <button onClick={handleDeleteStudent} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg"> <UserMinus size={16}/> Excluir Conta </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h5 className="font-black text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2"> <ClipboardEdit size={14}/> Anotações Pedagógicas </h5>
                        <div className="flex gap-2">
                            <textarea value={studentNote} onChange={e => setStudentNote(e.target.value)} placeholder="Registre observações..." className="flex-1 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-tocantins-blue outline-none text-sm h-24" />
                            <button onClick={handleSaveNote} disabled={isSavingNote || !studentNote.trim()} className="bg-slate-900 text-white px-6 rounded-2xl font-black text-[10px] uppercase"> {isSavingNote ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Salvar </button>
                        </div>
                        <div className="space-y-3 mt-6">
                            {studentNotesHistory.map((n: any) => ( <div key={n.id} className="bg-amber-50 p-4 rounded-2xl border border-amber-100 relative"> <p className="text-sm text-slate-700 italic">"{n.content}"</p> <p className="text-[8px] font-black text-amber-600 uppercase mt-2">{new Date(n.created_at).toLocaleString()}</p> </div> ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0 border-r border-white/5">
        <div className="mb-10 text-center">
           <div className={`w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl shadow-2xl overflow-hidden border-2 border-white/10 ${isSuper ? 'bg-amber-500' : currentSubInfo?.color}`}>
             {teacherPhoto ? <img src={teacherPhoto} className="w-full h-full object-cover"/> : (isSuper ? '👑' : currentSubInfo?.icon)}
           </div>
           <h2 className="font-black text-sm uppercase tracking-tight">{isSuper ? 'Super Admin' : `Prof. ${currentSubInfo?.name}`}</h2>
           {!isSuper && <button onClick={() => setActiveTab('teacher_profile')} className="mt-2 text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-tocantins-yellow transition-colors">Editar Minha Foto</button>}
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab('submissions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'submissions' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}> <BookOpen size={18}/> Atividades Diárias </button>
          <button onClick={() => setActiveTab('lessons_list')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'lessons_list' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}> <Library size={18}/> Plano de Aulas </button>
          {!isSuper && ( <button onClick={() => setActiveTab('exam_generator')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'exam_generator' ? 'bg-purple-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}> <BrainCircuit size={18}/> Gerar Avaliação </button> )}
          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'students' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}> <Users size={18}/> Carômetro </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'reports' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}> <BarChart3 size={18}/> Relatórios (IA) </button>
          <button onClick={() => setActiveTab('evaluations')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'evaluations' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}> <Award size={18}/> Notas Bimestrais </button>
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase transition-all ${activeTab === 'messages' ? 'bg-tocantins-blue text-white shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}> <MessageSquare size={18}/> Chat e Alertas </button>
        </nav>
        
        <button onClick={handleExitAdmin} className="w-full flex items-center justify-center gap-2 p-5 text-slate-300 bg-white/5 hover:bg-red-500/20 hover:text-red-300 rounded-2xl transition-all text-xs font-black uppercase mt-8 border border-white/10"> <Home size={18}/> Sair do Painel </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b p-6 flex justify-between items-center z-10 shadow-sm no-print">
           <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
             {activeTab === 'teacher_profile' ? 'Configurações de Perfil' : activeTab === 'reports' ? 'Relatórios Pedagógicos' : activeTab === 'lessons_list' ? 'Roteiro de Conteúdos' : activeTab === 'messages' ? 'Central de Mensagens' : 'Gestão Pedagógica'}
           </h1>
           <button onClick={loadData} className="p-3 text-slate-400 hover:text-tocantins-blue bg-slate-100 rounded-xl transition-all"> <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/> </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-50/50">
           
           {/* ABA: PERFIL DO PROFESSOR */}
           {activeTab === 'teacher_profile' && (
              <div className="max-w-md mx-auto bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 animate-in zoom-in-95">
                  <div className="text-center space-y-6">
                      <div className="relative inline-block">
                          <div className={`w-40 h-40 rounded-[48px] overflow-hidden border-4 border-tocantins-blue shadow-2xl bg-slate-100 mx-auto`}>
                              {teacherPhoto ? <img src={teacherPhoto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl">👨‍🏫</div>}
                          </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase">Prof. de {subjectsInfo[teacherSubject as Subject]?.name || 'Área'}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sua foto aparecerá para todos os seus alunos</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-tocantins-blue transition-all cursor-pointer text-[10px] font-black uppercase">
                              <Upload size={18}/> Arquivo
                              <input type="file" accept="image/*" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => setTeacherPhoto(reader.result as string);
                                      reader.readAsDataURL(file);
                                  }
                              }}/>
                          </label>
                          <button onClick={startCamera} className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-tocantins-blue transition-all text-[10px] font-black uppercase">
                              <Camera size={18}/> Câmera
                          </button>
                      </div>

                      <button onClick={handleSaveTeacherProfile} disabled={isSavingProfile || !teacherPhoto} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
                          {isSavingProfile ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                          Salvar Alterações
                      </button>
                  </div>
                  {showCamera && (
                    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-4">
                        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-8 flex gap-4">
                            <button onClick={() => { if(videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t=>t.stop()); setShowCamera(false); }} className="bg-white/10 text-white p-4 rounded-full"> <X size={24} /> </button>
                            <button onClick={takePhoto} className="bg-tocantins-blue text-white p-6 rounded-full shadow-2xl scale-110"> <Camera size={32} /> </button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                  )}
              </div>
           )}

           {/* FILTROS TOTAIS */}
           {activeTab !== 'exam_generator' && activeTab !== 'lessons_list' && activeTab !== 'messages' && activeTab !== 'teacher_profile' && activeTab !== 'reports' && (
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

           {/* ABA: SUBMISSÕES (ATIVIDADES DIÁRIAS) */}
           {activeTab === 'submissions' && (
              <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
                {filteredSubmissions.length === 0 ? <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-slate-400 font-bold">Nenhum envio recebido ainda.</div> : 
                  filteredSubmissions.map(sub => (
                    <div key={sub.id} className="bg-white rounded-[32px] border shadow-sm p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
                       <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                                    {sub.student_photo ? <img src={sub.student_photo} className="w-full h-full object-cover" /> : <User className="m-auto mt-3 text-slate-300"/>}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase">{sub.student_name}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase">{sub.school_class} • {sub.lesson_title}</p>
                                </div>
                              </div>
                              <div className="bg-slate-50 px-4 py-2 rounded-2xl font-black text-tocantins-blue text-sm">Nota: {sub.score?.toFixed(1)}</div>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                             {sub.content?.map((item: any, i: number) => (
                               <div key={i}><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Questão {i+1}</p><p className="text-sm font-medium text-slate-700 italic">"{item.answer}"</p></div>
                             ))}
                          </div>
                          <div className="mt-6 pt-6 border-t border-slate-100">
                             {sub.teacher_feedback ? (
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                   <div className="flex justify-between items-center mb-2">
                                      <h4 className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2"> <Reply size={14}/> Seu Feedback Enviado: </h4>
                                      <button onClick={() => { setFeedbackingId(sub.id); setTeacherFeedbackText(sub.teacher_feedback); }} className="text-[9px] font-black text-blue-400 uppercase"> Editar </button>
                                   </div>
                                   <p className="text-sm text-blue-800 italic font-medium">"{sub.teacher_feedback}"</p>
                                </div>
                             ) : feedbackingId === sub.id ? (
                                <div className="space-y-3">
                                   <textarea value={teacherFeedbackText} onChange={e => setTeacherFeedbackText(e.target.value)} placeholder="Escreva orientações..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm h-24" />
                                   <div className="flex gap-2">
                                      <button onClick={() => handleSaveFeedback(sub.id)} className="bg-tocantins-blue text-white px-6 py-3 rounded-xl text-xs font-black uppercase"> Enviar Feedback </button>
                                      <button onClick={() => setFeedbackingId(null)} className="bg-slate-200 text-slate-600 px-6 py-3 rounded-xl text-xs font-black uppercase"> Cancelar </button>
                                   </div>
                                </div>
                             ) : (
                                <button onClick={() => setFeedbackingId(sub.id)} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase"> <Reply size={16}/> Responder Atividade </button>
                             )}
                          </div>
                       </div>
                    </div>
                  ))
                }
              </div>
           )}

           {/* ABA: CARÔMETRO (LISTA DE ESTUDANTES) */}
           {activeTab === 'students' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in">
                  {filteredStudents.map(st => (
                      <button key={st.id} onClick={() => setSelectedStudent(st)} className="bg-white p-4 rounded-[32px] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                          <div className="w-full aspect-square rounded-2xl bg-slate-100 mb-4 overflow-hidden shadow-inner border-2 border-white">
                              {st.photo_url ? <img src={st.photo_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <User className="m-auto mt-6 text-slate-300" size={40}/>}
                          </div>
                          <h4 className="font-black text-slate-800 text-[10px] uppercase truncate px-1">{st.name}</h4>
                          <p className="text-[8px] font-black text-tocantins-blue uppercase mt-1">Série: {st.grade}ª • Turma: {st.school_class}</p>
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity"> <Settings size={12} className="text-slate-400"/> </div>
                      </button>
                  ))}
              </div>
           )}

           {/* ABA: MENSAGENS / CHAT */}
           {activeTab === 'messages' && (
              <div className="max-w-6xl mx-auto h-full flex flex-col animate-in fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden h-[calc(100vh-160px)]">
                    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-5 border-b bg-slate-50"> <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Conversas</h3> </div>
                        <div className="flex-1 overflow-y-auto divide-y">
                            {chatSessions.length === 0 ? <div className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase">Sem conversas.</div> : 
                                chatSessions.map(session => (
                                    <button key={session.studentId} onClick={() => setSelectedChatStudentId(session.studentId)} className={`w-full p-4 flex items-center gap-4 transition-colors text-left hover:bg-slate-50 ${selectedChatStudentId === session.studentId ? 'bg-blue-50 border-r-4 border-tocantins-blue' : ''}`}>
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border"> {session.photoUrl ? <img src={session.photoUrl} className="w-full h-full object-cover"/> : <User className="m-auto mt-2 text-slate-300"/>} </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-black text-slate-800 text-[10px] uppercase truncate">{session.studentName}</h4>
                                                <span className="text-[8px] text-slate-400 font-bold">{new Date(session.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium truncate">{session.lastMessage}</p>
                                        </div>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                    <div className="md:col-span-2 bg-white rounded-[32px] border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                        {selectedChatStudentId ? (
                            <>
                                <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden"> <img src={students.find(s => s.id === selectedChatStudentId)?.photo_url} className="w-full h-full object-cover"/> </div>
                                    <div> <h4 className="font-black text-slate-800 text-xs uppercase">{students.find(s => s.id === selectedChatStudentId)?.name}</h4> </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                    {selectedChatMessages.map(m => (
                                        <div key={m.id} className={`flex ${m.is_from_teacher ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm text-sm ${m.is_from_teacher ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                                <p className="font-medium leading-relaxed">{m.content}</p>
                                                <p className={`text-[8px] mt-2 font-bold uppercase ${m.is_from_teacher ? 'text-slate-400' : 'text-slate-300'}`}> {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
                                    <input type="text" value={teacherReplyText} onChange={e => setTeacherReplyText(e.target.value)} placeholder="Responder..." className="flex-1 p-4 bg-slate-100 rounded-2xl outline-none text-sm" disabled={isSendingReply} />
                                    <button type="submit" disabled={!teacherReplyText.trim() || isSendingReply} className="bg-tocantins-blue text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"> {isSendingReply ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} </button>
                                </form>
                            </>
                        ) : <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30"> <MessageSquare size={64} className="mb-4 text-slate-300" /> <h4 className="font-black text-slate-800 uppercase text-xs">Selecione uma conversa</h4> </div> }
                    </div>
                 </div>
              </div>
           )}

           {/* ABA: PLANO DE AULAS */}
           {activeTab === 'lessons_list' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
                 {curriculumData.map(grade => (
                    <div key={grade.id} className="space-y-4">
                       <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm ml-4">{grade.title} - {grade.description}</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                          {grade.bimesters.map(b => (
                             <div key={b.id} className="bg-white p-5 rounded-[32px] border shadow-sm">
                                <h4 className="font-black text-tocantins-blue text-xs uppercase mb-4">{b.title}</h4>
                                <div className="space-y-2">
                                   {b.lessons.filter(l => isSuper || l.subject === teacherSubject).map(l => (
                                      <div key={l.id} className="text-[10px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-tocantins-blue mt-1.5 shrink-0"></div>
                                         <span className="whitespace-normal break-words leading-tight">{l.title}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           )}

           {/* ABA: GERADOR DE PROVAS (IA) */}
           {activeTab === 'exam_generator' && !isSuper && (
              <div className="max-w-4xl mx-auto animate-in zoom-in-95">
                 <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center shadow-inner"> <BrainCircuit size={32}/> </div>
                       <div> <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gerador de Simulados (IA)</h2> <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Criação automática baseada no conteúdo ministrado</p> </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                       <div> <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Série Alvo</label> <select value={examGrade} onChange={e => setExamGrade(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none ring-1 ring-slate-100"> <option value="1">1ª Série</option> <option value="2">2ª Série</option> <option value="3">3ª Série</option> </select> </div>
                       <div> <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Bimestre de Conteúdo</label> <select value={examBimester} onChange={e => setExamBimester(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none ring-1 ring-slate-100"> <option value="1">1º Bimestre</option> <option value="2">2º Bimestre</option> <option value="3">3º Bimestre</option> <option value="4">4º Bimestre</option> </select> </div>
                       <div> <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Turma Específica</label> <select value={examClass} onChange={e => setExamClass(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none ring-1 ring-slate-100"> <option value="all">Todas as Turmas</option> {classOptions.map(c => <option key={c} value={c}>{c}</option>)} </select> </div>
                    </div>
                    {!generatedExam ? (
                       <button onClick={handleGenerateExam} disabled={isGeneratingExam} className="w-full bg-purple-600 text-white p-6 rounded-3xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"> {isGeneratingExam ? <Loader2 className="animate-spin"/> : <Wand2 size={20}/>} {isGeneratingExam ? 'A IA está elaborando as questões...' : 'Gerar Prova Inédita'} </button>
                    ) : (
                       <div className="space-y-6">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"> <h3 className="font-black text-slate-800 uppercase mb-4 border-b pb-2">Pré-visualização</h3> <div className="space-y-4"> {generatedExam.questions.map((q, i) => ( <div key={i} className="text-xs"> <p className="font-black text-purple-600 mb-1">Questão {i+1} ({q.difficulty})</p> <p className="text-slate-600 italic">"{q.questionText}"</p> </div> ))} </div> </div>
                          <div className="flex gap-4">
                             <button onClick={handlePublishExam} disabled={isPublishingExam} className="flex-1 bg-tocantins-blue text-white p-5 rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-2"> {isPublishingExam ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>} Publicar para Alunos </button>
                             <button onClick={() => setGeneratedExam(null)} className="flex-1 bg-slate-100 text-slate-600 p-5 rounded-3xl font-black uppercase text-xs"> Descartar e Tentar Outra </button>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* ABA: RELATÓRIOS (IA) */}
           {activeTab === 'reports' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                 <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner"> <BarChart3 size={32}/> </div>
                       <div> <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Relatórios de Desempenho</h2> <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Síntese pedagógica gerada pela inteligência artificial</p> </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div> <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Tipo de Relatório</label> <div className="flex gap-2 p-2 bg-slate-50 rounded-2xl"> <button onClick={() => setReportTarget('student')} className={`flex-1 p-3 rounded-xl font-black text-[10px] uppercase transition-all ${reportTarget === 'student' ? 'bg-white shadow-md text-tocantins-blue' : 'text-slate-400'}`}>Individual</button> <button onClick={() => setReportTarget('class')} className={`flex-1 p-3 rounded-xl font-black text-[10px] uppercase transition-all ${reportTarget === 'class' ? 'bg-white shadow-md text-tocantins-blue' : 'text-slate-400'}`}>Por Turma</button> </div> </div>
                       {reportTarget === 'student' ? (
                          <div> <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Selecionar Aluno</label> <select value={selectedReportStudent} onChange={e => setSelectedReportStudent(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none ring-1 ring-slate-100"> <option value="">Escolha...</option> {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.school_class})</option>)} </select> </div>
                       ) : (
                          <div> <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Selecionar Turma</label> <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none ring-1 ring-slate-100"> <option value="all">Escolha...</option> {classOptions.map(c => <option key={c} value={c}>{c}</option>)} </select> </div>
                       )}
                    </div>
                    <button onClick={handleGenerateFullReport} disabled={isGeneratingReport} className="w-full bg-tocantins-blue text-white p-6 rounded-3xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3"> {isGeneratingReport ? <Loader2 className="animate-spin"/> : <Sparkles size={20}/>} {isGeneratingReport ? 'Processando dados...' : 'Gerar Análise Pedagógica'} </button>
                 </div>
                 {aiReportResult && (
                    <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4">
                       <div className="flex justify-between items-center mb-8"> <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Parecer da Inteligência Artificial</h3> <button onClick={() => window.print()} className="p-3 bg-slate-100 rounded-xl text-slate-500 hover:text-tocantins-blue transition-colors"> <Printer size={20}/> </button> </div>
                       <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap"> {aiReportResult} </div>
                    </div>
                 )}
              </div>
           )}

           {/* ABA: NOTAS BIMESTRAIS (RESULTADOS EXAMES) */}
           {activeTab === 'evaluations' && (
              <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div> <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Filtrar por Bimestre</label> <select value={filterBimester} onChange={e => setFilterBimester(e.target.value)} className="w-full p-4 bg-white rounded-2xl border font-bold text-slate-700 outline-none"> <option value="all">Todos os Bimestres</option> <option value="1">1º Bimestre</option> <option value="2">2º Bimestre</option> <option value="3">3º Bimestre</option> <option value="4">4º Bimestre</option> </select> </div>
                 </div>
                 <div className="bg-white rounded-[40px] border overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b">
                          <tr> <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Estudante</th> <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Avaliação</th> <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Turma</th> <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Data/Hora</th> <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Nota Final</th> </tr>
                       </thead>
                       <tbody className="divide-y">
                          {filteredSubmissions.length === 0 ? <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold">Nenhum resultado encontrado.</td></tr> : 
                             filteredSubmissions.map(sub => (
                                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                   <td className="p-6"> <div className="flex items-center gap-3"> <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden"> <img src={sub.student_photo} className="w-full h-full object-cover"/> </div> <span className="text-xs font-bold text-slate-700 uppercase">{sub.student_name}</span> </div> </td>
                                   <td className="p-6"> <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">{sub.lesson_title}</span> </td>
                                   <td className="p-6 text-xs font-bold text-slate-500 uppercase">{sub.school_class}</td>
                                   <td className="p-6 text-[10px] font-bold text-slate-400 uppercase">{new Date(sub.created_at).toLocaleString()}</td>
                                   <td className="p-6"> <div className="w-12 h-12 rounded-xl bg-tocantins-blue text-white flex items-center justify-center font-black mx-auto shadow-lg shadow-blue-100">{sub.score?.toFixed(1)}</div> </td>
                                </tr>
                             ))
                          }
                       </tbody>
                    </table>
                 </div>
              </div>
           )}

        </div>
      </main>
    </div>
  );
};
