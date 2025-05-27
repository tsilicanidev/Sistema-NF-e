import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Notificacao {
  id: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  mensagem: string;
}

interface NotificacaoContextType {
  notificacoes: Notificacao[];
  adicionarNotificacao: (tipo: 'sucesso' | 'erro' | 'aviso' | 'info', mensagem: string) => void;
  removerNotificacao: (id: string) => void;
}

const NotificacaoContext = createContext<NotificacaoContextType | null>(null);

export const useNotificacao = () => {
  const context = useContext(NotificacaoContext);
  if (!context) {
    throw new Error('useNotificacao deve ser usado dentro de um NotificacaoProvider');
  }
  return context;
};

export const NotificacaoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const adicionarNotificacao = useCallback((tipo: 'sucesso' | 'erro' | 'aviso' | 'info', mensagem: string) => {
    const id = uuidv4();
    setNotificacoes(prev => [...prev, { id, tipo, mensagem }]);
  }, []);

  const removerNotificacao = useCallback((id: string) => {
    setNotificacoes(prev => prev.filter(notificacao => notificacao.id !== id));
  }, []);

  return (
    <NotificacaoContext.Provider value={{ notificacoes, adicionarNotificacao, removerNotificacao }}>
      {children}
    </NotificacaoContext.Provider>
  );
};