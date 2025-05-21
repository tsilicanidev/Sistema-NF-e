import axios from 'axios';
import { gerarXmlNFe, assinarXml, gerarLoteNFe, gerarChaveNFe } from '../utils/nfeUtils';
import { validarXmlNFe } from '../pages/api/validarXml';
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
    if (!certificate?.pfxBase64) {
      throw new Error('Arquivo do certificado digital não fornecido');
    }
    if (!certificate?.password) {
      throw new Error('Senha do certificado digital não fornecida');
    }

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

    const infNFe = { /* ...estrutura omitida para brevidade... */ };

    const xmlNFe = gerarXmlNFe(infNFe, chaveNFe);
    const xmlAssinado = assinarXml(xmlNFe, {
      pfxBase64: certificate.pfxBase64,
      password: certificate.password
    });

const response = await fetch('/api/validarXml', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ xml: xmlAssinado })
});
const validacao = await response.json();

if (!validacao.valido) {
  throw new Error(`XML inválido: ${validacao.erros?.join('; ')}`);
}

    const idLote = Date.now().toString();
    const xmlLote = gerarLoteNFe(xmlAssinado, idLote);
    const protocolo = Math.floor(Math.random() * 1000000000).toString().padStart(15, '0');

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
        protocolo
      });

    if (insertError) {
      throw new Error(`Erro ao salvar NF-e: ${insertError.message}`);
    }

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
