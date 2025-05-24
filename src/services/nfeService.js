import { gerarXmlNFe, assinarXml, gerarLoteNFe, gerarChaveNFe } from '../utils/nfeUtils';
import { SefazService } from './sefazService';
import { supabase } from './supabase';

export async function emitirNFe(notaFiscal, certificate) {
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

    const infNFe = montarInfNFe(notaFiscal, chaveNFe);
    const xmlNFe = gerarXmlNFe(infNFe, chaveNFe);

    // Criar instância do serviço SEFAZ passando os dados do certificado diretamente
    const sefazService = new SefazService({
      pfxBase64: certificate.pfxBase64,
      password: certificate.password
    });

    // Enviar para SEFAZ
    const resultado = await sefazService.autorizarNFe(xmlNFe);

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

function montarInfNFe(notaFiscal, chaveNFe) {
  // Montar objeto infNFe com todos os dados da nota
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
    },
    // ... outros campos da nota fiscal
  };
}

export async function consultarNFe(chave) {
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