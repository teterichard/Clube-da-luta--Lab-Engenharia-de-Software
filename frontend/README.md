# Topa-aí — Front-end (React + Vite)

Aplicação web do Topa-aí. Conversa com a API do [back-end](../backend/README.md) pelo caminho `/api`
(no desenvolvimento, o Vite redireciona `/api` para `http://localhost:3000`).

## Rodando

```bash
# em outro terminal, suba a API (ex.: cd backend && DB_IN_MEMORY=true npm run dev)
npm install
npm run dev        # http://localhost:5173
npm run lint       # oxlint
npm run build      # gera dist/
```

Para apontar para outra API, defina `VITE_API_URL` (ex.: `VITE_API_URL=https://api.exemplo.com/api`).

## Telas

| Rota | Tela | Caso de uso |
|---|---|---|
| `/entrar`, `/cadastro` | Login e criação de conta | RF01/RF02 |
| `/` | Início: minhas inscrições, atividades que organizo, convites pendentes e sugestões | — |
| `/busca` | Lista de atividades com filtros | Inscrever-se (passos 2–4) |
| `/atividades/nova`, `/atividades/:id/editar` | Criar e editar atividade | UC 5.2 / RF04 |
| `/atividades/:id` | Detalhes: solicitar, cancelar, aceitar convite; para o organizador, gerenciar status, solicitações e convites | Inscrever-se (5–7), RF07, RF11 |
| `/convites` | Convites recebidos | RF07 |
| `/notificacoes` | Central de notificações (também no sininho do topo) | — |
| `/comunidades`, `/comunidades/nova`, `/comunidades/:id` | Descobrir, criar e participar de comunidades | Comunidades |
| `/perfil` | Editar perfil e sair | — |
| `/contato` | Sobre o projeto e como falar com a equipe | — |

Todas as telas, menos entrar, cadastro e contato, exigem login (`components/RotaProtegida`).

## Organização

```
src/
├── components/   # peças reutilizáveis (Header, Card, Campo, FormAtividade, Tag...)
├── contexts/     # AuthContext: sessão do usuário
├── hooks/        # useTituloPagina
├── pages/        # uma pasta por tela (index.jsx + style.css)
├── services/     # api.js: todas as chamadas à API
└── utils/        # textos de status, listas de tipos/níveis e formatação
```

## Acessibilidade

A wiki define acessibilidade e inclusão como critério de qualidade. O que já está garantido:

- navegação completa pelo teclado, com link "Pular para o conteúdo" e foco sempre visível;
- campos com label, mensagens de erro ligadas ao campo (`aria-describedby`) e avisos anunciados (`role="alert"`/`"status"`);
- contraste mínimo WCAG AA nas cores;
- título da aba por página e `prefers-reduced-motion` respeitado.

As telas foram auditadas com [axe-core](https://github.com/dequelabs/axe-core) (regras WCAG 2 A/AA) sem violações.
