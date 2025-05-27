import React from 'react';
import { FileText } from 'lucide-react';
import Button from './Button';

interface VisualizarDanfeButtonProps {
  xml: string;
  className?: string;
}

export const VisualizarDanfeButton: React.FC<VisualizarDanfeButtonProps> = ({ xml, className }) => {
  const visualizarDanfe = async () => {
    try {
      const response = await fetch('/api/visualizarDanfe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar DANFE');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar DANFE:', error);
      alert('Erro ao visualizar DANFE: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <Button
      onClick={visualizarDanfe}
      variant="primary"
      icon={<FileText />}
      className={className}
    >
      Visualizar DANFE
    </Button>
  );
};

export default VisualizarDanfeButton;