
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env local se existir
  // O terceiro argumento '' permite carregar chaves que não começam com VITE_
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './',
    define: {
      // Esta linha substitui toda menção a 'process.env.API_KEY' 
      // pelo valor real da chave durante o processo de build do Vercel.
      // Fix: Cast process to any for safe environment variable access during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || (process.env as any).API_KEY)
    }
  };
});
