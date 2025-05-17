import React, { useState } from 'react';
import { Key, Plus, Check, X, Edit2, CalendarClock, AlertCircle } from 'lucide-react';
import { useCertificado, Certificado } from '../contexts/CertificadoContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Certificados: React.FC = () => {
  const { certificados, certificadoAtivo, carregando, adicionarCertificado, removerCertificado, selecionarCertificadoAtivo } = useCertificado();
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroCertificado, setErroCertificado] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.pfx')) {
        setArquivo(file);
        setErroCertificado('');
      } else {
        setArquivo(null);
        setErroCertificado('O arquivo deve ser do tipo .pfx');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!arquivo) {
      setErroCertificado('Selecione um arquivo de certificado');
      return;
    }
    
    if (!nome) {
      setErroCertificado('Informe um nome para o certificado');
      return;
    }
    
    if (!senha) {
      setErroCertificado('Informe a senha do certificado');
      return;
    }
    
    // Converte o arquivo para base64
    const reader = new FileReader();
    reader.readAsDataURL(arquivo);
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(',')[1] || '';
      
      try {
        // Em uma aplicação real, você verificaria a validade do certificado aqui
        // e obteria a data de validade a partir do próprio certificado
        const dataAtual = new Date();
        const dataValidade = new Date();
        dataValidade.setFullYear(dataAtual.getFullYear() + 1); // Simulando um certificado válido por 1 ano
        
        await adicionarCertificado({
          nome,
          arquivo: base64,
          senha,
          validade: dataValidade,
          ativo: certificados.length === 0 // Ativa automaticamente se for o primeiro certificado
        });
        
        // Limpa o formulário e fecha o modal
        setNome('');
        setSenha('');
        setArquivo(null);
        setShowModal(false);
      } catch (error) {
        console.error('Erro ao adicionar certificado:', error);
        setErroCertificado('Erro ao processar o certificado');
      }
    };
  };

  const isExpired = (validade: Date) => {
    return new Date() > validade;
  };

  const getExpirationColor = (validade: Date) => {
    if (isExpired(validade)) {
      return 'text-error-600';
    }
    
    const hoje = new Date();
    const diasRestantes = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes <= 30) {
      return 'text-warning-600';
    }
    
    return 'text-success-600';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Certificados Digitais</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={18} />
          <span>Adicionar Certificado</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-800">Certificados Cadastrados</h2>
          <p className="text-neutral-500 mt-1">Gerencie seus certificados digitais para assinatura de NF-e</p>
        </div>

        {carregando ? (
          <div className="p-8 text-center text-neutral-500">Carregando...</div>
        ) : certificados.length > 0 ? (
          <ul className="divide-y divide-neutral-200">
            {certificados.map((certificado) => (
              <li key={certificado.id} className="p-6 hover:bg-neutral-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${certificado.ativo ? 'bg-primary-50' : 'bg-neutral-100'}`}>
                      <Key className={certificado.ativo ? 'text-primary-500' : 'text-neutral-400'} size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800 flex items-center">
                        {certificado.nome}
                        {certificado.ativo && (
                          <span className="ml-2 text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full font-medium">
                            Ativo
                          </span>
                        )}
                      </h3>

                      <div className="mt-2 flex items-center text-sm">
                        <CalendarClock size={16} className={getExpirationColor(certificado.validade)} />
                        <span className={`ml-1 ${getExpirationColor(certificado.validade)}`}>
                          {isExpired(certificado.validade)
                            ? 'Expirado em '
                            : 'Válido até '}
                          {format(certificado.validade, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!certificado.ativo && (
                      <button
                        onClick={() => selecionarCertificadoAtivo(certificado.id)}
                        className="text-primary-600 hover:text-primary-800 p-2 rounded-md hover:bg-primary-50 transition-colors"
                        title="Definir como ativo"
                        disabled={isExpired(certificado.validade)}
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => removerCertificado(certificado.id)}
                      className="text-error-600 hover:text-error-800 p-2 rounded-md hover:bg-error-50 transition-colors"
                      title="Remover certificado"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Key className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-neutral-800 font-medium mb-1">Nenhum certificado encontrado</h3>
            <p className="text-neutral-500">
              Adicione seu primeiro certificado digital para começar a emitir NF-e
            </p>
          </div>
        )}
      </div>

      {/* Modal de adição de certificado */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-800">Adicionar Certificado Digital</h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-neutral-700 mb-1">
                    Nome do Certificado
                  </label>
                  <input
                    type="text"
                    id="nome"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Certificado Empresa XYZ"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="certificado" className="block text-sm font-medium text-neutral-700 mb-1">
                    Arquivo do Certificado (.pfx)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Key className="mx-auto h-12 w-12 text-neutral-400" />
                      <div className="flex text-sm text-neutral-600">
                        <label
                          htmlFor="certificado"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                        >
                          <span>Selecione o arquivo</span>
                          <input
                            id="certificado"
                            name="certificado"
                            type="file"
                            className="sr-only"
                            accept=".pfx"
                            onChange={handleFileChange}
                            required
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Apenas arquivos .pfx
                      </p>
                      {arquivo && (
                        <p className="text-sm text-success-600">
                          {arquivo.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-neutral-700 mb-1">
                    Senha do Certificado
                  </label>
                  <input
                    type="password"
                    id="senha"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Digite a senha do certificado"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
                
                {erroCertificado && (
                  <div className="text-error-600 flex items-center text-sm">
                    <AlertCircle size={16} className="mr-1" />
                    {erroCertificado}
                  </div>
                )}
              </div>
              
              <div className="bg-neutral-50 px-6 py-4 flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificados;