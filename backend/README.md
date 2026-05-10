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
