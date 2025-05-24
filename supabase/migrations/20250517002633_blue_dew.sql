/*
  # Initial Schema for NF-e System

  1. New Tables
    - `emissor` - Stores the company's information for invoice issuance
    - `certificados` - Stores digital certificates for signing NF-e
    - `notas_fiscais` - Stores issued NF-e data
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create emissor table (company information)
CREATE TABLE IF NOT EXISTS emissor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  inscricao_estadual text NOT NULL,
  regime_tributario smallint NOT NULL,
  endereco jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create digital certificates table
CREATE TABLE IF NOT EXISTS certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  arquivo text NOT NULL, -- Base64 of .pfx file
  senha text NOT NULL,
  validade timestamptz NOT NULL,
  ativo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emissor_id uuid REFERENCES emissor(id),
  numero text NOT NULL,
  serie text NOT NULL,
  chave text NOT NULL UNIQUE,
  xml text NOT NULL,
  xml_protocolo text,
  destinatario text NOT NULL,
  valor numeric(15,2) NOT NULL,
  data_emissao timestamptz NOT NULL,
  data_autorizacao timestamptz,
  status text NOT NULL DEFAULT 'pendente',
  protocolo text,
  mensagem_retorno text,
  danfe_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE emissor ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users on emissor"
  ON emissor
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for authenticated users on certificados"
  ON certificados
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow all operations for authenticated users on notas_fiscais"
  ON notas_fiscais
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS notas_fiscais_chave_idx ON notas_fiscais(chave);
CREATE INDEX IF NOT EXISTS notas_fiscais_emissor_id_idx ON notas_fiscais(emissor_id);
CREATE INDEX IF NOT EXISTS notas_fiscais_status_idx ON notas_fiscais(status);