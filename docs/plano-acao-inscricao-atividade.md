# Plano de Ação — Back-end do caso de uso "Inscrever-se em atividade"

Branch: `feature/inscricao-atividade` (criada a partir de `feature/criar-atividade-backend`)
Stack: a mesma do UC 5.2 — **Node.js + Express**, API **REST**, **MySQL**, **JWT**.

Este é o **caso de uso principal** do Topa-aí (wiki — Plano de Testes). Esta etapa corresponde aos itens 3 e 5 das
"Próximas etapas" do plano do UC 5.2: portar para o Node as regras já testadas na classe Java `Atividade`
e implementar a listagem com filtros.

---

## 1. Fluxo coberto

| Passo do fluxo básico | Endpoint | Caso de teste da wiki |
|---|---|---|
| 1. Login (pré-condição) | middleware JWT em todas as rotas | CT-02 |
| 2–4. Acessar lista e aplicar filtros | `GET /api/atividades?tipo=&nivel=&publicoAlvo=&local=&data=&comVaga=` | CT-03, CT-07 |
| 5. Ver detalhes e vagas | `GET /api/atividades/:id` | CT-01 |
| 6. Solicitar participação | `POST /api/atividades/:id/participacoes` | CT-01, CT-04, CT-06 |
| 7. Organizador aceita/recusa | `GET /api/atividades/:id/participacoes` e `PATCH /api/participacoes/:id` | CT-01, CT-05 |

---

## 2. Regras de negócio (domain/participacao.js)

| Código | Regra | HTTP |
|---|---|---|
| RI01 | Só atividades `AGENDADA` aceitam inscrição | 409 |
| RI02 | Atividade que já começou não aceita inscrição | 409 |
| RI03 | Organizador não se inscreve na própria atividade | 409 |
| RI04 | Atividade `PRIVADA` só por convite (não aparece na lista; solicitação direta é negada) | 403 / 404 |
| RI05 | Precisa haver vaga: `vagas = numeroIntegrantes − aceitos` (CT-04) | 409 |
| RI06 | Sem duplicidade: um usuário só tem uma solicitação ativa por atividade; após `REJEITADO` pode pedir de novo (CT-06) | 409 |
| RI07 | Só o organizador vê e responde solicitações | 403 |
| RI08 | Só solicitações `PENDENTE` podem ser respondidas; aceitar exige vaga | 409 |
| RI09 | Aceitar desconta vaga; recusar não desconta (CT-05) | — |

As regras RI03, RI05, RI06 e RI09 são as mesmas da classe Java `Atividade` (`solicitarParticipacao`, `getVagas`,
`confirmar`, `rejeitar`), agora na stack oficial do projeto.

---

## 3. Arquitetura (o que foi adicionado)

```
backend/src/
├── domain/
│   ├── participacao.js          # regras RI01–RI09 (funções puras)
│   ├── filtros.js               # padrão Strategy para os filtros da lista
│   ├── enums.js                 # + StatusParticipacao
│   └── erros.js                 # + ErroProibido (403), ErroNaoEncontrado (404), ErroRegraNegocio (409)
├── services/
│   ├── atividadeService.js      # + listar (com vagas e filtros) e detalhar
│   └── participacaoService.js   # solicitar, listarDaAtividade, responder
├── controllers/participacaoController.js
├── routes/participacaoRoutes.js # PATCH /api/participacoes/:id
└── repositories/
    ├── participacaoRepositoryMemoria.js
    └── participacaoRepositoryMySQL.js
db/schema.sql                    # + tabela participacao
```

**Padrão Strategy (filtros):** cada filtro (`tipo`, `nivel`, `publicoAlvo`, `local`, `data`, `comVaga`) é uma estratégia
independente com a função `atende(atividade, filtros)`. A lista final é a interseção das estratégias ativas, então
adicionar um filtro novo é só incluir um item no array, sem mexer nos outros (aberto/fechado).

---

## 4. Testes

- `tests/participacao.dominio.test.js` — regras de vagas, solicitação, resposta e filtros (unitários).
- `tests/inscricao.api.test.js` — fluxo ponta a ponta via HTTP (Supertest), um teste por caso CT-01 a CT-07
  + permissões, atividade privada, ids inexistentes e dados inválidos.

Rodar: `cd backend && npm test`.

---

## 5. Próximas etapas

1. **Notificação (padrão Observer):** avisar o participante quando a solicitação for aceita/recusada (CT-05).
2. **Convites (RF07):** liberar a inscrição em atividades privadas via `Convite`.
3. **UC Autenticação:** cadastro/login com bcrypt e emissão do JWT.
4. **Concorrência no MySQL:** ao aceitar, travar a atividade (`SELECT ... FOR UPDATE` em transação) para que dois
   aceites simultâneos não ultrapassem o número de integrantes.
5. **Front-end:** telas de lista com filtros, detalhes e "Solicitar participação".

## 6. Pendências para o grupo decidir

- **P5 — Reinscrição após recusa:** hoje o usuário recusado pode pedir de novo (igual ao código Java). Manter?
- **P6 — Cancelar inscrição:** o participante pode desistir de uma solicitação/participação aceita? (não está no documento)
