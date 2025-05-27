import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, Info, AlertCircle } from 'lucide-react';
import { useNotificacao } from '../contexts/NotificacaoContext';

interface NotificacaoProps {
  id: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  mensagem: string;
}

const Notificacao: React.FC<NotificacaoProps> = ({ id, tipo, mensagem }) => {
  const { removerNotificacao } = useNotificacao();

  useEffect(() => {
    const timer = setTimeout(() => {
      removerNotificacao(id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [id, removerNotificacao]);

  const getIcon = () => {
    switch (tipo) {
      case 'sucesso':
        return <CheckCircle className="text-success-500\" size={20} />;
      case 'erro':
        return <AlertCircle className="text-error-500" size={20} />;
      case 'aviso':
        return <AlertTriangle className="text-warning-500" size={20} />;
      case 'info':
        return <Info className="text-primary-500" size={20} />;
      default:
        return <Info className="text-primary-500" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (tipo) {
      case 'sucesso':
        return 'bg-success-50 border-success-500';
      case 'erro':
        return 'bg-error-50 border-error-500';
      case 'aviso':
        return 'bg-warning-50 border-warning-500';
      case 'info':
        return 'bg-primary-50 border-primary-500';
      default:
        return 'bg-primary-50 border-primary-500';
    }
  };

  return (
    <div
      className={`p-4 rounded-md shadow-md border-l-4 flex items-start w-80 ${getBgColor()}`}
      role="alert"
    >
      <div className="mr-3">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm text-neutral-800 font-medium">{mensagem}</p>
      </div>
      <button
        onClick={() => removerNotificacao(id)}
        className="ml-2 text-neutral-500 hover:text-neutral-800"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Notificacao;