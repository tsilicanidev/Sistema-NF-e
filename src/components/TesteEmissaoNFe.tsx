import React from 'react';
import Button from './Button';
import { FileCheck } from 'lucide-react';
import { useNotificacao } from '../contexts/NotificacaoContext';

export const TesteEmissaoNFe: React.FC = () => {
  const { adicionarNotificacao } = useNotificacao();
  
  const emitirNotaTeste = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variáveis de ambiente do Supabase não configuradas');
      }
      
      const response = await fetch(`${supabaseUrl}/functions/v1/nfe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          notaFiscal: {
            emitente: {
              CNPJ: '12345678000195',
              xNome: 'Empresa de Teste LTDA',
              enderEmit: {
                xLgr: 'Rua Exemplo',
                nro: '100',
                xBairro: 'Centro',
                cMun: '3550308',
                xMun: 'São Paulo',
                UF: 'SP',
                CEP: '01000000',
                cPais: '1058',
                xPais: 'BRASIL',
              },
              IE: '1234567890',
              CRT: '3',
            },
            destinatario: {
              CPF: '12345678909',
              nome: 'Cliente de Teste',
              endereco: {
                logradouro: 'Rua Cliente',
                numero: '200',
                bairro: 'Bairro Legal',
                cep: '02000000',
                municipio: 'São Paulo',
                codigoMunicipio: '3550308',
                uf: 'SP',
              },
              isento: true,
            },
            produtos: [
              {
                codigo: '001',
                descricao: 'Produto de Teste',
                ncm: '61091000',
                cfop: '5102',
                unidade: 'UN',
                quantidade: 1,
                valorUnitario: 100.0,
                icms: {
                  origem: '0',
                  cst: '00',
                  aliquota: 18,
                },
              },
            ],
            informacoesAdicionais: 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL',
          },
          ambiente: 'homologacao',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      adicionarNotificacao('sucesso', `NF-e emitida com sucesso! Chave: ${data.chave || 'N/A'}`);
    } catch (error) {
      console.error('Erro ao emitir NF-e:', error);
      adicionarNotificacao('erro', error instanceof Error ? error.message : 'Erro desconhecido ao emitir NF-e');
    }
  };

  return (
    <div className="p-4">
      <Button
        onClick={emitirNotaTeste}
        variant="primary"
        icon={<FileCheck />}
      >
        Emitir NF-e de Teste
      </Button>
    </div>
  );
};

export default TesteEmissaoNFe;