import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { XMLParser } from 'fast-xml-parser';
import QRCode from 'qrcode';
import bwipjs from 'bwip-js';

export async function gerarDanfePDF(xml: string): Promise<Uint8Array> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const json = parser.parse(xml);

  const nfe = json.NFe?.infNFe || json['nfeProc']?.NFe?.infNFe;
  const supl = json['nfeProc']?.NFe?.infNFeSupl || json.NFe?.infNFeSupl;

  if (!nfe) throw new Error('XML da NF-e inválido');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const chave = nfe.Id?.replace(/^NFe/, '') || '';

  // Cabeçalho com logotipo
  try {
    const logoImg = await fetch('/logo.png').then(res => res.blob()).then(blob => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    });
    doc.addImage(logoImg, 'PNG', 10, 10, 30, 20);
  } catch (e) {
    console.warn('Logo da empresa não encontrado, ignorando...');
  }

  // Cabeçalho
  doc.setFontSize(12);
  doc.text('DANFE', 10, 10);
  doc.setFontSize(9);
  doc.text('Documento Auxiliar da Nota Fiscal Eletrônica', 10, 14);

  doc.setFontSize(10);
  doc.text(`Nº: ${nfe.ide?.nNF}  Série: ${nfe.ide?.serie}  Emissão: ${nfe.ide?.dhEmi}`, 10, 22);
  doc.text(`Emitente: ${nfe.emit?.xNome}`, 10, 28);
  doc.text(`CNPJ: ${nfe.emit?.CNPJ}`, 10, 33);

  // Destinatário
  doc.text(`Destinatário: ${nfe.dest?.xNome}`, 10, 42);
  const docDest = nfe.dest?.CNPJ || nfe.dest?.CPF || '';
  doc.text(`Documento: ${docDest}`, 10, 47);
  doc.text(`Endereço: ${nfe.dest?.enderDest?.xLgr}, ${nfe.dest?.enderDest?.nro}`, 10, 52);
  doc.text(`${nfe.dest?.enderDest?.xMun} - ${nfe.dest?.enderDest?.UF} - CEP: ${nfe.dest?.enderDest?.CEP}`, 10, 57);

  // Chave de acesso
  doc.setFontSize(10);
  const chaveFormatada = chave.replace(/(\d{4})(?=.)/g, '$1 ');
  doc.text('Chave de Acesso:', 10, 65);
  doc.setFont('Courier', 'bold');
  doc.text(chaveFormatada, 10, 70);
  doc.setFont('helvetica');

  // QRCode
  if (supl?.qrCode) {
    const qrDataUrl = await QRCode.toDataURL(supl.qrCode);
    doc.addImage(qrDataUrl, 'PNG', 160, 10, 40, 40);
  }

  // Produtos
  const produtos = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
  const produtoRows = produtos.map((item: any) => {
    const prod = item.prod;
    return [
      prod.cProd,
      prod.xProd,
      prod.qCom,
      prod.uCom,
      prod.vUnCom,
      prod.vProd
    ];
  });

  doc.autoTable({
    head: [['Código', 'Descrição', 'Qtd', 'Unid', 'V. Unit', 'V. Total']],
    body: produtoRows,
    startY: 80,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [200, 200, 200] }
  });

  const yEnd = doc.lastAutoTable.finalY;

  // Totais
  doc.setFontSize(10);
  doc.text(`Valor Total da Nota: R$ ${nfe.total?.ICMSTot?.vNF}`, 10, yEnd + 10);
  doc.text(`Base ICMS: R$ ${nfe.total?.ICMSTot?.vBC}`, 10, yEnd + 16);
  doc.text(`ICMS: R$ ${nfe.total?.ICMSTot?.vICMS}`, 80, yEnd + 16);
  doc.text(`Frete: R$ ${nfe.total?.ICMSTot?.vFrete}`, 10, yEnd + 22);
  doc.text(`IPI: R$ ${nfe.total?.ICMSTot?.vIPI}`, 80, yEnd + 22);

  // Informações adicionais
  if (nfe.infAdic?.infCpl) {
    doc.text('Informações Complementares:', 10, yEnd + 32);
    doc.text(nfe.infAdic.infCpl, 10, yEnd + 38);
  }

  // Código de barras
  if (chave) {
    const barcodeBuffer = await bwipjs.toBuffer({ bcid: 'code128', text: chave, scale: 2, height: 10 });
    const barcodeDataUrl = 'data:image/png;base64,' + barcodeBuffer.toString('base64');
    doc.addImage(barcodeDataUrl, 'PNG', 10, 290, 190, 15);
  }

  return doc.output('arraybuffer');
}

// ✅ Exportação adicional para compatibilidade
export { gerarDanfePDF as gerarDANFE };
