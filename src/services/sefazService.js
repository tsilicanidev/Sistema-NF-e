import axios from 'axios';
import { create } from 'xmlbuilder2';
import { assinarXml } from '../utils/nfeUtils';
import https from 'node:https';

const SEFAZ_ENDPOINTS = {
  SP: {
    producao: 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
    homologacao: '/nfeautorizacao4.asmx' // Using proxy path
  }
};

const SOAP_ENVELOPE = `
<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
     <cUF>${35}</cUF>
      <versaoDados>4.00</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      {{CONTENT}}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>
`;

// Create custom HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 60000,
  maxHeaderSize: 16384
});

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export class SefazService {
  constructor(certificate, ambiente = 'homologacao', uf = 'SP') {
    this.pfxBase64 = certificate.pfxBase64;
    this.password = certificate.password;
    this.ambiente = ambiente;
    this.uf = uf;
    this.endpoint = SEFAZ_ENDPOINTS[uf][ambiente];
    
    this.axiosInstance = axios.create({
      httpsAgent,
      timeout: 60000,
      maxRedirects: 5,
      validateStatus: status => status >= 200 && status < 500,
      headers: {
        'User-Agent': 'NFe-Emissor/1.0',
        'Accept': 'application/soap+xml,application/xml,text/xml,*/*'
      }
    });
  }

  async retryWithExponentialBackoff(operation, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) {
    try {
      return await operation();
    } catch (error) {
      if (retries === 0) throw error;
      
      console.log(`Retry attempt remaining: ${retries}. Waiting ${delay}ms before next attempt.`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryWithExponentialBackoff(
        operation,
        retries - 1,
        Math.min(delay * 2, 10000) // Max delay of 10 seconds
      );
    }
  }

  async autorizarNFe(xmlNFe) {
    const sendRequest = async () => {
      try {
        const xmlAssinado = await assinarXml(xmlNFe, {
          pfxBase64: this.pfxBase64,
          password: this.password
        });

        const loteXml = this.gerarLoteNFe(xmlAssinado);
        const soapEnvelope = SOAP_ENVELOPE.replace('{{CONTENT}}', loteXml);

        console.log('Enviando requisição para SEFAZ:', this.endpoint);
        
        const response = await this.axiosInstance.post(this.endpoint, soapEnvelope, {
          headers: {
            'Content-Type': 'application/soap+xml;charset=utf-8',
            'SOAPAction': ''
          }
        });

        if (response.status >= 400) {
          throw new Error(`SEFAZ returned status ${response.status}: ${response.statusText}`);
        }

        return this.processarRespostaSefaz(response.data);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Servidor SEFAZ indisponível. Tente novamente em alguns minutos.');
        } else if (error.code === 'ETIMEDOUT') {
          throw new Error('Tempo de conexão com o servidor SEFAZ excedido. Tente novamente.');
        } else if (error.response?.status === 404) {
          throw new Error('Endpoint SEFAZ não encontrado. Verifique a configuração do ambiente.');
        } else if (error.response) {
          throw new Error(`Erro do servidor SEFAZ: ${error.response.status} - ${error.response.statusText}`);
        }
        
        throw error;
      }
    };

    return this.retryWithExponentialBackoff(sendRequest);
  }

  gerarLoteNFe(xmlNFe) {
    const rootNFe = create(xmlNFe).root();

    const lote = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('enviNFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe', versao: '4.00' })
        .ele('idLote').txt(Date.now().toString()).up()
        .ele('indSinc').txt('1').up()
        .import(rootNFe)
      .end({ prettyPrint: true });

    return lote;
  }

  processarRespostaSefaz(xmlResposta) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResposta, 'text/xml');
    
    const cStat = doc.getElementsByTagName('cStat')[0]?.textContent;
    const xMotivo = doc.getElementsByTagName('xMotivo')[0]?.textContent;
    const protocolo = doc.getElementsByTagName('nProt')[0]?.textContent;

    if (!cStat) {
      throw new Error('Resposta inválida do servidor SEFAZ');
    }

    return {
      status: cStat === '100' ? 'autorizada' : 'rejeitada',
      mensagem: xMotivo || 'Sem mensagem do servidor',
      protocolo,
      xml: xmlResposta
    };
  }

  async consultarStatus() {
    const sendRequest = async () => {
      try {
        const xmlConsulta = create({ version: '1.0', encoding: 'UTF-8' })
          .ele('consStatServ', { xmlns: 'http://www.portalfiscal.inf.br/nfe', versao: '4.00' })
            .ele('tpAmb').txt(this.ambiente === 'producao' ? '1' : '2').up()
            .ele('cUF').txt('35').up()
            .ele('xServ').txt('STATUS')
          .end({ prettyPrint: true });

        const response = await this.axiosInstance.post(
          `${this.endpoint}/NFeStatusServico4`,
          xmlConsulta,
          {
            headers: {
              'Content-Type': 'application/xml',
              'SOAPAction': ''
            }
          }
        );

        if (response.status >= 400) {
          throw new Error(`SEFAZ returned status ${response.status}: ${response.statusText}`);
        }

        return this.processarRespostaStatus(response.data);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Servidor de status SEFAZ indisponível. Tente novamente em alguns minutos.');
        } else if (error.code === 'ETIMEDOUT') {
          throw new Error('Tempo de conexão com o servidor de status SEFAZ excedido. Tente novamente.');
        }
        throw error;
      }
    };

    return this.retryWithExponentialBackoff(sendRequest);
  }

  processarRespostaStatus(xmlResposta) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResposta, 'text/xml');
    
    const cStat = doc.getElementsByTagName('cStat')[0]?.textContent;
    const xMotivo = doc.getElementsByTagName('xMotivo')[0]?.textContent;
    const tMed = doc.getElementsByTagName('tMed')[0]?.textContent;

    if (!cStat) {
      throw new Error('Resposta inválida do servidor de status SEFAZ');
    }

    return {
      status: cStat,
      mensagem: xMotivo || 'Sem mensagem do servidor',
      tempo: tMed
    };
  }
}

export default SefazService;