## Backend PedeBrasa

### Stack

- Node.js + TypeScript
- Express
- Sequelize + SQLite/Postgres
- JWT para autenticacao
- Docker + docker-compose

### Scripts

- `npm run dev`: modo desenvolvimento
- `npm run build`: compila para `dist`
- `npm start`: roda versao compilada

### Configuracao

1. Ajuste as variaveis de ambiente.
2. Instale dependencias:
   - `npm install`
3. Rode em desenvolvimento:
   - `npm run dev`

### Banco de dados

Por padrao, o backend usa SQLite local em `backend/data/pedebrasa.sqlite`.
Para usar Postgres/Supabase, configure `DATABASE_URL` no `.env` usado pelo
processo. Em Docker Compose, esse arquivo fica na raiz do repositorio, ao lado
de `docker-compose.yml`.

Variaveis:

- `DATABASE_URL`: string de conexao Postgres do Supabase.
- `DB_SSL`: use `true` para Supabase. O padrao em Docker e `true`.
- `DB_LOGGING`: use `true` apenas para depurar queries.

### Rotas principais

- `POST /api/register`: cadastro de usuario
- `POST /api/login`: login, retorna JWT
- `GET /api/churrasqueiros`: lista churrasqueiros
- `GET /api/churrasqueiros/:id`: detalhes
- `POST /api/churrasqueiros`: cria churrasqueiro (admin, autenticado)
- `GET /api/admin/menu`: menu/admin (admin, autenticado)
- `GET /api/health`: healthcheck

### Docker

- `docker compose up --build`
