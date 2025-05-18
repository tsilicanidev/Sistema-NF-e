import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DanfeOptions {
  orientacao?: 'portrait' | 'landscape';
  unidade?: 'pt' | 'mm' | 'cm' | 'in';
  formato?: [number, number];
  margens?: {
    topo: number;
    direita: number;
    baixo: number;
    esquerda: number;
  };
}

const defaultOptions: DanfeOptions = {
  orientacao: 'portrait',
  unidade: 'mm',
  formato: [210, 297], // A4
  margens: {
    topo: 10,
    direita: 10,
    baixo: 10,
    esquerda: 10
  }
};

export function gerarDANFE(notaFiscal: any, options: DanfeOptions = defaultOptions): string {
  const pdf = new jsPDF(options.orientacao, options.unidade, options.formato);
  
  // Configurações
  const margens = options.margens || defaultOptions.margens;
  const larguraPagina = options.formato?.[0] || 210;
  const alturaPagina = options.formato?.[1] || 297;
  
  // Fontes e tamanhos
  const fonteTitulo = 12;
  const fonteSubtitulo = 10;
  const fonteNormal = 8;
  const fontePequena = 6;

  // Cores
  const preto = '#000000';
  const cinzaClaro = '#F5F5F5';
  
  // Cabeçalho - Identificação do Documento
  pdf.setFillColor(cinzaClaro);
  pdf.rect(margens.esquerda, margens.topo, larguraPagina - 2 * margens.esquerda, 30, 'F');
  
  pdf.setFontSize(fonteTitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DANFE', larguraPagina / 2, margens.topo + 10, { align: 'center' });
  
  pdf.setFontSize(fonteSubtitulo);
  pdf.text('Documento Auxiliar da Nota Fiscal Eletrônica', larguraPagina / 2, margens.topo + 18, { align: 'center' });
  
  // Informações da nota
  pdf.setFontSize(fonteNormal);
  pdf.setFont('helvetica', 'normal');
  
  // Chave de acesso
  pdf.text(`Chave de Acesso: ${notaFiscal.chave || '0'.repeat(44)}`, margens.esquerda, margens.topo + 40);
  
  // Protocolo de autorização
  pdf.text(`Protocolo de Autorização: ${notaFiscal.protocolo || 'N/A'}`, margens.esquerda, margens.topo + 45);
  
  // Dados do emitente
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EMITENTE', margens.esquerda, margens.topo + 55);
  
  pdf.setFontSize(fonteNormal);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Razão Social: ${notaFiscal.emissor?.razaoSocial || 'N/A'}`, margens.esquerda, margens.topo + 60);
  pdf.text(`CNPJ: ${notaFiscal.emissor?.cnpj || 'N/A'}`, margens.esquerda, margens.topo + 65);
  pdf.text(`Endereço: ${notaFiscal.emissor?.endereco?.logradouro || 'N/A'}, ${notaFiscal.emissor?.endereco?.numero || 'N/A'}`, margens.esquerda, margens.topo + 70);
  pdf.text(`${notaFiscal.emissor?.endereco?.municipio || 'N/A'} - ${notaFiscal.emissor?.endereco?.uf || 'N/A'}`, margens.esquerda, margens.topo + 75);
  
  // Dados do destinatário
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESTINATÁRIO', margens.esquerda, margens.topo + 85);
  
  pdf.setFontSize(fonteNormal);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nome: ${notaFiscal.destinatario?.nome || 'N/A'}`, margens.esquerda, margens.topo + 90);
  pdf.text(`CPF/CNPJ: ${notaFiscal.destinatario?.documento || 'N/A'}`, margens.esquerda, margens.topo + 95);
  pdf.text(`Endereço: ${notaFiscal.destinatario?.endereco?.logradouro || 'N/A'}, ${notaFiscal.destinatario?.endereco?.numero || 'N/A'}`, margens.esquerda, margens.topo + 100);
  pdf.text(`${notaFiscal.destinatario?.endereco?.municipio || 'N/A'} - ${notaFiscal.destinatario?.endereco?.uf || 'N/A'}`, margens.esquerda, margens.topo + 105);
  
  // Tabela de produtos
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PRODUTOS', margens.esquerda, margens.topo + 115);
  
  // Cabeçalho da tabela
  const inicioTabela = margens.topo + 120;
  const larguraTabela = larguraPagina - 2 * margens.esquerda;
  
  pdf.setFillColor(cinzaClaro);
  pdf.rect(margens.esquerda, inicioTabela, larguraTabela, 8, 'F');
  
  pdf.setFontSize(fontePequena);
  pdf.text('CÓDIGO', margens.esquerda + 5, inicioTabela + 5);
  pdf.text('DESCRIÇÃO', margens.esquerda + 30, inicioTabela + 5);
  pdf.text('NCM', margens.esquerda + 100, inicioTabela + 5);
  pdf.text('QUANT.', margens.esquerda + 120, inicioTabela + 5);
  pdf.text('VALOR UNIT.', margens.esquerda + 145, inicioTabela + 5);
  pdf.text('VALOR TOTAL', margens.esquerda + 170, inicioTabela + 5);
  
  // Dados dos produtos
  let posicaoY = inicioTabela + 12;
  
  if (notaFiscal.produtos && notaFiscal.produtos.length > 0) {
    notaFiscal.produtos.forEach((produto: any, index: number) => {
      pdf.setFontSize(fontePequena);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(produto.codigo || 'N/A', margens.esquerda + 5, posicaoY);
      pdf.text(produto.descricao || 'N/A', margens.esquerda + 30, posicaoY);
      pdf.text(produto.ncm || 'N/A', margens.esquerda + 100, posicaoY);
      pdf.text(produto.quantidade?.toString() || 'N/A', margens.esquerda + 120, posicaoY);
      pdf.text(produto.valorUnitario?.toFixed(2).toString() || 'N/A', margens.esquerda + 145, posicaoY);
      pdf.text((produto.quantidade * produto.valorUnitario).toFixed(2).toString() || 'N/A', margens.esquerda + 170, posicaoY);
      
      posicaoY += 7;
      
      // Se estourar a página, criamos uma nova
      if (posicaoY > alturaPagina - margens.baixo) {
        pdf.addPage();
        posicaoY = margens.topo + 20;
      }
    });
  }
  
  // Totais
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VALOR TOTAL DA NOTA', margens.esquerda, posicaoY + 20);
  
  pdf.setFontSize(fonteNormal);
  pdf.text(`R$ ${notaFiscal.valorTotal?.toFixed(2) || '0.00'}`, margens.esquerda + 65, posicaoY + 20);
  
  // Informações adicionais
  pdf.setFontSize(fonteSubtitulo);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMAÇÕES ADICIONAIS', margens.esquerda, posicaoY + 35);
  
  pdf.setFontSize(fontePequena);
  pdf.setFont('helvetica', 'normal');
  pdf.text(notaFiscal.informacoesAdicionais || 'Documento sem valor fiscal - HOMOLOGAÇÃO', margens.esquerda, posicaoY + 40);
  
  // Retornar como data URL para visualização no navegador
  return pdf.output('datauristring');
}