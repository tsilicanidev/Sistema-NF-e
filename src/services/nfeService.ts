import { logger } from '../utils/logger';
import { supabase } from './supabase';
import { gerarXmlNFe } from '../utils/nfeUtils';

interface Certificate {
  pfxBase64: string;
  password: string;
}

interface EmitirNFeResponse {
  status: 'autorizada' | 'rejeitada';
  mensagem: string;
  protocolo?: string;
  xml?: string;
}

export const emitirNFe = async (data: any) => {
  try {
    logger.info('Iniciando emissão de NFe', { documentData: data });

    const response = await fetch('/api/emitir-nfe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    let result;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error('Resposta vazia do servidor');
      }
      result = JSON.parse(text);
    } catch (parseError) {
      logger.error('Erro ao processar resposta da API', { 
        status: response.status, 
        error: parseError,
        responseText: await response.text().catch(() => 'Não foi possível ler o corpo da resposta')
      });
      throw new Error('Falha ao processar resposta do servidor');
    }

    if (!response.ok) {
      logger.error('Erro ao emitir NFe', { 
        status: response.status, 
        error: result 
      });
      throw new Error(result.message || 'Falha ao emitir NFe');
    }

    logger.info('NFe emitida com sucesso', { result });
    return result;
  } catch (error) {
    logger.error('Erro durante emissão de NFe', error);
    throw error;
  }
};

export const validarXml = async (xml: string, schema: string) => {
  try {
    logger.info('Iniciando validação de XML');

    const response = await fetch('/api/validarXml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ xml, schema }),
    });

    let result;
    try {
      const text = await response.text();
      if (!text) {
        throw new Error('Resposta vazia do servidor de validação');
      }
      result = JSON.parse(text);
    } catch (parseError) {
      logger.error('Erro ao processar resposta da validação', { 
        status: response.status, 
        error: parseError,
        responseText: await response.text().catch(() => 'Não foi possível ler o corpo da resposta')
      });
      throw new Error('Falha ao processar resposta da validação do XML');
    }

    if (!response.ok) {
      logger.error('Erro na validação do XML', { 
        status: response.status, 
        error: result 
      });
      throw new Error(result.message || 'Falha na validação do XML');
    }

    logger.info('XML validado com sucesso', { result });
    return result;
  } catch (error) {
    logger.error('Erro durante validação do XML', error);
    throw error;
  }
};

export async function consultarNFe(chave: string): Promise<EmitirNFeResponse> {
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
      status: nota.status as 'autorizada' | 'rejeitada',
      mensagem: `NF-e ${nota.status}`,
      protocolo: nota.protocolo,
      xml: nota.xml
    };
  } catch (error) {
    console.error('Erro ao consultar NF-e:', error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao consultar NF-e');
  }
}