import jsPDF from 'jspdf';

// Função para gerar o DANFE em PDF
export function gerarDANFE(notaFiscal: any): string {
  // Aqui seria a implementação completa para gerar o DANFE no formato A4 retrato
  // seguindo as especificações do manual

  // Isso é apenas um esqueleto para demonstração
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  
  // Definições de cores
  const preto = '#000000';
  const cinzaClaro = '#F5F5F5';
  
  // Definições de fontes (tamanhos conforme manual)
  const fonteTitulo = 12;
  const fonteSubtitulo = 10;
  const fonteNormal = 8;
  const fontePequena = 6;
  
  // Cabeçalho - Identificação do Documento
  pdf.setFillColor(cinzaClaro);
  pdf.rect(margin, margin, pageWidth - 2 * margin, 30, 'F');
  pdf.setFontSize(fonteTitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DANFE', pageWidth / 2, margin + 10, { align: 'center' });
  
  pdf.setFontSize(fonteSubtitulo);
  pdf.text('Documento Auxiliar da Nota Fiscal Eletrônica', pageWidth / 2, margin + 18, { align: 'center' });
  
  // Informações da nota
  pdf.setFontSize(fonteNormal);
  pdf.setFont('helvetica', 'normal');
  
  // Chave de acesso
  pdf.text(`Chave de Acesso: ${notaFiscal.chave || '0'.repeat(44)}`, margin, margin + 40);
  
  // Protocolo de autorização
  pdf.text(`Protocolo de Autorização: ${notaFiscal.protocolo || 'N/A'}`, margin, margin + 45);
  
  // Dados do emitente
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMITENTE', margin, margin + 55);
  
  pdf.setFontSize(fonteNormal);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Razão Social: ${notaFiscal.emissor?.razaoSocial || 'N/A'}`, margin, margin + 60);
  pdf.text(`CNPJ: ${notaFiscal.emissor?.cnpj || 'N/A'}`, margin, margin + 65);
  pdf.text(`Endereço: ${notaFiscal.emissor?.endereco?.logradouro || 'N/A'}, ${notaFiscal.emissor?.endereco?.numero || 'N/A'}`, margin, margin + 70);
  pdf.text(`${notaFiscal.emissor?.endereco?.municipio || 'N/A'} - ${notaFiscal.emissor?.endereco?.uf || 'N/A'}`, margin, margin + 75);
  
  // Dados do destinatário
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESTINATÁRIO', margin, margin + 85);
  
  pdf.setFontSize(fonteNormal);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nome: ${notaFiscal.destinatario?.nome || 'N/A'}`, margin, margin + 90);
  pdf.text(`CPF/CNPJ: ${notaFiscal.destinatario?.documento || 'N/A'}`, margin, margin + 95);
  pdf.text(`Endereço: ${notaFiscal.destinatario?.endereco?.logradouro || 'N/A'}, ${notaFiscal.destinatario?.endereco?.numero || 'N/A'}`, margin, margin + 100);
  pdf.text(`${notaFiscal.destinatario?.endereco?.municipio || 'N/A'} - ${notaFiscal.destinatario?.endereco?.uf || 'N/A'}`, margin, margin + 105);
  
  // Tabela de produtos
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRODUTOS', margin, margin + 115);
  
  // Cabeçalho da tabela
  const inicioTabela = margin + 120;
  const larguraTabela = pageWidth - 2 * margin;
  
  pdf.setFillColor(cinzaClaro);
  pdf.rect(margin, inicioTabela, larguraTabela, 8, 'F');
  
  pdf.setFontSize(fontePequena);
  pdf.text('CÓDIGO', margin + 5, inicioTabela + 5);
  pdf.text('DESCRIÇÃO', margin + 30, inicioTabela + 5);
  pdf.text('NCM', margin + 100, inicioTabela + 5);
  pdf.text('QUANT.', margin + 120, inicioTabela + 5);
  pdf.text('VALOR UNIT.', margin + 145, inicioTabela + 5);
  pdf.text('VALOR TOTAL', margin + 170, inicioTabela + 5);
  
  // Dados dos produtos
  let posicaoY = inicioTabela + 12;
  
  if (notaFiscal.produtos && notaFiscal.produtos.length > 0) {
    notaFiscal.produtos.forEach((produto: any, index: number) => {
      pdf.setFontSize(fontePequena);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(produto.codigo || 'N/A', margin + 5, posicaoY);
      pdf.text(produto.descricao || 'N/A', margin + 30, posicaoY);
      pdf.text(produto.ncm || 'N/A', margin + 100, posicaoY);
      pdf.text(produto.quantidade?.toString() || 'N/A', margin + 120, posicaoY);
      pdf.text(produto.valorUnitario?.toFixed(2).toString() || 'N/A', margin + 145, posicaoY);
      pdf.text((produto.quantidade * produto.valorUnitario).toFixed(2).toString() || 'N/A', margin + 170, posicaoY);
      
      posicaoY += 7;
      
      // Se estourar a página, criamos uma nova
      if (posicaoY > pageHeight - margin) {
        pdf.addPage();
        posicaoY = margin + 20;
      }
    });
  }
  
  // Totais
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VALOR TOTAL DA NOTA', margin, posicaoY + 20);
  
  pdf.setFontSize(fonteNormal);
  pdf.text(`R$ ${notaFiscal.valorTotal?.toFixed(2) || '0.00'}`, margin + 65, posicaoY + 20);
  
  // Informações adicionais
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMAÇÕES ADICIONAIS', margin, posicaoY + 35);
  
  pdf.setFontSize(fontePequena);
  pdf.setFont('helvetica', 'normal');
  pdf.text(notaFiscal.informacoesAdicionais || 'Documento sem valor fiscal - HOMOLOGAÇÃO', margin, posicaoY + 40);
  
  // Retornar como data URL para visualização no navegador
  return pdf.output('datauristring');
}