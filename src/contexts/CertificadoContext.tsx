import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotificacao } from './NotificacaoContext';
import { supabase } from '../services/supabase';

export interface Certificado {
  id: string;
  nome: string;
  arquivo: string; // Base64 do arquivo .pfx
  senha: string;
  validade: Date;
  ativo: boolean;
}

interface CertificadoContextType {
  certificados: Certificado[];
  certificadoAtivo: Certificado | null;
  carregando: boolean;
  adicionarCertificado: (certificado: Omit<Certificado, 'id'>) => Promise<void>;
  atualizarCertificado: (id: string, certificado: Partial<Certificado>) => Promise<void>;
  removerCertificado: (id: string) => Promise<void>;
  selecionarCertificadoAtivo: (id: string) => Promise<void>;
}

const CertificadoContext = createContext<CertificadoContextType | null>(null);

export const useCertificado = () => {
  const context = useContext(CertificadoContext);
  if (!context) {
    throw new Error('useCertificado deve ser usado dentro de um CertificadoProvider');
  }
  return context;
};

export const CertificadoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [certificadoAtivo, setCertificadoAtivo] = useState<Certificado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { adicionarNotificacao } = useNotificacao();

  useEffect(() => {
    async function carregarCertificados() {
      try {
        const { data, error } = await supabase
          .from('certificados')
          .select('*')
          .order('ativo', { ascending: false });

        if (error) throw error;

        const certFormatados = data.map(cert => ({
          ...cert,
          validade: new Date(cert.validade)
        }));

        setCertificados(certFormatados);
        
        const ativo = certFormatados.find(cert => cert.ativo);
        if (ativo) {
          setCertificadoAtivo(ativo);
        }
      } catch (error) {
        adicionarNotificacao('erro', 'Erro ao carregar certificados');
        console.error(error);
      } finally {
        setCarregando(false);
      }
    }

    carregarCertificados();
  }, [adicionarNotificacao]);

  const adicionarCertificado = async (certificado: Omit<Certificado, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('certificados')
        .insert([certificado])
        .select()
        .single();

      if (error) throw error;

      const novoCertificado = {
        ...data,
        validade: new Date(data.validade)
      };

      setCertificados(prev => [...prev, novoCertificado]);
      
      // Se for o primeiro certificado ou estiver marcado como ativo
      if (certificados.length === 0 || novoCertificado.ativo) {
        setCertificadoAtivo(novoCertificado);
      }
      
      adicionarNotificacao('sucesso', 'Certificado adicionado com sucesso');
    } catch (error) {
      adicionarNotificacao('erro', 'Erro ao adicionar certificado');
      console.error(error);
    }
  };

  const atualizarCertificado = async (id: string, certificado: Partial<Certificado>) => {
    try {
      const { data, error } = await supabase
        .from('certificados')
        .update(certificado)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const certificadoAtualizado = {
        ...data,
        validade: new Date(data.validade)
      };

      setCertificados(prev => 
        prev.map(cert => cert.id === id ? certificadoAtualizado : cert)
      );
      
      // Se for o certificado ativo que foi atualizado
      if (certificadoAtivo?.id === id) {
        setCertificadoAtivo(certificadoAtualizado);
      }
      
      adicionarNotificacao('sucesso', 'Certificado atualizado com sucesso');
    } catch (error) {
      adicionarNotificacao('erro', 'Erro ao atualizar certificado');
      console.error(error);
    }
  };

  const removerCertificado = async (id: string) => {
    try {
      const { error } = await supabase
        .from('certificados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCertificados(prev => prev.filter(cert => cert.id !== id));
      
      // Se for o certificado ativo que foi removido
      if (certificadoAtivo?.id === id) {
        const proximoAtivo = certificados.find(cert => cert.id !== id);
        if (proximoAtivo) {
          await selecionarCertificadoAtivo(proximoAtivo.id);
        } else {
          setCertificadoAtivo(null);
        }
      }
      
      adicionarNotificacao('sucesso', 'Certificado removido com sucesso');
    } catch (error) {
      adicionarNotificacao('erro', 'Erro ao remover certificado');
      console.error(error);
    }
  };

  const selecionarCertificadoAtivo = async (id: string) => {
    try {
      // Desativa todos os certificados
      const { error: errorDesativar } = await supabase
        .from('certificados')
        .update({ ativo: false })
        .neq('id', '');
      
      if (errorDesativar) throw errorDesativar;
      
      // Ativa o certificado selecionado
      const { data, error } = await supabase
        .from('certificados')
        .update({ ativo: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const certAtualizado = {
        ...data,
        validade: new Date(data.validade)
      };
      
      setCertificados(prev => 
        prev.map(cert => ({
          ...cert,
          ativo: cert.id === id
        }))
      );
      
      setCertificadoAtivo(certAtualizado);
      adicionarNotificacao('sucesso', 'Certificado ativo alterado com sucesso');
    } catch (error) {
      adicionarNotificacao('erro', 'Erro ao selecionar certificado ativo');
      console.error(error);
    }
  };

  return (
    <CertificadoContext.Provider
      value={{
        certificados,
        certificadoAtivo,
        carregando,
        adicionarCertificado,
        atualizarCertificado,
        removerCertificado,
        selecionarCertificadoAtivo
      }}
    >
      {children}
    </CertificadoContext.Provider>
  );
};