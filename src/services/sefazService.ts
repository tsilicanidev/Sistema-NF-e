import axios from 'axios';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { create, convert } from 'xmlbuilder2';
import { SignedXml } from 'xml-crypto';
import { assinarXml } from '../utils/nfeUtils';

const SEFAZ_ENDPOINTS = {
  SP: {
    producao: 'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
    homologacao: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx'
  }
};

const SOAP_ENVELOPE = `
<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      <cUF>35</cUF>
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

export class SefazService {
  constructor(certificado, ambiente = 'homologacao', uf = 'SP') {
    this.certificado = certificado;
    this.ambiente = ambiente;
    this.uf = uf;
    this.endpoint = SEFAZ_ENDPOINTS[uf][ambiente];
  }

  async autorizarNFe(xmlNFe) {
    try {
      // Assinar XML
      const xmlAssinado = await assinarXml(xmlNFe, this.certificado);

      // Criar lote
      const loteXml = this.gerarLoteNFe(xmlAssinado);

      // Montar envelope SOAP
      const soapEnvelope = SOAP_ENVELOPE.replace('{{CONTENT}}', loteXml);

      // Enviar para SEFAZ
      const response = await axios.post(this.endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'application/soap+xml;charset=utf-8',
          'SOAPAction': ''
        },
        httpsAgent: this.certificado.getHttpsAgent()
      });

      // Processar resposta
      return this.processarRespostaSefaz(response.data);
    } catch (error) {
      console.error('Erro ao autorizar NF-e:', error);
      throw new Error(`Falha na autorização: ${error.message}`);
    }
  }

  gerarLoteNFe(xmlNFe) {
    // Convert the input XML string to a DOM document using xmlbuilder2
    const xmlDoc = convert(xmlNFe, { format: 'dom' });
    
    const lote = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('enviNFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe', versao: '4.00' })
        .ele('idLote').txt(Date.now().toString()).up()
        .ele('indSinc').txt('1').up()
        .import(xmlDoc.document.firstChild) // Import the first child (root element) of the document
      .end({ prettyPrint: true });

    return lote;
  }

  processarRespostaSefaz(xmlResposta) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResposta, 'text/xml');
    
    // Extrair informações relevantes
    const cStat = doc.getElementsByTagName('cStat')[0]?.textContent;
    const xMotivo = doc.getElementsByTagName('xMotivo')[0]?.textContent;
    const protocolo = doc.getElementsByTagName('nProt')[0]?.textContent;

    return {
      status: cStat === '100' ? 'autorizada' : 'rejeitada',
      mensagem: xMotivo,
      protocolo,
      xml: xmlResposta
    };
  }

  async consultarStatus() {
    try {
      const xmlConsulta = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('consStatServ', { xmlns: 'http://www.portalfiscal.inf.br/nfe', versao: '4.00' })
          .ele('tpAmb').txt(this.ambiente === 'producao' ? '1' : '2').up()
          .ele('cUF').txt('35').up()
          .ele('xServ').txt('STATUS')
        .end({ prettyPrint: true });

      const response = await axios.post(
        `${this.endpoint}/NFeStatusServico4`,
        xmlConsulta,
        {
          headers: {
            'Content-Type': 'application/xml',
            'SOAPAction': ''
          },
          httpsAgent: this.certificado.getHttpsAgent()
        }
      );

      return this.processarRespostaStatus(response.data);
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      throw new Error(`Falha na consulta de status: ${error.message}`);
    }
  }

  processarRespostaStatus(xmlResposta) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResposta, 'text/xml');
    
    return {
      status: doc.getElementsByTagName('cStat')[0]?.textContent,
      mensagem: doc.getElementsByTagName('xMotivo')[0]?.textContent,
      tempo: doc.getElementsByTagName('tMed')[0]?.textContent
    };
  }
}

export default SefazService;