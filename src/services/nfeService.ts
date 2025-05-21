import axios from 'axios';
import { gerarXmlNFe, assinarXml, gerarLoteNFe, gerarChaveNFe } from '../utils/nfeUtils';
import { gerarDanfePDF } from '../pages/api/lib/danfeService';
import { salvarDanfeNoStorage } from './danfeStorage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

// Interfaces
interface Destinatario {
  tipo: 'PF' | 'PJ';
  documento: string;
  nome: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cep: string;
    municipio: string;
    codigoMunicipio: string;
    uf: string;
  };
  inscricaoEstadual?: string;
  isento: boolean;
}

interface Produto {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  icms: {
    cst: string;
    origem: string;
    aliquota?: number;
    baseCalculo?: number;
  };
  pis: {
    cst: string;
    aliquota?: number;
    baseCalculo?: number;
  };
  cofins: {
    cst: string;
    aliquota?: number;
    baseCalculo?: number;
  };
}

interface NotaFiscal {
  id?: string;
  numero: string;
  serie: string;
  naturezaOperacao: string;
  dataEmissao: Date;
  tipoOperacao: '0' | '1'; // 0=Entrada, 1=Saída
  finalidade: '1' | '2' | '3' | '4'; // 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução
  destinatario: Destinatario;
  produtos: Produto[];
  informacoesAdicionais?: string;
  formaPagamento: string;
  valorTotal: number;
}

interface Certificate {
  pfxBase64: string;
  password: string;
}

