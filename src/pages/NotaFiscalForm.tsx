import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, User, Package, Calculator, Truck, FileText, AlertCircle, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import { useEmissor } from '../contexts/EmissorContext';
import { useCertificado } from '../contexts/CertificadoContext';
import { useNotificacao } from '../contexts/NotificacaoContext';
import { emitirNotaFiscal } from '../services/emitirNotaFiscal';
import { gerarDanfePDF } from '../services/danfeService';
import { useNavigate } from 'react-router-dom';
import { gerarXmlNFe, gerarChaveNFe } from '../utils/nfeUtils';

interface NotaFiscalFormData {
  naturezaOperacao: string;
  tipoOperacao: '0' | '1';
  finalidade: '1' | '2' | '3' | '4';
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
  valorTotal: number;
  transportador?: {
    nome: string;
    documento: string;
    endereco: string;
    municipio: string;
    uf: string;
  };
  informacoesAdicionais?: string;
  formaPagamento: string;
}

const NotaFiscalForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<NotaFiscalFormData>();
  const [produtos, setProdutos] = useState<NotaFiscalFormData['produtos']>([]);
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const { emissor } = useEmissor();
  const { certificado } = useCertificado();
  const { adicionarNotificacao } = useNotificacao();
  const navigate = useNavigate();

  useEffect(() => {
    if (!emissor) {
      adicionarNotificacao('erro', 'Dados do emissor não encontrados. Configure o emissor antes de emitir notas fiscais.');
      navigate('/configuracoes/emissor');
      return;
    }
    if (!certificado) {
      adicionarNotificacao('erro', 'Certificado digital não encontrado. Configure um certificado antes de emitir notas fiscais.');
      navigate('/certificados');
      return;
    }
  }, [emissor, certificado, adicionarNotificacao, navigate]);

  const chave = gerarChaveNFe(
  emissor.endereco.codigoUF,
  new Date().toISOString().slice(2, 7).replace('-', ''),
  emissor.cnpj,
  '55',
  '1',
  notaFiscal.numero.padStart(9, '0'),
  '1',
  Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
);

const xml = gerarXmlNFe({ ...notaFiscal, emit: emissor }, chave);

