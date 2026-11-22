# El Baul de los Libros — Instructivo para publicar y terminar

Tienda online de libros nuevos (Argentina). Este documento explica cómo correrla, qué hay que configurar para publicarla y **qué falta: conectar los mails**.

> El código de los mails **ya está hecho** (plantillas, disparadores y envío por Gmail con contraseña de aplicación). Lo que falta es **crear la contraseña de aplicación y cargar las variables de entorno**, más probar que lleguen bien. Detalle en la sección 6.

---

## 1. Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS 3 (colores como variables CSS en `app/globals.css`) |
| Base de datos | Upstash Redis (REST). En local, si no hay Upstash, usa archivos JSON en `.data/` |
| Pagos | Mercado Pago · Checkout Pro con la **API de Orders** (`POST /v1/orders`) |
| Mails | Gmail por SMTP (`nodemailer`, contraseña de aplicación) |
| Cron | Vercel Cron (`vercel.json`) |
| Hosting pensado | Vercel |

No hay librerías de UI ni de animación: todo está hecho a mano.

## 2. Correrlo en local

```bash
npm install
cp .env.example .env.local   # y completar (ver sección 4)
npm run dev                  # http://localhost:3000
npm run build                # build de producción (ya probado: compila, lint y tipos OK)
```

Panel de administración: `/admin` (clave = `ADMIN_PASSWORD`).

## 3. Estructura

```
app/                 páginas + back
  page.tsx           inicio
  catalogo/          catálogo y página de cada libro (/catalogo/[id], generada estática)
  checkout/          checkout y /checkout/gracias (vuelta de Mercado Pago)
  pedido/[id]/       seguimiento del pedido (?t=token) y /opinion (reseñas)
  admin/             panel: pedidos, carritos, stock, opiniones, arrepentimientos (+ actions.ts)
  api/
    pedidos/                 crea el pedido, reserva stock, crea la orden de Mercado Pago
    mercadopago/webhook/     avisos de Mercado Pago (type "order"; "payment" para pedidos viejos)
    carritos/                guarda carritos abandonados (cuando el cliente completa email/celular)
    cron/vencimientos/       cancela pedidos sin pagar a las 24 h + manda mails de reseña
    arrepentimiento/         botón de arrepentimiento (Res. SCI 424/2020)
    opiniones/               guarda reseñas del comprador
  arrepentimiento/, cambios-y-devoluciones/, terminos/, privacidad/   páginas legales
components/          UI por sección (layout, ui, home, catalogo, libro, cart, checkout, pedido, admin, legal)
data/                catálogo: books.ts (libros y precios), razones.ts, momentos.ts
lib/                 lógica: pricing, shipping (tarifas Correo Argentino), stock, orders, orderStore,
                     mercadopago, mpSync, notify (envío de mails), emails (plantillas), expireOrders,
                     reviewRequests, abandonedCarts, reviews, withdrawals, adminQueue, upstash…
public/images/       fotos y tapas (libros/<id>.jpg)
```

Reglas importantes:
- **Los precios siempre se recalculan en el servidor** (`lib/pricing.ts`). El navegador solo manda ids y cantidades.
- `data/books.ts`: cada libro tiene `precioTransferencia` (lo que se cobra por transferencia). El precio de lista (Mercado Pago) se calcula: +10 %, redondeado para arriba a $ 100.
- Envíos: tabla por zona en `lib/shipping.ts` (cotizada a mano en MiCorreo). Córdoba Capital: retiro o Uber Moto, sin costo de envío.

## 3 bis. Cómo funciona: flujo de compra, estados y notificaciones

### Estados de un pedido (`lib/orderTypes.ts`, `lib/orderStatus.ts`)

```
recibido → pago_confirmado → preparando → enviado → entregado
    └──────────────→ cancelado (a mano, o solo a las 24 h sin pago)
```
En retiro en persona, "enviado" se muestra como **"Listo para retirar"** y "entregado" como **"Retirado"**.
Cada cambio queda en `order.history` (fecha y nota) y se ve en la línea de tiempo del cliente y del panel.

### 1) Antes de comprar
- **Carrito** (`components/cart/`): vive en `localStorage` (`bdl-carrito-v1`). Muestra el total con transferencia, el ahorro y el total con Mercado Pago.
- **Checkout** (`components/checkout/CheckoutForm.tsx`):
  - **Córdoba Capital** (provincia Córdoba + localidad "Córdoba"; si falta la localidad, CP 5000–5024): solo **retiro** (sin costo) o **Uber Moto** (lo paga el cliente). Se coordina por WhatsApp.
  - **Resto del país**: Correo Argentino **a sucursal** o **a domicilio**. El precio sale de `lib/shipping.ts` (3 zonas × peso por cantidad de libros) y se suma al total.
  - Celular en dos campos (código de área sin 0 + número sin 15 = 10 dígitos), como lo pide MiCorreo.
