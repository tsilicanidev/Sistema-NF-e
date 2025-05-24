import { create } from 'npm:xmlbuilder2@3.1.1';
import { SignedXml } from 'npm:xml-crypto@3.2.0';
import * as forge from 'npm:node-forge@1.3.1';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

async function assinarXml(xml: string, certificateData: { pfxBase64: string; password: string }) {
  try {
    const cleanBase64 = certificateData.pfxBase64.replace(/[\r\n\s]/g, '');
    const pfxBinary = forge.util.decode64(cleanBase64);
    const pfxAsn1 = forge.asn1.fromDer(pfxBinary);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, certificateData.password);

    const keyBag = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    const certBag = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0];

    if (!keyBag?.key || !certBag?.cert) {
      throw new Error('Certificado digital inválido');
    }

    const privateKey = forge.pki.privateKeyToPem(keyBag.key);
    const certificate = forge.pki.certificateToPem(certBag.cert).replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '');

    const sig = new SignedXml();
    sig.signingKey = privateKey;
    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${certificate}</X509Certificate></X509Data>`,
    };

    sig.addReference(
      "//*[local-name(.)='infNFe']",
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ]
    );

    sig.computeSignature(xml);
    return sig.getSignedXml();
  } catch (error) {
    console.error('Erro ao assinar XML:', error);
    throw new Error(`Falha ao assinar o XML da NF-e: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }

  try {
    const { xmlNFe, certificate, ambiente = 'homologacao' } = await req.json();

    if (!xmlNFe || !certificate?.pfxBase64 || !certificate?.password) {
      throw new Error('Parâmetros inválidos');
    }

    const xmlAssinado = await assinarXml(xmlNFe, certificate);
    
    const loteXml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('enviNFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe', versao: '4.00' })
        .ele('idLote').txt(Date.now().toString()).up()
        .ele('indSinc').txt('1').up()
        .import(create(xmlAssinado).root())
      .end({ prettyPrint: true });

    const soapEnvelope = SOAP_ENVELOPE.replace('{{CONTENT}}', loteXml);
    
    // Updated endpoint URL construction
    const endpoint = SEFAZ_ENDPOINTS.SP[ambiente];
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml;charset=utf-8',
        'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
        'Accept': 'application/soap+xml',
        'Connection': 'keep-alive'
      },
      body: soapEnvelope
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SEFAZ Error Response:', errorText);
      throw new Error(`SEFAZ returned status ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
    }

    const xmlResposta = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlResposta, 'text/xml');
    
    const cStat = doc.getElementsByTagName('cStat')[0]?.textContent;
    const xMotivo = doc.getElementsByTagName('xMotivo')[0]?.textContent;
    const protocolo = doc.getElementsByTagName('nProt')[0]?.textContent;

    return new Response(
      JSON.stringify({
        status: cStat === '100' ? 'autorizada' : 'rejeitada',
        mensagem: xMotivo || 'Sem mensagem do servidor',
        protocolo,
        xml: xmlResposta
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno no servidor',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});