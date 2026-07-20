# Mall Virtual Backend API Guide

Esta guia resume el backend MVP actual para desarrollo, pruebas en Postman y diseno de interfaces. El objetivo es tener un mapa claro del flujo completo antes de conectar el frontend.

## Estado Actual

El backend ya cubre el flujo principal del MVP:

1. Registro/login de cliente y comercio.
2. Alta de perfil merchant, compania y tienda.
3. Creacion/listado de categorias.
4. Aprobacion de tiendas por admin.
5. Creacion/listado de productos.
6. Direcciones de cliente.
7. Carrito.
8. Checkout con link de WhatsApp.
9. Gestion de orden por comercio/admin.
10. Confirmacion manual de pago.
11. Historial de estados del pedido.

No hay migracion nueva para estas piezas recientes porque el schema Prisma ya tenia los modelos necesarios.

## Entorno Local

Base URL con Docker:

```txt
http://localhost:4000
```

Levantar servicios:

```bash
cd /Users/angelyama/Documents/mall-virtual
docker compose up -d
```

Apagar sin borrar datos:

```bash
docker compose down
```

No usar salvo que quieras borrar la base:

```bash
docker compose down -v
```

Ver estado:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f api
```

## Postman

Archivos:

```txt
postman/mall-virtual.postman_collection.json
postman/mall-virtual.local.postman_environment.json
```

Environment recomendado:

```txt
mall_virtual_local
```

Variables principales:

```txt
baseUrl
merchantToken
customerToken
adminToken
merchantUserId
customerUserId
adminUserId
companyId
storeId
storeSlug
categoryId
productId
productSlug
variantId
cartItemId
addressId
orderId
whatsappCheckoutUrl
```

Todas las rutas protegidas usan:

```txt
Authorization: Bearer {{token}}
```

## Roles

```txt
CUSTOMER     Cliente comprador.
MERCHANT     Comercio/dueno de tienda.
DRIVER       Futuro repartidor.
ADMIN        Admin operativo.
SUPER_ADMIN  Admin total.
```

Notas importantes:

- El registro publico solo permite `CUSTOMER` y `MERCHANT`.
- Para crear el primer admin en desarrollo, se registra como usuario normal y luego se cambia el rol en DB.
- Las rutas admin requieren `ADMIN` o `SUPER_ADMIN`.
- Las rutas merchant requieren `MERCHANT`, salvo gestion compartida con admin.

Crear primer admin en desarrollo:

```bash
docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
UPDATE users
SET role = 'ADMIN', "updatedAt" = NOW()
WHERE email = 'admin@test.com';
SQL
```

## Reglas De Validacion Globales

El backend usa `ValidationPipe` global con:

```txt
whitelist: true
forbidNonWhitelisted: true
transform: true
```

Eso significa:

- Campos no declarados en DTO son rechazados.
- Numeros enviados como string pueden transformarse cuando el DTO lo permite.
- Los request bodies deben respetar exactamente los campos esperados.

## Convenciones De Datos

### IDs

Los `id` internos son UUID:

```txt
d8bfbc68-0f8a-44f2-b2a5-ebc76f29840e
```

Se usan porque son dificiles de adivinar, seguros para API publica y utiles cuando el sistema escala.

Para mostrar al usuario se usa un identificador amigable, por ejemplo:

```txt
orderNumber: MVG-20260710-97HHQU
```

### Null

`null` significa que el campo existe pero todavia no tiene valor.

Ejemplos:

```txt
description: null      No se guardo descripcion.
iconUrl: null          No hay imagen/icono.
deletedAt: null        No esta eliminado.
confirmedAt: null      Aun no se confirmo.
paidAt: null           Aun no se marco como pagado.
```

### Soft Delete

Varias entidades usan `deletedAt`. Cuando se "borra", normalmente se llena `deletedAt` en vez de eliminar la fila fisicamente.

## Estados Principales

### StoreStatus

```txt
PENDING_REVIEW  Tienda creada, esperando aprobacion.
ACTIVE          Tienda visible y operativa.
SUSPENDED       Suspendida por admin.
PAUSED          Pausada.
REJECTED        Rechazada.
```

### ProductStatus

```txt
DRAFT
ACTIVE
OUT_OF_STOCK
ARCHIVED
```

### OrderStatus

```txt
PENDING
SENT_TO_WHATSAPP
CONFIRMED
PROCESSING
READY_FOR_PICKUP
ON_THE_WAY
DELIVERED
CANCELLED
REFUNDED
```

Transiciones soportadas por servicio:

```txt
PENDING -> SENT_TO_WHATSAPP | CONFIRMED | CANCELLED
SENT_TO_WHATSAPP -> CONFIRMED | CANCELLED
CONFIRMED -> PROCESSING | CANCELLED | REFUNDED
PROCESSING -> READY_FOR_PICKUP | ON_THE_WAY | CANCELLED
READY_FOR_PICKUP -> ON_THE_WAY | DELIVERED | CANCELLED
ON_THE_WAY -> DELIVERED | CANCELLED
DELIVERED -> REFUNDED
CANCELLED -> final
REFUNDED -> final
```

Si se cancela una orden, `cancellationReason` es obligatorio.

### PaymentStatus

```txt
PENDING
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

