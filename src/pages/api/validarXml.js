
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import libxmljs from 'libxmljs2';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { xml } = req.body;

  try {
    const xmlDoc = libxmljs.parseXml(xml);
    const schemaPath = path.resolve('./schemas/leiauteNFe_v4.00.xsd');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schemaDoc = libxmljs.parseXml(schemaContent);

    const valido = xmlDoc.validate(schemaDoc);
    if (!valido) {
      const erros = xmlDoc.validationErrors.map((e) => e.message);
      return res.status(400).json({ valido: false, erros });
    }

    return res.status(200).json({ valido: true });
  } catch (err) {
    return res.status(500).json({
      valido: false,
      erros: [err instanceof Error ? err.message : 'Erro desconhecido']
    });
  }
}
