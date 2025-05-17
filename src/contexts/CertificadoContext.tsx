import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotificacao } from './NotificacaoContext';
import { supabase } from '../services/supabase';
import fs from 'node:fs/promises';

export interface Certificado {
  id: string;
  nome: string;
  arquivo: string;
  senha: string;
  validade: Date;
}

interface CertificadoContextType {
  certificado: Certificado | null;
  carregando: boolean;
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
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { adicionarNotificacao } = useNotificacao();

  useEffect(() => {
    async function carregarCertificado() {
      try {
        // Carregar certificado do arquivo
        const certificadoFixo: Certificado = {
          id: '1',
          nome: 'Certificado Padrão',
          arquivo: '/cert/certificado.pfx',
          senha: 'Casa090618',
          validade: new Date('2025-12-31') // Data exemplo, em produção seria obtida do certificado
        };
        
        setCertificado(certificadoFixo);
      } catch (error) {
        console.error('Erro ao carregar certificado:', error);
        adicionarNotificacao('erro', 'Erro ao carregar certificado');
      } finally {
        setCarregando(false);
      }
    }

    carregarCertificado();
  }, [adicionarNotificacao]);

  return (
    <CertificadoContext.Provider
      value={{
        certificado,
        carregando
      }}
    >
      {children}
    </CertificadoContext.Provider>
  );
};