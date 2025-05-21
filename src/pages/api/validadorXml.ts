// pages/api/validar-xml.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import libxmljs from 'libxmljs2';
import path from 'path';
import fs from 'fs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const xml = req.body?.xml;
    if (!xml) return res.status(400).json({ valido: false, erros: ['XML não fornecido'] });

    const xmlDoc = libxmljs.parseXml(xml);
    const schemaPath = path.resolve('./public/schemas/leiauteNFe_v4.00.xsd');
    const schemaDoc = libxmljs.parseXml(fs.readFileSync(schemaPath, 'utf-8'));

    const valido = xmlDoc.validate(schemaDoc);

    return res.status(200).json(valido
      ? { valido: true }
      : { valido: false, erros: xmlDoc.validationErrors.map(e => e.message) });
  } catch (err: any) {
    return res.status(500).json({ valido: false, erros: [err.message] });
  }
}
