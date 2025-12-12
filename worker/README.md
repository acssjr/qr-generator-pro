# QR Code Tracker - Cloudflare Worker

API para rastreamento de QR Codes usando Cloudflare Workers + D1 Database.

## 🚀 Setup Inicial

### 1. Fazer login no Cloudflare

```bash
npx wrangler login
```

### 2. Criar o banco de dados D1

```bash
npx wrangler d1 create qr-tracker-db
```

**IMPORTANTE:** Copie o `database_id` retornado e cole no arquivo `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "qr-tracker-db"
database_id = "COLE_O_ID_AQUI"
```

### 3. Executar a migração do banco

```bash
# Localmente (para testes)
npx wrangler d1 execute qr-tracker-db --local --file=./schema.sql

# Em produção
npx wrangler d1 execute qr-tracker-db --remote --file=./schema.sql
```

### 4. Testar localmente

```bash
npx wrangler dev
```

### 5. Deploy para produção

```bash
npx wrangler deploy
```

## 📡 API Endpoints

### Criar Link Rastreável
```http
POST /api/links
Content-Type: application/json

{
    "url": "https://meusite.com",
    "title": "Campanha Marketing"
}
```

**Resposta:**
```json
{
    "success": true,
    "data": {
        "id": "uuid-aqui",
        "shortCode": "abc123",
        "originalUrl": "https://meusite.com",
        "trackingUrl": "https://seu-worker.workers.dev/t/abc123",
        "title": "Campanha Marketing"
    }
}
```

### Listar Links
```http
GET /api/links
```

### Obter Estatísticas
```http
GET /api/stats/{id ou shortCode}
```

**Resposta:**
```json
{
    "success": true,
    "data": {
        "link": { ... },
        "stats": {
            "totalClicks": 150,
            "clicksByDay": [...],
            "clicksByCountry": [...],
            "clicksByDevice": [...],
            "clicksByBrowser": [...],
            "clicksByOS": [...],
            "recentClicks": [...]
        }
    }
}
```

### Redirecionar (URL do QR Code)
```http
GET /t/{shortCode}
```
Registra o clique e redireciona para a URL original.

## 🔧 Variáveis de Ambiente

No `wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGINS = "https://seusite.com,http://localhost:5500"
```

## 📊 Dados Coletados em Cada Scan

- Data/hora do escaneamento
- País e cidade (via Cloudflare)
- Tipo de dispositivo (mobile/tablet/desktop)
- Navegador
- Sistema operacional
- Referer (se disponível)
- Hash do IP (para privacidade)
