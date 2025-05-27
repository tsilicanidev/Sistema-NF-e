
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

type NotaFiscal = {
  id: string;
  chave: string;
  status: string;
  xml_url: string;
  pdf_url: string;
};

export function ListaDanfe() {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);

  useEffect(() => {
    const carregarNotas = async () => {
      const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*')
        .order('emitida_em', { ascending: false });

      if (!error && data) setNotas(data as NotaFiscal[]);
    };
    carregarNotas();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Notas Fiscais Emitidas</h2>
      <table className="w-full table-auto border text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Chave</th>
            <th className="p-2">Status</th>
            <th className="p-2">XML</th>
            <th className="p-2">DANFE</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nfe) => (
            <tr key={nfe.id} className="border-t">
              <td className="p-2">{nfe.chave}</td>
              <td className="p-2">{nfe.status}</td>
              <td className="p-2">
                <a href={nfe.xml_url} target="_blank" className="text-blue-600 hover:underline">
                  Baixar XML
                </a>
              </td>
              <td className="p-2">
                <a href={nfe.pdf_url} target="_blank" className="text-green-600 hover:underline">
                  Baixar DANFE
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
