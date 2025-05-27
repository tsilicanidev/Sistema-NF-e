import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import validarXmlRouter from '../src/api/validar-xml';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(bodyParser.text({ type: 'text/xml' }));
app.use('/api/validar-xml', validarXmlRouter);

describe('API /api/validar-xml', () => {
  it('deve validar um XML correto', async () => {
    const xml = '<?xml version="1.0"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"></NFe>';
    const response = await request(app)
      .post('/api/validar-xml')
      .set('Content-Type', 'text/xml')
      .send(xml);

    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('deve falhar com XML inválido', async () => {
    const xml = '<notaFiscal></notaFiscal>';
    const response = await request(app)
      .post('/api/validar-xml')
      .set('Content-Type', 'text/xml')
      .send(xml);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('XML inválido');
  });

  it('deve retornar erro se XSD estiver ausente', async () => {
    const xsdPath = path.join(__dirname, '../schemas/leiauteNFe_v4.00.xsd');
    const backupPath = xsdPath + '.bak';

    if (fs.existsSync(xsdPath)) fs.renameSync(xsdPath, backupPath);

    const xml = '<?xml version="1.0"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"></NFe>';
    const response = await request(app)
      .post('/api/validar-xml')
      .set('Content-Type', 'text/xml')
      .send(xml);

    if (fs.existsSync(backupPath)) fs.renameSync(backupPath, xsdPath);

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toBe('Arquivo XSD não encontrado');
  });
});
