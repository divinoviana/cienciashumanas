
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: './',
    define: {
      // Injeta a API Key a partir do ambiente de execução (process.env.API_KEY)
      // Certifique-se de que a chave fornecida esteja configurada no ambiente/plataforma.
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
    }
  };
});
