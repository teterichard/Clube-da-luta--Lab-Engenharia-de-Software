# Plano de Ação — Back-end do caso de uso "Criar Atividade" (UC 5.2)

Branch: `feature/criar-atividade-backend`
Stack (seção 6 do documento): **Node.js + Express**, API **REST**, **MySQL**, autenticação **JWT**.

---

## 1. Escopo do caso de uso (seção 5.2 do documento)

**Ator:** Organizador (usuário autenticado).

**Fluxo principal descrito no documento:**

1. Fazer login no Topa-aí.
2. Criar uma atividade na plataforma.
3. Definir data e horário, local, número de integrantes, tipo de atividade, nível, público-alvo e visibilidade (pública ou privada).
4. Convidar pessoas específicas.
5. Receber solicitações de participação.
6. Aceitar ou recusar as solicitações.

**Recorte desta primeira entrega (MVP do back-end):** passos **2 e 3**, ou seja, o endpoint que cria a atividade.
Os passos 1, 4, 5 e 6 dependem de outros casos de uso e ficam como etapas seguintes (seção 6 deste plano):

| Passo | Requisito | Situação nesta branch |
|---|---|---|
| 1. Login | RF01/RF02 | Só o **middleware JWT** que valida o token. Emissão do token (login) fica para o UC de autenticação. |
| 2 e 3. Criar e definir dados | RF03, RF05, RF06, RF11 | **Implementado** |
| 4. Convidar pessoas | RF07 | Próxima etapa |
| 5 e 6. Solicitações | RF09, RF10 | Próxima etapa (regras já existem no domínio Java) |

Requisitos não funcionais atendidos já no MVP: **RNF05** (integridade: validação + constraints no banco), **RNF06** (controle de acesso: só autenticado cria), **RNF02** (operação simples, uma inserção).

---

## 2. Contrato da API

### `POST /api/atividades`

Header: `Authorization: Bearer <jwt>` (o `sub` do token é o id do organizador)

```json
{
  "titulo": "Basquete no Ibirapuera",
  "descricao": "Jogo 5x5, traga água",
  "tipo": "basquete",
  "nivel": "iniciante",
  "publicoAlvo": "adultos",
  "dataHora": "2026-11-20T18:00:00-03:00",
  "local": "Parque Ibirapuera - quadra 3",
  "numeroIntegrantes": 10,
  "visibilidade": "PUBLICA"
}
```

| Resposta | Quando |
|---|---|
| `201 Created` + corpo da atividade + header `Location` | Sucesso. Status inicial `AGENDADA`, `organizadorId` = usuário do token |
| `400 Bad Request` + `{ erro, detalhes[] }` | Dados inválidos (lista todos os campos com problema) |
| `401 Unauthorized` | Sem token, token inválido ou expirado |

### Regras de negócio / validação

| Código | Regra |
|---|---|
| RN01 | `titulo` obrigatório, 3 a 100 caracteres |
| RN02 | `tipo`, `nivel`, `publicoAlvo`, `local` obrigatórios |
| RN03 | `nivel` ∈ {iniciante, intermediario, avancado} |
| RN04 | `dataHora` obrigatória, ISO-8601 válida e **no futuro** |
| RN05 | `numeroIntegrantes` inteiro **≥ 2** (o documento cita formar "pelo menos dois times"; ver pendência P1) |
| RN06 | `visibilidade` ∈ {PUBLICA, PRIVADA}; padrão `PUBLICA` |
| RN07 | Toda atividade nasce com status `AGENDADA` (RF11) |
| RN08 | O organizador é sempre o usuário autenticado; o corpo **não** pode definir `organizadorId` nem `status` |
| RN09 | `descricao` opcional, até 500 caracteres |

---

## 3. Arquitetura (camadas)

```
backend/
├── src/
│   ├── app.js                      # monta o Express (sem listen) — usado nos testes
│   ├── server.js                   # sobe o servidor HTTP
│   ├── config/env.js               # variáveis de ambiente (.env)
│   ├── middlewares/
│   │   ├── autenticacao.js         # valida JWT → req.usuario
│   │   └── tratadorErros.js        # converte erros de domínio em HTTP
│   ├── routes/atividadeRoutes.js   # POST /api/atividades
│   ├── controllers/atividadeController.js
│   ├── services/atividadeService.js        # caso de uso CriarAtividade
│   ├── domain/
│   │   ├── atividade.js            # validação + regras (RN01–RN09)
│   │   ├── enums.js                # Status, Visibilidade, Nivel
│   │   └── erros.js                # ErroValidacao, ErroNaoAutenticado
│   └── repositories/
│       ├── atividadeRepositoryMemoria.js   # testes / dev sem banco
│       └── atividadeRepositoryMySQL.js     # mysql2
├── db/schema.sql                   # tabelas usuario e atividade
├── tests/                          # Jest + Supertest
├── .env.example
└── package.json
```

