
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: './',
    define: {
      // Injeta a chave de API fornecida pelo usuário para uso via process.env.API_KEY
      'process.env.API_KEY': JSON.stringify('AIzaSyDyl-glllc5TSUgNWSCnPUaxO5itH9pi18')
    }
  };
});
