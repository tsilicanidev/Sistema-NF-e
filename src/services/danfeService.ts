import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    topo: 7,
    direita: 7,
    baixo: 7,
    esquerda: 7
  }
};

export function gerarDANFE(notaFiscal: any, options: DanfeOptions = defaultOptions): string {
  const pdf = new jsPDF(options.orientacao, options.unidade, options.formato);
  
  // Configurações
  const margens = options.margens || defaultOptions.margens;
  const larguraPagina = options.formato?.[0] || 210;
  const alturaPagina = options.formato?.[1] || 297;
  
  // Fontes e tamanhos
  const fonteTitulo = 14;
  const fonteSubtitulo = 12;
  const fonteNormal = 8;
  const fontePequena = 6;

  // Cores
  const preto = '#000000';
  const cinzaClaro = '#F5F5F5';
  
  // Cabeçalho - Recibo
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margens.esquerda, margens.topo, larguraPagina - 2 * margens.esquerda, 35, 'S');
  
  // Divisão do recibo
  pdf.line(
    larguraPagina - margens.direita - 60,
    margens.topo,
    larguraPagina - margens.direita - 60,
    margens.topo + 35
  );

  // Logo "NF-e" no canto superior esquerdo
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NF-e', margens.esquerda + 5, margens.topo + 10);
  pdf.setFontSize(8);
  pdf.text('Nº. ' + (notaFiscal.numero || 'N/A'), margens.esquerda + 5, margens.topo + 15);
  pdf.text('Série: ' + (notaFiscal.serie || '1'), margens.esquerda + 5, margens.topo + 20);

  // Título DANFE centralizado
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DOCUMENTO AUXILIAR DA', larguraPagina/2, margens.topo + 8, { align: 'center' });
  pdf.text('NOTA FISCAL ELETRÔNICA', larguraPagina/2, margens.topo + 13, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('0 - ENTRADA', larguraPagina/2 - 20, margens.topo + 20);
  pdf.text('1 - SAÍDA', larguraPagina/2 - 20, margens.topo + 25);
  
  // Retângulo para o tipo (0-entrada, 1-saída)
  pdf.rect(larguraPagina/2 - 5, margens.topo + 17, 8, 8, 'S');
  pdf.setFontSize(10);
  pdf.text(notaFiscal.tipo === '0' ? '0' : '1', larguraPagina/2 - 2, margens.topo + 23);

  // Chave de acesso
  pdf.setFontSize(8);
  pdf.text('Chave de Acesso', larguraPagina - margens.direita - 55, margens.topo + 5);
  pdf.setFontSize(10);
  const chave = notaFiscal.chave || '0'.repeat(44);
  pdf.text(chave.match(/.{4}/g)?.join(' ') || '', larguraPagina - margens.direita - 55, margens.topo + 10);

  // Protocolo
  pdf.setFontSize(8);
  pdf.text(
    `Protocolo de Autorização: ${notaFiscal.protocolo || 'N/A'}`,
    larguraPagina - margens.direita - 55,
    margens.topo + 20
  );
  pdf.text(
    `Data de Autorização: ${format(new Date(notaFiscal.dataAutorizacao || new Date()), 'dd/MM/yyyy HH:mm:ss')}`,
    larguraPagina - margens.direita - 55,
    margens.topo + 25
  );

  // Dados do Emitente
  const yEmitente = margens.topo + 40;
  pdf.rect(margens.esquerda, yEmitente, larguraPagina - 2 * margens.esquerda, 30, 'S');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(notaFiscal.emissor?.razaoSocial || 'N/A', margens.esquerda + 5, yEmitente + 10);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`CNPJ: ${notaFiscal.emissor?.cnpj || 'N/A'}`, margens.esquerda + 5, yEmitente + 15);
  pdf.text(`IE: ${notaFiscal.emissor?.inscricaoEstadual || 'N/A'}`, margens.esquerda + 100, yEmitente + 15);
  
  const enderecoEmitente = [
    notaFiscal.emissor?.endereco?.logradouro,
    notaFiscal.emissor?.endereco?.numero,
    notaFiscal.emissor?.endereco?.bairro,
    notaFiscal.emissor?.endereco?.municipio,
    notaFiscal.emissor?.endereco?.uf,
    notaFiscal.emissor?.endereco?.cep
  ].filter(Boolean).join(', ');
  
  pdf.text(enderecoEmitente, margens.esquerda + 5, yEmitente + 20);

  // Dados do Destinatário
  const yDestinatario = yEmitente + 35;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margens.esquerda, yDestinatario, larguraPagina - 2 * margens.esquerda, 35, 'FD');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESTINATÁRIO / REMETENTE', margens.esquerda + 5, yDestinatario + 5);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Nome/Razão Social: ${notaFiscal.destinatario?.nome || 'N/A'}`, margens.esquerda + 5, yDestinatario + 12);
  pdf.text(`CNPJ/CPF: ${notaFiscal.destinatario?.documento || 'N/A'}`, margens.esquerda + 5, yDestinatario + 17);
  pdf.text(`Endereço: ${notaFiscal.destinatario?.endereco?.logradouro || 'N/A'}, ${notaFiscal.destinatario?.endereco?.numero || 'N/A'}`, margens.esquerda + 5, yDestinatario + 22);
  pdf.text(`Bairro: ${notaFiscal.destinatario?.endereco?.bairro || 'N/A'}`, margens.esquerda + 5, yDestinatario + 27);
  pdf.text(`Município: ${notaFiscal.destinatario?.endereco?.municipio || 'N/A'} - ${notaFiscal.destinatario?.endereco?.uf || 'N/A'}`, margens.esquerda + 100, yDestinatario + 27);
  pdf.text(`CEP: ${notaFiscal.destinatario?.endereco?.cep || 'N/A'}`, margens.esquerda + 5, yDestinatario + 32);

  // Tabela de Produtos
  const yProdutos = yDestinatario + 40;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS DOS PRODUTOS / SERVIÇOS', margens.esquerda + 5, yProdutos);

  const headers = [
    ['CÓDIGO', 'DESCRIÇÃO', 'NCM', 'CST', 'CFOP', 'UN', 'QUANT.', 'VALOR UNIT.', 'VALOR TOTAL', 'BC ICMS', 'VALOR ICMS', 'VALOR IPI', 'ALÍQ. ICMS', 'ALÍQ. IPI']
  ];

  const data = notaFiscal.produtos?.map((produto: any) => [
    produto.codigo || '',
    produto.descricao || '',
    produto.ncm || '',
    produto.icms?.cst || '',
    produto.cfop || '',
    produto.unidade || '',
    produto.quantidade?.toString() || '',
    produto.valorUnitario?.toFixed(2) || '',
    (produto.quantidade * produto.valorUnitario)?.toFixed(2) || '',
    produto.icms?.baseCalculo?.toFixed(2) || '',
    produto.icms?.valor?.toFixed(2) || '',
    produto.ipi?.valor?.toFixed(2) || '',
    produto.icms?.aliquota?.toString() || '',
    produto.ipi?.aliquota?.toString() || ''
  ]) || [];

  (pdf as any).autoTable({
    head: headers,
    body: data,
    startY: yProdutos + 5,
    margin: { left: margens.esquerda, right: margens.direita },
    styles: {
      fontSize: 6,
      cellPadding: 1
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 15 }, // CÓDIGO
      1: { cellWidth: 45 }, // DESCRIÇÃO
      2: { cellWidth: 15 }, // NCM
      3: { cellWidth: 10 }, // CST
      4: { cellWidth: 10 }, // CFOP
      5: { cellWidth: 10 }, // UN
      6: { cellWidth: 15 }, // QUANT.
      7: { cellWidth: 15 }, // VALOR UNIT.
      8: { cellWidth: 15 }, // VALOR TOTAL
      9: { cellWidth: 15 }, // BC ICMS
      10: { cellWidth: 15 }, // VALOR ICMS
      11: { cellWidth: 15 }, // VALOR IPI
      12: { cellWidth: 10 }, // ALÍQ. ICMS
      13: { cellWidth: 10 } // ALÍQ. IPI
    }
  });

  // Cálculo do Imposto
  const finalY = (pdf as any).lastAutoTable.finalY;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CÁLCULO DO IMPOSTO', margens.esquerda + 5, finalY + 10);

  // Totais
  const yTotais = finalY + 15;
  pdf.rect(margens.esquerda, yTotais, larguraPagina - 2 * margens.esquerda, 25, 'S');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('BASE DE CÁLC. ICMS', margens.esquerda + 5, yTotais + 5);
  pdf.text('VALOR DO ICMS', margens.esquerda + 45, yTotais + 5);
  pdf.text('BASE DE CÁLC. ICMS ST', margens.esquerda + 85, yTotais + 5);
  pdf.text('VALOR DO ICMS ST', margens.esquerda + 125, yTotais + 5);
  pdf.text('VALOR TOTAL DOS PRODUTOS', margens.esquerda + 165, yTotais + 5);

  pdf.setFont('helvetica', 'bold');
  pdf.text((notaFiscal.totais?.baseCalculoIcms || '0.00').toString(), margens.esquerda + 5, yTotais + 10);
  pdf.text((notaFiscal.totais?.valorIcms || '0.00').toString(), margens.esquerda + 45, yTotais + 10);
  pdf.text((notaFiscal.totais?.baseCalculoIcmsSt || '0.00').toString(), margens.esquerda + 85, yTotais + 10);
  pdf.text((notaFiscal.totais?.valorIcmsSt || '0.00').toString(), margens.esquerda + 125, yTotais + 10);
  pdf.text((notaFiscal.valorTotal || '0.00').toString(), margens.esquerda + 165, yTotais + 10);

  // Transportador
  const yTransportador = yTotais + 30;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TRANSPORTADOR / VOLUMES TRANSPORTADOS', margens.esquerda + 5, yTransportador);

  pdf.rect(margens.esquerda, yTransportador + 5, larguraPagina - 2 * margens.esquerda, 25, 'S');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('NOME / RAZÃO SOCIAL', margens.esquerda + 5, yTransportador + 10);
  pdf.text('FRETE POR CONTA', margens.esquerda + 100, yTransportador + 10);
  pdf.text('PLACA DO VEÍCULO', margens.esquerda + 140, yTransportador + 10);
  pdf.text('UF', margens.esquerda + 170, yTransportador + 10);

  // Dados Adicionais
  const yDadosAdicionais = yTransportador + 35;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DADOS ADICIONAIS', margens.esquerda + 5, yDadosAdicionais);

  pdf.rect(margens.esquerda, yDadosAdicionais + 5, larguraPagina - 2 * margens.esquerda, 35, 'S');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('INFORMAÇÕES COMPLEMENTARES', margens.esquerda + 5, yDadosAdicionais + 10);
  pdf.text(notaFiscal.informacoesAdicionais || 'DOCUMENTO EMITIDO EM AMBIENTE DE HOMOLOGAÇÃO', margens.esquerda + 5, yDadosAdicionais + 15, {
    maxWidth: larguraPagina - 2 * margens.esquerda - 10
  });

  // Retornar como data URL para visualização no navegador
  return pdf.output('datauristring');
}