/*
  # Criação das tabelas para o sistema de NF-e
  
  1. Tabelas
    - `emissor` - Dados do emissor da NF-e
    - `notas_fiscais` - Notas fiscais emitidas
    - `certificados` - Certificados digitais
  
  2. Segurança
    - Habilitação de RLS em todas as tabelas
    - Políticas de acesso para usuários autenticados
*/

-- Tabela de emissor (dados da empresa emitente)
CREATE TABLE IF NOT EXISTS public.emissor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text NOT NULL,
  cnpj text NOT NULL,
  inscricao_estadual text NOT NULL,
  regime_tributario smallint NOT NULL,
  endereco jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de notas fiscais
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emissor_id uuid REFERENCES public.emissor(id),
  numero text NOT NULL,
  serie text NOT NULL,
  chave text UNIQUE NOT NULL,
  xml text NOT NULL,
  xml_protocolo text,
  destinatario text NOT NULL,
  valor numeric(15,2) NOT NULL,
  data_emissao timestamptz NOT NULL,
  data_autorizacao timestamptz,
  status text NOT NULL DEFAULT 'pendente',
  protocolo text,
  danfe_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de certificados digitais
CREATE TABLE IF NOT EXISTS public.certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  arquivo text NOT NULL,
  senha text NOT NULL,
  validade timestamptz NOT NULL,
  ativo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.emissor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Permitir acesso ao emissor para usuários autenticados" 
  ON public.emissor FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir acesso às notas fiscais para usuários autenticados" 
  ON public.notas_fiscais FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir acesso aos certificados para usuários autenticados" 
  ON public.certificados FOR ALL TO authenticated USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_chave ON public.notas_fiscais(chave);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON public.notas_fiscais(numero);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON public.notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON public.notas_fiscais(data_emissao);