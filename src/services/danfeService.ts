import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fxp from 'fast-xml-parser';
import QRCode from 'qrcode';

import bwipjs from 'bwip-js';


export async function gerarDanfePDF(xml: string): Promise<Uint8Array> {
    const json = fxp.parse(xml, { ignoreAttributes: false, attributeNamePrefix: '' });
  const nfe = json.NFe?.infNFe || json['nfeProc']?.NFe?.infNFe;
  const supl = json['nfeProc']?.NFe?.infNFeSupl || json.NFe?.infNFeSupl;

  if (!nfe) throw new Error('Não foi possível extrair os dados da NF-e');

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('DANFE - Documento Auxiliar da NF-e', 20, 20);

  doc.setFontSize(12);
  doc.text(`Emitente: ${nfe.emit?.xNome}`, 20, 40);
  doc.text(`Destinatário: ${nfe.dest?.xNome}`, 20, 50);
  doc.text(`Chave de Acesso: ${nfe.Id?.replace(/^NFe/, '')}`, 20, 60);
  doc.text(`Número: ${nfe.ide?.nNF} Série: ${nfe.ide?.serie}`, 20, 70);
  doc.text(`Data de Emissão: ${nfe.ide?.dhEmi}`, 20, 80);
  doc.text(`Valor Total: R$ ${nfe.total?.ICMSTot?.vNF}`, 20, 90);
  doc.text(`CFOP: ${nfe.det?.[0]?.prod?.CFOP || nfe.det?.prod?.CFOP || ''}`, 20, 100);

  if (nfe.transp) {
    doc.text('Transportadora:', 20, 110);
    doc.text(`Nome: ${nfe.transp.transporta?.xNome || '---'}`, 25, 120);
    doc.text(`Placa: ${nfe.transp.veicTransp?.placa || '---'} UF: ${nfe.transp.veicTransp?.UF || ''}`, 25, 130);
  }

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
    startY: 140,
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  const finalY = doc.lastAutoTable.finalY;
  doc.text(`Base ICMS: R$ ${nfe.total?.ICMSTot?.vBC || '0,00'}`, 20, finalY + 10);
  doc.text(`ICMS: R$ ${nfe.total?.ICMSTot?.vICMS || '0,00'}`, 80, finalY + 10);
  doc.text(`Frete: R$ ${nfe.total?.ICMSTot?.vFrete || '0,00'}`, 140, finalY + 10);
  doc.text(`Outros: R$ ${nfe.total?.ICMSTot?.vOutro || '0,00'}`, 20, finalY + 20);
  doc.text(`IPI: R$ ${nfe.total?.ICMSTot?.vIPI || '0,00'}`, 80, finalY + 20);

  if (nfe.cobr?.fat) {
    doc.text(`Fatura: Nº ${nfe.cobr.fat.nFat} - Valor Original: R$ ${nfe.cobr.fat.vOrig}`, 20, finalY + 30);
  }

  if (nfe.pag?.detPag) {
    const pagamentos = Array.isArray(nfe.pag.detPag) ? nfe.pag.detPag : [nfe.pag.detPag];
    let y = finalY + 40;
    doc.text('Pagamentos:', 20, y);
    pagamentos.forEach((p: any, index: number) => {
      y += 10;
      doc.text(`Forma: ${p.tPag} - Valor: R$ ${p.vPag}`, 25, y);
    });
  }

  if (nfe.infAdic?.infCpl) {
    doc.text('Informações Complementares:', 20, doc.internal.pageSize.height - 40);
    doc.text(nfe.infAdic.infCpl, 20, doc.internal.pageSize.height - 30);
  }

  if (supl?.qrCode) {
    const qrDataUrl = await QRCode.toDataURL(supl.qrCode);
    doc.addImage(qrDataUrl, 'PNG', 150, 20, 40, 40);
  }

  const chave = nfe.Id?.replace(/^NFe/, '');
  if (chave) {
    const barcodeBuffer = await bwipjs.toBuffer({ bcid: 'code128', text: chave, scale: 2, height: 10 });
    const barcodeDataUrl = 'data:image/png;base64,' + barcodeBuffer.toString('base64');
    doc.addImage(barcodeDataUrl, 'PNG', 20, doc.internal.pageSize.height - 20, 170, 20);
  }

  return doc.output('arraybuffer');
}


