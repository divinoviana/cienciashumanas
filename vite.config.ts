
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo (development/production)
  // O terceiro parâmetro '' permite carregar variáveis sem o prefixo VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './',
    define: {
      // Injeta a API_KEY do ambiente (Vercel ou local .env) para o código cliente
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
