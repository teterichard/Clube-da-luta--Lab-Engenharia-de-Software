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

## Projeto Extensionista
O Topa Aí foi desenvolvido com o propósito de atender aos critérios de uma aplicação extensionista, buscando gerar um impacto positivo na sociedade por meio da tecnologia. A plataforma funciona como uma ferramenta de aproximação entre pessoas que, mesmo sem se conhecerem previamente, compartilham interesses e desejam participar de atividades coletivas. Dessa forma, incentiva a socialização, a formação de comunidades, a prática de esportes e a construção de novas relações interpessoais.

Em uma sociedade cada vez mais conectada digitalmente, mas que nem sempre oferece oportunidades suficientes de interação presencial, o Topa Aí propõe uma utilização diferente da tecnologia. Em vez de estimular exclusivamente o consumo de conteúdo e as interações virtuais, a plataforma utiliza o ambiente digital como um meio para viabilizar experiências fora das telas. A proposta é transformar conexões iniciadas no ambiente virtual em encontros reais, aproximando pessoas e facilitando a participação em atividades que talvez não acontecessem espontaneamente.

Essa iniciativa também se relaciona diretamente à importância das relações sociais para a saúde e o desenvolvimento humano. O isolamento social e a ausência de vínculos interpessoais podem afetar negativamente a saúde mental, contribuindo para sentimentos de solidão, ansiedade e depressão. Além disso, a falta de interação e de atividades coletivas pode comprometer hábitos importantes para a saúde física, como a prática regular de exercícios. O convívio social também favorece o estímulo cognitivo, uma vez que as relações interpessoais envolvem comunicação, aprendizado, troca de experiências e desenvolvimento de habilidades intelectuais.

Nesse contexto, a missão do Topa Aí é utilizar a tecnologia para aproximar pessoas, reduzir barreiras à socialização e incentivar experiências compartilhadas. Mais do que organizar atividades, a plataforma busca criar oportunidades para que indivíduos encontrem companhia para fazer aquilo de que gostam, descubram novos interesses e construam vínculos. Afinal, a tecnologia deve ser também uma ferramenta para aproximar pessoas no mundo real, e não apenas conectá-las virtualmente.



