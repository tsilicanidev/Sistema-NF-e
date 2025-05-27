
const express = require('express');
const cors = require('cors');
const { XMLValidator } = require('fast-xml-parser');

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.text({ type: '*/*' }));

app.post('/api/validar-xml', (req, res) => {
  try {
    const xml = req.body;

    if (!xml) {
      return res.status(400).json({ valid: false, message: 'XML não fornecido' });
    }

    const result = XMLValidator.validate(xml, { allowBooleanAttributes: true });

    if (result === true) {
      return res.status(200).json({ valid: true, message: 'XML válido' });
    } else {
      return res.status(400).json({ valid: false, message: 'XML inválido', errors: result });
    }
  } catch (err) {
    return res.status(500).json({ valid: false, message: 'Erro ao validar XML', error: err.message });
  }
});

app.listen(5173, () => {
  console.log('Servidor rodando em http://localhost:5173');
});
