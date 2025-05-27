import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Building, AlertCircle } from 'lucide-react';
import { useEmissor, Emissor } from '../contexts/EmissorContext';
import { useNotificacao } from '../contexts/NotificacaoContext';
import { supabase } from '../services/supabase';
import Button from '../components/Button';

const ConfiguracaoEmissor: React.FC = () => {
  const { emissor, carregando } = useEmissor();
  const { adicionarNotificacao } = useNotificacao();
  const [salvando, setSalvando] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Emissor>();
  
  React.useEffect(() => {
    if (emissor) {
      reset(emissor);
    }
  }, [emissor, reset]);
  
  const onSubmit = async (data: Emissor) => {
    try {
      setSalvando(true);
      
      const { error } = await supabase
        .from('emissor')
        .upsert([data], { onConflict: 'id' });
      
      if (error) throw error;
      
      adicionarNotificacao('sucesso', 'Dados do emissor salvos com sucesso');
    } catch (error) {
      console.error('Erro ao salvar dados do emissor:', error);
      adicionarNotificacao('erro', 'Erro ao salvar dados do emissor');
    } finally {
      setSalvando(false);
    }
  };
  
  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-neutral-500">Carregando...</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Configuração do Emissor</h1>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={salvando}
          variant="primary"
          icon={<Save />}
          isLoading={salvando}
          loadingText="Salvando..."
        >
          Salvar
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <Building className="text-primary-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-neutral-800">Dados do Emissor</h2>
              <p className="text-neutral-500 mt-1">Informações da empresa emitente das NF-e</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  {...register('razaoSocial', { required: 'Razão social é obrigatória' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Razão Social da Empresa"
                />
                {errors.razaoSocial && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.razaoSocial.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  {...register('nomeFantasia', { required: 'Nome fantasia é obrigatório' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nome Fantasia da Empresa"
                />
                {errors.nomeFantasia && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.nomeFantasia.message}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  {...register('cnpj', { 
                    required: 'CNPJ é obrigatório',
                    pattern: {
                      value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                      message: 'CNPJ inválido. Use o formato: XX.XXX.XXX/XXXX-XX'
                    }
                  })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="XX.XXX.XXX/XXXX-XX"
                />
                {errors.cnpj && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.cnpj.message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  {...register('inscricaoEstadual', { required: 'Inscrição estadual é obrigatória' })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Inscrição Estadual"
                />
                {errors.inscricaoEstadual && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.inscricaoEstadual.message}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Regime Tributário
              </label>
              <select
                {...register('regimeTributario', { required: 'Regime tributário é obrigatório' })}
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={1}>1 - Simples Nacional</option>
                <option value={2}>2 - Simples Nacional - excesso de sublimite</option>
                <option value={3}>3 - Regime Normal</option>
              </select>
              {errors.regimeTributario && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.regimeTributario.message}
                </p>
              )}
            </div>
            
            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">Endereço do Emissor</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    {...register('endereco.logradouro', { required: 'Logradouro é obrigatório' })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Rua, Avenida, etc."
                  />
                  {errors.endereco?.logradouro && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.logradouro.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    {...register('endereco.numero', { required: 'Número é obrigatório' })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Número"
                  />
                  {errors.endereco?.numero && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.numero.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    {...register('endereco.bairro', { required: 'Bairro é obrigatório' })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Bairro"
                  />
                  {errors.endereco?.bairro && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.bairro.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    {...register('endereco.cep', { 
                      required: 'CEP é obrigatório',
                      pattern: {
                        value: /^\d{5}-\d{3}$/,
                        message: 'CEP inválido. Use o formato: 12345-678'
                      }
                    })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="12345-678"
                  />
                  {errors.endereco?.cep && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.cep.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    UF
                  </label>
                  <select
                    {...register('endereco.uf', { required: 'UF é obrigatória' })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  {errors.endereco?.uf && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.uf.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Município
                  </label>
                  <input
                    type="text"
                    {...register('endereco.municipio', { required: 'Município é obrigatório' })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Município"
                  />
                  {errors.endereco?.municipio && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.municipio.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código do Município (IBGE)
                  </label>
                  <input
                    type="text"
                    {...register('endereco.codigoMunicipio', { required: 'Código do município é obrigatório' })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Código IBGE (7 dígitos)"
                  />
                  {errors.endereco?.codigoMunicipio && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.codigoMunicipio.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    {...register('endereco.pais', { required: 'País é obrigatório' })}
                    defaultValue="BRASIL"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.endereco?.pais && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.pais.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Código do País
                  </label>
                  <input
                    type="text"
                    {...register('endereco.codigoPais', { required: 'Código do país é obrigatório' })}
                    defaultValue="1058"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {errors.endereco?.codigoPais && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.endereco.codigoPais.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfiguracaoEmissor;