
import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './screens/Home';
import { GradeView } from './screens/GradeView';
import { LessonView } from './screens/LessonView';
import { Contact } from './screens/Contact';
import { AdminDashboard } from './screens/AdminDashboard';
import { Login } from './screens/Login';
import { MyActivities } from './screens/MyActivities';
import { Mail, Lock } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/grade/:id" element={<GradeView />} />
            <Route path="/lesson/:lessonId" element={<LessonView />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/my-activities" element={<MyActivities />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-center md:text-left border-b border-slate-800 pb-8 mb-8">
              <div>
                <h4 className="text-white font-bold mb-2">Portal de Ciências Humanas</h4>
                <p className="text-sm">Conectando o conhecimento à realidade juvenil do Tocantins.</p>
              </div>
              
              <div className="flex flex-col md:items-end gap-4">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl text-tocantins-yellow hover:bg-slate-700 transition-colors text-sm font-bold"
                >
                  <Mail className="w-4 h-4" /> Contato
                </Link>
                <Link 
                  to="/admin" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl text-white/60 hover:text-white transition-colors text-xs"
                >
                  <Lock className="w-3 h-3" /> Painel Admin
                </Link>
              </div>
            </div>

            <div className="text-center text-xs space-y-1">
              <p>© 2026 Ciências Humanas e Sociais Aplicadas - Tocantins</p>
              <p>Docente Responsável: <span className="text-slate-200">Prof. Me. Divino Ribeiro Viana</span></p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
