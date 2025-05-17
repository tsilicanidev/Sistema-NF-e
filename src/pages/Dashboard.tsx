import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FilePlus, FileText, FileWarning, Check, Clock, X, Search } from 'lucide-react';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotaFiscal {
  id: string;
  numero: string;
  chave: string;
  destinatario: string;
  valor: number;
  status: 'pendente' | 'autorizada' | 'rejeitada' | 'cancelada';
  data_emissao: string;
}

const Dashboard: React.FC = () => {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [filtro, setFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarNotas() {
      try {
        setErro(null);
        const { data, error } = await supabase
          .from('notas_fiscais')
          .select('*')
          .order('data_emissao', { ascending: false })
          .limit(20);

        if (error) throw error;
        setNotas(data || []);
      } catch (error) {
        console.error('Erro ao carregar notas fiscais:', error);
        setErro('Não foi possível carregar as notas fiscais. Por favor, verifique sua conexão e tente novamente.');
      } finally {
        setCarregando(false);
      }
    }

    carregarNotas();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'autorizada':
        return <Check className="text-success-500" size={20} />;
      case 'pendente':
        return <Clock className="text-warning-500" size={20} />;
      case 'rejeitada':
        return <X className="text-error-500" size={20} />;
      case 'cancelada':
        return <FileWarning className="text-neutral-500" size={20} />;
      default:
        return <Clock className="text-warning-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'autorizada':
        return 'bg-success-50 text-success-700 border-success-200';
      case 'pendente':
        return 'bg-warning-50 text-warning-700 border-warning-200';
      case 'rejeitada':
        return 'bg-error-50 text-error-700 border-error-200';
      case 'cancelada':
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      default:
        return 'bg-warning-50 text-warning-700 border-warning-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'autorizada':
        return 'Autorizada';
      case 'pendente':
        return 'Pendente';
      case 'rejeitada':
        return 'Rejeitada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Pendente';
    }
  };

  const notasFiltradas = notas.filter(nota => 
    nota.numero.includes(filtro) || 
    nota.destinatario.toLowerCase().includes(filtro.toLowerCase()) ||
    nota.chave.includes(filtro)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
        <Link
          to="/notas/nova"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <FilePlus size={18} />
          <span>Nova NF-e</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-success-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Notas Autorizadas</p>
              <p className="text-2xl font-bold text-neutral-800 mt-2">
                {notas.filter(n => n.status === 'autorizada').length}
              </p>
            </div>
            <div className="p-3 bg-success-50 rounded-full">
              <Check className="text-success-500" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-warning-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Notas Pendentes</p>
              <p className="text-2xl font-bold text-neutral-800 mt-2">
                {notas.filter(n => n.status === 'pendente').length}
              </p>
            </div>
            <div className="p-3 bg-warning-50 rounded-full">
              <Clock className="text-warning-500" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-error-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-neutral-500 text-sm">Notas Rejeitadas</p>
              <p className="text-2xl font-bold text-neutral-800 mt-2">
                {notas.filter(n => n.status === 'rejeitada').length}
              </p>
            </div>
            <div className="p-3 bg-error-50 rounded-full">
              <X className="text-error-500" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800">Últimas Notas Fiscais</h2>
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Buscar por número, destinatário ou chave..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {erro ? (
            <div className="p-8 text-center text-error-600 bg-error-50">
              <FileWarning className="mx-auto mb-2" size={24} />
              {erro}
            </div>
          ) : carregando ? (
            <div className="p-8 text-center text-neutral-500">Carregando...</div>
          ) : notasFiltradas.length > 0 ? (
            <table className="w-full">
              <thead className="bg-neutral-50 text-neutral-600 text-sm">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Número</th>
                  <th className="py-3 px-4 text-left font-medium">Destinatário</th>
                  <th className="py-3 px-4 text-left font-medium">Valor</th>
                  <th className="py-3 px-4 text-left font-medium">Data</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {notasFiltradas.map((nota) => (
                  <tr key={nota.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 text-neutral-800 font-medium">{nota.numero}</td>
                    <td className="py-3 px-4 text-neutral-600">{nota.destinatario}</td>
                    <td className="py-3 px-4 text-neutral-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valor)}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {format(new Date(nota.data_emissao), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {getStatusIcon(nota.status)}
                        <span className={`ml-2 text-sm px-2 py-1 rounded-full border ${getStatusBadge(nota.status)}`}>
                          {getStatusText(nota.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/notas/visualizar/${nota.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium inline-flex items-center"
                      >
                        <span>Visualizar</span>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-neutral-500">
              {filtro ? 'Nenhuma nota fiscal encontrada com o filtro aplicado.' : 'Nenhuma nota fiscal emitida ainda.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;