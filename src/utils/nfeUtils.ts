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
  if (!certificateData?.pfxBase64) {
    throw new Error('Certificado digital não fornecido');
  }

  if (!certificateData?.password) {
    throw new Error('Senha do certificado não fornecida');
  }

  try {
    // Decodifica o certificado base64
    const pfxBinary = forge.util.decode64(certificateData.pfxBase64);
    
    // Converte para ASN.1
    const pfxAsn1 = forge.asn1.fromDer(pfxBinary);
    
    // Extrai o PKCS#12
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, certificateData.password);

    // Obtém a chave privada e o certificado
    const bags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];

    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag][0];

    if (!keyBag || !certBag) {
      throw new Error('Não foi possível extrair a chave privada ou o certificado');
    }

    const privateKey = forge.pki.privateKeyToPem(keyBag.key);
    const certificate = forge.pki.certificateToPem(certBag.cert);

    // Remove cabeçalhos e quebras de linha do certificado
    const cleanCertificate = certificate
      .replace(/-----BEGIN CERTIFICATE-----/, '')
      .replace(/-----END CERTIFICATE-----/, '')
      .replace(/\n/g, '');

    // Cria o documento XML
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const infNFeElement = doc.getElementsByTagName('infNFe')[0];
    
    if (!infNFeElement) {
      throw new Error('Elemento infNFe não encontrado no XML');
    }

    const id = infNFeElement.getAttribute('Id');
    if (!id) {
      throw new Error('Atributo Id não encontrado no elemento infNFe');
    }

    // Configura a assinatura XML
    const sig = new SignedXml();
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    sig.addReference(
      `//*[local-name(.)='infNFe' and @Id='${id}']`,
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ],
      'http://www.w3.org/2000/09/xmldsig#sha1'
    );

    sig.signingKey = privateKey;
    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${cleanCertificate}</X509Certificate></X509Data>`
    };

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