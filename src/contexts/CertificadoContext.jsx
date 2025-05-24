import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotificacao } from './NotificacaoContext';

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
        const certBase64 = import.meta.env.VITE_CERTIFICADO_BASE64;
        const certSenha = import.meta.env.VITE_CERTIFICADO_SENHA;

        if (!certBase64 || !certSenha) {
          throw new Error('Certificado digital não configurado no arquivo .env');
        }

        // Criar certificado com dados do .env
        const certificadoFixo: Certificado = {
          id: '1',
          nome: 'Certificado Principal',
          arquivo: certBase64,
          senha: certSenha,
          validade: new Date('2025-12-31') // Em produção, extrair do certificado
        };
        
        setCertificado(certificadoFixo);
      } catch (error) {
        console.error('Erro ao carregar certificado:', error);
        adicionarNotificacao('erro', error instanceof Error ? error.message : 'Erro ao carregar certificado');
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