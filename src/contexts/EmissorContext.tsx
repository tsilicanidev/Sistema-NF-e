import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotificacao } from './NotificacaoContext';

export interface Emissor {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    codigoPais: string;
    pais: string;
    codigoMunicipio: string;
  };
  regimeTributario: 1 | 2 | 3;
}

interface EmissorContextType {
  emissor: Emissor | null;
  carregando: boolean;
}

const EmissorContext = createContext<EmissorContextType | null>(null);

export const useEmissor = () => {
  const context = useContext(EmissorContext);
  if (!context) {
    throw new Error('useEmissor deve ser usado dentro de um EmissorProvider');
  }
  return context;
};

export const EmissorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emissor, setEmissor] = useState<Emissor | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { adicionarNotificacao } = useNotificacao();

  useEffect(() => {
    async function carregarEmissor() {
      try {
        const requiredEnvVars = [
          'VITE_EMPRESA_RAZAO_SOCIAL',
          'VITE_EMPRESA_NOME_FANTASIA',
          'VITE_EMPRESA_CNPJ',
          'VITE_EMPRESA_IE',
          'VITE_EMPRESA_REGIME',
          'VITE_EMISSOR_ENDERECO_LOGRADOURO',
          'VITE_EMISSOR_ENDERECO_NUMERO',
          'VITE_EMISSOR_ENDERECO_BAIRRO',
          'VITE_EMISSOR_ENDERECO_CIDADE',
          'VITE_EMISSOR_ENDERECO_UF',
          'VITE_EMISSOR_ENDERECO_CEP',
          'VITE_EMISSOR_ENDERECO_COD_PAIS',
          'VITE_EMISSOR_ENDERECO_PAIS'
        ];

        const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
        if (missingVars.length > 0) {
          throw new Error(`Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`);
        }

        const emissorData: Emissor = {
          razaoSocial: import.meta.env.VITE_EMPRESA_RAZAO_SOCIAL,
          nomeFantasia: import.meta.env.VITE_EMPRESA_NOME_FANTASIA,
          cnpj: import.meta.env.VITE_EMPRESA_CNPJ,
          inscricaoEstadual: import.meta.env.VITE_EMPRESA_IE,
          regimeTributario: Number(import.meta.env.VITE_EMPRESA_REGIME) as 1 | 2 | 3,
          endereco: {
            logradouro: import.meta.env.VITE_EMISSOR_ENDERECO_LOGRADOURO,
            numero: import.meta.env.VITE_EMISSOR_ENDERECO_NUMERO,
            bairro: import.meta.env.VITE_EMISSOR_ENDERECO_BAIRRO,
            municipio: import.meta.env.VITE_EMISSOR_ENDERECO_CIDADE,
            uf: import.meta.env.VITE_EMISSOR_ENDERECO_UF,
            cep: import.meta.env.VITE_EMISSOR_ENDERECO_CEP,
            codigoPais: import.meta.env.VITE_EMISSOR_ENDERECO_COD_PAIS,
            pais: import.meta.env.VITE_EMISSOR_ENDERECO_PAIS,
            codigoMunicipio: '3550308' // São Paulo
          }
        };

        setEmissor(emissorData);
      } catch (error) {
        console.error('Erro ao carregar dados do emissor:', error);
        adicionarNotificacao('erro', error instanceof Error ? error.message : 'Erro ao carregar dados do emissor');
      } finally {
        setCarregando(false);
      }
    }

    carregarEmissor();
  }, [adicionarNotificacao]);

  return (
    <EmissorContext.Provider
      value={{
        emissor,
        carregando
      }}
    >
      {children}
    </EmissorContext.Provider>
  );
};