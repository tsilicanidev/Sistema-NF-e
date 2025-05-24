import { create } from 'xmlbuilder2';
import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';
import forge from 'node-forge';

export function gerarChaveNFe(cUF, anoMes, cnpj, modelo, serie, numero, tpEmis, cNF) {
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

export function gerarXmlNFe(infNFe, chaveNFe) {
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

export function assinarXml(xml, certificateData) {
  if (!certificateData?.pfxBase64) {
    throw new Error('Certificado digital não fornecido');
  }
  if (!certificateData?.password) {
    throw new Error('Senha do certificado não fornecida');
  }

  try {
    const cleanBase64 = certificateData.pfxBase64.replace(/[\r\n\s]/g, '');
    if (!isValidBase64(cleanBase64)) {
      throw new Error('Certificado digital inválido: string base64 malformada');
    }

    const pfxBinary = forge.util.decode64(cleanBase64);
    const pfxAsn1 = forge.asn1.fromDer(pfxBinary);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, certificateData.password);

    const keyBag = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    if (!keyBag?.key) {
      throw new Error('Chave privada não encontrada no certificado');
    }

    const certBag = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0];
    if (!certBag?.cert) {
      throw new Error('Certificado não encontrado no arquivo PFX');
    }

    const privateKey = forge.pki.privateKeyToPem(keyBag.key);
    const certificate = forge.pki.certificateToPem(certBag.cert).replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '');

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const infNFeElement = doc.getElementsByTagName('infNFe')[0];
    if (!infNFeElement) {
      throw new Error('Elemento infNFe não encontrado no XML');
    }

    const id = infNFeElement.getAttribute('Id');
    if (!id) {
      throw new Error('Atributo Id não encontrado no elemento infNFe');
    }

    const sig = new SignedXml();
    sig.signatureAlgorithm = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
    sig.digestAlgorithm = "http://www.w3.org/2000/09/xmldsig#sha1";
    sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
    sig.signingKey = privateKey;

    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${certificate}</X509Certificate></X509Data>`,
    };

    sig.addReference(
      `//*[local-name(.)='infNFe' and @Id='${id}']`,
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ]
    );

    sig.computeSignature(xml);
    return sig.getSignedXml();
  } catch (error) {
    console.error('Erro ao assinar XML:', error);
    throw new Error(`Falha ao assinar o XML da NF-e: ${error.message}`);
  }
}

export function gerarLoteNFe(xmlNFe, idLote) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${idLote}</idLote>
  <indSinc>1</indSinc>
  ${xmlNFe}
</enviNFe>`;
}

function isValidBase64(str) {
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