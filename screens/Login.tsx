
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, User, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { loginStudent } = useAuth();
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        if (!photo) throw new Error("A foto é obrigatória para o cadastro.");
        
        const { error } = await supabase.from('students').insert([{ 
          name: formData.name, email: formData.email, password: formData.password, 
          school_class: formData.school_class, grade: formData.grade, photo_url: photo
        }]);
        
        if (error) throw error;
        alert("Cadastro realizado! Faça login agora.");
        setIsRegistering(false);
      } else {
        const { data, error } = await supabase.from('students').select('*')
          .eq('email', formData.email).eq('password', formData.password).single();

        if (error || !data) throw new Error("Email ou senha incorretos.");
        
        loginStudent(data);
        // Pequeno atraso opcional para garantir persistência do storage
        setTimeout(() => navigate('/'), 100);
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
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-tocantins-blue w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{isRegistering ? 'Novo Cadastro' : 'Portal do Aluno'}</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ciências Humanas - Tocantins</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
             <div className="space-y-3">
                <input required placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border rounded-2xl text-sm outline-none focus:ring-1 focus:ring-tocantins-blue" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                    <select className="w-full p-4 bg-slate-50 border rounded-2xl text-sm outline-none" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                      <option value="1">1ª Série</option>
                      <option value="2">2ª Série</option>
                      <option value="3">3ª Série</option>
                    </select>
                    <select required className="w-full p-4 bg-slate-50 border rounded-2xl text-sm outline-none" value={formData.school_class} onChange={e => setFormData({...formData, school_class: e.target.value})}>
                      <option value="">Turma</option>
                      {getClassesByGrade(formData.grade).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200 hover:bg-slate-100 transition-colors">
                   <label className="text-[10px] font-black text-slate-500 cursor-pointer uppercase tracking-widest">
                      {photo ? "✅ Foto Selecionada" : "📸 Anexar Foto de Perfil"}
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                   </label>
                </div>
             </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <input required type="email" placeholder="E-mail" className="w-full p-4 pl-12 bg-slate-50 border rounded-2xl text-sm outline-none focus:ring-1 focus:ring-tocantins-blue" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <User className="absolute left-4 top-4 text-slate-300" size={18} />
            </div>
            <div className="relative">
              <input required type="password" placeholder="Senha" className="w-full p-4 pl-12 bg-slate-50 border rounded-2xl text-sm outline-none focus:ring-1 focus:ring-tocantins-blue" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
            </div>
          </div>

          <button disabled={loading} className="w-full bg-tocantins-blue text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 flex justify-center items-center gap-2 cursor-pointer active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" /> : isRegistering ? 'Criar Minha Conta' : 'Entrar no Portal'}
          </button>
        </form>

        <div className="mt-8 text-center border-t pt-6">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black text-slate-400 hover:text-tocantins-blue uppercase tracking-widest transition-colors cursor-pointer">
            {isRegistering ? 'Já tenho uma conta? Fazer Login' : 'Não tem conta? Registre-se aqui'}
          </button>
        </div>
      </div>
    </div>
  );
};
