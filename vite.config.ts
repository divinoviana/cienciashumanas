
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Chave de API fornecida pelo usuário
  const apiKey = "AIzaSyCS1UvrjwMvFxonKYyOYdTXITGSBfJrk9g";

  return {
    plugins: [react()],
    base: './', // Caminho relativo garante que funcione em diversos ambientes de hospedagem
    define: {
      // Injeta a API Key de forma segura no build para ser acessada via process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