const resultado = await emitirNotaFiscal(xml, {
  pfxBase64: certificado.arquivo,
  password: certificado.senha
});

      const valorTotal = produtos.reduce((total, produto) => {
        return total + (produto.quantidade * produto.valorUnitario);
      }, 0);

      const notaFiscal = {
        numero: Math.floor(Math.random() * 1000000).toString(),
        serie: '1',
        naturezaOperacao: data.naturezaOperacao,
        dataEmissao: new Date(),
        tipoOperacao: data.tipoOperacao,
        finalidade: data.finalidade,
        destinatario: data.destinatario,
        produtos: produtos,
        valorTotal,
        formaPagamento: data.formaPagamento,
        informacoesAdicionais: data.informacoesAdicionais
      };

      const resultado = await emitirNFe(notaFiscal, {
        pfxBase64: certificado.arquivo,
        password: certificado.senha
      });

      if (resultado.status === 'autorizada') {
        adicionarNotificacao('sucesso', 'NF-e emitida com sucesso');
        navigate(`/notas/visualizar/${resultado.chave}`);
      } else {
        throw new Error(resultado.mensagem || 'Erro ao emitir NF-e');
      }
    } catch (error) {
      console.error('Erro ao emitir NF-e:', error);
      adicionarNotificacao('erro', error instanceof Error ? error.message : 'Erro ao emitir NF-e');
    } finally {
      setLoading(false);
    }
  };

  if (!emissor || !certificado) {
    return null;
  }

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
    setAttemptedSubmit(false);
  };

  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const atualizarProduto = (index: number, campo: string, valor: any) => {
    const novosProdutos = [...produtos];
    novosProdutos[index] = {
      ...novosProdutos[index],
      [campo]: valor
    };
    setProdutos(novosProdutos);
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
          disabled={loading || produtos.length === 0}
        >
          Emitir NF-e
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-800">Identificação</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Natureza da Operação
              </label>
              <input
                type="text"
                {...register('naturezaOperacao', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Ex: Venda de mercadoria"
              />
              {errors.naturezaOperacao && (
                <p className="mt-1 text-sm text-error-600">{errors.naturezaOperacao.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo de Operação
              </label>
              <select
                {...register('tipoOperacao', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-800">Destinatário</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo de Pessoa
              </label>
              <select
                {...register('destinatario.tipo', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                CPF/CNPJ
              </label>
              <input
                type="text"
                {...register('destinatario.documento', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Digite o CPF ou CNPJ"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Nome/Razão Social
              </label>
              <input
                type="text"
                {...register('destinatario.nome', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Nome completo ou Razão Social"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Inscrição Estadual
              </label>
              <input
                type="text"
                {...register('destinatario.inscricaoEstadual')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Inscrição Estadual (se houver)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('destinatario.isento')}
                className="h-4 w-4 text-primary-600 border-neutral-300 rounded"
              />
              <label className="ml-2 block text-sm text-neutral-700">
                Contribuinte isento de Inscrição Estadual
              </label>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Logradouro
              </label>
              <input
                type="text"
                {...register('destinatario.endereco.logradouro', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Número
              </label>
              <input
                type="text"
                {...register('destinatario.endereco.numero', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Número"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Complemento
              </label>
              <input
                type="text"
                {...register('destinatario.endereco.complemento')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Complemento (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                {...register('destinatario.endereco.bairro', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Bairro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                {...register('destinatario.endereco.cep', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="00000-000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Município
              </label>
              <input
                type="text"
                {...register('destinatario.endereco.municipio', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                placeholder="Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                UF
              </label>
              <select
                {...register('destinatario.endereco.uf', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="">Selecione...</option>
                <option value="AC">AC</option>
                <option value="AL">AL</option>
                <option value="AP">AP</option>
                <option value="AM">AM</option>
                <option value="BA">BA</option>
                <option value="CE">CE</option>
                <option value="DF">DF</option>
                <option value="ES">ES</option>
                <option value="GO">GO</option>
                <option value="MA">MA</option>
                <option value="MT">MT</option>
                <option value="MS">MS</option>
                <option value="MG">MG</option>
                <option value="PA">PA</option>
                <option value="PB">PB</option>
                <option value="PR">PR</option>
                <option value="PE">PE</option>
                <option value="PI">PI</option>
                <option value="RJ">RJ</option>
                <option value="RN">RN</option>
                <option value="RS">RS</option>
                <option value="RO">RO</option>
                <option value="RR">RR</option>
                <option value="SC">SC</option>
                <option value="SP">SP</option>
                <option value="SE">SE</option>
                <option value="TO">TO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Produtos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-neutral-500" />
              <h2 className="text-lg font-semibold text-neutral-800">Produtos</h2>
            </div>
            <Button
              variant="secondary"
              onClick={() => adicionarProduto()}
              type="button"
            >
              Adicionar Produto
            </Button>
          </div>

          {attemptedSubmit && produtos.length === 0 && (
            <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-md flex items-center gap-2 text-error-700">
              <AlertCircle className="h-5 w-5" />
              <span>Adicione pelo menos um produto antes de emitir a NF-e</span>
            </div>
          )}

          {produtos.map((produto, index) => (
            <div key={index} className="border-b border-neutral-200 py-4 last:border-0">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-neutral-800 font-medium">Produto {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removerProduto(index)}
                  className="text-error-600 hover:text-error-700"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={produto.codigo}
                    onChange={(e) => atualizarProduto(index, 'codigo', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    placeholder="Código do produto"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={produto.descricao}
                    onChange={(e) => atualizarProduto(index, 'descricao', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    placeholder="Descrição do produto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    NCM
                  </label>
                  <input
                    type="text"
                    value={produto.ncm}
                    onChange={(e) => atualizarProduto(index, 'ncm', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    placeholder="Código NCM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    CFOP
                  </label>
                  <input
                    type="text"
                    value={produto.cfop}
                    onChange={(e) => atualizarProduto(index, 'cfop', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    placeholder="Código CFOP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Unidade
                  </label>
                  <select
                    value={produto.unidade}
                    onChange={(e) => atualizarProduto(index, 'unidade', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  >
                    <option value="UN">Unidade</option>
                    <option value="KG">Quilograma</option>
                    <option value="L">Litro</option>
                    <option value="M">Metro</option>
                    <option value="CX">Caixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={produto.quantidade}
                    onChange={(e) => atualizarProduto(index, 'quantidade', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    min="1"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Valor Unitário
                  </label>
                  <input
                    type="number"
                    value={produto.valorUnitario}
                    onChange={(e) => atualizarProduto(index, 'valorUnitario', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Valor Total
                  </label>
                  <input
                    type="text"
                    value={`R$ ${(produto.quantidade * produto.valorUnitario).toFixed(2)}`}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
                    disabled
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Origem
                  </label>
                  <select
                    value={produto.icms.origem}
                    onChange={(e) => atualizarProduto(index, 'icms', { ...produto.icms, origem: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
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
                    value={produto.icms.cst}
                    onChange={(e) => atualizarProduto(index, 'icms', { ...produto.icms, cst: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  >
                    <option value="00">00 - Tributada integralmente</option>
                    <option value="10">10 - Tributada com cobrança de ICMS por substituição tributária</option>
                    <option value="20">20 - Com redução de base de cálculo</option>
                    <option value="30">30 - Isenta ou não tributada com cobrança de ICMS por substituição tributária</option>
                    <option value="40">40 - Isenta</option>
                    <option value="41">41 - Não tributada</option>
                    <option value="50">50 - Suspensão</option>
                    <option value="51">51 - Diferimento</option>
                    <option value="60">60 - ICMS cobrado anteriormente por substituição tributária</option>
                    <option value="70">70 - Com redução de base de cálculo e cobrança de ICMS por substituição tributária</option>
                    <option value="90">90 - Outras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Alíquota ICMS
                  </label>
                  <input
                    type="number"
                    value={produto.icms.aliquota || 0}
                    onChange={(e) => atualizarProduto(index, 'icms', { ...produto.icms, aliquota: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totais */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-800">Totais</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Valor Total dos Produtos
              </label>
              <input
                type="text"
                value={`R$ ${produtos.reduce((total, produto) => total + (produto.quantidade * produto.valorUnitario), 0).toFixed(2)}`}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                {...register('formaPagamento', { required: 'Campo obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="01">Dinheiro</option>
                <option value="02">Cheque</option>
                <option value="03">Cartão de Crédito</option>
                <option value="04">Cartão de Débito</option>
                <option value="05">Crédito Loja</option>
                <option value="15">Boleto Bancário</option>
                <option value="90">Sem Pagamento</option>
                <option value="99">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-800">Informações Adicionais</h2>
          </div>

          <div>
            <textarea
              {...register('informacoesAdicionais')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              rows={4}
              placeholder="Informações complementares da NF-e"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default NotaFiscalForm;