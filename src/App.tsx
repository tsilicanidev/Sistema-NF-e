import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🔧 Certifique-se de criar esses arquivos ou comente os imports abaixo se ainda não existirem
import Dashboard from './pages/Dashboard';
import NotaFiscalForm from './pages/NotaFiscalForm';
import NotaFiscalVisualizacao from './pages/NotaFiscalVisualizacao';
import ConfiguracaoEmissor from './pages/ConfiguracaoEmissor';
import Layout from './components/Layout';
import { NotificacaoProvider } from './contexts/NotificacaoContext';
import { CertificadoProvider } from './contexts/CertificadoContext';
import { EmissorProvider } from './contexts/EmissorContext';

function App() {
  return (
    <BrowserRouter>
      <NotificacaoProvider>
        <CertificadoProvider>
          <EmissorProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/notas/nova" element={<NotaFiscalForm />} />
                <Route path="/notas/editar/:id" element={<NotaFiscalForm />} />
                <Route path="/notas/visualizar/:id" element={<NotaFiscalVisualizacao />} />
                <Route path="/configuracoes/emissor" element={<ConfiguracaoEmissor />} />
              </Routes>
            </Layout>
          </EmissorProvider>
        </CertificadoProvider>
      </NotificacaoProvider>
    </BrowserRouter>
  );
}

export default App;
