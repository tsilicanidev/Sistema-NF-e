// backend/api/emitir-nfe.js (ou .ts se estiver usando TypeScript)
import fs from 'fs';
import https from 'https';
import { create } from 'xmlbuilder2';
import axios from 'axios';
import forge from 'node-forge';
import { assinarXml } from '../../utils/nfeUtils';
import { DOMParser } from '@xmldom/xmldom';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { xml, certificado, ambiente = 'homologacao', uf = 'SP' } = req.body;

    if (!xml || !certificado?.pfxBase64 || !certificado.password) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    const pfxBuffer = Buffer.from(certificado.pfxBase64, 'base64');

    // Assinar XML da NFe
    const xmlAssinado = await assinarXml(xml, {
      pfxBase64: certificado.pfxBase64,
      password: certificado.password
    });

    const loteXml = gerarLoteNFe(xmlAssinado);
    const envelopeSOAP = gerarEnvelopeSOAP(loteXml);

    const endpoint = ambiente === 'producao'
      ? 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx'
      : 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx';

    const response = await axios.post(endpoint, envelopeSOAP, {
      headers: {
        'Content-Type': 'application/soap+xml;charset=utf-8',
        'SOAPAction': ''
      },
      httpsAgent: new https.Agent({
        pfx: pfxBuffer,
        passphrase: certificado.password,
        rejectUnauthorized: false
      })
    });

    const parsed = processarRespostaSefaz(response.data);

    return res.status(200).json({
      status: parsed.status,
      mensagem: parsed.mensagem,
      protocolo: parsed.protocolo,
      xmlResposta: response.data
    });
  } catch (error) {
    console.error('Erro ao emitir NF-e:', error);
    return res.status(500).json({ message: error.message });
  }
}

function gerarLoteNFe(xmlNFeAssinado) {
  const rootNFe = create(xmlNFeAssinado).root();

  return create({ version: '1.0', encoding: 'UTF-8' })
    .ele('enviNFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe', versao: '4.00' })
      .ele('idLote').txt(Date.now().toString()).up()
      .ele('indSinc').txt('1').up()
      .import(rootNFe)
    .end({ prettyPrint: true });
}

function gerarEnvelopeSOAP(conteudoLote) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      <cUF>35</cUF>
      <versaoDados>4.00</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      ${conteudoLote}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`;
}

function processarRespostaSefaz(xmlResposta) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlResposta, 'text/xml');

  const cStat = doc.getElementsByTagName('cStat')[0]?.textContent;
  const xMotivo = doc.getElementsByTagName('xMotivo')[0]?.textContent;
  const protocolo = doc.getElementsByTagName('nProt')[0]?.textContent;

  if (!cStat) {
    throw new Error('Resposta inválida do servidor SEFAZ');
  }

  return {
    status: cStat === '100' ? 'autorizada' : 'rejeitada',
    mensagem: xMotivo || 'Sem mensagem do servidor',
    protocolo
  };
}
