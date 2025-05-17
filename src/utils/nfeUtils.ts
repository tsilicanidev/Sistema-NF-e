import { create } from 'xmlbuilder2';
import { SignedXml } from 'xml-crypto';

interface InfNFe {
  ide: {
    cUF: string;
    cNF: string;
    natOp: string;
    mod: string;
    serie: string;
    nNF: string;
    dhEmi: string;
    tpNF: string;
    idDest: string;
    cMunFG: string;
    tpImp: string;
    tpEmis: string;
    cDV: string;
    tpAmb: string;
    finNFe: string;
    indFinal: string;
    indPres: string;
    procEmi: string;
    verProc: string;
  };
  emit: {
    CNPJ: string;
    xNome: string;
    xFant?: string;
    enderEmit: {
      xLgr: string;
      nro: string;
      xBairro: string;
      cMun: string;
      xMun: string;
      UF: string;
      CEP: string;
      cPais: string;
      xPais: string;
    };
    IE: string;
    CRT: string;
  };
  dest: {
    CPF?: string;
    CNPJ?: string;
    xNome: string;
    enderDest: {
      xLgr: string;
      nro: string;
      xBairro: string;
      cMun: string;
      xMun: string;
      UF: string;
      CEP: string;
      cPais: string;
      xPais: string;
    };
    indIEDest: string;
    IE?: string;
  };
  det: Array<{
    "@nItem": string;
    prod: {
      cProd: string;
      cEAN: string;
      xProd: string;
      NCM: string;
      CFOP: string;
      uCom: string;
      qCom: string;
      vUnCom: string;
      vProd: string;
      cEANTrib: string;
      uTrib: string;
      qTrib: string;
      vUnTrib: string;
      indTot: string;
    };
    imposto: {
      ICMS: {
        ICMS00?: {
          orig: string;
          CST: string;
          modBC: string;
          vBC: string;
          pICMS: string;
          vICMS: string;
        };
        ICMSSN102?: {
          orig: string;
          CSOSN: string;
        };
      };
      PIS: {
        PISAliq?: {
          CST: string;
          vBC: string;
          pPIS: string;
          vPIS: string;
        };
        PISNT?: {
          CST: string;
        };
      };
      COFINS: {
        COFINSAliq?: {
          CST: string;
          vBC: string;
          pCOFINS: string;
          vCOFINS: string;
        };
        COFINSNT?: {
          CST: string;
        };
      };
    };
  }>;
  total: {
    ICMSTot: {
      vBC: string;
      vICMS: string;
      vICMSDeson: string;
      vFCPUFDest?: string;
      vICMSUFDest?: string;
      vICMSUFRemet?: string;
      vFCP?: string;
      vBCST: string;
      vST: string;
      vFCPST?: string;
      vFCPSTRet?: string;
      vProd: string;
      vFrete: string;
      vSeg: string;
      vDesc: string;
      vII: string;
      vIPI: string;
      vIPIDevol?: string;
      vPIS: string;
      vCOFINS: string;
      vOutro: string;
      vNF: string;
      vTotTrib?: string;
    };
  };
  transp: {
    modFrete: string;
  };
  pag: {
    detPag: Array<{
      tPag: string;
      vPag: string;
    }>;
  };
  infAdic?: {
    infCpl?: string;
  };
}

export function gerarChaveNFe(
  cUF: string,
  anoMes: string,
  cnpj: string,
  modelo: string,
  serie: string,
  numero: string,
  tpEmis: string,
  cNF: string
): string {
  const chave = `${cUF}${anoMes}${cnpj}${modelo}${serie}${numero}${tpEmis}${cNF}`;
  
  // Calcula o dígito verificador (apenas exemplo simplificado)
  // Em uma implementação real, usaria o algoritmo módulo 11
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
  // Criar estrutura do XML NFe
  const xmlObj = {
    'NFe': {
      '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
      'infNFe': {
        '@Id': `NFe${chaveNFe}`,
        '@versao': '4.00',
        ...infNFe
      }
    }
  };
  
  // Gerar XML
  const xml = create(xmlObj).end({ prettyPrint: true });
  return xml;
}

export function assinarXml(xml: string, certificado: string, senha: string): string {
  // Este é um exemplo simplificado
  // Em uma implementação real, você usaria a biblioteca xml-crypto com o certificado real
  
  try {
    // Parse da string XML para obter o elemento infNFe
    // Criar um SignedXml com o certificado
    const sig = new SignedXml();
    
    // Configurar a assinatura
    sig.addReference(
      "//*//*[local-name(.)='infNFe']",
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ],
      'http://www.w3.org/2000/09/xmldsig#sha1'
    );
    
    // Assinar o XML
    // sig.computeSignature(xml);
    
    // Retornar o XML assinado
    // return sig.getSignedXml();
    
    // Como não podemos realmente assinar sem um certificado real,
    // retornamos uma simulação de XML assinado para fins educacionais
    return xml.replace('</infNFe>', '</infNFe><Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI="#NFe123"><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>digest-value-here</DigestValue></Reference></SignedInfo><SignatureValue>signature-value-here</SignatureValue><KeyInfo><X509Data><X509Certificate>certificate-here</X509Certificate></X509Data></KeyInfo></Signature>');
  } catch (error) {
    console.error('Erro ao assinar XML:', error);
    throw new Error('Falha ao assinar o XML da NF-e');
  }
}

export function gerarLoteNFe(xmlNFe: string, idLote: string): string {
  const loteXml = `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${idLote}</idLote>
  <indSinc>1</indSinc>
  ${xmlNFe}
</enviNFe>`;

  return loteXml;
}