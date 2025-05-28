import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import libxmljs from 'libxmljs2';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const xml = req.body;

    const xsdPath = path.join(__dirname, '../../schemas/leiauteNFe_v4.00.xsd');
    if (!fs.existsSync(xsdPath)) {
      return res.status(500).json({ error: 'Arquivo XSD não encontrado' });
    }

    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');
    const xmlDoc = libxmljs.parseXml(xml);
    const xsdDoc = libxmljs.parseXml(xsdContent);

    const isValid = xmlDoc.validate(xsdDoc);
    if (!isValid) {
      return res.status(400).json({
        error: 'XML inválido',
        detalhes: xmlDoc.validationErrors.map(e => e.message),
      });
    }

    return res.status(200).json({ ok: true, mensagem: 'XML válido com base no XSD' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao validar XML', detalhes: err.message });
  }
});

export default router;
