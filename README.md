# Tienda Medusa v2 sobre Supabase

Tienda en línea construida con [Medusa v2](https://docs.medusajs.com) (backend + admin) y un storefront Next.js, usando **Supabase solo como base de datos Postgres**. La tienda vende en Ecuador en dólares (`/ec`) y mantiene la región Europa en euros (`/dk`).

## Arquitectura

```text
Navegador ──> Storefront Next.js (:8000) ──HTTP + publishable key──> Medusa backend (:9000) ──SQL──> Supabase Postgres
                                                                        └── Admin (/app)             (Session pooler :5432)
```

- **Storefront** (`apps/storefront`): solo habla con la Store API de Medusa (`/store/*`) usando `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`. No usa `supabase-js`, ni Supabase Auth, ni RLS.
- **Backend** (`apps/backend`): Medusa se encarga de productos, precios, carritos, clientes, autenticación, pagos y órdenes, y es el único que se conecta a la base.
- **Supabase**: Postgres gestionado. Guarda las tablas que crean las migraciones de Medusa (`product`, `region`, `cart`, `order`, ...).

**Por qué no `supabase-js` en el front:** la lógica de negocio (precios por región, stock, checkout) vive en Medusa. Si el navegador escribiera directo en la base, se saltaría esas reglas y habría que exponer la base con políticas RLS. Así, la única credencial en el front es la publishable key, que es pública por diseño.

**Por qué Session pooler (5432):** el backend es un proceso de larga duración que mantiene su propio pool de conexiones. El Session pooler es compatible con IPv4 y admite sentencias preparadas y las migraciones de Medusa. La conexión directa es solo IPv6, y el Transaction pooler (6543) está pensado para funciones serverless de conexión corta.

## Requisitos

- Node.js 20+
- pnpm 10+
- Un proyecto en Supabase (plan gratuito sirve)

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Configurar el backend:

   ```bash
   cp apps/backend/.env.template apps/backend/.env
   ```

   En `apps/backend/.env`, reemplaza `DATABASE_URL` por la URI del **Session pooler** (Supabase > Connect > Session pooler, puerto `5432`) y cambia `JWT_SECRET` y `COOKIE_SECRET`. **No definas `REDIS_URL`**: sin él, Medusa usa event bus, caché y locking en memoria, suficiente para desarrollo.

3. Crear las tablas y los datos iniciales en Supabase:

   ```bash
   cd apps/backend
   pnpm medusa db:migrate                               # tablas + seed inicial (src/migration-scripts)
   pnpm medusa exec ./src/scripts/add-ec-region.ts      # región Ecuador en USD + envío
   pnpm medusa user -e admin@example.com -p <password>  # usuario del Admin
   ```

   `db:migrate` también ejecuta una sola vez `src/migration-scripts/initial-data-seed.ts` (región Europa, almacén, envíos y productos de ejemplo). Queda registrado en la tabla `script_migrations`.

4. Levantar el backend y obtener la publishable key:

   ```bash
   pnpm run backend:dev   # desde la raíz
   ```

   Abre `http://localhost:9000/app` y copia la key desde Settings > Publishable API Keys.

5. Configurar el storefront:

   ```bash
   cp apps/storefront/.env.template apps/storefront/.env.local
   ```

   Pega la key en `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

6. Levantar todo:

   ```bash
   pnpm run dev   # backend :9000 y storefront :8000
   ```

   `http://localhost:8000` redirige a `/ec`.

## Región Ecuador

`apps/backend/src/scripts/add-ec-region.ts` es idempotente (se puede correr varias veces sin duplicar nada) y hace lo siguiente:

- Crea la región **Ecuador** (`usd`, país `ec`) con el proveedor de pago por defecto.
- Crea la tax region de `ec`.
- Deja `usd` como moneda por defecto de la tienda. `eur` queda como secundaria para la región Europa, así que `/dk` sigue funcionando en euros.
- Agrega la service zone "Ecuador" al almacén existente, con la opción **Standard Shipping** a 10 USD.

En el storefront, `NEXT_PUBLIC_DEFAULT_REGION=ec`, y el fallback en `apps/storefront/src/middleware.ts` también es `ec`.

## Catálogo propio

El producto propio **Cafe de loja** se crea desde el Admin. `apps/backend/src/scripts/complete-cafe-de-loja.ts` le asigna el shipping profile por defecto, la imagen, el SKU y 100 unidades de stock en el almacén. Sin shipping profile, el checkout falla con *"The cart items require shipping profiles that are not satisfied by the current shipping methods"*.

```bash
cd apps/backend
pnpm medusa exec ./src/scripts/complete-cafe-de-loja.ts
```

## Tienda de mascotas (Huellitas)

`apps/backend/src/scripts/seed-pet-store.ts` convierte la tienda en **Huellitas**, una tienda de mascotas. Es idempotente y hace lo siguiente:

- Crea las categorías **Comida**, **Arena para gatos**, **Camas** y **Juguetes**, y las colecciones **Mundo perruno** y **Rincón gatuno**.
- Crea 15 productos con variantes (peso, tamaño o presentación), precios en USD y EUR, fotos de Unsplash y 100 unidades de stock por variante.
- Pasa a borrador los productos de ropa del starter y "Cafe de loja", y desactiva las categorías de ropa. No borra nada: se pueden reactivar desde el Admin.

```bash
cd apps/backend
pnpm medusa exec ./src/scripts/seed-pet-store.ts
```

El storefront guarda en caché las categorías y colecciones. Si no ves los cambios, detén el storefront, borra `apps/storefront/.next/cache/fetch-cache` y vuelve a levantarlo.

## Verificar una compra en Supabase

1. Compra en `http://localhost:8000/ec` (el pago por defecto es manual).
2. En Supabase > Table Editor > `order`, refresca: aparece la fila nueva con `currency_code = usd` y el mismo `display_id` que muestra la página de confirmación.

## Estructura

```text
apps/
  backend/      Medusa v2: API, admin, scripts (src/scripts), migraciones
  storefront/   Next.js 15: rutas /[countryCode]/..., middleware de región
```

## Secretos

`.env` y `.env.local` están en `.gitignore`. Solo se versionan `apps/backend/.env.template` y `apps/storefront/.env.template`, que no tienen credenciales reales.
