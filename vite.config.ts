
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: './',
    define: {
      // Consome a API_KEY das variáveis de ambiente do sistema (ex: Vercel) 
      // e a disponibiliza para o código frontend como process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
    }
  };
});
