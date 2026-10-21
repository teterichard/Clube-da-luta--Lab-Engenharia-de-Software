# Topa-aí — Back-end (Node.js + Express)

Implementação inicial do caso de uso **5.2 — Criar Atividade**.
Plano completo: [`docs/plano-acao-criar-atividade.md`](../docs/plano-acao-criar-atividade.md).

## Rodando

```bash
cd backend
npm install
cp .env.example .env

# Opção A: sem banco (dados em memória)
DB_IN_MEMORY=true npm run dev

# Opção B: com MySQL via Docker (aplica db/schema.sql automaticamente)
docker compose up -d
npm run dev
```

## Testes

```bash
npm test
```

## Exemplo de chamada

Enquanto o UC de login não existe, gere um token de teste:

```bash
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({sub:1,nome:'Org'}, 'troque-este-segredo'))")

curl -i http://localhost:3000/api/atividades \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Basquete no Ibirapuera",
    "tipo": "basquete",
    "nivel": "iniciante",
    "publicoAlvo": "adultos",
    "dataHora": "2026-11-20T18:00:00-03:00",
    "local": "Parque Ibirapuera - quadra 3",
    "numeroIntegrantes": 10,
    "visibilidade": "PUBLICA"
  }'
```

> Com MySQL, o `sub` do token precisa existir na tabela `usuario` (chave estrangeira).
