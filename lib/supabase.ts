
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://fsncukuzkiolkeuiqayq.supabase.co';
const supabaseKey = 'sb_publishable_cZ_x7pGMXH72l6-PYbXTbQ_XE_7qHRD';

export const supabase = createClient(supabaseUrl, supabaseKey);

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
