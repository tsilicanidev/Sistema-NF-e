
import * as fs from 'fs';
import * as path from 'path';

function carregarCertificadoPFX(): { pfxBuffer: Buffer; senha: string } {
  const pfxBase64 = process.env.CERT_PFX_BASE64;
  const senha = process.env.CERT_PFX_SENHA || '';

  if (pfxBase64) {
    const pfxBuffer = Buffer.from(pfxBase64, 'base64');
    return { pfxBuffer, senha };
  }

  // Fallback: tenta ler da pasta cert/
  const pfxPath = path.resolve(process.cwd(), 'cert', 'certificado.pfx');
  if (!fs.existsSync(pfxPath)) {
    throw new Error('Certificado .pfx não encontrado e variável CERT_PFX_BASE64 não fornecida');
  }

  const pfxBuffer = fs.readFileSync(pfxPath);
  return { pfxBuffer, senha };
}

import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface NFe {
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
    xFant: string;
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
    "@_nItem": string;
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
        ICMS00: {
          orig: string;
          CST: string;
          modBC: string;
          vBC: string;
          pICMS: string;
          vICMS: string;
        };
      };
      PIS: {
        PISNT: {
          CST: string;
        };
      };
      COFINS: {
        COFINSNT: {
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
      vBCST: string;
      vST: string;
      vProd: string;
      vFrete: string;
      vSeg: string;
      vDesc: string;
      vII: string;
      vIPI: string;
      vPIS: string;
      vCOFINS: string;
      vOutro: string;
      vNF: string;
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

export const gerarChaveNFe = (
  cUF: string,
  AAMM: string,
  CNPJ: string,
  mod: string,
  serie: string,
  nNF: string,
  tpEmis: string,
  cNF: string
): string => {
  const chave = `${cUF}${AAMM}${CNPJ}${mod}${serie.padStart(3, '0')}${nNF.padStart(9, '0')}${tpEmis}${cNF}`;
  
  let soma = 0;
  let peso = 2;
  
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  const dv = 11 - (soma % 11);
  const digito = dv === 10 || dv === 11 ? '0' : dv.toString();
  
  return chave + digito;
};

export const gerarXmlNFe = (nfe: NFe, chave: string): string => {
  const builder = new XMLBuilder({
    attributeNamePrefix: "@_",
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true,
    indentBy: "  "
  });

  const xmlObj = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "UTF-8"
    },
    "NFe": {
      "@_xmlns": "http://www.portalfiscal.inf.br/nfe",
      "infNFe": {
        "@_Id": `NFe${chave}`,
        "@_versao": "4.00",
        ...nfe
      }
    }
  };

  const xml = builder.build(xmlObj);
  
  // Ensure proper XML formatting and structure
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const validarXmlComXSD = async (xml: string, schema: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/validarXml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        xml,
        schema
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro na validação do XML');
    }

    if (!result.valid) {
      const errorMessage = result.error || 'XML inválido';
      const lineInfo = result.line ? ` (linha ${result.line})` : '';
      throw new Error(`${errorMessage}${lineInfo}`);
    }

    return true;
  } catch (error) {
    console.error('Erro na validação do XML:', error);
    throw error;
  }
};