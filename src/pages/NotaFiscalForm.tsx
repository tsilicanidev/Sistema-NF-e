import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, User, Package, Calculator, Truck, FileText, AlertCircle } from 'lucide-react';
import Button from '../components/Button';

interface NotaFiscalFormData {
  // Identificação
  naturezaOperacao: string;
  tipoOperacao: '0' | '1';
  finalidade: '1' | '2' | '3' | '4';
  
  // Destinatário
  destinatario: {
    tipo: 'PF' | 'PJ';
    documento: string;
    nome: string;
    inscricaoEstadual: string;
    isento: boolean;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cep: string;
      municipio: string;
      uf: string;
    };
  };
  
  // Produtos
  produtos: Array<{
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    icms: {
      origem: string;
      cst: string;
      aliquota?: number;
    };
  }>;
  
  // Totais
  valorTotal: number;
  
  // Transporte
  transportador?: {
    nome: string;
    documento: string;
    endereco: string;
    municipio: string;
    uf: string;
  };
  
  // Informações Adicionais
  informacoesAdicionais?: string;
  
  // Pagamento
  formaPagamento: string;
}

const NotaFiscalForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<NotaFiscalFormData>();
  const [produtos, setProdutos] = useState<NotaFiscalFormData['produtos']>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: NotaFiscalFormData) => {
    try {
      setLoading(true);
      console.log('Dados da NF-e:', data);
      // Implementar lógica de emissão
    } catch (error) {
      console.error('Erro ao emitir NF-e:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarProduto = () => {
    setProdutos([...produtos, {
      codigo: '',
      descricao: '',
      ncm: '',
      cfop: '',
      unidade: 'UN',
      quantidade: 1,
      valorUnitario: 0,
      icms: {
        origem: '0',
        cst: '00',
      }
    }]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Nova Nota Fiscal</h1>
        <Button
          variant="primary"
          icon={Save}
          onClick={handleSubmit(onSubmit)}
          isLoading={loading}
          loadingText="Emitindo..."
        >
          Emitir NF-e
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <FileText className="text-primary-500" size={24} />
              <h2 className="text-lg font-semibold text-neutral-800">Identificação da NF-e</h2>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Natureza da Operação
              </label>
              <input
                type="text"
                {...register('naturezaOperacao', { required: 'Campo obrigatório' })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Venda de Mercadorias"
              />
              {errors.naturezaOperacao && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.naturezaOperacao.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo de Operação
              </label>
              <select
                {...register('tipoOperacao', { required: 'Campo obrigatório' })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="1">Saída</option>
                <option value="0">Entrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Finalidade
              </label>
              <select
                {...register('finalidade', { required: 'Campo obrigatório' })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="1">Normal</option>
                <option value="2">Complementar</option>
                <option value="3">Ajuste</option>
                <option value="4">Devolução</option>
              </select>
            </div>
          </div>
        </div>

        {/* Destinatário */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <User className="text-primary-500" size={24} />
              <h2 className="text-lg font-semibold text-neutral-800">Dados do Destinatário</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tipo de Pessoa
                </label>
                <select
                  {...register('destinatario.tipo', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PJ">Pessoa Jurídica</option>
                  <option value="PF">Pessoa Física</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {watch('destinatario.tipo') === 'PJ' ? 'CNPJ' : 'CPF'}
                </label>
                <input
                  type="text"
                  {...register('destinatario.documento', { 
                    required: 'Campo obrigatório',
                    pattern: {
                      value: watch('destinatario.tipo') === 'PJ' 
                        ? /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
                        : /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                      message: 'Formato inválido'
                    }
                  })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={watch('destinatario.tipo') === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                />
                {errors.destinatario?.documento && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.destinatario.documento.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  {...register('destinatario.nome', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.destinatario?.nome && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.destinatario.nome.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  {...register('destinatario.inscricaoEstadual')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={watch('destinatario.isento')}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  {...register('destinatario.isento')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label className="text-sm text-neutral-700">
                  Contribuinte Isento de Inscrição Estadual
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.logradouro', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.numero', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.complemento')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.bairro', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.cep', { 
                    required: 'Campo obrigatório',
                    pattern: {
                      value: /^\d{5}-\d{3}$/,
                      message: 'Formato inválido (00000-000)'
                    }
                  })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Município
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.municipio', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  UF
                </label>
                <select
                  {...register('destinatario.endereco.uf', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione...</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AM">AM</option>
                  <option value="AP">AP</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MG">MG</option>
                  <option value="MS">MS</option>
                  <option value="MT">MT</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="PR">PR</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="RS">RS</option>
                  <option value="SC">SC</option>
                  <option value="SE">SE</option>
                  <option value="SP">SP</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="text-primary-500" size={24} />
                <h2 className="text-lg font-semibold text-neutral-800">Produtos</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={adicionarProduto}
                type="button"
              >
                Adicionar Produto
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            {produtos.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Package className="mx-auto mb-2 text-neutral-400" size={32} />
                <p>Nenhum produto adicionado</p>
                <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
              </div>
            ) : (
              <div className="space-y-6">
                {produtos.map((produto, index) => (
                  <div key={index} className="border border-neutral-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Código
                        </label>
                        <input
                          type="text"
                          {...register(`produtos.${index}.codigo` as const, { required: true })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Descrição
                        </label>
                        <input
                          type="text"
                          {...register(`produtos.${index}.descricao` as const, { required: true })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          NCM
                        </label>
                        <input
                          type="text"
                          {...register(`produtos.${index}.ncm` as const, { required: true })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          CFOP
                        </label>
                        <input
                          type="text"
                          {...register(`produtos.${index}.cfop` as const, { required: true })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Unidade
                        </label>
                        <select
                          {...register(`produtos.${index}.unidade` as const, { required: true })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="UN">Unidade</option>
                          <option value="KG">Quilograma</option>
                          <option value="MT">Metro</option>
                          <option value="CX">Caixa</option>
                          <option value="PC">Peça</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`produtos.${index}.quantidade` as const, { 
                            required: true,
                            min: 0.01
                          })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Valor Unitário
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`produtos.${index}.valorUnitario` as const, {
                            required: true,
                            min: 0.01
                          })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Origem
                        </label>
                        <select
                          {...register(`produtos.${index}.icms.origem` as const, { required: true })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="0">0 - Nacional</option>
                          <option value="1">1 - Estrangeira (Importação direta)</option>
                          <option value="2">2 - Estrangeira (Adquirida no mercado interno)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          CST ICMS
                        </label>
                        <select
                          {...register(`produtos.${index}.icms.cst` as const, { required: true })}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="00">00 - Tributada integralmente</option>
                          <option value="10">10 - Tributada com cobrança de ICMS por ST</option>
                          <option value="20">20 - Com redução de base de cálculo</option>
                          <option value="30">30 - Isenta ou não tributada com cobrança de ICMS por ST</option>
                          <option value="40">40 - Isenta</option>
                          <option value="41">41 - Não tributada</option>
                          <option value="50">50 - Suspensão</option>
                          <option value="51">51 - Diferimento</option>
                          <option value="60">60 - ICMS cobrado anteriormente por ST</option>
                          <option value="70">70 - Com redução de base de cálculo e cobrança de ICMS por ST</option>
                          <option value="90">90 - Outros</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Alíquota ICMS
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...register(`produtos.${index}.icms.aliquota` as const)}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transporte */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <Truck className="text-primary-500" size={24} />
              <h2 className="text-lg font-semibold text-neutral-800">Dados do Transporte</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nome do Transportador
                </label>
                <input
                  type="text"
                  {...register('transportador.nome')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  CNPJ/CPF
                </label>
                <input
                  type="text"
                  {...register('transportador.documento')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  {...register('transportador.endereco')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Município
                </label>
                <input
                  type="text"
                  {...register('transportador.municipio')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                UF
              </label>
              <select
                {...register('transportador.uf')}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione...</option>
                <option value="AC">AC</option>
                <option value="AL">AL</option>
                <option value="AM">AM</option>
                <option value="AP">AP</option>
                <option value="BA">BA</option>
                <option value="CE">CE</option>
                <option value="DF">DF</option>
                <option value="ES">ES</option>
                <option value="GO">GO</option>
                <option value="MA">MA</option>
                <option value="MG">MG</option>
                <option value="MS">MS</option>
                <option value="MT">MT</option>
                <option value="PA">PA</option>
                <option value="PB">PB</option>
                <option value="PE">PE</option>
                <option value="PI">PI</option>
                <option value="PR">PR</option>
                <option value="RJ">RJ</option>
                <option value="RN">RN</option>
                <option value="RO">RO</option>
                <option value="RR">RR</option>
                <option value="RS">RS</option>
                <option value="SC">SC</option>
                <option value="SE">SE</option>
                <option value="SP">SP</option>
                <option value="TO">TO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pagamento e Informações Adicionais */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <Calculator className="text-primary-500" size={24} />
              <h2 className="text-lg font-semibold text-neutral-800">Pagamento e Informações Adicionais</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  {...register('formaPagamento', { required: 'Campo obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  
                  <option value="01">Dinheiro</option>
                  <option value="02">Cheque</option>
                  <option value="03">Cartão de Crédito</option>
                  <option value="04">Cartão de Débito</option>
                  <option value="05">Crédito Loja</option>
                  <option value="10">Vale Alimentação</option>
                  <option value="11">Vale Refeição</option>
                  <option value="12">Vale Presente</option>
                  <option value="13">Vale Combustível</option>
                  <option value="14">Duplicata Mercantil</option>
                  <option value="15">Boleto Bancário</option>
                  <option value="90">Sem Pagamento</option>
                  <option value="99">Outros</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Informações Adicionais
              </label>
              <textarea
                {...register('informacoesAdicionais')}
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Informações complementares da NF-e"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NotaFiscalForm;