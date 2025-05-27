import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FileText, Home, Settings, FileCheck } from 'lucide-react';
import { useNotificacao } from '../contexts/NotificacaoContext';
import Notificacao from './Notificacao';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { notificacoes } = useNotificacao();

  const menuItems = [
    { path: '/dashboard', icon: <Home size={20} />, text: 'Dashboard' },
    { path: '/notas/nova', icon: <FileText size={20} />, text: 'Nova NF-e' },
    { path: '/configuracoes/emissor', icon: <Settings size={20} />, text: 'Configurações' },
  ];

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 bg-primary-800 text-white flex-col">
        <div className="p-4 border-b border-primary-700">
          <div className="flex items-center space-x-2">
            <FileCheck size={24} />
            <h1 className="text-xl font-bold">Sistema NF-e</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-100 hover:bg-primary-700'
              }`}
            >
              {item.icon}
              <span>{item.text}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-700 text-xs text-primary-300">
          <p>Sistema NF-e v0.1.0</p>
          <p>© 2025 Todos os direitos reservados</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-primary-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck size={20} />
            <h1 className="text-lg font-bold">Sistema NF-e</h1>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        {/* Notifications */}
        <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-50">
          {notificacoes.map((notificacao) => (
            <Notificacao 
              key={notificacao.id} 
              id={notificacao.id}
              tipo={notificacao.tipo} 
              mensagem={notificacao.mensagem} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;