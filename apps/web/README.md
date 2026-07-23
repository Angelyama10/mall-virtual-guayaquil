# Mall Virtual Guayaquil - Frontend

Frontend de comercio local construido con Next.js 16, React 19 y Tailwind CSS 4. Consume el backend NestJS mediante una capa BFF interna para mantener el JWT fuera de JavaScript del navegador.

## Experiencias incluidas

| Área | Rutas | Alcance |
| --- | --- | --- |
| Pública | `/`, `/explorar`, `/producto/[slug]`, `/tienda/[slug]` | Portada, catálogo, filtros, productos y tiendas reales |
| Acceso | `/login`, `/registro` | Registro de clientes/comercios y sesión por rol |
| Cliente | `/carrito`, `/checkout`, `/cuenta`, `/cuenta/pedidos/[id]` | Carrito, direcciones, checkout por WhatsApp e historial |
| Comercio | `/comercio` | Métricas, productos, stock, pedidos, pagos y estados |
| Administración | `/admin` | Revisión de tiendas, categorías, usuarios y pedidos |

## Arquitectura

- `app/(storefront)`: experiencia pública y de cliente.
- `app/(dashboard)`: paneles operativos por rol.
- `app/api/session`: login, registro, sesión y logout.
- `app/api/backend/[...path]`: proxy autenticado hacia NestJS.
- `components`: UI y flujos interactivos reutilizables.
- `lib/api.ts`: consumo server-side del backend.
- `lib/client-api.ts`: cliente para Route Handlers de Next.js.
- `lib/types.ts`: contratos compartidos del frontend.

El token se guarda en la cookie `mall_session` con `httpOnly`, `sameSite=lax` y `secure` en producción. El navegador llama a `/api/backend/*`; Next.js agrega el Bearer token en el servidor y NestJS conserva la autorización definitiva por rol.

## Diseño

- Identidad: teal profundo, coral, dorado e ivory.
- Tipografía: Manrope para interfaz y Cormorant Garamond para titulares.
- Iconografía: Lucide.
- Movimiento: Framer Motion con respeto a `prefers-reduced-motion`.
- Accesibilidad: enlace de salto, foco visible, controles etiquetados, objetivos táctiles, landmarks y reflow móvil.

Los tokens principales viven en `app/globals.css`. Los recursos visuales locales están en `public/images`.

## Ejecución con Docker

Desde la raíz del repositorio:

```bash
docker compose up -d --build
docker compose logs -f web
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

El servicio web usa internamente `API_INTERNAL_URL=http://api:3000`. El comando de desarrollo sincroniza dependencias antes de iniciar Next.js.

Para apagar sin borrar datos:

```bash
docker compose down
```

No uses `docker compose down -v` salvo que quieras eliminar la base de datos local.

## Verificación

```bash
docker compose exec -T web npm run lint
docker compose exec -T web npm run build
```

Las rutas privadas requieren usuarios con el rol correspondiente. NestJS sigue siendo la fuente de verdad para permisos y transiciones de pedidos/pagos.
