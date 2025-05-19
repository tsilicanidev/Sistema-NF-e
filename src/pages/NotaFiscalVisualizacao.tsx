
import React from 'react';
import { VisualizarDanfeButton } from '@/components/VisualizarDanfeButton';

const exemploXml = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe versao="4.00" Id="NFe00000000000000000000000000000000000000000000"></infNFe></NFe>`;

const NotaFiscalVisualizacao: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Visualização da Nota Fiscal</h1>
      <VisualizarDanfeButton xml={exemploXml} />
    </div>
  );
};

export default NotaFiscalVisualizacao;
