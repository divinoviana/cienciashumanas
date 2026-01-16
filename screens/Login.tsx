
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, User, Lock, GraduationCap, Loader2, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    school_class: '',
    grade: '1'
  });
  
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraActive(true);
      
      // Pequeno timeout para garantir que o componente de vídeo foi montado no DOM antes de atribuir o stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Erro ao dar play:", e));
        }
      }, 100);

    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Erro ao acessar a câmera. Certifique-se de que deu permissão de acesso.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Inverte horizontalmente para a foto não ficar espelhada (já que o vídeo está espelhado para o usuário)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A foto deve ter no máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        if (!photo) throw new Error("A foto é obrigatória para o cadastro.");
        if (!formData.school_class) throw new Error("Selecione sua turma.");
        
        const { error } = await supabase
          .from('students')
          .insert([{ 
            name: formData.name, 
            email: formData.email, 
            password: formData.password, 
            school_class: formData.school_class,
            grade: formData.grade,
            photo_url: photo
          }]);
        
        if (error) {
          if (error.code === '23505') throw new Error("Este e-mail já está cadastrado.");
          throw error;
        }
        
        alert("Cadastro realizado com sucesso! Faça login para continuar.");
        setIsRegistering(false);
      } else {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('email', formData.email)
          .eq('password', formData.password)
          .single();

        if (error || !data) throw new Error("Email ou senha incorretos.");
        
        localStorage.setItem('student', JSON.stringify(data));
        navigate('/');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getClassesByGrade = (grade: string) => {
    if (grade === '1') return Array.from({length: 6}, (_, i) => `13.0${i+1}`);
    if (grade === '2') return Array.from({length: 8}, (_, i) => `23.0${i+1}`);
    if (grade === '3') return Array.from({length: 9}, (_, i) => `33.0${i+1}`);
    return [];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-tocantins-blue w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{isRegistering ? 'Novo Cadastro' : 'Acesso do Estudante'}</h2>
          <p className="text-slate-500 text-sm mt-1">Portal de Filosofia - Tocantins</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <>
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center relative">
                    {cameraActive ? (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
                      />
                    ) : photo ? (
                      <img src={photo} className="w-full h-full object-cover" alt="Perfil" />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  
                  {photo && !cameraActive && (
                    <button 
                      type="button" 
                      onClick={() => { setPhoto(null); setCameraActive(false); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {!cameraActive ? (
                    <>
                      <button 
                        type="button" 
                        onClick={startCamera} 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-full hover:bg-black transition"
                      >
                        <Camera className="w-4 h-4" /> Ativar Câmera
                      </button>
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-full cursor-pointer hover:bg-slate-50 transition">
                        <Upload className="w-4 h-4" /> Arquivo
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </>
                  ) : (
                    <button 
                      type="button" 
                      onClick={takePhoto} 
                      className="flex items-center gap-2 px-6 py-2 bg-tocantins-blue text-white text-xs font-bold rounded-full shadow-lg"
                    >
                      <Check className="w-4 h-4" /> Tirar Foto
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <input required placeholder="Nome Completo" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tocantins-blue outline-none transition text-slate-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Série</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tocantins-blue outline-none text-slate-700" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                      <option value="1">1ª Série</option>
                      <option value="2">2ª Série</option>
                      <option value="3">3ª Série</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Turma</label>
                    <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tocantins-blue outline-none text-slate-700" value={formData.school_class} onChange={e => setFormData({...formData, school_class: e.target.value})}>
                      <option value="">Selecionar</option>
                      {getClassesByGrade(formData.grade).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <div className="relative">
              <input required type="email" placeholder="E-mail" className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tocantins-blue outline-none transition text-slate-700" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
            <div className="relative">
              <input required type="password" placeholder="Senha" className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-tocantins-blue outline-none transition text-slate-700" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-tocantins-blue hover:bg-blue-800 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 mt-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : isRegistering ? 'Finalizar Cadastro' : 'Entrar no Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button onClick={() => { setIsRegistering(!isRegistering); setPhoto(null); stopCamera(); }} className="text-sm font-semibold text-slate-600 hover:text-tocantins-blue transition underline-offset-4 hover:underline">
            {isRegistering ? 'Já tenho uma conta? Fazer Login' : 'Novo por aqui? Criar conta agora'}
          </button>
        </div>
      </div>
    </div>
  );
};