// Função para emitir NF-e
export async function emitirNFe(notaFiscal: NotaFiscal, certificate: Certificate): Promise<{ status: string; mensagem: string; chave?: string; protocolo?: string }> {
  try {
    // Validação do certificado
    if (!certificate?.pfxBase64) {
      throw new Error('Arquivo do certificado digital não fornecido');
    }
    if (!certificate?.password) {
      throw new Error('Senha do certificado digital não fornecida');
    }

    // Gerar chave da NF-e
    const anoMes = new Date().toISOString().substring(0, 7).replace('-', '');
    const chaveNFe = gerarChaveNFe(
      '35', // UF SP
      anoMes,
      import.meta.env.VITE_EMPRESA_CNPJ.replace(/\D/g, ''),
      '55', // modelo NF-e
      notaFiscal.serie.padStart(3, '0'),
      notaFiscal.numero.padStart(9, '0'),
      '1', // tpEmis: emissão normal
      notaFiscal.numero.substring(notaFiscal.numero.length - 8).padStart(8, '0') // cNF = 8 últimos dígitos do número
    );
    
    // Construir objeto da NF-e para XML
    const infNFe = {
      ide: {
        cUF: '35', // SP
        cNF: notaFiscal.numero.substring(notaFiscal.numero.length - 8).padStart(8, '0'),
        natOp: notaFiscal.naturezaOperacao,
        mod: '55',
        serie: notaFiscal.serie,
        nNF: notaFiscal.numero,
        dhEmi: notaFiscal.dataEmissao.toISOString(),
        tpNF: notaFiscal.tipoOperacao,
        idDest: '1', // operação interna
        cMunFG: '3505708', // Barueri
        tpImp: '1', // DANFE retrato
        tpEmis: '1', // emissão normal
        cDV: chaveNFe.substring(chaveNFe.length - 1),
        tpAmb: '2', // ambiente de homologação
        finNFe: notaFiscal.finalidade,
        indFinal: '1', // consumidor final
        indPres: '1', // operação presencial
        procEmi: '0', // emissão por aplicativo
        verProc: '1.0.0', // versão do aplicativo
      },
      emit: {
        CNPJ: import.meta.env.VITE_EMPRESA_CNPJ.replace(/\D/g, ''),
        xNome: import.meta.env.VITE_EMPRESA_RAZAO_SOCIAL,
        xFant: import.meta.env.VITE_EMPRESA_NOME_FANTASIA,
        enderEmit: {
          xLgr: import.meta.env.VITE_EMISSOR_ENDERECO_LOGRADOURO,
          nro: import.meta.env.VITE_EMISSOR_ENDERECO_NUMERO,
          xBairro: import.meta.env.VITE_EMISSOR_ENDERECO_BAIRRO,
          cMun: '3505708', // Barueri
          xMun: import.meta.env.VITE_EMISSOR_ENDERECO_CIDADE,
          UF: import.meta.env.VITE_EMISSOR_ENDERECO_UF,
          CEP: import.meta.env.VITE_EMISSOR_ENDERECO_CEP.replace(/\D/g, ''),
          cPais: import.meta.env.VITE_EMISSOR_ENDERECO_COD_PAIS,
          xPais: import.meta.env.VITE_EMISSOR_ENDERECO_PAIS,
        },
        IE: import.meta.env.VITE_EMPRESA_IE.replace(/\D/g, ''),
        CRT: import.meta.env.VITE_EMPRESA_REGIME.toString(),
      },
      dest: {
        [notaFiscal.destinatario.tipo === 'PF' ? 'CPF' : 'CNPJ']: notaFiscal.destinatario.documento.replace(/\D/g, ''),
        xNome: notaFiscal.destinatario.nome,
        enderDest: {
          xLgr: notaFiscal.destinatario.endereco.logradouro,
          nro: notaFiscal.destinatario.endereco.numero,
          xBairro: notaFiscal.destinatario.endereco.bairro,
          cMun: notaFiscal.destinatario.endereco.codigoMunicipio,
          xMun: notaFiscal.destinatario.endereco.municipio,
          UF: notaFiscal.destinatario.endereco.uf,
          CEP: notaFiscal.destinatario.endereco.cep.replace(/\D/g, ''),
          cPais: '1058',
          xPais: 'BRASIL',
        },
        indIEDest: notaFiscal.destinatario.isento ? '2' : '1',
        IE: notaFiscal.destinatario.inscricaoEstadual?.replace(/\D/g, '') || undefined,
      },
      det: notaFiscal.produtos.map((produto, index) => {
        const defaultIcms = {
          cst: '102',
          origem: '0',
          aliquota: 0,
          baseCalculo: 0
        };

        const defaultPisCofins = {
          cst: '07',
          aliquota: 0,
          baseCalculo: 0
        };

        const icms = {
          ...defaultIcms,
          ...produto.icms
        };

        const pis = {
          ...defaultPisCofins,
          ...produto.pis
        };

        const cofins = {
          ...defaultPisCofins,
          ...produto.cofins
        };

        return {
          '@nItem': (index + 1).toString(),
          prod: {
            cProd: produto.codigo,
            cEAN: 'SEM GTIN',
            xProd: produto.descricao,
            NCM: produto.ncm,
            CFOP: produto.cfop,
            uCom: produto.unidade,
            qCom: produto.quantidade.toFixed(4),
            vUnCom: produto.valorUnitario.toFixed(4),
            vProd: (produto.quantidade * produto.valorUnitario).toFixed(2),
            cEANTrib: 'SEM GTIN',
            uTrib: produto.unidade,
            qTrib: produto.quantidade.toFixed(4),
            vUnTrib: produto.valorUnitario.toFixed(4),
            indTot: '1',
          },
          imposto: {
            ICMS: Number(import.meta.env.VITE_EMPRESA_REGIME) === 1 ? {
              ICMSSN102: {
                orig: icms.origem,
                CSOSN: icms.cst,
              }
            } : {
              ICMS00: {
                orig: icms.origem,
                CST: icms.cst,
                modBC: '0',
                vBC: icms.baseCalculo?.toFixed(2) || '0.00',
                pICMS: icms.aliquota?.toFixed(2) || '0.00',
                vICMS: ((icms.baseCalculo || 0) * (icms.aliquota || 0) / 100).toFixed(2),
              }
            },
            PIS: {
              PISAliq: {
                CST: pis.cst,
                vBC: pis.baseCalculo?.toFixed(2) || '0.00',
                pPIS: pis.aliquota?.toFixed(2) || '0.00',
                vPIS: ((pis.baseCalculo || 0) * (pis.aliquota || 0) / 100).toFixed(2),
              }
            },
            COFINS: {
              COFINSAliq: {
                CST: cofins.cst,
                vBC: cofins.baseCalculo?.toFixed(2) || '0.00',
                pCOFINS: cofins.aliquota?.toFixed(2) || '0.00',
                vCOFINS: ((cofins.baseCalculo || 0) * (cofins.aliquota || 0) / 100).toFixed(2),
              }
            }
          }
        };
      }),
      total: {
        ICMSTot: {
          vBC: '0.00',
          vICMS: '0.00',
          vICMSDeson: '0.00',
          vBCST: '0.00',
          vST: '0.00',
          vProd: notaFiscal.valorTotal.toFixed(2),
          vFrete: '0.00',
          vSeg: '0.00',
          vDesc: '0.00',
          vII: '0.00',
          vIPI: '0.00',
          vPIS: '0.00',
          vCOFINS: '0.00',
          vOutro: '0.00',
          vNF: notaFiscal.valorTotal.toFixed(2),
          vTotTrib: '0.00',
        }
      },
      transp: {
        modFrete: '9' // Sem frete
      },
      pag: {
        detPag: [{
          tPag: notaFiscal.formaPagamento,
          vPag: notaFiscal.valorTotal.toFixed(2)
        }]
      },
      infAdic: notaFiscal.informacoesAdicionais ? {
        infCpl: notaFiscal.informacoesAdicionais
      } : undefined
    };
    
    // Gerar XML da NF-e
    const xmlNFe = gerarXmlNFe(infNFe, chaveNFe);
    
    // Assinar XML com certificado digital
    const xmlAssinado = assinarXml(xmlNFe, {
      pfxBase64: certificate.pfxBase64,
      password: certificate.password
    });
    
    
    const pdfBuffer = await gerarDanfePDF(xmlAssinado);
    const pdfUrl = await salvarDanfeNoStorage(chaveNFe, pdfBuffer);

    // Gerar lote de envio
    const idLote = Date.now().toString();
    const xmlLote = gerarLoteNFe(xmlAssinado, idLote);
    
    // Simular autorização bem-sucedida
    const protocolo = Math.floor(Math.random() * 1000000000).toString().padStart(15, '0');
    
    // Salvar NF-e no Supabase
    const { data: emissor } = await supabase
      .from('emissor')
      .select('id')
      .single();

    if (!emissor?.id) {
      throw new Error('Emissor não encontrado');
    }

    const { error: insertError } = await supabase
      .from('notas_fiscais')
      .insert({
        emissor_id: emissor.id,
        numero: notaFiscal.numero,
        serie: notaFiscal.serie,
        chave: chaveNFe,
        xml: xmlAssinado,
        xml_protocolo: `<protocolo>${protocolo}</protocolo>`,
        destinatario: notaFiscal.destinatario.nome,
        valor: notaFiscal.valorTotal,
        data_emissao: notaFiscal.dataEmissao.toISOString(),
        data_autorizacao: new Date().toISOString(),
        status: 'autorizada',
        danfe_url: pdfUrl,
        protocolo
      });

    if (insertError) {
      throw new Error(`Erro ao salvar NF-e: ${insertError.message}`);
    }
    
    return {
      status: 'autorizada',
        danfe_url: pdfUrl,
      mensagem: 'NF-e autorizada com sucesso',
      chave: chaveNFe,
      protocolo
    };
  } catch (error) {
    console.error('Erro ao emitir NF-e:', error);
    return {
      status: 'erro',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido ao emitir NF-e'
    };
  }
}

// Função para consultar status da NF-e
export async function consultarNFe(chave: string): Promise<any> {
  try {
    const { data: nota, error } = await supabase
      .from('notas_fiscais')
      .select('*')
      .eq('chave', chave)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!nota) {
      throw new Error('NF-e não encontrada');
    }
    
    return {
      status: nota.status,
      mensagem: `NF-e ${nota.status}`,
      protocolo: nota.protocolo,
      data_autorizacao: nota.data_autorizacao
    };
  } catch (error) {
    console.error('Erro ao consultar NF-e:', error);
    return {
      status: 'erro',
      mensagem: 'Erro ao consultar status da NF-e'
    };
  }
}