# Topa-aí — Laboratório de Engenharia de Software

Plataforma para **criar, divulgar e participar de atividades físicas e eventos sociais**, conectando pessoas com
interesses parecidos e dando visibilidade a organizadores (contexto completo na [wiki](../../wiki)).

## Estrutura do repositório

| Pasta | O que tem |
|---|---|
| [`backend/`](backend/) | API REST em **Node.js + Express**, MySQL e JWT (stack oficial do projeto) |
| [`frontend/`](frontend/) | Aplicação web em **React + Vite** |
| [`docs/`](docs/) | Planos de ação de cada caso de uso e o [guia de deploy](docs/deploy.md) |
| `src/` e `pom.xml` | Protótipo do domínio em **Java** (JUnit 5), mantido só como referência das regras de negócio |
| `.github/workflows/` | Esteiras de CI (back-end Node, build do front-end e protótipo Java) |

## Como rodar

Pré-requisitos: Node.js 20+ e, se quiser usar banco de verdade, Docker.

```bash
# 1. API (porta 3000)
cd backend
npm install
cp .env.example .env
DB_IN_MEMORY=true npm run dev      # sem banco; ou: docker compose up -d && npm run dev

# 2. Front-end (porta 5173, redireciona /api para a API)
cd frontend
npm install
npm run dev
```

Detalhes de endpoints e exemplos de chamada estão no [README do back-end](backend/README.md).

## Testes

```bash
cd backend && npm test        # Jest + Supertest
cd frontend && npm run lint && npm run build
mvn test                      # protótipo Java
```

## Fluxo de trabalho com Git

- `main`: versão estável, recebe apenas merges de `develop` via pull request.
- `develop`: integração das funcionalidades prontas.
- `feature/<nome>`, `fix/<nome>`, `chore/<nome>`: uma branch por tarefa, criada a partir de `develop`
  e integrada de volta por pull request com revisão de pelo menos um colega.
- Mensagens de commit no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português:
  `feat(api): ...`, `fix(front): ...`, `docs: ...`, `test: ...`, `chore: ...`, `ci: ...`.
- A esteira de CI precisa estar verde antes do merge.
