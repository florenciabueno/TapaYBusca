# Guía de desarrollo local - TapaYBusca

## Levantar todo el proyecto (DB + Backend + Frontend)

### 1. Base de datos (PostgreSQL)

Levanta PostgreSQL con Docker:

```bash
docker compose up -d
```

Verifica que el contenedor esté corriendo:

```bash
docker compose ps
```

### 2. Backend

```bash
cd backend
```

Copia las variables de entorno:

```bash
cp .env.example .env
```

Las credenciales del `.env.example` ya están configuradas para funcionar con el `docker-compose` (usuario: `tapaybusca`, contraseña: `tapaybusca`, base de datos: `tapaybusca`).

Instala dependencias y ejecuta migraciones:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

Inicia el servidor:

```bash
npm run dev
```

El backend estará en `http://localhost:3001`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend estará en `http://localhost:5173` (o el puerto que Vite asigne).

### Resumen de comandos (desde la raíz del proyecto)

```bash
# Terminal 1 - Base de datos
docker compose up -d

# Terminal 2 - Backend
cd backend && npm install && npm run db:generate && npm run db:migrate && npm run db:seed && npm run dev

# Terminal 3 - Frontend
cd frontend && npm install && npm run dev
```

### Credenciales de prueba

- **Email:** test@example.com
- **Contraseña:** test1234