Transiciones soportadas:

```txt
PENDING -> PAID | FAILED
PAID -> PARTIALLY_REFUNDED | REFUNDED
PARTIALLY_REFUNDED -> REFUNDED
FAILED -> final
REFUNDED -> final
```

Si se hace `PARTIALLY_REFUNDED`, `refundAmount` es obligatorio.

## Health

### GET /

Publico.

Respuesta esperada:

```txt
Hello World!
```

Uso: confirmar que la API esta arriba.

## Auth

### POST /auth/register

Publico.

Crea usuario `CUSTOMER` o `MERCHANT`.

Body:

```json
{
  "email": "maria.zambrano@test.com",
  "phone": "+593991112233",
  "plainPassword": "Password123",
  "role": "CUSTOMER"
}
```

Respuesta:

```json
{
  "user": {
    "id": "uuid",
    "email": "maria.zambrano@test.com",
    "role": "CUSTOMER"
  },
  "accessToken": "jwt"
}
```

### POST /auth/login

Publico.

Body:

```json
{
  "email": "maria.zambrano@test.com",
  "password": "Password123"
}
```

Devuelve `accessToken`.

### GET /auth/me

Requiere JWT.

Devuelve el usuario autenticado sin `passwordHash`.

## Users Y Direcciones

### GET /users/me/addresses

Roles:

```txt
CUSTOMER, MERCHANT, DRIVER, ADMIN, SUPER_ADMIN
```

Lista direcciones propias.

### POST /users/me/addresses

Crea direccion del usuario autenticado.

Body:

```json
{
  "label": "Casa",
  "street": "Urdesa Central, Calle Primera 123",
  "city": "Guayaquil",
  "state": "Guayas",
  "reference": "Cerca del parque, casa blanca con porton negro",
  "latitude": -2.170998,
  "longitude": -79.922359,
  "isDefault": true
}
```

Notas:

- La primera direccion se vuelve default automaticamente.
- Si `isDefault` es `true`, las demas direcciones del usuario se marcan como no default.

### GET /users/me/addresses/:addressId

Devuelve una direccion propia.

### PATCH /users/me/addresses/:addressId

Actualiza una direccion propia.

### PATCH /users/me/addresses/:addressId/default

Marca una direccion como default.

### DELETE /users/me/addresses/:addressId

Soft delete de direccion propia.

### Rutas Admin De Usuarios

Todas requieren:

```txt
ADMIN, SUPER_ADMIN
```

Rutas:

