import axios from 'axios';

interface CertificadoDigital {
  pfxBase64: string;
  password: string;
}

interface EmitirNFeResponse {
  status: string;
  mensagem: string;
  protocolo?: string;
  xmlResposta: string;
}

export async function emitirNotaFiscal(
  xml: string,
  certificado: CertificadoDigital,
  ambiente: 'homologacao' | 'producao' = 'homologacao',
  uf: string = 'SP'
): Promise<EmitirNFeResponse> {
  const response = await axios.post('/api/emitir-nfe', {
    xml,
    certificado,
    ambiente,
    uf
  });

  return response.data;
}
