import { supabase } from './supabase';

export async function salvarDanfeNoStorage(chave: string, pdfBuffer: Uint8Array): Promise<string | null> {
  const filePath = `danfes/danfe-${chave}.pdf`;

  const { data, error } = await supabase.storage
    .from('danfes')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) {
    console.error('Erro ao salvar DANFE no storage:', error);
    return null;
  }

  const { data: publicUrl } = supabase.storage
    .from('danfes')
    .getPublicUrl(filePath);

  return publicUrl?.publicUrl ?? null;
}