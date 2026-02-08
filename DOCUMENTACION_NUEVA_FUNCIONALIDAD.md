# Documentación de la nueva funcionalidad - TapaYBusca

Este documento describe en detalle todo lo que se implementó en el proyecto: la configuración de la base de datos, el dashboard de ecuaciones en el frontend, y las decisiones de arquitectura tomadas.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Base de datos](#2-base-de-datos)
3. [Frontend - Feature Equations](#3-frontend---feature-equations)
4. [Flujo de la aplicación](#4-flujo-de-la-aplicación)
5. [Paleta de colores](#5-paleta-de-colores)
6. [Próximos pasos](#6-próximos-pasos)

---

## 1. Visión general

Se añadieron dos bloques principales:

1. **Infraestructura de base de datos**: PostgreSQL en Docker + Prisma para poder correr el backend con persistencia local.
2. **Dashboard de ecuaciones**: Una nueva sección en el frontend donde el usuario ve su lista de ecuaciones después de iniciar sesión. Por ahora es solo frontend (datos mock), sin integración con backend.

La arquitectura sigue el patrón **feature-based**: cada funcionalidad vive en su propia carpeta con componentes, tipos, datos y páginas.

---

## 2. Base de datos

### 2.1 ¿Por qué Docker + PostgreSQL?

Para desarrollar el backend de forma local se necesitaba una base de datos. En lugar de instalar PostgreSQL en cada máquina, se usa **Docker Compose** para levantar un contenedor con PostgreSQL. Así:

- La configuración es reproducible en cualquier entorno.
- No hay que instalar PostgreSQL manualmente.
- Los datos se guardan en un volumen persistente.

### 2.2 Docker Compose (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: tapaybusca-db
    environment:
      POSTGRES_USER: tapaybusca
      POSTGRES_PASSWORD: tapaybusca
      POSTGRES_DB: tapaybusca
    ports:
      - "5434:5432"   # Puerto del host:Puerto del contenedor
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Detalles:**

- **Imagen**: `postgres:16-alpine` — PostgreSQL 16 en una imagen ligera.
- **Variables de entorno**: Usuario, contraseña y nombre de base de datos `tapaybusca`.
- **Puertos**: El contenedor escucha en 5432; en el host se expone en 5434 para evitar conflictos con posibles instalaciones locales de PostgreSQL.
- **Volumen**: `postgres_data` persiste los datos entre reinicios del contenedor.

### 2.3 Prisma

**Prisma** es el ORM que usa el backend para acceder a la base de datos. Se eligió porque:

- Define el esquema en un único archivo (`schema.prisma`).
- Genera migraciones de forma automática.
- Genera tipos TypeScript a partir del esquema.

**Schema actual** (`backend/prisma/schema.prisma`):

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

Por ahora solo existe el modelo `User`, usado para autenticación. En el futuro se podrán añadir modelos para ecuaciones.

### 2.4 Variables de entorno del backend

El archivo `.env` del backend debe incluir:

```
DATABASE_URL="postgresql://tapaybusca:tapaybusca@localhost:5434/tapaybusca"
```

El puerto debe coincidir con el definido en `docker-compose` (5434 si se dejó como en el ejemplo).

### 2.5 Comandos de base de datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:generate` | Regenera el cliente de Prisma tras cambios en el schema |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:seed` | Ejecuta el script que crea el usuario de prueba |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar la base de datos |

### 2.6 Script de seed (`create-test-user.ts`)

Crea un usuario de prueba para poder iniciar sesión:

- **Email:** test@example.com
- **Contraseña:** test1234

Si el usuario ya existe, el script no hace nada.

---

## 3. Frontend - Feature Equations

### 3.1 Estructura de carpetas

La funcionalidad de ecuaciones está organizada así:

```
frontend/src/features/equations/
├── components/           # Componentes reutilizables
│   ├── EquationsLayout/  # Layout principal (sidebar + header + contenido)
│   ├── EquationsTable/   # Tabla de ecuaciones
│   ├── Header/           # Barra superior (usuario + logout)
│   └── Sidebar/          # Navegación lateral
├── data/
│   └── mockEquations.ts  # Datos mock (vacío por ahora)
├── pages/                # Páginas/ pantallas
│   ├── EquationsPage.tsx      # Página principal "Mis Ecuaciones"
│   ├── CreateEquationPage.tsx # Placeholder "Crear Ecuación"
│   ├── UploadPage.tsx         # Placeholder "Subir"
│   ├── DownloadPage.tsx       # Placeholder "Descargar"
│   └── PlaceholderPage.tsx    # Página genérica para rutas sin implementar
└── types/
    ├── equation.types.ts # Tipos de Equation
    └── index.ts          # Reexportaciones
```

**Por qué esta estructura:** Se usa un enfoque feature-based para que cada funcionalidad tenga sus componentes, tipos y datos juntos, facilitando el mantenimiento y la evolución independiente.

### 3.2 Tipos (`equation.types.ts`)

```typescript
export type EquationStatus = 'pendiente' | 'resuelta' | 'en_proceso';
export type EquationOrigin = 'manual' | 'importado';

export interface Equation {
  id: string;
  equation: string;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
}
```

Definen la forma de una ecuación y sus posibles estados y orígenes, listos para cuando se conecte el backend.

### 3.3 Componentes principales

#### EquationsLayout

- Contenedor que envuelve toda la vista de ecuaciones.
- Incluye: `Sidebar`, `Header` y el área de contenido (`children`).
- Incluye el botón flotante de ayuda (esquina inferior derecha).
- Fondo: gradiente suave con la paleta del proyecto.

#### Sidebar

- Navegación lateral con logo y enlaces: Inicio, Crear Ecuación, Subir, Descargar.
- Usa el mismo logo que el login (`assets/logo.png`).
- Fondo con gradiente vertical de la paleta (#629FAD → #296374 → #0C2C55).
- El ítem activo se destaca con un fondo más claro.

#### Header

- Barra superior con nombre del usuario y botón de cerrar sesión.
- Usa el hook `useAuth` para obtener el usuario y la función `logout`.
- Tras cerrar sesión redirige a `/login`.
- Fondo con gradiente horizontal de la paleta.
- Los botones de acciones (Descargar, Subir, Alta ecuación) se eliminaron por redundancia con el sidebar.

#### EquationsTable

- Tabla con columnas: Ecuación, Origen, Estado, Pasos, Fecha, Acciones.
- Usa datos de `mockEquations.ts` (actualmente vacío).
- Si no hay ecuaciones: muestra "No hay ecuaciones creadas. ¡Crea tu primera ecuación!".
- Si hay datos: renderiza filas con botón "Ver" en Acciones.
- Colores de la tabla basados en tonos de azul de la paleta (#629FAD, #296374) para diferenciarla del fondo.

### 3.4 Datos mock (`mockEquations.ts`)

```typescript
export const mockEquations: Equation[] = [];
```

Por ahora la tabla se alimenta de un array vacío. Cuando exista API de ecuaciones, se sustituirá por llamadas al backend.

### 3.5 Rutas

| Ruta | Componente | Protegida | Descripción |
|------|------------|-----------|-------------|
| `/` | Redirect | - | Redirige a `/dashboard` si hay usuario, o a `/login` si no |
| `/login` | LoginPage | No | Inicio de sesión |
| `/dashboard` | EquationsPage | Sí | Lista de ecuaciones (Inicio) |
| `/crear-ecuacion` | CreateEquationPage | Sí | Placeholder "Crear Ecuación" |
| `/subir` | UploadPage | Sí | Placeholder "Subir" |
| `/descargar` | DownloadPage | Sí | Placeholder "Descargar" |

Las rutas protegidas pasan por `ProtectedRoute`, que verifica si existe usuario; si no, redirige a login.

---

## 4. Flujo de la aplicación

1. Usuario entra a la app (p. ej. `/`).
2. `AppRouter` comprueba si hay usuario (Zustand store).
3. Si no hay usuario → redirect a `/login`.
4. Usuario introduce credenciales y pulsa "Iniciar sesión".
5. `LoginForm` llama a `login()` de `useAuth`, que usa el servicio de auth contra el backend.
6. Si el login es correcto:
   - Se guardan `user` y `token` en Zustand.
   - `LoginForm` hace `navigate(ROUTES.DASHBOARD)`.
7. El usuario llega a `/dashboard` (EquationsPage).
8. `ProtectedRoute` comprueba el usuario; al estar autenticado muestra el contenido.
9. EquationsPage se renderiza dentro de `EquationsLayout`, que muestra Sidebar, Header y la tabla de ecuaciones.
10. Al hacer logout en el Header:
    - Se llama a `logout()` del store.
    - Se redirige a `/login`.

---

## 5. Paleta de colores

Paleta definida en el proyecto:

| Color | Hex | Uso |
|-------|-----|-----|
| Primary | #0C2C55 | Azul oscuro, texto, bordes, botón de ayuda |
| Secondary | #296374 | Azul medio, subtítulos, cabecera de tabla |
| Tertiary | #629FAD | Azul claro, degradados |
| Light | #EDEDCE | Beige claro, fondo del área principal |

Aplicación:

- **Sidebar**: Gradiente vertical #629FAD → #296374 → #0C2C55.
- **Header**: Gradiente horizontal #629FAD → #296374 → #0C2C55.
- **Área principal**: Gradiente suave #EDEDCE → #f5f5e8 → #EDEDCE.
- **Tabla**: Fondos y bordes basados en rgba de #629FAD y #296374.

---

## 6. Próximos pasos

Para seguir evolucionando la funcionalidad:

1. **Backend de ecuaciones**: Crear modelo Prisma `Equation`, migraciones y API (listar, crear, ver detalle).
2. **Servicios de frontend**: Añadir servicios que llamen a la API de ecuaciones.
3. **Estados de carga y error**: Manejar loading y errores en la tabla.
4. **Implementar páginas placeholder**: Crear Ecuación, Subir, Descargar.
5. **Acciones en la tabla**: Implementar el botón "Ver" y otras acciones por ecuación.
