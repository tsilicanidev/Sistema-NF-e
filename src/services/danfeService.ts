import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface NotaFiscal {
  id: string;
  numero: string;
  chave: string;
  destinatario: string;
  valor: number;
  status: 'pendente' | 'autorizada' | 'rejeitada' | 'cancelada';
  data_emissao: string;
}

export function gerarDANFE(nota: NotaFiscal): string {
  // Create PDF
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(16);
  doc.text('DANFE - Documento Auxiliar da Nota Fiscal Eletrônica', 20, 20);
  
  // Add basic info
  doc.setFontSize(12);
  doc.text(`Número: ${nota.numero}`, 20, 40);
  doc.text(`Chave: ${nota.chave}`, 20, 50);
  doc.text(`Destinatário: ${nota.destinatario}`, 20, 60);
  doc.text(`Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valor)}`, 20, 70);
  doc.text(`Data de Emissão: ${new Date(nota.data_emissao).toLocaleDateString('pt-BR')}`, 20, 80);
  doc.text(`Status: ${nota.status.charAt(0).toUpperCase() + nota.status.slice(1)}`, 20, 90);

  // Return as data URL
  return doc.output('datauristring');
}