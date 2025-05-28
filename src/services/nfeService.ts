
import { gerarXmlNFe } from '../utils/nfeUtils';
import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';
import https from 'https';
import axios from 'axios';

// Função auxiliar para assinar o XML
export function assinarXml(xml: string, tagAssinatura = 'infNFe', idAttr = 'Id'): string {
  const privateKey = fs.readFileSync('certs/privateKey.pem', 'utf-8');
  const cert = fs.readFileSync('certs/publicCert.pem', 'utf-8');
  const sig = new SignedXml();
  sig.addReference(`//*[local-name(.)='${tagAssinatura}']`, ['http://www.w3.org/2000/09/xmldsig#enveloped-signature']);
  sig.signingKey = privateKey;
  sig.keyInfoProvider = {
    getKeyInfo: () => "<X509Data></X509Data>",
  };
  const doc = new DOMParser().parseFromString(xml);
  sig.computeSignature(xml);
  const signedXml = sig.getSignedXml();
  return signedXml;
}

// Envio da NF-e
export async function emitirNFe(dados: any) {
  const xml = gerarXmlNFe(dados);
  const xmlAssinado = assinarXml(xml);

  // Enviar para a SEFAZ (aqui simulado com log)
  try {
    const response = await axios.post(
      'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      xmlAssinado,
      {
        headers: {
          'Content-Type': 'application/xml',
        },
        httpsAgent: new https.Agent({
          pfx: fs.readFileSync('certs/certificado.pfx'),
          passphrase: 'senha-certificado'
        })
      }
    );

    return response.data;
  } catch (err: any) {
    console.error('Erro ao emitir NF-e:', err.message);
    throw new Error('Erro ao enviar XML para SEFAZ: ' + err.message);
  }
}
