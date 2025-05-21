import fs from 'fs';
import path from 'path';
import libxmljs from 'libxmljs2';

export function validarXmlNFe(xml: string): { valido: boolean; erros?: string[] } {
  try {
    const xmlDoc = libxmljs.parseXml(xml);

    const schemaPath = path.resolve('schemas', 'leiauteNFe_v4.00.xsd');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schemaDoc = libxmljs.parseXml(schemaContent);

    const valido = xmlDoc.validate(schemaDoc);

    return valido
      ? { valido: true }
      : { valido: false, erros: xmlDoc.validationErrors.map(e => e.message) };
  } catch (err) {
    return { valido: false, erros: [err instanceof Error ? err.message : 'Erro desconhecido'] };
  }
}
