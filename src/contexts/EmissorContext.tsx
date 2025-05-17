import React, { createContext, useContext, useState } from 'react';
import { useNotificacao } from './NotificacaoContext';

export interface Emissor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    codigoMunicipio: string;
    municipio: string;
    uf: string;
    cep: string;
    codigoPais: string;
    pais: string;
  };
  regimeTributario: 1 | 2 | 3;
}

interface EmissorContextType {
  emissor: Emissor | null;
  carregando: boolean;
  salvarEmissor: (dados: Emissor) => Promise<void>;
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
  const emissorEnv: Emissor = {
    id: crypto.randomUUID(),
    razaoSocial: import.meta.env.VITE_EMPRESA_RAZAO_SOCIAL,
    nomeFantasia: import.meta.env.VITE_EMPRESA_NOME_FANTASIA,
    cnpj: import.meta.env.VITE_EMPRESA_CNPJ,
    inscricaoEstadual: import.meta.env.VITE_EMPRESA_IE,
    regimeTributario: Number(import.meta.env.VITE_EMPRESA_REGIME) as 1 | 2 | 3,
    endereco: {
      logradouro: import.meta.env.VITE_EMISSOR_ENDERECO,
      numero: import.meta.env.VITE_EMISSOR_ENDERECO_NUMERO,
      bairro: import.meta.env.VITE_EMISSOR_ENDERECO_BAIRRO,
      municipio: import.meta.env.VITE_EMISSOR_ENDERECO_CIDADE,
      uf: import.meta.env.VITE_EMISSOR_ENDERECO_UF,
      cep: import.meta.env.VITE_EMISSOR_ENDERECO_CEP,
      codigoMunicipio: import.meta.env.VITE_EMISSOR_ENDERECO_COD_MUNICIPIO,
      codigoPais: '1058',
      pais: 'Brasil',
    },
  };

  const [emissor, setEmissor] = useState<Emissor>(emissorEnv);
  const [carregando, setCarregando] = useState(false);
  const { adicionarNotificacao } = useNotificacao();

  const salvarEmissor = async (dados: Emissor) => {
    try {
      setCarregando(true);
      setEmissor(dados);
      adicionarNotificacao('sucesso', 'Dados do emissor salvos localmente');
    } catch (error) {
      adicionarNotificacao('erro', 'Erro ao salvar dados do emissor');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <EmissorContext.Provider value={{ emissor, carregando, salvarEmissor }}>
      {children}
    </EmissorContext.Provider>
  );
};