- **Carrito abandonado**: cuando el cliente completa email o celular, se guarda su carrito (`POST /api/carritos`). Si a las 2 h no compró, aparece en **Panel → Carritos** con botones de WhatsApp/mail y un link que le rearma el carrito (`/checkout?c=id:cant,…`). Se borra solo si compra (por id de checkout o por email) o a los 30 días.

### 2) Confirmación (`POST /api/pedidos`)
1. Valida datos y **recalcula precios y envío en el servidor**.
2. **Reserva el stock** (si no alcanza, 409 y no hay pedido).
3. Si es Mercado Pago, crea la orden (`POST /v1/orders`, vence a 1 día) y devuelve el `checkout_url`.
4. Guarda el pedido (estado `recibido`, token secreto para el link de seguimiento).
5. Manda **"¡Recibimos tu pedido!"** al cliente y el **aviso de pedido nuevo** al dueño.

### 3a) Pago por transferencia (10 % off sobre los libros)
- El cliente ve los datos (alias/CVU) y un botón de WhatsApp con el mensaje del comprobante + número de pedido ya escrito.
- El dueño verifica el comprobante y en el panel pasa el pedido a **Pago confirmado** → mail al cliente.
- **Reserva de 24 h**: si no paga, el cron lo **cancela solo**, devuelve el stock, manda **"Tu reserva venció"** (con botón para rearmar el pedido) y lo pasa a Carritos.
- Si paga tarde: el dueño reactiva el pedido desde el panel (vuelve a reservar stock o avisa que no hay).

### 3b) Pago con Mercado Pago (precio de lista)
- El cliente paga en Mercado Pago y vuelve a `/checkout/gracias?pedido=…`. Esa página **consulta la orden a Mercado Pago** y, si está acreditada, pasa el pedido a **Pago confirmado** (mail al cliente). El webhook hace lo mismo aunque el cliente no vuelva.
- Efectivo (Rapipago / Pago Fácil): el cupón vence con la reserva (24 h).
- Si se acredita **después** de vencida la reserva: con stock, el pedido sigue; sin stock, queda marcado en rojo para devolver el pago (`paidAfterExpiry`).

### 4) Despacho (panel)
- **Para despachar**: plazo de **1 día hábil** desde el pago (domingos no cuentan; sábados hasta las 13 h; sin feriados). Amarillo cuando faltan < 8 h, rojo si se pasó (`lib/adminQueue.ts`).
- En cada pedido, bloque **"Datos para la etiqueta"** con botón de copiar en el orden de MiCorreo (paquete: medidas, peso, valor; destino: nombre, CP, dirección, celular, etc.).
- El dueño genera la etiqueta en MiCorreo, pasa el pedido a **En camino** con empresa, número de seguimiento y fecha estimada → mail con "faltan X días".
- Después, **Entregado** → mail.

### 5) Post-venta
- **3 días después de "Entregado"** (cron): mail **"¿Cómo te fue?"** → `/pedido/<id>/opinion?t=<token>`. El comprador puntúa cada libro, la tienda y deja sugerencias. Una sola vez, solo si el pedido está entregado.
- Las reseñas de libros se publican en la página del libro **solo si el dueño las aprueba** (Panel → Opiniones), con "Compra verificada". La opinión de la tienda solo se puede publicar si el cliente dio permiso (todavía no hay sección pública para mostrarla). Las sugerencias son privadas.
- **Botón de arrepentimiento** (`/arrepentimiento`, obligatorio): 10 días corridos. Da un código en el momento (`ARR-XXXX-XXXX`), mail de constancia al cliente y aviso al dueño. Aparece en **Panel → Arrepentimientos** y como cartel en Pedidos.
- Cambios y devoluciones: solo por defecto de fábrica/impresión, daño en el envío o título equivocado (`/cambios-y-devoluciones`).

### Resumen de notificaciones

