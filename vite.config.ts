
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env local
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Captura a API_KEY: prioriza o que está no arquivo .env, 
  // depois o que está no ambiente do sistema
  const API_KEY = env.API_KEY || (process as any).env.API_KEY;
  const GEMINI_API_KEY = env.GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY || API_KEY;

  return {
    plugins: [react()],
    base: './',
    define: {
      // Substitui 'process.env.API_KEY' pelo valor real da chave durante o build
      'process.env.API_KEY': JSON.stringify(API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY)
    }
  };
});
