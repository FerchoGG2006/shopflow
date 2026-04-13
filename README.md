# ShopFlow — MVP

> Tu tienda digital en un link. Recibe pedidos por WhatsApp. Compite con Vinapp y Beacons.

## ¿Qué incluye este MVP?

| Módulo | Descripción |
|---|---|
| 🛍️ **Tienda pública** | `tudominio.com/nombre-negocio` — catálogo visual, carrito, pedido por WhatsApp |
| 📊 **Dashboard** | Panel del negocio: pedidos en tiempo real, estadísticas del día |
| 📦 **Gestión de productos** | Crear, editar, eliminar productos. **IA genera la descripción automáticamente** |
| 💬 **WhatsApp inteligente** | Mensaje formateado con todos los detalles del pedido, cliente y pago |
| 🔐 **Autenticación** | Firebase Auth — registro e inicio de sesión para negocios |

## Stack tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Base de datos**: Firebase Firestore (tiempo real)
- **Almacenamiento**: Firebase Storage (imágenes)
- **IA**: Claude Haiku (descripciones de productos)
- **Estilos**: CSS puro con variables (sin Tailwind)
- **Deploy**: Vercel (recomendado)

## Instalación

### 1. Clonar y preparar

```bash
git clone https://github.com/TU_USUARIO/shopflow.git
cd shopflow
npm install
```

### 2. Configurar Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Activa **Authentication** → Email/Password
4. Activa **Firestore Database** (modo producción)
5. Activa **Storage**
6. Ve a Configuración → Apps Web → Copia las credenciales

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Firebase y Anthropic
```

### 4. Reglas de Firestore

Copia esto en Firebase Console → Firestore → Reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Negocios: solo el dueño puede escribir
    match /businesses/{businessId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == businessId;
    }
    // Productos: públicos para leer, solo el dueño escribe
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.businessId;
      allow create: if request.auth != null;
    }
    // Pedidos: cualquiera puede crear, solo el dueño ve los suyos
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null &&
        request.auth.uid == resource.data.businessId;
    }
    // Categorías: públicas
    match /categories/{catId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Correr en local

```bash
npm run dev
# Abre http://localhost:3000
```

## Estructura del proyecto

```
src/
├── app/
│   ├── [slug]/
│   │   └── page.tsx        ← 🛍️ Tienda pública (la más importante)
│   ├── dashboard/
│   │   ├── page.tsx        ← 📊 Dashboard del negocio
│   │   └── products/
│   │       └── page.tsx    ← 📦 Gestión de productos
│   ├── api/
│   │   └── ai/describe/
│   │       └── route.ts    ← 🧠 API de IA para descripciones
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── firebase.ts         ← 🔥 Todas las funciones de Firebase
│   ├── whatsapp.ts         ← 💬 Generador de mensajes WhatsApp
│   ├── ai.ts               ← 🤖 Llamadas a la API de IA
│   └── types.ts            ← 📐 Tipos TypeScript
```

## Deploy en Vercel

```bash
npm install -g vercel
vercel

# Agrega las variables de entorno en:
# vercel.com → Tu proyecto → Settings → Environment Variables
```

## Siguientes pasos (Fase 2)

- [ ] Página de onboarding para nuevos negocios
- [ ] Login/registro de negocios
- [ ] Pagos con Stripe
- [ ] Notificaciones push (PWA)
- [ ] Estadísticas avanzadas con recharts
- [ ] QR Code por negocio
- [ ] Verificación de comprobantes con IA (de NEXUS)

---

Desarrollado por **Antigravity AI** — parte del ecosistema NEXUS