| Momento | Cliente (mail) | Dueño | Automático |
|---|---|---|---|
| Pedido confirmado | "¡Recibimos tu pedido!" (+ datos de transferencia) | Mail de pedido nuevo | Sí |
| Pago confirmado | Mail con línea de tiempo | — | Sí con Mercado Pago; manual en transferencia |
| Preparando / En camino / Entregado / Cancelado | Mail con línea de tiempo (y seguimiento + fecha en "En camino") | — | Manual (al cambiar el estado en el panel con "Avisar al cliente") |
| 24 h sin pago | "Tu reserva venció" + link para rearmar | Pasa a Carritos | Sí (cron) |
| 3 días después de entregado | "¿Cómo te fue?" | Aparece en Opiniones | Sí (cron) o botón manual |
| Arrepentimiento | Constancia con código | Mail + cartel en el panel | Sí |
| Carrito abandonado (2 h) | — (por ahora el dueño escribe a mano) | Aparece en Carritos | Lista sí, mensaje manual |
| Recordatorio de pago | — (botón de WhatsApp con mensaje armado) | Alerta en Esperando pago | Manual |

**Alertas del panel** (sin mail): pedidos atrasados para despachar, pagos con menos de 12 h de reserva, pagos tardíos sin stock y arrepentimientos pendientes.

### Otros comportamientos de la tienda
- **Stock**: un libro con 0 desaparece del sitio (su página da 404). Con 3 o menos muestra "¡Quedan X!" en el inicio, "Seguí leyendo" y la página del libro. Cualquier cambio de stock refresca el catálogo (`revalidatePath`).
- **Inicio → "Elegidos / Los más vendidos de <mes>"** (`lib/monthlyPicks.ts`): un libro por género. Primero los más vendidos del mes; si faltan, el de más stock de cada género, con rotación mensual. Se titula "Los más vendidos" solo con 4 o más ejemplares vendidos en el mes. La página se regenera cada hora.
- **"Seguí leyendo"** (`relatedBooks` en `data/books.ts`): por momentos en común ("Para tu momento", `data/momentos.ts`) y géneros cercanos. Nunca completa con libros que no tienen relación.
- **Colores por género** de las tarjetas: `CATEGORY_TONE` en `data/books.ts`.

## 4. Variables de entorno

| Variable | Para qué | Obligatoria |
|---|---|---|
| `SITE_URL` | URL pública (links de mails, vuelta de Mercado Pago). Ej. `https://elbauldeloslibros.com.ar` | Sí |
| `ADMIN_PASSWORD` | Clave del panel `/admin` | Sí |
| `CRON_SECRET` | Clave del cron de vencimientos (`Authorization: Bearer …`) | Sí |
| `MP_ACCESS_TOKEN` | Access Token de Mercado Pago (producción) | Sí |
| `MP_WEBHOOK_SECRET` | Clave secreta de Webhooks de Mercado Pago | Sí |
| `GMAIL_USER` | Cuenta de Gmail desde la que salen los mails | Sí (sección 6) |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación de esa cuenta (no la contraseña normal) | Sí (sección 6) |
| `MAIL_FROM_NAME` | Nombre del remitente. Por defecto `El Baul de los Libros` | No |
| `ORDER_EMAIL` | Mail del dueño: avisos de pedidos nuevos y arrepentimientos. También es el reply-to. Por defecto, `GMAIL_USER` | No |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Base de datos | **Sí en Vercel** |

`.env.local` **no** viene en el zip (tiene claves). Las credenciales las carga el dueño en Vercel.

## 5. Publicar (Vercel)

1. Subir a un repo de GitHub (el `.gitignore` ya excluye `node_modules`, `.next`, `.env*.local` y `.data`).
2. Vercel → *Import Project*. Framework: Next.js (sin configuración extra).
3. **Upstash Redis** (obligatorio: en Vercel no se puede escribir en disco). Se puede crear desde *Vercel → Storage → Upstash* o en upstash.com. Cargar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
   - Claves que usa: `order:<id>` + zset `orders`, hash `stock`, `cart:<id>` + zset `carts` (TTL 30 días), `withdrawal:<code>` + zset `withdrawals`, `feedback:<orderId>` + zset `feedback`.
4. Cargar el resto de las variables (sección 4) y desplegar.
5. **Cargar el stock inicial** desde `/admin/stock` (o en la consola de Upstash, ver sección 9). Un libro con 0 no se muestra.
6. **Dominio propio**: apuntarlo a Vercel y poner `SITE_URL` con `https://`. Dejar `www.` como dominio principal (el webhook de Mercado Pago no sigue redirecciones).

