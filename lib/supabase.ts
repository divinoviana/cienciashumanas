
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Retornamos um objeto que falha graciosamente em vez de travar no boot
    console.warn("Supabase: Variáveis de ambiente não detectadas.");
    return null;
  }

  return createClient(url, key);
};

let instance: any = null;

// Exportamos um Proxy que inicializa o cliente apenas quando for usado pela primeira vez
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!instance) {
      instance = getSupabaseClient();
    }
    
    if (!instance) {
      // Se não houver instância, retornamos uma função que retorna um erro para evitar quebras
      return (...args: any[]) => ({ 
        data: null, 
        error: { message: "Supabase não configurado. Verifique as variáveis de ambiente." },
        from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: true }) }) }) })
      });
    }

    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

// Helper para converter base64 em Blob para o Supabase Storage
export const base64ToBlob = (base64: string, contentType: string) => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
};
