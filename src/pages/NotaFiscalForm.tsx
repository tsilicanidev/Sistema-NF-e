import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useForm } from 'react-hook-form';
import { Save, Plus, Trash2, FileCheck } from 'lucide-react';
import Button from '../components/Button';
import { useEmissor } from '../contexts/EmissorContext';
import { useCertificado } from '../contexts/CertificadoContext';
import { useNotificacao } from '../contexts/NotificacaoContext';
import { emitirNFe } from '../services/nfeService';
import { gerarChaveNFe, gerarXmlNFe, validarXmlComXSD, type NFe } from '../utils/nfeUtils';
import { useNavigate } from 'react-router-dom';

interface NotaFiscalFormData {
  naturezaOperacao: string;
  tipoOperacao: '0' | '1';
  finalidade: '1' | '2' | '3' | '4';
  destinatario: {
    tipo: 'PF' | 'PJ';
    documento: string;
    nome: string;
    inscricaoEstadual?: string;
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
  informacoesAdicionais?: string;
  formaPagamento: string;
}

const NotaFiscalForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<NotaFiscalFormData>();
  const { emissor } = useEmissor();
  const { certificado } = useCertificado();
  const { adicionarNotificacao } = useNotificacao();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<NotaFiscalFormData['produtos']>([]);

