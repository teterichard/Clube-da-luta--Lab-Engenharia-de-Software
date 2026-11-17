# Deploy na nuvem (TG3 — Hospedagem, 1,5 ponto)

Caminho sugerido: **API + MySQL no Railway** e **front na Vercel**.

```
Navegador ──► Vercel (front React) ──VITE_API_URL──► Railway: API Node ──MYSQL_URL──► Railway: MySQL
```

A API cria as tabelas sozinha ao subir (`db/schema.sql`, tudo `IF NOT EXISTS`).

## Antes de começar: custos

Confiram os preços ao criar as contas, porque eles mudam:

- **Railway** cobra pelo uso: contas novas ganham um crédito de teste; depois, o plano Free dá US$ 1/mês de crédito
  e o Hobby custa US$ 5/mês ([preços em 2026](https://www.activepieces.com/blog/railway-pricing-2026-plans-usage-rates-and-costs.md)).
  API + MySQL ligados o mês todo podem passar do crédito do plano Free: combinem quem fica com a conta.
- **Vercel**: o plano Hobby é gratuito para projetos pessoais, não comerciais.
- **Alternativa sem cartão:** o **Azure for Students** dá US$ 100 de crédito por 12 meses, validando com o e-mail
  da faculdade ([FAQ da Microsoft](https://learn.microsoft.com/en-us/azure/education-hub/faq)): Azure Database for MySQL
  (Flexible Server, com `DB_SSL=true`) + App Service (Node 20) + Static Web Apps para o front.
- Evitem o MySQL gratuito da Aiven: não aceita bancos novos desde 06/11/2026 e os existentes serão apagados em 21/12/2026
  ([aviso da Aiven](https://aiven.io/docs/products/mysql/howto/mysql-free-tier-migration-options)).

## 1. Banco e API no Railway

1. Entrem em [railway.com](https://railway.com) com a conta do GitHub.
2. **New Project → Deploy from GitHub repo** → `Clube-da-luta--Lab-Engenharia-de-Software`.
3. No serviço criado: **Settings → Root Directory** = `backend` (o start é o `npm start`).
4. No projeto: **+ New → Database → MySQL**.
5. No serviço da API, aba **Variables**:

   | Variável | Valor |
   |---|---|
   | `MYSQL_URL` | `${{MySQL.MYSQL_URL}}` (referência ao banco; o Railway completa) |
   | `JWT_SECRET` | texto longo e aleatório — gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `NODE_ENV` | `production` (a API não sobe com o `JWT_SECRET` padrão) |
   | `CORS_ORIGIN` | deixe vazio por enquanto; preencha no passo 3 |

6. **Settings → Networking → Generate Domain** e anotem o endereço (ex.: `https://topa-ai-api.up.railway.app`).
7. Teste: `https://SEU-ENDERECO/health` deve mostrar `{"status":"ok"}`. Se não subir: **Deployments → View logs**.

## 2. Front na Vercel

1. Em [vercel.com](https://vercel.com), com o GitHub: **Add New → Project** → importem o repositório.
2. **Root Directory** = `frontend` (o Vite é detectado sozinho).
3. **Environment Variables**: `VITE_API_URL` = `https://SEU-ENDERECO-DO-RAILWAY/api`.
4. **Deploy** e anotem o endereço (ex.: `https://topa-ai.vercel.app`).

O `frontend/vercel.json` faz as rotas do React (`/atividades/1`, `/perfil`...) funcionarem ao recarregar a página.

## 3. Ligar um no outro (CORS)

No Railway, serviço da API → **Variables** → `CORS_ORIGIN` = endereço da Vercel, sem barra no final
(ex.: `https://topa-ai.vercel.app`). O Railway refaz o deploy sozinho.

## 4. Conferir

1. Abram o endereço da Vercel → **Criar conta** (informem a idade).
2. Criem uma atividade, saiam, criem outra conta e peçam para participar.
3. Entrem de novo como organizador e aceitem.

"Não foi possível conectar ao servidor" = problema no `VITE_API_URL` (depois de mudar, faça **Redeploy** na Vercel)
ou no `CORS_ORIGIN`.

## A cada push

Railway e Vercel refazem o deploy sozinhos a cada push na `main`; as esteiras do GitHub Actions rodam os testes antes.
