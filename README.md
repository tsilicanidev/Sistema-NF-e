
# Sistema NF-e (Vite + React)

Este projeto é um emissor de NF-e modelo 55 com geração de DANFE em PDF, compatível com Vite.

## ✅ Tecnologias

- React 18+
- Vite
- TypeScript
- TailwindCSS
- Supabase
- jsPDF

## 🚀 Como rodar localmente

```bash
# Instalar dependências
yarn

# Rodar o servidor de desenvolvimento
yarn dev
```

Acesse `http://localhost:3000`

## 🛠️ Build para produção

```bash
yarn build
```

Os arquivos finais estarão na pasta `dist`.

## 📦 Deploy no Vercel

- Projeto já está preparado para Vite.
- **Garanta que não exista `vercel.json` com chave `builds`.**
- Configure no painel da Vercel:
  - Framework: `Vite`
  - Build Command: `yarn build`
  - Output Directory: `dist`

## ❌ Sem dependências do Next.js
Todos os arquivos relacionados ao Next.js foram removidos.