- **Controller** só traduz HTTP ↔ serviço.
- **Service** orquestra: recebe dados + organizador, chama o domínio, persiste.
- **Domain** concentra as regras, sem depender de Express nem de banco (fácil de testar).
- **Repository** é injetado no app (`criarApp({ atividadeRepository })`), permitindo trocar memória ↔ MySQL.

### Modelo de dados (MySQL)

Baseado no diagrama de classes (seção 5.4), acrescentando `numero_integrantes`, `publico_alvo` e `organizador_id`, que o caso de uso exige e o diagrama ainda não tem (ver pendência P2).

---

## 4. Plano de ação (etapas)

| # | Etapa | Entregável | Critério de pronto |
|---|---|---|---|
| 1 | Setup do projeto | `backend/package.json`, Express, Jest, ESLint opcional, `.env.example` | `npm test` roda |
| 2 | Domínio Atividade | `domain/atividade.js`, `enums.js`, `erros.js` | Testes unitários das RN01–RN09 passando |
| 3 | Repositório em memória | `atividadeRepositoryMemoria.js` | Salva e gera id |
| 4 | Serviço CriarAtividade | `atividadeService.js` | Testes do serviço passando |
| 5 | Middleware JWT | `middlewares/autenticacao.js` | 401 sem token / token inválido |
| 6 | Rota + controller + tratador de erros | `POST /api/atividades` | Testes de integração (Supertest) 201/400/401 |
| 7 | Banco MySQL | `db/schema.sql`, `atividadeRepositoryMySQL.js`, `docker-compose.yml` | Insert real funcionando localmente |
| 8 | Esteira CI | `.github/workflows/backend-ci.yml` (Node 20, `npm ci && npm test`) | CI verde no PR |
| 9 | Documentação | README do back-end + exemplos `curl` | Revisado pelo grupo |
| 10 | PR e revisão | PR `feature/criar-atividade-backend` → `main` | Aprovação de 1 colega |

**Etapas 1 a 6, 7 (schema e repositório), 8 e 9 já estão no esqueleto desta branch.** Falta validar o repositório MySQL em um banco real e abrir o PR.

---

## 5. Casos de teste planejados

| ID | Cenário | Esperado |
|---|---|---|
| CA-01 | Dados válidos + token válido | 201, status `AGENDADA`, organizador = usuário do token |
| CA-02 | Sem token | 401 |
| CA-03 | Token inválido/expirado | 401 |
| CA-04 | Sem título / título curto | 400, detalhe em `titulo` |
| CA-05 | `dataHora` no passado ou inválida | 400 |
| CA-06 | `numeroIntegrantes` < 2 ou não inteiro | 400 |
| CA-07 | `visibilidade` inválida | 400; ausente → `PUBLICA` |
| CA-08 | `nivel` fora da lista | 400 |
| CA-09 | Corpo tenta enviar `status`/`organizadorId` | Ignorados (RN08) |
| CA-10 | Vários campos inválidos | 400 listando todos os erros |

---

## 6. Próximas etapas (após este MVP)

1. **UC Autenticação** (RF01/RF02): cadastro, login com senha criptografada (bcrypt — RNF04) e emissão de JWT.
2. **Convidar pessoas** (RF07, passo 4): `POST /api/atividades/:id/convites` (entidade `Convite` do diagrama).
3. **Solicitações** (RF09/RF10, passos 5 e 6): portar as regras já testadas na classe Java `Atividade` (`solicitarParticipacao`, vagas, duplicidade, organizador não se inscreve).
4. **Editar/excluir atividade** (RF04) e **ciclo de status** (RF11: iniciar, cancelar, concluir).
5. Listagem com filtros (tipo, nível, público-alvo) — também já modelada no Java (`atendeFiltros`).

---

## 7. Pendências para o grupo decidir

- **P1 — Mínimo de integrantes:** o documento fala em "pelo menos dois times". Adotamos `≥ 2`; o código Java usa `> 0`. Confirmar o valor.
- **P2 — Diagrama de classes:** a classe `Atividade` (5.4) não tem `numeroIntegrantes`, `publicoAlvo` nem `organizador`, mas o UC 5.2 exige. Sugerimos atualizar o diagrama.
- **P3 — Código Java existente:** o repositório tem o domínio em Java/Maven, enquanto o documento define Node.js. Decidir se o Java fica como referência/protótipo ou se será removido após a migração. A esteira CI Java continua funcionando em paralelo.
- **P4 — Listas fechadas:** confirmar os valores válidos de `nivel`, `tipo` e `publicoAlvo` (hoje `tipo` e `publicoAlvo` são texto livre).
