import type { NextApiRequest, NextApiResponse } from 'next';
import { gerarDanfePDF } from '@/services/danfeService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { xml } = req.body;

  if (!xml) {
    return res.status(400).json({ error: 'XML não fornecido' });
  }

  try {
    const pdfBuffer = await gerarDanfePDF(xml);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=danfe.pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    console.error('Erro ao gerar DANFE:', err);
    res.status(500).json({ error: err.message || 'Erro interno no servidor' });
  }
}
