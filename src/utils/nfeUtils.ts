import { create } from 'xmlbuilder2';
import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';
import * as forge from 'node-forge';

interface InfNFe {
  ide: { cUF: string; cNF: string; natOp: string; mod: string; serie: string; nNF: string; dhEmi: string; tpNF: string; idDest: string; cMunFG: string; tpImp: string; tpEmis: string; cDV: string; tpAmb: string; finNFe: string; indFinal: string; indPres: string; procEmi: string; verProc: string; };
  emit: { CNPJ: string; xNome: string; xFant?: string; enderEmit: { xLgr: string; nro: string; xBairro: string; cMun: string; xMun: string; UF: string; CEP: string; cPais: string; xPais: string; }; IE: string; CRT: string; };
  dest: { CPF?: string; CNPJ?: string; xNome: string; enderDest: { xLgr: string; nro: string; xBairro: string; cMun: string; xMun: string; UF: string; CEP: string; cPais: string; xPais: string; }; indIEDest: string; IE?: string; };
  det: Array<{ "@nItem": string; prod: { cProd: string; cEAN: string; xProd: string; NCM: string; CFOP: string; uCom: string; qCom: string; vUnCom: string; vProd: string; cEANTrib: string; uTrib: string; qTrib: string; vUnTrib: string; indTot: string; }; imposto: { ICMS: { ICMS00?: { orig: string; CST: string; modBC: string; vBC: string; pICMS: string; vICMS: string; }; ICMSSN102?: { orig: string; CSOSN: string; }; }; PIS: { PISAliq?: { CST: string; vBC: string; pPIS: string; vPIS: string; }; PISNT?: { CST: string; }; }; COFINS: { COFINSAliq?: { CST: string; vBC: string; pCOFINS: string; vCOFINS: string; }; COFINSNT?: { CST: string; }; }; }; }>;
  total: { ICMSTot: { vBC: string; vICMS: string; vICMSDeson: string; vFCPUFDest?: string; vICMSUFDest?: string; vICMSUFRemet?: string; vFCP?: string; vBCST: string; vST: string; vFCPST?: string; vFCPSTRet?: string; vProd: string; vFrete: string; vSeg: string; vDesc: string; vII: string; vIPI: string; vIPIDevol?: string; vPIS: string; vCOFINS: string; vOutro: string; vNF: string; vTotTrib?: string; }; };
  transp: { modFrete: string; };
  pag: { detPag: Array<{ tPag: string; vPag: string; }>; };
  infAdic?: { infCpl?: string; };
}

export function gerarChaveNFe(cUF: string, anoMes: string, cnpj: string, modelo: string, serie: string, numero: string, tpEmis: string, cNF: string): string {
  const chave = `${cUF}${anoMes}${cnpj}${modelo}${serie}${numero}${tpEmis}${cNF}`;
  let soma = 0;
  let peso = 2;
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const dv = 11 - (soma % 11);
  const digito = dv === 10 || dv === 11 ? 0 : dv;
  return `${chave}${digito}`;
}

export function gerarXmlNFe(infNFe: InfNFe, chaveNFe: string): string {
  const xmlObj = {
    NFe: {
      '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
      infNFe: {
        '@Id': `NFe${chaveNFe}`,
        '@versao': '4.00',
        ...infNFe
      }
    }
  };
  return create(xmlObj).end({ prettyPrint: true });
}

interface CertificateData {
  pfxBase64: string;
  password: string;
}

export function assinarXml(xml: string, certificateData: CertificateData): string {
  console.log('🔥 assinatura ativa');
  if (!certificateData?.pfxBase64) throw new Error('Certificado digital não fornecido');
  if (!certificateData?.password) throw new Error('Senha do certificado não fornecida');

  try {
    const cleanBase64 = certificateData.pfxBase64.replace(/[\r\n\s]/g, '');
    if (!isValidBase64(cleanBase64)) throw new Error('Certificado digital inválido: string base64 malformada');

    const pfxBinary = forge.util.decode64(cleanBase64);
    const pfxAsn1 = forge.asn1.fromDer(pfxBinary);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, certificateData.password);

    const keyBag = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    if (!keyBag?.key) throw new Error('Chave privada não encontrada no certificado');

    const certBag = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0];
    if (!certBag?.cert) throw new Error('Certificado não encontrado no arquivo PFX');

    const privateKey = forge.pki.privateKeyToPem(keyBag.key);
    const certificate = forge.pki.certificateToPem(certBag.cert).replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '');

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const infNFeElement = doc.getElementsByTagName('infNFe')[0];
    if (!infNFeElement) throw new Error('Elemento infNFe não encontrado no XML');

    const id = infNFeElement.getAttribute('Id');
    if (!id) throw new Error('Atributo Id não encontrado no elemento infNFe');

    // Configura a assinatura XML
const sig = new SignedXml();

// Ordem correta das propriedades
sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
sig.signingKey = privateKey;

// Informações do certificado
sig.keyInfoProvider = {
  getKeyInfo: () => `<X509Data><X509Certificate>${certificate}</X509Certificate></X509Data>`,
};

// ✅ digestAlgorithm deve estar aqui — como terceiro argumento:
sig.addReference(
  `//*[local-name(.)='infNFe' and @Id='${id}']`,
  [
    'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
    'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
  ],
  'http://www.w3.org/2000/09/xmldsig#sha1' // <-- CORRETO AQUI
);

// Gera a assinatura
sig.computeSignature(xml);
return sig.getSignedXml();
  } catch (error) {
    console.error('Erro ao assinar XML:', error);
    throw new Error(`Falha ao assinar o XML da NF-e: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export function gerarLoteNFe(xmlNFe: string, idLote: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">\n  <idLote>${idLote}</idLote>\n  <indSinc>1</indSinc>\n  ${xmlNFe}\n</enviNFe>`;
}

function isValidBase64(str: string): boolean {
  try {
    if (str.length % 4 !== 0) return false;
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) return false;
    const decoded = atob(str);
    const encoded = btoa(decoded);
    return encoded === str;
  } catch {
    return false;
  }
}