### Mercado Pago (producción)
- Aplicación ya creada en Mercado Pago Developers (Checkout Pro · API de Orders). El dueño activa las **credenciales de producción** y las carga en `MP_ACCESS_TOKEN`.
- **Webhooks**: URL `https://<dominio>/api/mercadopago/webhook`, evento **"Order (Mercado Pago)"**. Copiar la clave secreta a `MP_WEBHOOK_SECRET`.
- ⚠️ **Verificar la firma con un aviso real**: `verifyWebhookSignature` (`lib/mercadopago.ts`) arma el manifest como en la doc de Webhooks (`id:<data.id>;request-id:<x-request-id>;ts:<ts>;`). Si los avisos de *order* dan 401, revisar ese formato contra la doc o el SDK oficial.
- El pago también se confirma cuando el cliente vuelve a `/checkout/gracias` (se consulta `GET /v1/orders/{id}`), así que funciona aunque falle un aviso.
- `auto_return` y las fotos de los ítems solo se mandan si `SITE_URL` es `https://`.
- Ya probado con credenciales de prueba: un pago aprobado pasó el pedido a "Pago confirmado" solo.

### Cron (Vercel Cron, en `vercel.json`)
Vercel llama a `GET /api/cron/vencimientos` y, si `CRON_SECRET` está cargada en Vercel, manda solo `Authorization: Bearer <CRON_SECRET>`. No hay que configurar nada afuera. Hace dos cosas:
1. Cancela los pedidos sin pagar con más de 24 h, devuelve el stock, avisa al cliente y pasa el carrito a "Carritos" del panel.
2. Manda el mail "¿Cómo te fue?" a los pedidos entregados hace 3 días o más.

- **Plan Hobby (gratis)**: Vercel solo permite **una vez por día**. Está configurado `0 12 * * *` (12:00 UTC = 9:00 en Argentina; Vercel puede correrlo en cualquier momento de esa hora). Además se revisa solo cuando alguien hace un pedido, completa el checkout o abre el panel, así que en la práctica los vencimientos se procesan seguido.
- **Plan Pro**: se puede pasar a cada hora cambiando el `schedule` a `0 * * * *`.
- Se ve en Vercel → proyecto → *Settings → Cron Jobs* (ahí también hay un botón para correrlo a mano).

## 6. ✉️ Mails — lo que falta hacer

### 6.1 Qué hay programado
Envío: `lib/notify.ts` (función `sendEmail`, SMTP de Gmail `smtp.gmail.com:465` con `nodemailer`). Plantillas HTML + texto: `lib/emails.ts`.
Si faltan `GMAIL_USER` o `GMAIL_APP_PASSWORD`, **no se manda nada**: el contenido se escribe en el log del servidor (`[pedidos] Mail … sin configurar`).

| Mail | A quién | Cuándo sale | Dónde se dispara |
|---|---|---|---|
| Pedido recibido (con datos de transferencia y botón para mandar el comprobante por WhatsApp) | Cliente | Al confirmar el pedido | `notifyNewOrder` en `app/api/pedidos/route.ts` |
| Aviso de pedido nuevo | Dueño (`ORDER_EMAIL`) | Al confirmar el pedido | `notifyNewOrder` |
| Cambio de estado (pago confirmado, preparando, en camino con seguimiento y fecha estimada, entregado, cancelado) con línea de tiempo | Cliente | Al cambiar el estado en el panel con "Avisar al cliente" tildado | `updateOrder` en `app/admin/actions.ts` |
| Pago confirmado (Mercado Pago) | Cliente | Cuando Mercado Pago acredita | `lib/mpSync.ts` |
| "Tu reserva venció" + botón para volver a armar el pedido | Cliente | 24 h sin pago | `lib/expireOrders.ts` (cron) |
| "¿Cómo te fue?" (pide reseña y sugerencias) | Cliente | 3 días después de "Entregado", una vez | `lib/reviewRequests.ts` (cron) y botón del panel |
| Constancia de arrepentimiento (código) + aviso al dueño | Cliente + dueño | Al usar el botón de arrepentimiento | `notifyWithdrawal` |

Vista previa de cualquier mail de estado desde el panel: pedido → "Vista previa del mail" (`/admin/pedidos/<id>/mail`).

### 6.2 Pasos para conectarlo
1. En la cuenta de Google de la tienda, activar la **verificación en 2 pasos** (myaccount.google.com → Seguridad).
2. Entrar a **myaccount.google.com/apppasswords**, crear una contraseña de aplicación (nombre: "Tienda web") y copiar los 16 caracteres.
3. Variables en Vercel:
   - `GMAIL_USER=` la cuenta, ej. `elbauldeloslibros@gmail.com`
   - `GMAIL_APP_PASSWORD=` los 16 caracteres (con o sin espacios)
   - `ORDER_EMAIL=` el mail del dueño, si es distinto de la cuenta de envío (opcional)
4. Volver a desplegar.

Límites de Gmail: unos **500 mails por día** (cuenta gratis). El remitente siempre es la dirección de `GMAIL_USER` (Gmail no deja mandar como otra dirección). Si se cambia la contraseña de la cuenta de Google, la contraseña de aplicación se invalida y hay que crear otra.

