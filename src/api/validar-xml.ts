import type { VercelRequest, VercelResponse } from '@vercel/node';
import { XMLParser } from 'fast-xml-parser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    const { xml } = req.body;

    if (!xml || typeof xml !== 'string') {
      return res.status(400).json({ error: 'XML não fornecido ou inválido.' });
    }

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);

    // Apenas validação básica de estrutura
    if (!parsed?.NFe) {
      return res.status(422).json({ error: 'Estrutura XML da NFe inválida.' });
    }

    res.status(200).json({ sucesso: true, mensagem: 'XML válido.', dados: parsed });
  } catch (e: unknown) {
    res.status(500).json({ error: 'Erro ao validar XML', detalhe: String(e) });
  }
}
