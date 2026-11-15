# Topa-aí — Back-end (Node.js + Express)

Casos de uso implementados:

- **5.2 — Criar Atividade** — plano: [`docs/plano-acao-criar-atividade.md`](../docs/plano-acao-criar-atividade.md)
- **Inscrever-se em atividade** (caso de uso principal) — plano: [`docs/plano-acao-inscricao-atividade.md`](../docs/plano-acao-inscricao-atividade.md)
- **Convidar pessoas** (RF07, passo 4 do UC 5.2) — atividades privadas só por convite
- **Gestão da atividade** (RF04/RF11) — editar, excluir, iniciar, cancelar e concluir
- **Autenticação** (RF01/RF02) — cadastro, login com senha em bcrypt (RNF04) e perfil

## Endpoints

### Autenticação (públicas)

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/api/auth/cadastro` | Cria a conta `{ nome, email, senha, localizacao?, idade?, proficiencia? }` e devolve `{ token, usuario }` |
| `POST` | `/api/auth/login` | `{ email, senha }` → `{ token, usuario }` |

### Demais rotas

Todas exigem `Authorization: Bearer <jwt>` (o token vem do cadastro ou do login).

| Método | Rota | O que faz |
|---|---|---|
| `GET` | `/api/usuarios/me` | Perfil do usuário logado |
| `PATCH` | `/api/usuarios/me` | Edita `nome`, `localizacao`, `idade`, `proficiencia` |
| `POST` | `/api/atividades` | Cria atividade (organizador = usuário do token) |
| `GET` | `/api/atividades` | Lista atividades públicas e agendadas, com `vagas`. Filtros: `tipo`, `nivel`, `publicoAlvo`, `local` (parcial), `data` (AAAA-MM-DD), `comVaga=true` |
| `GET` | `/api/atividades/:id` | Detalhes da atividade + vagas restantes |
| `PATCH` | `/api/atividades/:id` | Organizador edita (só `AGENDADA`; não reduz abaixo dos aceitos) |
| `DELETE` | `/api/atividades/:id` | Organizador exclui (só se ninguém foi aceito — senão, cancele) |
| `POST` | `/api/atividades/:id/iniciar` | `AGENDADA` → `ATIVA` |
| `POST` | `/api/atividades/:id/cancelar` | `AGENDADA`/`ATIVA` → `CANCELADA` |
| `POST` | `/api/atividades/:id/concluir` | `ATIVA` → `CONCLUIDA` |
| `POST` | `/api/atividades/:id/participacoes` | Solicita participação (status `PENDENTE`) |
| `GET` | `/api/atividades/:id/participacoes` | Organizador vê as solicitações da atividade |
| `POST` | `/api/atividades/:id/convites` | Organizador convida pelo e-mail: `{ "email": "ana@exemplo.com" }` |
| `GET` | `/api/atividades/:id/convites` | Organizador vê os convites e respostas |
| `GET` | `/api/convites` | Convites recebidos pelo usuário logado (`?status=PENDENTE`) |
| `PATCH` | `/api/convites/:id` | Convidado responde `{ "decisao": "ACEITAR" }` ou `RECUSAR`; aceitar confirma a presença |
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

```bash
# cadastro (devolve o token) e login
curl -s http://localhost:3000/api/auth/cadastro -H "Content-Type: application/json" \
  -d '{"nome":"Organizador","email":"org@exemplo.com","senha":"senha1234"}'

TOKEN=$(curl -s http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"org@exemplo.com","senha":"senha1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# criar atividade
curl -i http://localhost:3000/api/atividades \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Basquete no Ibirapuera",
    "tipo": "basquete",
    "nivel": "iniciante",
    "publicoAlvo": "adultos",
    "dataHora": "2026-12-20T18:00:00-03:00",
    "local": "Parque Ibirapuera - quadra 3",
    "numeroIntegrantes": 10,
    "visibilidade": "PUBLICA"
  }'
```

Fluxo de inscrição (cadastre um segundo usuário para ser o participante e guarde o token em `TOKEN_JOAO`):

```bash
# listar com filtros
curl "http://localhost:3000/api/atividades?tipo=basquete&nivel=iniciante&comVaga=true" -H "Authorization: Bearer $TOKEN_JOAO"

# solicitar participação na atividade 1
curl -X POST http://localhost:3000/api/atividades/1/participacoes -H "Authorization: Bearer $TOKEN_JOAO"

# organizador aceita a solicitação 1
curl -X PATCH http://localhost:3000/api/participacoes/1 \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"decisao":"ACEITAR"}'
```

> `scripts/gerarToken.js` continua disponível para gerar tokens de teste rapidamente, mas com MySQL o `sub`
> precisa existir na tabela `usuario`; prefira o cadastro.
