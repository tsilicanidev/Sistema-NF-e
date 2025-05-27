/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EMPRESA_RAZAO_SOCIAL: string
  readonly VITE_EMPRESA_NOME_FANTASIA: string
  readonly VITE_EMPRESA_CNPJ: string
  readonly VITE_EMPRESA_IE: string
  readonly VITE_EMPRESA_REGIME: string
  readonly VITE_EMISSOR_ENDERECO_LOGRADOURO: string
  readonly VITE_EMISSOR_ENDERECO_NUMERO: string
  readonly VITE_EMISSOR_ENDERECO_BAIRRO: string
  readonly VITE_EMISSOR_ENDERECO_CIDADE: string
  readonly VITE_EMISSOR_ENDERECO_UF: string
  readonly VITE_EMISSOR_ENDERECO_CEP: string
  readonly VITE_EMISSOR_ENDERECO_COD_PAIS: string
  readonly VITE_EMISSOR_ENDERECO_PAIS: string
  readonly VITE_CERTIFICADO_BASE64: string
  readonly VITE_CERTIFICADO_SENHA: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}