import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import validarXmlRouter from './src/api/validar-xml';

const app = express();

app.use(cors());
app.use(bodyParser.text({ type: 'text/xml' }));

app.use('/api/validar-xml', validarXmlRouter);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor Express rodando em http://localhost:${PORT}`);
});