### 6.3 Pruebas (con credenciales de prueba de Mercado Pago o pedidos por transferencia)
- [ ] Pedido por transferencia → llegan "Recibimos tu pedido" (cliente) y el aviso al dueño.
- [ ] Cambiar el pedido a "Pago confirmado", "En camino" (con número de seguimiento y fecha) y "Entregado" con "Avisar al cliente" → llega cada mail con la línea de tiempo correcta.
- [ ] Pago con Mercado Pago → llega "Pago confirmado".
- [ ] Pedido sin pagar con `createdAt` de hace 25 h + llamar al cron → llega "Tu reserva venció" y el link rearma el carrito.
- [ ] Pedido entregado hace 3 días + cron (o botón "Mandar el mail ahora") → llega "¿Cómo te fue?" y el link abre `/pedido/<id>/opinion`.
- [ ] Botón de arrepentimiento → llegan la constancia con el código y el aviso al dueño.
- [ ] Revisar en Gmail y Outlook, celular y compu: que no caiga en spam y que el HTML se vea bien (son tablas con estilos en línea).
- [ ] Responder un mail → la respuesta le llega a `ORDER_EMAIL` (reply-to).

### 6.4 Mejora opcional (no está hecha)
Mail automático de **carrito abandonado**: hoy el panel "Carritos" arma el mensaje y el dueño lo manda a mano (WhatsApp o mail). Se podría mandar solo a las 2 h desde el mismo cron, usando `lib/abandonedCarts.ts` y una plantilla nueva en `lib/emails.ts`. Si se hace: una sola vez por carrito y respetando el aviso de privacidad del checkout.

## 7. Datos que faltan del negocio
- `lib/site.ts` → `LEGAL.cuit` y `LEGAL.email` (se muestran en Términos y Privacidad cuando se completan).
- Si el negocio está inscripto en ARCA: agregar el **QR de Data Fiscal** en el footer (`components/layout/Footer.tsx`).

## 8. Checklist después de publicar
- [ ] Inicio, catálogo, página de libro y checkout en celular y compu.
- [ ] Pedido por transferencia de punta a punta (panel → estados → mails).
- [ ] Pedido con Mercado Pago real de monto bajo y reembolso desde Mercado Pago.
- [ ] Webhook de Mercado Pago responde 200 (ver logs de Vercel).
- [ ] Cron corriendo cada hora (ver respuesta `{"ok":true,…}`).
- [ ] Botón de arrepentimiento y link "Defensa de las y los Consumidores" en el footer.
- [ ] `/admin` con una clave larga.

## 9. Stock al 22/11/2026 (para cargar en `/admin/stock`)

| Libro (id) | Unidades |
|---|---|
| habitos-atomicos | 1 |
| la-inteligencia-emocional | 1 |
| el-ego-es-el-enemigo | 1 |
| el-poder-de-las-palabras | 1 |
| como-ganar-amigos | 1 |
| padre-rico-padre-pobre | 5 |
| la-psicologia-del-dinero | 2 |
| el-inversor-inteligente | 0 |
| de-cero-a-uno | 1 |
| el-millonario-de-la-puerta-de-al-lado | 1 |
| el-hombre-mas-rico-de-babilonia | 1 |
| el-dia-que-dejo-de-nevar-en-alaska | 1 |
| 50-proverbios-estoicos | 1 |
| el-camino-del-hombre-superior | 1 |
| los-cuatro-acuerdos | 3 |
| el-poder-del-ahora | 1 |
| el-alquimista | 2 |
| el-hombre-en-busca-de-sentido | 3 |
| la-paciente-silenciosa | 2 |

`la-montana-eres-tu` está marcado sin stock en `data/books.ts` (`sinStock: true`). Por consola de Upstash se puede cargar todo junto:

```
HSET stock habitos-atomicos 1 la-inteligencia-emocional 1 el-ego-es-el-enemigo 1 el-poder-de-las-palabras 1 como-ganar-amigos 1 padre-rico-padre-pobre 5 la-psicologia-del-dinero 2 el-inversor-inteligente 0 de-cero-a-uno 1 el-millonario-de-la-puerta-de-al-lado 1 el-hombre-mas-rico-de-babilonia 1 el-dia-que-dejo-de-nevar-en-alaska 1 50-proverbios-estoicos 1 el-camino-del-hombre-superior 1 los-cuatro-acuerdos 3 el-poder-del-ahora 1 el-alquimista 2 el-hombre-en-busca-de-sentido 3 la-paciente-silenciosa 2
```
