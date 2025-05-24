import React from 'react';

interface VisualizarDanfeButtonProps {
  xml: string;
}

export const VisualizarDanfeButton: React.FC<VisualizarDanfeButtonProps> = ({ xml }) => {
  const visualizarDanfe = async () => {
    try {
      const response = await fetch('/api/visualizarDanfe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml })
      });

      if (!response.ok) {
        console.error('Erro ao gerar DANFE');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar DANFE:', error);
    }
  };

  return (
    <button
      onClick={visualizarDanfe}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      Visualizar DANFE
    </button>
  );
};
