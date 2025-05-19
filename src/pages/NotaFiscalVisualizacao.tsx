import React from 'react';
import { useParams } from 'react-router-dom';

const NotaFiscalVisualizacao: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Visualização da Nota Fiscal</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">ID da Nota Fiscal: {id}</p>
        {/* Additional visualization content will be added here */}
      </div>
    </div>
  );
};

import { VisualizarDanfeButton } from '@/components/VisualizarDanfeButton';

// Exemplo de XML fixo para teste (substitua por XML real se necessário)
const exemploXml = `<NFe xmlns=\"http://www.portalfiscal.inf.br/nfe\"><infNFe versao=\"4.00\" Id=\"NFe00000000000000000000000000000000000000000000\"></infNFe></NFe>`;

function NotaFiscalVisualizacao() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Visualização da Nota Fiscal</h1>
      <VisualizarDanfeButton xml={exemploXml} />
    </div>
  );
}

export default NotaFiscalVisualizacao;