  const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Erro ${response.status}: ${response.statusText}`);
      } catch (e) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    }

    const responseText = await response.text();
    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      return responseText;
    }
  };

  const preencherDadosTeste = () => {
    reset({
      naturezaOperacao: 'VENDA DE MERCADORIA',
      tipoOperacao: '1',
      finalidade: '1',
      destinatario: {
        tipo: 'PF',
        documento: '12345678909',
        nome: 'CLIENTE TESTE',
        isento: true,
        endereco: {
          logradouro: 'RUA TESTE',
          numero: '123',
          bairro: 'CENTRO',
          cep: '01001-000',
          municipio: 'SAO PAULO',
          uf: 'SP'
        }
      },
      formaPagamento: '01',
      informacoesAdicionais: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL'
    });

    setProdutos([{
      codigo: 'PROD001',
      descricao: 'PRODUTO TESTE',
      ncm: '84713019',
      cfop: '5102',
      unidade: 'UN',
      quantidade: 1,
      valorUnitario: 100,
      icms: {
        origem: '0',
        cst: '00',
        aliquota: 18
      }
    }]);

    adicionarNotificacao('sucesso', 'Formulário preenchido com dados de teste');
  };

  const validarXml = async (xml: string) => {
  try {
    const response = await fetch('http://localhost:5173/api/validar-xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
      },
      body: xml,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || 'Erro na validação');
    }

    console.log('XML válido:', result);
    return true;
  } catch (error: any) {
    console.error('Erro ao validar XML:', error.message);
    return false;
  }
};


const onSubmit = async (data: NotaFiscalFormData) => {
    try {
      if (produtos.length === 0) {
        adicionarNotificacao('erro', 'Adicione pelo menos um produto');
        return;
      }

      if (!certificado?.arquivo || !certificado?.senha) {
        adicionarNotificacao('erro', 'Certificado digital não configurado corretamente');
        return;
      }

      if (!emissor) {
        adicionarNotificacao('erro', 'Dados do emissor não configurados');
        return;
      }

      setLoading(true);

      const valorTotal = produtos.reduce((total, produto) => {
        return total + (produto.quantidade * produto.valorUnitario);
      }, 0);

      const numeroNota = Math.floor(Math.random() * 1000000).toString().padStart(9, '0');
      const cNF = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

      const chave = gerarChaveNFe(
        emissor.endereco.uf === 'SP' ? '35' : '11',
        new Date().toISOString().slice(2, 7).replace('-', ''),
        emissor.cnpj.replace(/\D/g, ''),
        '55',
        '1',
        numeroNota,
        '1',
        cNF
      );

      const notaFiscal: NFe = {
        ide: {
          cUF: emissor.endereco.uf === 'SP' ? '35' : '11',
          cNF,
          natOp: data.naturezaOperacao,
          mod: '55',
          serie: '1',
          nNF: numeroNota,
          dhEmi: new Date().toISOString(),
          tpNF: data.tipoOperacao,
          idDest: '1',
          cMunFG: emissor.endereco.codigoMunicipio,
          tpImp: '1',
          tpEmis: '1',
          cDV: chave.slice(-1),
          tpAmb: '2',
          finNFe: data.finalidade,
          indFinal: '1',
          indPres: '1',
          procEmi: '0',
          verProc: '1.0.0'
        },
        emit: {
          CNPJ: emissor.cnpj.replace(/\D/g, ''),
          xNome: emissor.razaoSocial,
          xFant: emissor.nomeFantasia,
          enderEmit: {
            xLgr: emissor.endereco.logradouro,
            nro: emissor.endereco.numero,
            xBairro: emissor.endereco.bairro,
            cMun: emissor.endereco.codigoMunicipio,
            xMun: emissor.endereco.municipio,
            UF: emissor.endereco.uf,
            CEP: emissor.endereco.cep.replace(/\D/g, ''),
            cPais: emissor.endereco.codigoPais,
            xPais: emissor.endereco.pais
          },
          IE: emissor.inscricaoEstadual.replace(/\D/g, ''),
          CRT: emissor.regimeTributario.toString()
        },
        dest: {
          ...(data.destinatario.tipo === 'PF' 
            ? { CPF: data.destinatario.documento.replace(/\D/g, '') }
            : { CNPJ: data.destinatario.documento.replace(/\D/g, '') }
          ),
          xNome: data.destinatario.nome,
          enderDest: {
            xLgr: data.destinatario.endereco.logradouro,
            nro: data.destinatario.endereco.numero,
            xBairro: data.destinatario.endereco.bairro,
            cMun: '3550308', // São Paulo
            xMun: data.destinatario.endereco.municipio,
            UF: data.destinatario.endereco.uf,
            CEP: data.destinatario.endereco.cep.replace(/\D/g, ''),
            cPais: '1058',
            xPais: 'BRASIL'
          },
          indIEDest: data.destinatario.isento ? '2' : '1',
          IE: data.destinatario.isento ? '' : data.destinatario.inscricaoEstadual
        },
        det: produtos.map((prod, i) => ({
          "@_nItem": (i + 1).toString(),
          prod: {
            cProd: prod.codigo,
            cEAN: '',
            xProd: prod.descricao,
            NCM: prod.ncm,
            CFOP: prod.cfop,
            uCom: prod.unidade,
            qCom: prod.quantidade.toString(),
            vUnCom: prod.valorUnitario.toFixed(2),
            vProd: (prod.quantidade * prod.valorUnitario).toFixed(2),
            cEANTrib: '',
            uTrib: prod.unidade,
            qTrib: prod.quantidade.toString(),
            vUnTrib: prod.valorUnitario.toFixed(2),
            indTot: '1'
          },
          imposto: {
            ICMS: {
              ICMS00: {
                orig: prod.icms.origem,
                CST: prod.icms.cst,
                modBC: '3',
                vBC: (prod.quantidade * prod.valorUnitario).toFixed(2),
                pICMS: prod.icms.aliquota?.toFixed(2) || '0',
                vICMS: (((prod.icms.aliquota || 0) / 100) * prod.quantidade * prod.valorUnitario).toFixed(2)
              }
            },
            PIS: {
              PISNT: {
                CST: '07'
              }
            },
            COFINS: {
              COFINSNT: {
                CST: '07'
              }
            }
          }
        })),
        total: {
          ICMSTot: {
            vBC: valorTotal.toFixed(2),
            vICMS: '0.00',
            vICMSDeson: '0.00',
            vBCST: '0.00',
            vST: '0.00',
            vProd: valorTotal.toFixed(2),
            vFrete: '0.00',
            vSeg: '0.00',
            vDesc: '0.00',
            vII: '0.00',
            vIPI: '0.00',
            vPIS: '0.00',
            vCOFINS: '0.00',
            vOutro: '0.00',
            vNF: valorTotal.toFixed(2)
          }
        },
        transp: {
          modFrete: '9'
        },
        pag: {
          detPag: [{
            tPag: data.formaPagamento,
            vPag: valorTotal.toFixed(2)
          }]
        },
        infAdic: data.informacoesAdicionais ? {
          infCpl: data.informacoesAdicionais
        } : undefined
      };

      const xml = gerarXmlNFe(notaFiscal, chave);

      try {
        // Validar XML usando o endpoint completo do Supabase
        const validationResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validar-xml`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: xml,
        });

        const validationResult = await handleApiResponse(validationResponse);
        
        if (!validationResult || validationResult.error) {
          throw new Error(`Erro na validação do XML: ${validationResult?.error || 'XML inválido'}`);
        }

        // Emitir NFe usando o endpoint completo do Supabase
        const nfeResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nfe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            xml,
            certificate: {
              pfxBase64: certificado.arquivo,
              password: certificado.senha
            },
            ambiente: 'homologacao'
          }),
        });

        const resultado = await handleApiResponse(nfeResponse);

        if (resultado.status === 'autorizada') {
          adicionarNotificacao('sucesso', 'NF-e autorizada com sucesso');
          
          // Salvar a nota no banco de dados
          const { error: saveError } = await supabase
            .from('notas_fiscais')
            .insert({
              numero: numeroNota,
              serie: '1',
              chave: chave,
              xml: xml,
              protocolo: resultado.protocolo || '',
              status: 'autorizada',
              destinatario: data.destinatario.nome,
              valor: valorTotal,
            });
            
          if (saveError) {
            console.error('Erro ao salvar nota fiscal:', saveError);
            adicionarNotificacao('aviso', 'NF-e autorizada, mas houve um erro ao salvar no banco de dados');
          }
          
          navigate(`/notas/visualizar/${chave}`);
        } else {
          throw new Error(resultado.mensagem || 'NF-e rejeitada pela SEFAZ');
        }
      } catch (apiError) {
        console.error('Erro na API:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Erro ao emitir NF-e:', error);
      adicionarNotificacao('erro', error instanceof Error ? error.message : 'Erro desconhecido ao emitir NF-e');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduto = () => {
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
        aliquota: 18
      }
    }]);
  };

  const handleRemoveProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Nova Nota Fiscal</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<FileCheck />}
            onClick={preencherDadosTeste}
            type="button"
          >
            Preencher Teste
          </Button>
          <Button
            variant="primary"
            icon={<Save />}
            onClick={handleSubmit(onSubmit)}
            isLoading={loading}
            loadingText="Emitindo..."
          >
            Emitir NF-e
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Dados Gerais */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-800">Dados Gerais</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Natureza da Operação
              </label>
              <input
                type="text"
                {...register('naturezaOperacao', { required: 'Campo obrigatório' })}
                className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              {errors.naturezaOperacao && (
                <p className="mt-1 text-sm text-error-600">{errors.naturezaOperacao.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Tipo de Operação
              </label>
              <select
                {...register('tipoOperacao', { required: 'Campo obrigatório' })}
                className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="1">Saída</option>
                <option value="0">Entrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Finalidade
              </label>
              <select
                {...register('finalidade', { required: 'Campo obrigatório' })}
                className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
            <h2 className="text-lg font-semibold text-neutral-800">Destinatário</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Tipo de Pessoa
                </label>
                <select
                  {...register('destinatario.tipo', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  {watch('destinatario.tipo') === 'PF' ? 'CPF' : 'CNPJ'}
                </label>
                <input
                  type="text"
                  {...register('destinatario.documento', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Nome/Razão Social
                </label>
                <input
                  type="text"
                  {...register('destinatario.nome', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  {...register('destinatario.inscricaoEstadual')}
                  disabled={watch('destinatario.isento')}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-neutral-100"
                />
              </div>

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  {...register('destinatario.isento')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label className="ml-2 block text-sm text-neutral-700">
                  Contribuinte Isento de Inscrição Estadual
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Logradouro
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.logradouro', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Número
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.numero', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Complemento
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.complemento')}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Bairro
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.bairro', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  CEP
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.cep', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Município
                </label>
                <input
                  type="text"
                  {...register('destinatario.endereco.municipio', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  UF
                </label>
                <select
                  {...register('destinatario.endereco.uf', { required: 'Campo obrigatório' })}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
          <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800">Produtos</h2>
            <Button
              variant="primary"
              icon={<Plus />}
              onClick={handleAddProduto}
              type="button"
            >
              Adicionar Produto
            </Button>
          </div>
          <div className="p-6">
            {produtos.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                Nenhum produto adicionado
              </div>
            ) : (
              <div className="space-y-6">
                {produtos.map((produto, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveProduto(index)}
                      className="absolute top-4 right-4 text-error-600 hover:text-error-700"
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Código
                        </label>
                        <input
                          type="text"
                          value={produto.codigo}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].codigo = e.target.value;
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={produto.descricao}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].descricao = e.target.value;
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          NCM
                        </label>
                        <input
                          type="text"
                          value={produto.ncm}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].ncm = e.target.value;
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          CFOP
                        </label>
                        <input
                          type="text"
                          value={produto.cfop}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].cfop = e.target.value;
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Unidade
                        </label>
                        <select
                          value={produto.unidade}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].unidade = e.target.value;
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          <option value="UN">Unidade</option>
                          <option value="KG">Quilograma</option>
                          <option value="L">Litro</option>
                          <option value="M">Metro</option>
                          <option value="CX">Caixa</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          value={produto.quantidade}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].quantidade = Number(e.target.value);
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Valor Unitário
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={produto.valorUnitario}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].valorUnitario = Number(e.target.value);
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Origem
                        </label>
                        <select
                          value={produto.icms.origem}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].icms.origem = e.target.value;
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          <option value="0">0 - Nacional</option>
                          <option value="1">1 - Estrangeira (Importação direta)</option>
                          <option value="2">2 - Estrangeira (Adquirida no mercado interno)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          CST ICMS
                        </label>
                        <select
                          value={produto.icms.cst}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].icms.cst = e.target.value;
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
                          <option value="90">90 - Outros</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700">
                          Alíquota ICMS
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={produto.icms.aliquota}
                          onChange={(e) => {
                            const newProdutos = [...produtos];
                            newProdutos[index].icms.aliquota = Number(e.target.value);
                            setProdutos(newProdutos);
                          }}
                          className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagamento e Informações Adicionais */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-800">Pagamento e Informações Adicionais</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Forma de Pagamento
              </label>
              <select
                {...register('formaPagamento', { required: 'Campo obrigatório' })}
                className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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

            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Informações Adicionais
              </label>
              <textarea
                {...register('informacoesAdicionais')}
                rows={4}
                className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NotaFiscalForm;