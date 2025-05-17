import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotificacao } from './NotificacaoContext';
import { supabase } from '../services/supabase';

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
  regimeTributario: 1 | 2 | 3; // 1 = Simples Nacional, 2 = Simples Nacional - excesso de sublimite, 3 = Normal
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
    regimeTributario: 1,
    endereco: {
      logradouro: import.meta.env.VITE_EMISSOR_ENDERECO_LOGRADOURO,
      numero: import.meta.env.VITE_EMISSOR_ENDERECO_NUMERO,
      bairro: import.meta.env.VITE_EMISSOR_ENDERECO_BAIRRO,
      municipio: import.meta.env.VITE_EMISSOR_ENDERECO_CIDADE,
      uf: import.meta.env.VITE_EMISSOR_ENDERECO_UF,
      cep: import.meta.env.VITE_EMISSOR_ENDERECO_CEP,
      codigoMunicipio: "350660",
      codigoPais: "1058",
      pais: "Brasil",
    },
  };

  const [emissor, setEmissor] = useState<Emissor | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { adicionarNotificacao } = useNotificacao();

  useEffect(() => {
    async function carregarEmissor() {
      try {
        const { data, error } = await supabase
          .from('emissor')
          .select('*')
          .maybeSingle();

        if (error || !data) throw error;

        const emissorFormatado = {
          ...data,
          razaoSocial: data.razao_social,
          nomeFantasia: data.nome_fantasia,
          inscricaoEstadual: data.inscricao_estadual,
          regimeTributario: data.regime_tributario,
        };
        setEmissor(emissorFormatado);
      } catch (error) {
        console.warn("Erro ao carregar dados do Supabase, usando .env");
        setEmissor(emissorEnv);
        adicionarNotificacao('erro', 'Carregando dados do emissor padrão');
      } finally {
        setCarregando(false);
      }
    }

    carregarEmissor();
  }, [adicionarNotificacao]);

  const salvarEmissor = async (dados: Emissor) => {
    try {
      setCarregando(true);

      const dadosFormatados = {
        razao_social: dados.razaoSocial,
        nome_fantasia: dados.nomeFantasia,
        cnpj: dados.cnpj,
        inscricao_estadual: dados.inscricaoEstadual,
        regime_tributario: dados.regimeTributario,
        endereco: dados.endereco,
      };

      if (emissor?.id) {
        const { error } = await supabase
          .from('emissor')
          .update(dadosFormatados)
          .eq('id', emissor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('emissor')
          .insert([dadosFormatados]);

        if (error) throw error;
      }

      setEmissor(dados);
      adicionarNotificacao('sucesso', 'Dados do emissor salvos com sucesso');
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
