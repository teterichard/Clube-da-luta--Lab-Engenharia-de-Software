# Topa-aí — Back-end (Node.js + Express)

Casos de uso implementados:

- **5.2 — Criar Atividade** — plano: [`docs/plano-acao-criar-atividade.md`](../docs/plano-acao-criar-atividade.md)
- **Inscrever-se em atividade** (caso de uso principal) — plano: [`docs/plano-acao-inscricao-atividade.md`](../docs/plano-acao-inscricao-atividade.md)
- **Comunidades** — criar, descobrir, entrar/sair e administrar membros (portado do protótipo Java)
- **Notificações** (padrão Observer) — solicitação, resposta, convite, mudança e cancelamento de atividade
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
| `GET` | `/api/usuarios/me` | Perfil do usuário logado + `reputacao` `{ media, total }` (notas dos organizadores) |
| `PATCH` | `/api/usuarios/me` | Edita `nome`, `localizacao`, `idade`, `proficiencia` |
| `POST` | `/api/atividades` | Cria atividade (organizador = usuário do token) |
| `GET` | `/api/atividades` | Lista atividades públicas e agendadas, com `vagas`. Filtros: `tipo`, `nivel`, `publicoAlvo`, `local` (parcial), `data` (AAAA-MM-DD), `comVaga=true`. Esconde as que a idade do usuário não permite (RF19) |
| `GET` | `/api/atividades/organizadas` | Atividades que eu organizo (todas), com `vagas` e `pendentes` |
| `GET` | `/api/atividades/:id` | Detalhes da atividade + vagas restantes |
| `PATCH` | `/api/atividades/:id` | Organizador edita (só `AGENDADA`; não reduz abaixo dos aceitos) |
| `DELETE` | `/api/atividades/:id` | Organizador exclui (só se ninguém foi aceito — senão, cancele) |
| `POST` | `/api/atividades/:id/iniciar` | `AGENDADA` → `ATIVA` |
| `POST` | `/api/atividades/:id/cancelar` | `AGENDADA`/`ATIVA` → `CANCELADA` |
| `POST` | `/api/atividades/:id/concluir` | `ATIVA` → `CONCLUIDA` (avisa os confirmados para avaliar) |
| `POST` | `/api/atividades/:id/participacoes` | Solicita participação (status `PENDENTE`) |
| `GET` | `/api/atividades/:id/participacoes` | Organizador vê as solicitações da atividade (com `notaDoOrganizador` depois de avaliar) |
| `POST` | `/api/atividades/:id/avaliacoes` | Participante confirmado avalia a atividade concluída: `{ "nota": 1-5, "comentario"? }` (RF12/RF13) |
| `GET` | `/api/atividades/:id/avaliacoes` | `{ media, total, avaliacoes, minhaAvaliacao, possoAvaliar }` |
| `POST` | `/api/atividades/:id/participantes/:usuarioId/avaliacao` | Organizador avalia um participante confirmado: `{ "nota" }` (RF14) |
| `POST` | `/api/atividades/:id/convites` | Organizador convida pelo e-mail: `{ "email": "ana@exemplo.com" }` |
| `GET` | `/api/atividades/:id/convites` | Organizador vê os convites e respostas |
| `GET` | `/api/convites` | Convites recebidos pelo usuário logado (`?status=PENDENTE`) |
| `PATCH` | `/api/convites/:id` | Convidado responde `{ "decisao": "ACEITAR" }` ou `RECUSAR`; aceitar confirma a presença |
| `PATCH` | `/api/participacoes/:id` | Organizador responde: `{ "decisao": "ACEITAR" }` ou `{ "decisao": "RECUSAR" }` |
| `POST` | `/api/comunidades` | Cria comunidade `{ nome, descricao, visibilidade, modalidade?, publicoAlvo?, vagasMaximas? }`; quem cria vira admin |
| `GET` | `/api/comunidades` | Todas as comunidades, com `totalMembros`, `vagas` (`null` = sem limite), `meuStatus`, `meuPapel`. Filtros: `busca`, `modalidade`, `publicoAlvo`, `comVaga=true` |
| `GET` | `/api/comunidades/minhas` | Comunidades de que faço parte (inclui pedidos pendentes) |
| `GET` / `PATCH` | `/api/comunidades/:id` | Detalhes / admin edita |
| `GET` | `/api/comunidades/:id/membros` | Membros (privada: só para membros; pendentes: só para admins) |
| `POST` | `/api/comunidades/:id/membros` | Entrar (pública: na hora; privada: pedido pendente) |
| `DELETE` | `/api/comunidades/:id/membros/me` | Sair (o último admin não pode sair) |
| `PATCH` | `/api/comunidades/:id/membros/:usuarioId` | Admin: `{ "decisao": "ACEITAR" \| "RECUSAR" }` ou `{ "papel": "ADMIN" }` |
| `GET` / `POST` | `/api/comunidades/:id/mensagens` | Mural (RF17), só membros ativos: `{ "conteudo" }` |
| `POST` | `/api/comunidades/:id/avaliacoes` | Membro avalia a comunidade depois de 3 meses dentro dela (RF18) |
| `GET` | `/api/comunidades/:id/avaliacoes` | `{ media, total, avaliacoes, minhaAvaliacao, possoAvaliarEm }` |
| `GET` | `/api/notificacoes` | Minhas notificações `{ naoLidas, itens }` (`?naoLidas=true` filtra) |
| `PATCH` | `/api/notificacoes/:id/lida` | Marca uma como lida |
| `POST` | `/api/notificacoes/lidas` | Marca todas como lidas |
| `GET` | `/api/participacoes/minhas` | Minhas inscrições, com resumo de cada atividade |
| `POST` | `/api/participacoes/:id/cancelar` | Participante desiste (pendente ou aceita; devolve a vaga) |

Erros: `400` dados inválidos · `401` sem login · `403` sem permissão (inclui faixa etária) · `404` não encontrado · `409` regra de negócio (sem vagas, duplicidade, já respondida, idade não informada).

**Faixa etária (RF19/RNF08):** atividade ou comunidade com `publicoAlvo` `adultos` só aceita 18+ e `menores` só aceita menores de 18.
A idade vem do perfil; sem ela, a pessoa precisa informar antes de entrar onde há restrição.

**Deploy:** a API aceita `DATABASE_URL`/`MYSQL_URL`, cria as tabelas ao subir e libera o front pelo `CORS_ORIGIN`.
Passo a passo em [`docs/deploy.md`](../docs/deploy.md). Criar as tabelas sem subir a API: `npm run db:init`.

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
npm test             # unitários + API com repositórios em memória
npm run test:mysql   # integração com MySQL de verdade (precisa do banco no ar, ex.: docker compose up -d)
```

O teste de integração recria o banco `topaai_teste` (configurável em `DB_TEST_NAME`) a partir de `db/schema.sql`,
e o usuário do banco precisa de permissão sobre ele (`db/permissoes-teste.sql`, aplicado automaticamente pelo
`docker compose`). Na esteira de CI ele roda num serviço `mysql:8.0`.

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
