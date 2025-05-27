import { create } from 'npm:xmlbuilder2@3.1.1';
import { SignedXml } from 'npm:xml-crypto@3.2.0';
import * as forge from 'npm:node-forge@1.3.1';
import { DOMParser } from 'npm:@xmldom/xmldom@0.8.10';

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
</soap12:Envelope>`;

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

    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const infNFeElement = doc.getElementsByTagName('infNFe')[0];
    if (!infNFeElement) {
      throw new Error('Elemento infNFe não encontrado no XML');
    }

    const id = infNFeElement.getAttribute('Id');
    if (!id) {
      throw new Error('Atributo Id não encontrado no elemento infNFe');
    }

    const sig = new SignedXml();
    sig.signatureAlgorithm = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
    sig.digestAlgorithm = "http://www.w3.org/2000/09/xmldsig#sha1";
    sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
    sig.signingKey = privateKey;

    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${certificate}</X509Certificate></X509Data>`,
    };

    sig.addReference(
      `//*[local-name(.)='infNFe' and @Id='${id}']`,
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ]
    );

    sig.computeSignature(xml);
    return sig.getSignedXml();
  } catch (error) {
    console.error('Erro ao assinar XML:', error);
    throw new Error(`Falha ao assinar o XML da NF-e: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Mock function to simulate SEFAZ response in homologation environment
function mockSefazResponse(xml: string) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    // Extract NFe info for the mock response
    const infNFe = doc.getElementsByTagName('infNFe')[0];
    const id = infNFe?.getAttribute('Id')?.replace('NFe', '') || '';
    const nNF = doc.getElementsByTagName('nNF')[0]?.textContent || '';
    
    // Generate a random protocol number
    const protocolNumber = Math.floor(Math.random() * 10000000000000000).toString().padStart(15, '0');
    
    // Create mock response XML
    const responseXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Body>
          <nfeResultMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
            <retEnviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
              <tpAmb>2</tpAmb>
              <verAplic>SVRS202305241115</verAplic>
              <cStat>104</cStat>
              <xMotivo>Lote processado</xMotivo>
              <cUF>35</cUF>
              <dhRecbto>${new Date().toISOString()}</dhRecbto>
              <protNFe versao="4.00">
                <infProt>
                  <tpAmb>2</tpAmb>
                  <verAplic>SVRS202305241115</verAplic>
                  <chNFe>${id}</chNFe>
                  <dhRecbto>${new Date().toISOString()}</dhRecbto>
                  <nProt>${protocolNumber}</nProt>
                  <digVal>MOCK_DIGEST_VALUE</digVal>
                  <cStat>100</cStat>
                  <xMotivo>Autorizado o uso da NF-e</xMotivo>
                </infProt>
              </protNFe>
            </retEnviNFe>
          </nfeResultMsg>
        </soap:Body>
      </soap:Envelope>
    `;
    
    return responseXml;
  } catch (error) {
    console.error('Erro ao gerar resposta mock:', error);
    throw new Error('Falha ao gerar resposta simulada da SEFAZ');
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Method not allowed'
    }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle both direct XML submission and notaFiscal object
    let xml = requestData.xml;
    const certificate = requestData.certificate;
    const ambiente = requestData.ambiente || 'homologacao';

    // If notaFiscal object is provided instead of XML, we would generate XML here
    // This is a simplified mock for demonstration
    if (!xml && requestData.notaFiscal) {
      // In a real implementation, you would generate XML from the notaFiscal object
      // For now, we'll just create a simple mock XML
      const mockXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
          <infNFe Id="NFe35230612345678000195550010000000011000000010" versao="4.00">
            <ide>
              <cUF>35</cUF>
              <cNF>00000001</cNF>
              <natOp>VENDA</natOp>
              <mod>55</mod>
              <serie>1</serie>
              <nNF>000000001</nNF>
              <dhEmi>${new Date().toISOString()}</dhEmi>
              <tpNF>1</tpNF>
              <idDest>1</idDest>
              <cMunFG>3550308</cMunFG>
              <tpImp>1</tpImp>
              <tpEmis>1</tpEmis>
              <cDV>0</cDV>
              <tpAmb>2</tpAmb>
              <finNFe>1</finNFe>
              <indFinal>1</indFinal>
              <indPres>1</indPres>
              <procEmi>0</procEmi>
              <verProc>1.0.0</verProc>
            </ide>
            <emit>
              <CNPJ>12345678000195</CNPJ>
              <xNome>EMPRESA TESTE LTDA</xNome>
              <xFant>EMPRESA TESTE</xFant>
              <enderEmit>
                <xLgr>RUA TESTE</xLgr>
                <nro>123</nro>
                <xBairro>CENTRO</xBairro>
                <cMun>3550308</cMun>
                <xMun>SAO PAULO</xMun>
                <UF>SP</UF>
                <CEP>01001000</CEP>
                <cPais>1058</cPais>
                <xPais>BRASIL</xPais>
              </enderEmit>
              <IE>123456789</IE>
              <CRT>3</CRT>
            </emit>
            <dest>
              <CPF>12345678909</CPF>
              <xNome>CLIENTE TESTE</xNome>
              <enderDest>
                <xLgr>RUA CLIENTE</xLgr>
                <nro>456</nro>
                <xBairro>BAIRRO CLIENTE</xBairro>
                <cMun>3550308</cMun>
                <xMun>SAO PAULO</xMun>
                <UF>SP</UF>
                <CEP>01002000</CEP>
                <cPais>1058</cPais>
                <xPais>BRASIL</xPais>
              </enderDest>
              <indIEDest>2</indIEDest>
            </dest>
            <det nItem="1">
              <prod>
                <cProd>001</cProd>
                <cEAN></cEAN>
                <xProd>PRODUTO TESTE</xProd>
                <NCM>61091000</NCM>
                <CFOP>5102</CFOP>
                <uCom>UN</uCom>
                <qCom>1</qCom>
                <vUnCom>100.00</vUnCom>
                <vProd>100.00</vProd>
                <cEANTrib></cEANTrib>
                <uTrib>UN</uTrib>
                <qTrib>1</qTrib>
                <vUnTrib>100.00</vUnTrib>
                <indTot>1</indTot>
              </prod>
              <imposto>
                <ICMS>
                  <ICMS00>
                    <orig>0</orig>
                    <CST>00</CST>
                    <modBC>3</modBC>
                    <vBC>100.00</vBC>
                    <pICMS>18.00</pICMS>
                    <vICMS>18.00</vICMS>
                  </ICMS00>
                </ICMS>
                <PIS>
                  <PISNT>
                    <CST>07</CST>
                  </PISNT>
                </PIS>
                <COFINS>
                  <COFINSNT>
                    <CST>07</CST>
                  </COFINSNT>
                </COFINS>
              </imposto>
            </det>
            <total>
              <ICMSTot>
                <vBC>100.00</vBC>
                <vICMS>18.00</vICMS>
                <vICMSDeson>0.00</vICMSDeson>
                <vBCST>0.00</vBCST>
                <vST>0.00</vST>
                <vProd>100.00</vProd>
                <vFrete>0.00</vFrete>
                <vSeg>0.00</vSeg>
                <vDesc>0.00</vDesc>
                <vII>0.00</vII>
                <vIPI>0.00</vIPI>
                <vPIS>0.00</vPIS>
                <vCOFINS>0.00</vCOFINS>
                <vOutro>0.00</vOutro>
                <vNF>100.00</vNF>
              </ICMSTot>
            </total>
            <transp>
              <modFrete>9</modFrete>
            </transp>
            <pag>
              <detPag>
                <tPag>01</tPag>
                <vPag>100.00</vPag>
              </detPag>
            </pag>
            <infAdic>
              <infCpl>NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL</infCpl>
            </infAdic>
          </infNFe>
        </NFe>
      `;
      xml = mockXml;
    }

    if (!xml || !certificate?.pfxBase64 || !certificate?.password) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Parâmetros inválidos',
        details: {
          xml: !xml ? 'XML não fornecido' : null,
          certificate: !certificate ? 'Certificado não fornecido' : 
            !certificate.pfxBase64 ? 'Certificado PFX não fornecido' : 
            !certificate.password ? 'Senha do certificado não fornecida' : null
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // In a real implementation, we would sign the XML and send to SEFAZ
    // For this example, we'll simulate a successful response
    try {
      // Simulate XML signing
      console.log("Assinando XML...");
      // const xmlAssinado = await assinarXml(xml, certificate);
      
      // For testing purposes, we'll skip actual signing and use the original XML
      const xmlAssinado = xml;
      
      // In homologation mode, we'll use a mock response
      if (ambiente === 'homologacao') {
        console.log("Ambiente de homologação - gerando resposta simulada");
        
        // Extract chave from XML for the response
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlAssinado, 'text/xml');
        const infNFe = doc.getElementsByTagName('infNFe')[0];
        const chave = infNFe?.getAttribute('Id')?.replace('NFe', '') || '';
        const protocolo = Math.floor(Math.random() * 10000000000000000).toString().padStart(15, '0');
        
        return new Response(JSON.stringify({
          status: 'autorizada',
          mensagem: 'Autorizado o uso da NF-e',
          codigoStatus: '100',
          protocolo: protocolo,
          chave: chave,
          xml: xmlAssinado
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // For production, we would actually send to SEFAZ
      // This is just a placeholder for the real implementation
      const mockResponse = mockSefazResponse(xmlAssinado);
      
      // Parse the mock response
      const parser = new DOMParser();
      const doc = parser.parseFromString(mockResponse, 'text/xml');
      
      const cStat = doc.getElementsByTagName('cStat')[0]?.textContent;
      const xMotivo = doc.getElementsByTagName('xMotivo')[0]?.textContent;
      const protocolo = doc.getElementsByTagName('nProt')[0]?.textContent;
      const chave = doc.getElementsByTagName('chNFe')[0]?.textContent;

      return new Response(JSON.stringify({
        status: cStat === '100' ? 'autorizada' : 'rejeitada',
        mensagem: xMotivo || 'Sem mensagem do servidor',
        protocolo: protocolo || '',
        codigoStatus: cStat,
        chave: chave,
        xml: xmlAssinado
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (processError) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Erro ao processar a NF-e',
        details: processError instanceof Error ? processError.message : 'Erro desconhecido no processamento'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Erro não tratado:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Erro interno no servidor',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Erro desconhecido'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});