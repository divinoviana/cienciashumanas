
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env local
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Captura a API_KEY: prioriza o que está no arquivo .env, 
  // depois o que está no ambiente do sistema (Vercel)
  const API_KEY = env.API_KEY || (process as any).env.API_KEY;

  return {
    plugins: [react()],
    base: './',
    define: {
      // Substitui 'process.env.API_KEY' pelo valor real da chave durante o build
      'process.env.API_KEY': JSON.stringify(API_KEY)
    }
  };
});
