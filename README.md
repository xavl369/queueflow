# QueueFlow

Sistema de gestión de turnos en tiempo real para eventos sociales.

Los invitados escanean un código QR para registrarse y reciben una notificación por WhatsApp cuando su silla está lista. El operador administra todo desde un panel de administración optimizado para móvil.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Hosting | Firebase Hosting |
| Base de datos | Firebase Realtime Database |
| Backend | Firebase Cloud Functions |
| Autenticación | Firebase Authentication (email/password) |
| Notificaciones | Twilio WhatsApp (plantilla Utility) + SMS como respaldo |
| PWA | vite-plugin-pwa |

## Vistas de la Aplicación

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/register/:eventId` | Página de registro para invitados (QR) | Público |
| `/admin/:eventId` | Panel de administración del operador | Requiere auth |
| `/login` | Inicio de sesión del admin | Público |

## Máquina de Estados del Cliente

```
waiting → called → attending → finished
called → absent → (reactivar) → waiting (prioridad: true)
```

## Estados del Evento

```
inactive → active → closed (terminal)
```

## Sillas

- Dos sillas independientes: **Silla 1** y **Silla 2**
- Cada silla tiene estado (`available` / `occupied`) y `current_client_id`
- Solo puede haber UN cliente en `called`/`attending` por silla a la vez
- Esta validación ocurre en una transacción de Cloud Function (nunca en el cliente)

## Mensajes de Notificación

| Mensaje | Disparador |
|---------|-----------|
| MSG 1 | Confirmación de registro (automático al enviar formulario) |
| MSG 2 | Silla lista (al presionar LLAMAR — el más crítico) |
| MSG 3 | Aviso de reactivación (al presionar REACTIVAR — opcional) |
| MSG 4 | Agradecimiento post-servicio (Fase 2, no en MVP) |

Todos los mensajes usan plantillas de tipo **Utility** (no Marketing).

## Configuración del Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Firebase — obtenlos desde la consola de Firebase > Configuración del proyecto
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Twilio — solo se usa en Cloud Functions (nunca expuesto al navegador)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Feature flags
USE_WHATSAPP=false
DEFAULT_COUNTRY_CODE=+52
DEFAULT_TIMEZONE=America/Hermosillo
DEFAULT_LANGUAGE=es
MAX_EXTRA_TIME_MINUTES=30

# Emulador local (desarrollo)
VITE_USE_EMULATOR=false
```

## Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Desarrollo con emuladores locales de Firebase
npm run dev:local

# Iniciar emuladores de Firebase
npm run emulators

# Ejecutar pruebas (Vitest)
npm run test

# Ejecutar pruebas en modo watch
npm run test:watch

# Pruebas de reglas de seguridad
npm run test:rules

# Build de producción
npm run build

# Cloud Functions
cd functions && npm run test
```

## Orden de Construcción (Fases)

1. Estructura del proyecto Firebase y configuración
2. Página de registro pública + escritura en Firebase
3. Panel de administración con listener en tiempo real
4. Máquina de estados de sillas y lógica de botones (Cloud Functions)
5. Integración de Twilio en Cloud Functions
6. Toggle maestro del evento (abrir/cerrar)
7. Lista de ausentes y lógica de reactivación
8. Configuración PWA
9. Reglas de seguridad
10. QA y despliegue

## Estructura del Panel de Administración

```
┌─────────────────────────────────────┐
│  Barra de estado del evento (fija)  │
├──────────────┬──────────────────────┤
│   Silla 1    │       Silla 2        │
├─────────────────────────────────────┤
│       Lista de espera (scroll)      │
├─────────────────────────────────────┤
│    Lista de ausentes (colapsada)    │
├─────────────────────────────────────┤
│  Atendidos | En espera | Ausentes   │
└─────────────────────────────────────┘
```

## Reglas de Desarrollo

- Diseño mobile-first en todos los componentes (el panel se opera con una mano)
- Nunca hardcodear credenciales — siempre variables de entorno
- La lógica de asignación de sillas siempre va en Cloud Functions, nunca en React
- Todos los componentes son funcionales con hooks (sin clases)
- Los listeners de Firebase van en `useEffect` con limpieza en el return
- `async/await` sobre cadenas `.then()`
- Early returns sobre condicionales anidados
- Named exports (excepto en páginas)