```txt
POST   /users
GET    /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

`POST /users` permite crear usuarios con roles internos si ya tienes token admin.

## Categorias

### GET /categories

Publico.

Lista categorias activas.

### GET /categories/:slug

Publico.

Busca categoria activa por slug.

### GET /categories/admin

Roles:

```txt
ADMIN, SUPER_ADMIN
```

Lista categorias no eliminadas, activas e inactivas.

### POST /categories

Roles:

```txt
ADMIN, SUPER_ADMIN
```

Body:

```json
{
  "name": "Calzado",
  "description": "Zapatos, zapatillas y accesorios de calzado",
  "sortOrder": 1
}
```

Campos opcionales:

```txt
slug
iconUrl
parentId
isActive
```

Notas:

- Si no mandas `slug`, se genera desde `name`.
- Si `parentId` es `null`, es categoria raiz.
- Si tiene `parentId`, es subcategoria.

### PATCH /categories/:id

Roles:

```txt
ADMIN, SUPER_ADMIN
```

Actualiza categoria.

### DELETE /categories/:id

Roles:

```txt
ADMIN, SUPER_ADMIN
```

Soft delete y marca `isActive = false`.

## Tiendas Y Merchant

### GET /stores

Publico.

Lista tiendas:

```txt
status = ACTIVE
company.isActive = true
deletedAt = null
```

### GET /stores/:slug

Publico.

Devuelve tienda publica activa.

### GET /stores/my

Rol:

```txt
MERCHANT
```

Lista tiendas del comercio autenticado.

### POST /stores/merchant-profile

Rol:

```txt
MERCHANT
```

Body:

```json
{
  "contactEmail": "ventas@zapateriamalecon.com",
  "contactPhone": "+593987654321",
  "taxId": "0992857364001",
  "taxIdCountry": "EC"
}
```

### POST /stores/companies

Rol:

```txt
MERCHANT
```

Body:

```json
{
  "name": "Zapateria Malecon",
  "description": "Tienda de calzado urbano y casual en Guayaquil",
  "website": "https://zapateriamalecon.example.com"
}
```

### POST /stores

Rol:

```txt
MERCHANT
```

Crea tienda en estado `PENDING_REVIEW`.

Body:

```json
{
  "companyId": "{{companyId}}",
  "name": "Zapateria Malecon Centro",
  "openingHours": {
    "monday": "09:00-19:00",
    "tuesday": "09:00-19:00",
    "wednesday": "09:00-19:00",
    "thursday": "09:00-19:00",
    "friday": "09:00-19:00",
    "saturday": "10:00-17:00"
  },
  "address": {
    "street": "Malecon Simon Bolivar y 9 de Octubre",
    "city": "Guayaquil",
    "state": "Guayas",
    "reference": "Frente al rio, local 12"
  },
  "settings": {
    "whatsappNumber": "+593987654321",
    "instagramUrl": "https://instagram.com/zapateriamalecon",
    "acceptsWhatsapp": true,
    "acceptsCash": true,
    "acceptsCard": false,
    "acceptsOnlinePayment": false,
    "deliveryRadiusKm": 8,
    "averagePreparationMinutes": 25,
    "minimumOrderAmount": 15,
    "freeDeliveryFromAmount": 80
  }
}
```

### GET /stores/admin

Roles:

```txt
ADMIN, SUPER_ADMIN
```

Lista todas las tiendas no eliminadas.

### GET /stores/admin/pending

Roles:

```txt
ADMIN, SUPER_ADMIN
```

Lista tiendas en `PENDING_REVIEW`.

### PATCH /stores/:id/status

Roles:

```txt
ADMIN, SUPER_ADMIN
```

Body:

```json
{
  "status": "ACTIVE",
  "note": "Tienda aprobada para pruebas reales del MVP"
}
```

Notas:

- Cambia estado de tienda.
- Si el nuevo estado es `PAUSED`, `REJECTED` o `SUSPENDED`, tambien pone `isOpen = false`.
- Crea `AuditLog` con accion `STORE_STATUS_UPDATED`.

## Productos

### GET /products

Publico.

Lista productos:

```txt
product.status = ACTIVE
store.status = ACTIVE
category.isActive = true
```

### GET /products/:slug

Publico.

Devuelve producto activo por slug.

### GET /products/my

Rol:

```txt
MERCHANT
```

Lista productos de tiendas del comercio autenticado.

### POST /products

Rol:

```txt
MERCHANT
```

Body basico:

```json
{
  "storeId": "{{storeId}}",
  "categoryId": "{{categoryId}}",
  "name": "Zapatillas Urbanas Negras Talla 39",
  "description": "Zapatillas urbanas color negro, suela antideslizante, ideales para uso diario.",
  "basePrice": 49.99,
  "compareAtPrice": 59.99,
  "sku": "ZAP-URB-NEG-39",
  "weightGrams": 850,
  "status": "ACTIVE",
  "isFeatured": true,
  "isAvailable": true,
  "initialStock": 12,
  "images": [
    {
      "url": "https://example.com/zapatillas-urbanas-negras.jpg",
      "altText": "Zapatillas urbanas negras"
    }
  ]
}
```

Notas:

- Si no mandas `variants`, el servicio crea una variante `Default`.
- `initialStock` se usa para la variante default.
- Si mandas variantes, cada variante puede tener `stock`, `price`, `sku`, `attributes`.
- El stock real vive en `Inventory`, no en `Product`.

## Carrito

Todas las rutas requieren JWT.

### GET /cart

Devuelve o crea el carrito del usuario autenticado.

### POST /cart/items

Body:

```json
{
  "productId": "{{productId}}",
  "quantity": 1
}
```

Opcional:

```json
{
  "variantId": "{{variantId}}"
}
```

Reglas:

- Producto debe estar `ACTIVE`.
- Tienda debe estar `ACTIVE`.
- Categoria debe estar activa.
- Debe haber stock disponible.
- El carrito solo acepta productos de una tienda para el MVP.
- Al agregar se incrementa `reservedStock`.

### PATCH /cart/items/:itemId

Actualiza cantidad.

Body:

```json
{
  "quantity": 3
}
```

### DELETE /cart/items/:itemId

Elimina item y libera stock reservado.

### DELETE /cart

Vacia carrito y libera stock reservado.

## Ordenes Cliente

Todas requieren JWT.

### GET /orders

Lista ordenes del cliente autenticado.

### GET /orders/:id

Detalle de una orden del cliente autenticado.

### POST /orders/checkout

Crea orden desde carrito.

Body:

```json
{
  "addressId": "{{addressId}}",
  "deliveryType": "HOME_DELIVERY",
  "notes": "Cliente Maria Zambrano. Confirmar por WhatsApp antes de enviar."
}
```

Resultado:

```txt
Order.status = SENT_TO_WHATSAPP
Payment.status = PENDING
Payment.method = WHATSAPP_TRANSFER
Cart queda vacio
Inventory.stock baja
Inventory.reservedStock baja
```

Respuesta incluye:

```txt
whatsappCheckoutUrl
```

Ejemplo de mensaje generado:

```txt
Hola, quiero confirmar mi pedido MVG-20260710-97HHQU por un total de $149.97.
```

## Ordenes Merchant/Admin

### GET /orders/manage

Roles:

```txt
MERCHANT, ADMIN, SUPER_ADMIN
```

Merchant ve solo ordenes de sus tiendas.

Admin ve todas.

### GET /orders/manage/stores/:storeId

Roles:

```txt
MERCHANT, ADMIN, SUPER_ADMIN
```

Lista ordenes gestionables filtradas por tienda.

### GET /orders/manage/:id

Roles:

```txt
MERCHANT, ADMIN, SUPER_ADMIN
```

Detalle gestionable.

### PATCH /orders/:id/status

Roles:

```txt
MERCHANT, ADMIN, SUPER_ADMIN
```

Confirmar:

```json
{
  "status": "CONFIRMED",
  "note": "Cliente confirmo el pedido por WhatsApp"
}
```

Procesar:

```json
{
  "status": "PROCESSING",
  "note": "Pedido en preparacion"
}
```

Enviar:

```json
{
  "status": "ON_THE_WAY",
  "note": "Pedido salio a entrega"
}
```

Entregar:

```json
{
  "status": "DELIVERED",
  "note": "Cliente recibio el pedido conforme"
}
```

Cancelar:

```json
{
  "status": "CANCELLED",
  "cancellationReason": "CUSTOMER_REQUEST",
  "cancellationNote": "Cliente pidio cancelar por WhatsApp",
  "note": "Cancelado por solicitud del cliente"
}
```

Efectos:

- Actualiza `Order.status`.
- Crea `OrderStatusHistory`.
- Llena `confirmedAt` cuando pasa a `CONFIRMED`.
- Llena `deliveredAt` cuando pasa a `DELIVERED`.

### PATCH /orders/:id/payment

Roles:

```txt
MERCHANT, ADMIN, SUPER_ADMIN
```

Marcar pagado:

```json
{
  "status": "PAID",
  "method": "BANK_TRANSFER",
  "providerPaymentId": "TRF-MARIA-ZAMBRANO-001",
  "metadata": {
    "bank": "Banco Pichincha",
    "receiptNumber": "BP-20260710-001"
  }
}
```

Marcar fallido:

```json
{
  "status": "FAILED",
  "metadata": {
    "reason": "Comprobante no recibido"
  }
}
```

Reembolso total:

```json
{
  "status": "REFUNDED",
  "refundReason": "Producto no disponible"
}
```

Reembolso parcial:

```json
{
  "status": "PARTIALLY_REFUNDED",
  "refundAmount": 10,
  "refundReason": "Ajuste por diferencia de precio"
}
```

Efectos:

- Actualiza `Payment.status`.
- Llena `paidAt` si pasa a `PAID`.
- Llena `refundedAt` si pasa a `REFUNDED` o `PARTIALLY_REFUNDED`.

## Payments

Existe `PaymentsModule`, pero por ahora no expone rutas propias.

Los pagos del MVP se gestionan desde:

```txt
PATCH /orders/:id/payment
```

## Flujo Completo De Prueba MVP

### Admin

1. Registrar admin temporal como usuario normal.
2. Cambiar rol a `ADMIN` en DB.
3. Login admin.
4. Crear categoria.
5. Aprobar tienda.

### Merchant

1. Registrar/login merchant.
2. Crear merchant profile.
3. Crear compania.
4. Crear tienda.
5. Esperar aprobacion admin.
6. Crear producto.
7. Ver ordenes recibidas.
8. Confirmar orden.
9. Marcar pago como pagado.
10. Procesar/enviar/entregar orden.

### Customer

1. Registrar/login cliente.
2. Ver categorias/productos.
3. Crear direccion.
4. Agregar producto al carrito.
5. Checkout.
6. Abrir link WhatsApp.
7. Ver mis ordenes.

## Flujo Para Figma

### Cliente

Pantallas recomendadas:

```txt
Home/catalogo
Listado de categorias
Listado de tiendas
Listado de productos
Detalle de producto
Carrito
Mis direcciones
Checkout
Confirmacion con WhatsApp
Mis pedidos
Detalle de pedido
```

Estados visuales importantes:

```txt
Producto sin stock
Carrito vacio
Pedido SENT_TO_WHATSAPP
Pedido CONFIRMED
Pedido PROCESSING
Pedido ON_THE_WAY
Pedido DELIVERED
Pago PENDING
Pago PAID
```

### Merchant

Pantallas recomendadas:

```txt
Dashboard comercio
Crear perfil merchant
Crear compania
Crear tienda
Estado de aprobacion de tienda
Mis productos
Crear producto
Ordenes recibidas
Detalle de orden
Actualizar estado de orden
Confirmar pago
```

### Admin

Pantallas recomendadas:

```txt
Dashboard admin
Categorias
Crear/editar categoria
Tiendas pendientes
Aprobar/rechazar tienda
Usuarios
Ordenes globales
```

## Errores Comunes

### 401 Unauthorized

Falta token o el token expiro.

Solucion:

```txt
Ejecutar login del rol correspondiente y revisar Authorization Bearer.
```

### 403 Forbidden

Token valido, pero rol incorrecto.

Ejemplo:

```txt
Intentar crear categoria con customerToken.
```

### 404 Not Found

Entidad no existe o no pertenece al usuario autenticado.

Ejemplos:

```txt
Direccion de otro usuario.
Orden de otra tienda.
Producto no publico.
```

### 409 Conflict

Dato duplicado.

Ejemplos:

```txt
Email ya usado.
Categoria con nombre repetido.
Merchant profile ya existe.
```

### 400 Bad Request

Body invalido o transicion no permitida.

Ejemplos:

```txt
Cancelar orden sin cancellationReason.
Pasar DELIVERED directo desde SENT_TO_WHATSAPP.
Reembolso parcial sin refundAmount.
Campo extra no permitido por DTO.
```

## Comandos De Verificacion

Tests:

```bash
docker compose exec api npm test -- --runInBand
```

Build:

```bash
docker compose exec api npm run build
```

Lint:

```bash
docker compose exec api npm run lint
```

Estado Git:

```bash
git status
```

## Pendientes Despues Del MVP Backend

1. Frontend cliente.
2. Frontend merchant.
3. Frontend admin.
4. Pagos reales con gateway.
5. Delivery interno.
6. Notificaciones.
7. Refresh tokens/sesiones moviles.
8. Upload real de imagenes.
9. Busqueda/filtros avanzados.
10. Reportes y analitica.
