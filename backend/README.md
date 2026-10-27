# Topa-aí — Back-end (Node.js + Express)

Casos de uso implementados:

- **5.2 — Criar Atividade** — plano: [`docs/plano-acao-criar-atividade.md`](../docs/plano-acao-criar-atividade.md)
- **Inscrever-se em atividade** (caso de uso principal) — plano: [`docs/plano-acao-inscricao-atividade.md`](../docs/plano-acao-inscricao-atividade.md)

## Endpoints

Todos exigem `Authorization: Bearer <jwt>`.

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/api/atividades` | Cria atividade (organizador = usuário do token) |
| `GET` | `/api/atividades` | Lista atividades públicas e agendadas, com `vagas`. Filtros: `tipo`, `nivel`, `publicoAlvo`, `local` (parcial), `data` (AAAA-MM-DD), `comVaga=true` |
| `GET` | `/api/atividades/:id` | Detalhes da atividade + vagas restantes |
| `POST` | `/api/atividades/:id/participacoes` | Solicita participação (status `PENDENTE`) |
| `GET` | `/api/atividades/:id/participacoes` | Organizador vê as solicitações da atividade |
| `PATCH` | `/api/participacoes/:id` | Organizador responde: `{ "decisao": "ACEITAR" }` ou `{ "decisao": "RECUSAR" }` |

Erros: `400` dados inválidos · `401` sem login · `403` sem permissão · `404` não encontrado · `409` regra de negócio (sem vagas, duplicidade, já respondida).

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

Fluxo de inscrição (use um token com outro `sub` para o participante):

```bash
TOKEN_JOAO=$(node -e "console.log(require('jsonwebtoken').sign({sub:2,nome:'Joao'}, 'troque-este-segredo'))")

# listar com filtros
curl "http://localhost:3000/api/atividades?tipo=basquete&nivel=iniciante&comVaga=true" -H "Authorization: Bearer $TOKEN_JOAO"

# solicitar participação na atividade 1
curl -X POST http://localhost:3000/api/atividades/1/participacoes -H "Authorization: Bearer $TOKEN_JOAO"

# organizador aceita a solicitação 1
curl -X PATCH http://localhost:3000/api/participacoes/1 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"decisao":"ACEITAR"}'
```

> Com MySQL, o `sub` do token precisa existir na tabela `usuario` (chave estrangeira).
