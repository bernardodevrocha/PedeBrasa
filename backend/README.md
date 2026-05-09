## Backend pedebrasa (API churrasqueiros)

### Stack

- Node.js + TypeScript
- Express
- Sequelize + SQLite
- JWT para autenticação
- Docker + docker-compose

### Scripts

- `npm run dev` – modo desenvolvimento (ts-node-dev)
- `npm run build` – compila para `dist`
- `npm start` – roda versão compilada

### Configuração

1. Copie `.env.example` para `.env` e ajuste as variáveis.
2. Instale dependências:
   - `npm install`
3. Rode em desenvolvimento:
   - `npm run dev`

### Rotas principais

- `POST /api/register` – cadastro de usuário
- `POST /api/login` – login, retorna JWT
- `GET /api/churrasqueiros` – lista churrasqueiros
- `GET /api/churrasqueiros/:id` – detalhes
- `POST /api/churrasqueiros` – cria churrasqueiro (admin, autenticado)
- `GET /api/admin/menu` – menu/admin (admin, autenticado)
- `GET /api/health` – healthcheck

### Docker

- `docker compose up --build`

### Stripe Checkout

O pagamento usa Stripe Checkout hospedado. O backend cria uma Checkout Session
em `POST /api/pagamentos/:bookingId` e retorna `checkoutUrl`; o frontend
redireciona o usuario para a Stripe.

Variaveis obrigatorias:

- `STRIPE_SECRET_KEY`: chave secreta do modo teste ou producao.
- `STRIPE_WEBHOOK_SECRET`: segredo do endpoint de webhook.
- `FRONTEND_URL`: URL para onde a Stripe retorna apos sucesso/cancelamento.
- `STRIPE_CURRENCY`: moeda, por padrao `brl`.

Eventos de webhook necessarios:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`
