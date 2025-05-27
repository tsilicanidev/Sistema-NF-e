import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { gerarDanfePDF } from '../services/danfeService';
import { salvarDanfeNoStorage } from '../services/danfeStorage';
import { supabase } from '../services/supabase';
import VisualizarDanfeButton from '../components/VisualizarDanfeButton';

interface NotaFiscal {
  id: string;
  numero: string;
  chave: string;
  destinatario: string;
  valor: number;
  created_at: string; // Changed from data_emissao to created_at
  status: 'autorizada' | 'pendente' | 'rejeitada';
  xml: string;
  protocolo: string;
}

const NotaFiscalVisualizacao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [nota, setNota] = useState<NotaFiscal | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingDanfe, setDownloadingDanfe] = useState(false);

  useEffect(() => {
    const carregarNota = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notas_fiscais')
          .select('*')
          .eq('chave', id)
          .single();
        
        if (error) throw error;
        
        setNota(data);
      } catch (error) {
        console.error('Erro ao carregar nota fiscal:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarNota();
  }, [id]);

  const handleDownloadDANFE = async () => {
    if (!nota?.xml) return;

    try {
      setDownloadingDanfe(true);
      
      // Gerar PDF do DANFE
      const pdfBuffer = await gerarDanfePDF(nota.xml);
      
      // Salvar no Supabase Storage
      await salvarDanfeNoStorage(nota.chave, pdfBuffer);
      
      // Criar blob e download
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `danfe-${nota.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar DANFE:', error);
      alert('Erro ao gerar DANFE: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setDownloadingDanfe(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-neutral-500">Carregando...</div>
      </div>
    );
  }

  if (!nota) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-800">Nota fiscal não encontrada</h2>
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 mt-2 inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar para o dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-800">
            Nota Fiscal #{nota.numero}
          </h1>
        </div>
        <div className="flex gap-2">
          <VisualizarDanfeButton xml={nota.xml} />
          <Button
            variant="outline"
            icon={<Download />}
            onClick={handleDownloadDANFE}
            isLoading={downloadingDanfe}
            loadingText="Baixando..."
          >
            Baixar DANFE
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <FileText className="text-primary-600 w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold text-neutral-800">Detalhes da Nota Fiscal</h2>
              <p className="text-neutral-500 text-sm">Informações completas da NF-e</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Chave de Acesso</h3>
              <p className="text-neutral-800 font-mono">{nota.chave}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Status</h3>
              <p className={`text-neutral-800 capitalize ${
                nota.status === 'autorizada' ? 'text-success-600' : 
                nota.status === 'rejeitada' ? 'text-error-600' : 'text-warning-600'
              }`}>{nota.status}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Destinatário</h3>
              <p className="text-neutral-800">{nota.destinatario}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Valor Total</h3>
              <p className="text-neutral-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valor)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Data de Emissão</h3>
              <p className="text-neutral-800">
                {new Date(nota.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-1">Protocolo de Autorização</h3>
              <p className="text-neutral-800">{nota.protocolo || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotaFiscalVisualizacao;