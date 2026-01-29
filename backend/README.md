# Backend - TapaYBusca

Backend desarrollado con Node.js, Express, Prisma y PostgreSQL siguiendo un enfoque incremental.

## Estructura del Proyecto

```
backend/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── index.ts                  # App entry point
│   │
│   ├── config/                   # Configuration
│   │   ├── database.ts           # DB connection config
│   │   └── env.ts                # Environment variables
│   │
│   ├── shared/                   # Shared utilities
│   │   └── types/                # TypeScript types
│   │
│   └── modules/                  # Feature modules
│       └── auth/                 # Authentication module
│           ├── routes/           # Route definitions
│           ├── controllers/      # Request handlers
│           ├── services/         # Business logic
│           ├── repositories/     # Data access layer
│           ├── types/            # DTOs & interfaces
│           └── validators/      # Input validation
│
├── prisma/
│   ├── schema.prisma             # Prisma schema
│   └── migrations/               # Database migrations
│
├── .env.example                  # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRE_IN="24h"
PORT=3001
NODE_ENV=development
```

### 3. Configurar Prisma

Genera el cliente de Prisma:

```bash
npx prisma generate
```

Ejecuta las migraciones:

```bash
npx prisma migrate dev
```

## Desarrollo

Ejecutar en modo desarrollo:

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3001`

## Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión

## Migraciones

Este proyecto sigue un enfoque incremental de desarrollo de base de datos. Cada nueva funcionalidad agrega una nueva migración.

Para crear una nueva migración:

```bash
npx prisma migrate dev --name nombre_de_la_migracion
```

Para aplicar migraciones en producción:

```bash
npx prisma migrate deploy
```

## Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma** - ORM y gestión de migraciones
- **PostgreSQL** - Base de datos relacional
- **TypeScript** - Tipado estático
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas
