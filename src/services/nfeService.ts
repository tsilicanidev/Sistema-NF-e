import { XMLParser } from 'fast-xml-parser';
import { gerarXmlNFe, gerarChaveNFe } from '../utils/nfeUtils';
import { supabase } from './supabase';

interface Certificate {
  pfxBase64: string;
  password: string;
}

interface NotaFiscal {
  id?: string;
  numero: string;
  serie: string;
  naturezaOperacao: string;
  dataEmissao: Date;
  tipoOperacao: '0' | '1';
  finalidade: '1' | '2' | '3' | '4';
  destinatario: {
    tipo: 'PF' | 'PJ';
    documento: string;
    nome: string;
    inscricaoEstadual?: string;
    isento: boolean;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cep: string;
      municipio: string;
      uf: string;
    };
  };
  produtos: Array<{
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    icms: {
      origem: string;
      cst: string;
      aliquota?: number;
    };
  }>;
  informacoesAdicionais?: string;
  formaPagamento: string;
  valorTotal: number;
}

export async function emitirNFe(notaFiscal: NotaFiscal, certificate: Certificate) {
  try {
    const anoMes = new Date().toISOString().substring(0, 7).replace('-', '');
    const chaveNFe = gerarChaveNFe(
      '35',
      anoMes,
      import.meta.env.VITE_EMPRESA_CNPJ.replace(/\D/g, ''),
      '55',
      notaFiscal.serie.padStart(3, '0'),
      notaFiscal.numero.padStart(9, '0'),
      '1',
      notaFiscal.numero.substring(notaFiscal.numero.length - 8).padStart(8, '0')
    );

    const infNFe = montarInfNFe(notaFiscal, chaveNFe);
    const xmlNFe = gerarXmlNFe(infNFe, chaveNFe);

    // Call Supabase Edge Function instead of direct SEFAZ communication
    const { data: resultado, error } = await supabase.functions.invoke('nfe', {
      body: {
        xmlNFe,
        certificate,
        ambiente: 'homologacao'
      }
    });

    if (error) {
      throw new Error(`Erro ao enviar NF-e: ${error.message}`);
    }

    if (resultado.status === 'autorizada') {
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
          xml: xmlNFe,
          xml_protocolo: resultado.xml,
          destinatario: notaFiscal.destinatario.nome,
          valor: notaFiscal.valorTotal,
          data_emissao: notaFiscal.dataEmissao.toISOString(),
          data_autorizacao: new Date().toISOString(),
          status: 'autorizada',
          protocolo: resultado.protocolo
        });

      if (insertError) {
        throw new Error(`Erro ao salvar NF-e: ${insertError.message}`);
      }
    }

    return {
      status: resultado.status,
      mensagem: resultado.mensagem,
      chave: chaveNFe,
      protocolo: resultado.protocolo
    };
  } catch (error) {
    console.error('Erro ao emitir NF-e:', error);
    return {
      status: 'erro',
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido ao emitir NF-e'
    };
  }
}

function montarInfNFe(notaFiscal: NotaFiscal, chaveNFe: string) {
  return {
    ide: {
      cUF: '35',
      cNF: chaveNFe.substring(35, 43),
      natOp: notaFiscal.naturezaOperacao,
      mod: '55',
      serie: notaFiscal.serie,
      nNF: notaFiscal.numero,
      dhEmi: new Date().toISOString(),
      tpNF: notaFiscal.tipoOperacao,
      idDest: '1',
      cMunFG: '3550308',
      tpImp: '1',
      tpEmis: '1',
      cDV: chaveNFe.substring(43),
      tpAmb: '2',
      finNFe: notaFiscal.finalidade,
      indFinal: '1',
      indPres: '1',
      procEmi: '0',
      verProc: '1.0.0'
    }
  };
}

export async function consultarNFe(chave: string) {
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