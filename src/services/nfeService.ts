import axios from 'axios';
import { gerarXmlNFe, assinarXml, gerarLoteNFe, gerarChaveNFe } from '../utils/nfeUtils';
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

// Função para emitir NF-e
export async function emitirNFe(
  notaFiscal: NotaFiscal, 
  emissorId: string,
  certificadoId: string
): Promise<{ status: string; mensagem: string; chave?: string; protocolo?: string }> {
  try {
    // 1. Buscar dados do emissor
    const { data: emissor, error: emissorError } = await supabase
      .from('emissor')
      .select('*')
      .eq('id', emissorId)
      .single();
      
    if (emissorError) throw new Error('Erro ao buscar dados do emissor');
    
    // 2. Buscar dados do certificado
    const { data: certificado, error: certError } = await supabase
      .from('certificados')
      .select('*')
      .eq('id', certificadoId)
      .single();
      
    if (certError) throw new Error('Erro ao buscar dados do certificado');
    
    // 3. Gerar chave da NF-e
    const anoMes = new Date().toISOString().substring(0, 7).replace('-', '');
    const chaveNFe = gerarChaveNFe(
      emissor.endereco.codigoMunicipio.substring(0, 2), // UF
      anoMes,
      emissor.cnpj.replace(/\D/g, ''),
      '55', // modelo NF-e
      notaFiscal.serie.padStart(3, '0'),
      notaFiscal.numero.padStart(9, '0'),
      '1', // tpEmis: emissão normal
      notaFiscal.numero.substring(notaFiscal.numero.length - 8).padStart(8, '0') // cNF = 8 últimos dígitos do número
    );
    
    // 4. Construir objeto da NF-e para XML
    const infNFe = {
      ide: {
        cUF: emissor.endereco.codigoMunicipio.substring(0, 2),
        cNF: notaFiscal.numero.substring(notaFiscal.numero.length - 8).padStart(8, '0'),
        natOp: notaFiscal.naturezaOperacao,
        mod: '55',
        serie: notaFiscal.serie,
        nNF: notaFiscal.numero,
        dhEmi: notaFiscal.dataEmissao.toISOString(),
        tpNF: notaFiscal.tipoOperacao,
        idDest: '1', // operação interna
        cMunFG: emissor.endereco.codigoMunicipio,
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
        CNPJ: emissor.cnpj.replace(/\D/g, ''),
        xNome: emissor.razaoSocial,
        xFant: emissor.nomeFantasia,
        enderEmit: {
          xLgr: emissor.endereco.logradouro,
          nro: emissor.endereco.numero,
          xBairro: emissor.endereco.bairro,
          cMun: emissor.endereco.codigoMunicipio,
          xMun: emissor.endereco.municipio,
          UF: emissor.endereco.uf,
          CEP: emissor.endereco.cep.replace(/\D/g, ''),
          cPais: '1058',
          xPais: 'BRASIL',
        },
        IE: emissor.inscricaoEstadual.replace(/\D/g, ''),
        CRT: emissor.regimeTributario.toString(),
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
      det: notaFiscal.produtos.map((produto, index) => ({
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
          ICMS: emissor.regimeTributario === 1 ? {
            ICMSSN102: {
              orig: produto.icms.origem,
              CSOSN: produto.icms.cst,
            }
          } : {
            ICMS00: {
              orig: produto.icms.origem,
              CST: produto.icms.cst,
              modBC: '0',
              vBC: produto.icms.baseCalculo?.toFixed(2) || '0.00',
              pICMS: produto.icms.aliquota?.toFixed(2) || '0.00',
              vICMS: ((produto.icms.baseCalculo || 0) * (produto.icms.aliquota || 0) / 100).toFixed(2),
            }
          },
          PIS: {
            PISAliq: {
              CST: produto.pis.cst,
              vBC: produto.pis.baseCalculo?.toFixed(2) || '0.00',
              pPIS: produto.pis.aliquota?.toFixed(2) || '0.00',
              vPIS: ((produto.pis.baseCalculo || 0) * (produto.pis.aliquota || 0) / 100).toFixed(2),
            }
          },
          COFINS: {
            COFINSAliq: {
              CST: produto.cofins.cst,
              vBC: produto.cofins.baseCalculo?.toFixed(2) || '0.00',
              pCOFINS: produto.cofins.aliquota?.toFixed(2) || '0.00',
              vCOFINS: ((produto.cofins.baseCalculo || 0) * (produto.cofins.aliquota || 0) / 100).toFixed(2),
            }
          }
        }
      })),
      total: {
        ICMSTot: {
          vBC: '0.00', // Em uma implementação real, seria calculado
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
    
    // 5. Gerar XML da NF-e
    const xmlNFe = gerarXmlNFe(infNFe, chaveNFe);
    
    // 6. Assinar XML com certificado digital
    const xmlAssinado = assinarXml(xmlNFe, certificado.arquivo, certificado.senha);
    
    // 7. Gerar lote de envio
    const idLote = Date.now().toString();
    const xmlLote = gerarLoteNFe(xmlAssinado, idLote);
    
    // 8. Transmitir para SEFAZ
    // Em uma implementação real, usaríamos axios para chamar o Web Service SOAP
    // const resposta = await transmitirParaSefaz(xmlLote);
    
    // Como é uma simulação, vamos simular uma autorização bem-sucedida
    const protocolo = Math.floor(Math.random() * 1000000000).toString().padStart(15, '0');
    
    // 9. Salvar NF-e no banco de dados
    const { error: salvarError } = await supabase
      .from('notas_fiscais')
      .insert([{
        emissor_id: emissorId,
        numero: notaFiscal.numero,
        serie: notaFiscal.serie,
        chave: chaveNFe,
        xml: xmlAssinado,
        xml_protocolo: `<protocolo>${protocolo}</protocolo>`, // Simulação
        destinatario: notaFiscal.destinatario.nome,
        valor: notaFiscal.valorTotal,
        data_emissao: notaFiscal.dataEmissao.toISOString(),
        status: 'autorizada',
        protocolo: protocolo
      }]);
      
    if (salvarError) throw new Error('Erro ao salvar NF-e no banco de dados');
    
    return {
      status: 'autorizada',
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
    // Em uma implementação real, consultaríamos o status na SEFAZ
    // Aqui apenas simulamos a consulta no banco de dados local
    
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('*')
      .eq('chave', chave)
      .single();
      
    if (error) throw error;
    
    return {
      status: data.status,
      mensagem: `NF-e ${data.status}`,
      protocolo: data.protocolo,
      data_autorizacao: data.data_autorizacao
    };
  } catch (error) {
    console.error('Erro ao consultar NF-e:', error);
    return {
      status: 'erro',
      mensagem: 'Erro ao consultar status da NF-e'
    };
  }
}