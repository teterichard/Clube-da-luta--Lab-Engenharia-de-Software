# Avaliações, mural, faixa etária e deploy — o que faltava para o MVP

Branch `feature/avaliacoes-mural-deploy`, feita em cima da `main` depois do PR #11 (o trabalho do Jonas).
Com ela, os 19 requisitos funcionais da wiki ficam cobertos e o projeto fica pronto para ir para a nuvem.

## O que entrou

| Requisito | Back-end | Tela |
|---|---|---|
| RF12, RF13 — participantes avaliam a atividade concluída | `POST/GET /api/atividades/:id/avaliacoes` | "Avaliações da atividade" nos detalhes |
| RF14 — organizador avalia participantes | `POST /api/atividades/:id/participantes/:usuarioId/avaliacao` | estrelas na lista de participantes; reputação no perfil |
| RF15 — comunidade com modalidade, público e limite | campos novos em `comunidade` + filtros na listagem | formulário, lista (filtro por modalidade) e detalhes |
| RF17 — interação na comunidade | `GET/POST /api/comunidades/:id/mensagens` | "Mural" (atualiza a cada 15 s) |
| RF18 — avaliar comunidade após 3 meses | `POST/GET /api/comunidades/:id/avaliacoes` | "Avaliações da comunidade" |
| RF19 / RNF08 — faixa etária | `domain/faixaEtaria.js`, aplicada na busca, inscrição, convite e comunidades | campo idade no cadastro |
| RNF07 — histórico de avaliações | tabela `avaliacao` | média e lista nas telas |
| TG3 — hospedagem | `DATABASE_URL`/`MYSQL_URL`, `DB_SSL`, `CORS_ORIGIN`, tabelas criadas ao subir, `npm run db:init` | `vercel.json`, `VITE_API_URL` |

Notificações novas (pelo mesmo padrão Observer do Jonas): "atividade concluída, avalie" para os confirmados,
e "você foi avaliado" / "avaliaram sua atividade/comunidade".

## Decisões para o grupo confirmar

1. **Idade é do perfil e continua opcional.** Quem não informou vê tudo na busca, mas só entra em atividade ou comunidade
   "adultos"/"menores" depois de informar. Fora da faixa: a atividade nem aparece na busca e a inscrição é recusada.
2. **"Menores" também barra adultos.** O organizador pode ser adulto.
3. **Limite de integrantes da comunidade é opcional** (em branco = sem limite). Pedidos pendentes não ocupam vaga;
   o limite não pode ficar abaixo dos membros atuais.
4. **Os 3 meses para avaliar a comunidade** contam de quando a pessoa entra de fato (na privada, da aprovação).
   Quem criou a comunidade não a avalia.
5. **Uma avaliação por pessoa** (por atividade, por participante e por comunidade), sem edição.

## Mudanças nos testes existentes

- Nos testes que não tratam de idade, o público padrão das atividades de exemplo passou de `adultos` para `todos`
  (`inscricao`, `minhasInscricoes`, `concorrencia` e `integracao/mysql`); no CT-07 o `adultos` ficou explícito.
  Motivo: os usuários desses testes não têm idade, e agora a regra RF19 vale.
- `comunidade.dominio.test.js`: o objeto criado tem os três campos novos (`null` por padrão).

## Banco local

`comunidade` ganhou colunas e há duas tabelas novas (`comunidade_mensagem` e `avaliacao`). Quem já tinha o banco do Docker:
`docker compose down -v && docker compose up -d`.

## Testes

- `tests/avaliacaoMuralIdade.dominio.test.js` e `tests/avaliacaoMuralIdade.api.test.js` (novos).
- `tests/integracao/mysql.test.js`: dois cenários novos com MySQL de verdade (avaliações com o `UNIQUE` do banco,
  colunas novas da comunidade e mural), rodados pela esteira.
- Nova esteira `.github/workflows/frontend-ci.yml` faz o build do front a cada push.

## Ficou de fora

- Editar ou apagar avaliações e mensagens do mural (moderação).
- Data de nascimento no lugar da idade (a idade guardada não "envelhece" sozinha).
