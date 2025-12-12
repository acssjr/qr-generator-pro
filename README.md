# QR Code Generator Pro

Gerador de QR Code profissional com personalização avançada e rastreamento de scans.

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **TailwindCSS** - Estilização utility-first
- **TypeScript** - Tipagem estática
- **Cloudflare Workers** - API de tracking
- **D1 Database** - Banco de dados serverless
- **Vercel** - Hospedagem

## ✨ Funcionalidades

- ✅ Geração de QR Code em tempo real
- ✅ Personalização de cores, estilos e logo
- ✅ Download em PNG e SVG
- ✅ Rastreamento de scans (país, cidade, dispositivo, navegador)
- ✅ Dashboard de estatísticas
- ✅ Deep links para acesso direto às estatísticas
- ✅ Armazenamento local de QR Codes criados

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 🌐 Deploy na Vercel

1. Conecte seu repositório GitHub à Vercel
2. A Vercel detectará automaticamente o projeto Next.js
3. Deploy automático a cada push

## 📁 Estrutura

```
src/
├── app/
│   ├── globals.css      # Estilos globais
│   ├── layout.tsx       # Layout principal
│   └── page.tsx         # Página principal
├── components/
│   ├── CustomizationPanel.tsx
│   ├── DashboardModal.tsx
│   ├── QRCodeDisplay.tsx
│   └── Toast.tsx
├── lib/
│   └── api.ts           # Serviço de API
└── types/
    └── index.ts         # Tipos TypeScript

worker/                  # Cloudflare Worker (API de tracking)
├── src/
│   └── index.js
├── schema.sql
└── wrangler.toml
```

## 📊 API de Tracking

O Worker está hospedado em: `https://qr-tracker.acssjr.workers.dev`

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/links | Criar link rastreável |
| GET | /api/links | Listar todos os links |
| GET | /api/stats/:id | Estatísticas de um link |
| GET | /t/:shortCode | Redirecionar e registrar scan |

## 📝 Licença

MIT
