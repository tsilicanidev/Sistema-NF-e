import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, XCircle, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { supabase } from '../services/supabase';

interface NotaFiscal {
  id: string;
  numero: string;
  chave: string;
  destinatario: string;
  valor: number;
  created_at: string;
  status: 'autorizada' | 'pendente' | 'rejeitada';
}

function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const stats = {
    autorizadas: notasFiscais.filter(nf => nf.status === 'autorizada').length,
    pendentes: notasFiscais.filter(nf => nf.status === 'pendente').length,
    rejeitadas: notasFiscais.filter(nf => nf.status === 'rejeitada').length
  };

  useEffect(() => {
    async function carregarNotas() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notas_fiscais')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setNotasFiscais(data || []);
      } catch (error) {
        console.error('Erro ao carregar notas fiscais:', error);
      } finally {
        setLoading(false);
      }
    }
    
    carregarNotas();
  }, []);

  const getStatusColor = (status: NotaFiscal['status']) => {
    switch (status) {
      case 'autorizada':
        return 'text-success-600 bg-success-50';
      case 'pendente':
        return 'text-warning-600 bg-warning-50';
      case 'rejeitada':
        return 'text-error-600 bg-error-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  const getStatusIcon = (status: NotaFiscal['status']) => {
    switch (status) {
      case 'autorizada':
        return <CheckCircle className="w-4 h-4" />;
      case 'pendente':
        return <Clock className="w-4 h-4" />;
      case 'rejeitada':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredNotas = notasFiscais.filter(nota => 
    nota.numero?.includes(searchTerm) || 
    nota.destinatario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nota.chave?.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
        <Link to="/notas/nova">
          <Button variant="primary" icon={<Plus />}>
            Nova NF-e
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-success-500">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-success-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Notas Autorizadas</p>
              <p className="text-2xl font-bold text-neutral-800">{stats.autorizadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-warning-500">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-warning-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Notas Pendentes</p>
              <p className="text-2xl font-bold text-neutral-800">{stats.pendentes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-error-500">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-error-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Notas Rejeitadas</p>
              <p className="text-2xl font-bold text-neutral-800">{stats.rejeitadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-800">Notas Fiscais</h2>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número, destinatário ou chave..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              <p className="mt-2 text-neutral-600">Carregando notas fiscais...</p>
            </div>
          ) : filteredNotas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Número</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Destinatário</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotas.map((nota) => (
                    <tr key={nota.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-4 px-4 text-sm text-neutral-800">{nota.numero}</td>
                      <td className="py-4 px-4 text-sm text-neutral-800">{nota.destinatario}</td>
                      <td className="py-4 px-4 text-sm text-neutral-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valor)}
                      </td>
                      <td className="py-4 px-4 text-sm text-neutral-800">
                        {new Date(nota.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(nota.status)}`}>
                          {getStatusIcon(nota.status)}
                          <span className="ml-1 capitalize">{nota.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/notas/visualizar/${nota.chave}`}
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Visualizar
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              {searchTerm ? 'Nenhuma nota fiscal encontrada para a busca.' : 'Nenhuma nota fiscal emitida ainda.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;