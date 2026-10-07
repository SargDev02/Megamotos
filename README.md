# Megamotos

Aplicación web interna de Megamotos para gestionar la recepción de motocicletas, las órdenes de taller, el catálogo de trabajos, los usuarios y las liquidaciones de mecánicos.

## Requisitos

- Node.js 20 o superior
- npm
- Un proyecto de Supabase configurado para Megamotos

## Instalación

```bash
npm install
```

Crea un archivo `.env.local` a partir de `.env.example` y completa únicamente las variables públicas del cliente:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

No incluyas claves `service_role` ni contraseñas en archivos del repositorio.

## Comandos

```bash
npm run dev
npm run lint
npm run build
```

## Roles

- `ADMIN`: administra usuarios, trabajos y liquidaciones, y accede al flujo operativo.
- `VENDEDOR`: recibe motocicletas, crea órdenes y gestiona sus estados.
- `MECANICO`: consulta en modo lectura las motocicletas y trabajos que tiene asignados.

Los estados operativos existentes son `RECIBIDA → EN_PROCESO → TERMINADA`.

## Supabase

Este directorio no contiene infraestructura local `supabase/migrations`. Queda pendiente versionar, cuando exista esa infraestructura, la política RLS vigente de `perfiles`: `ADMIN` puede leer perfiles; `VENDEDOR` puede leer los perfiles del personal necesarios para identificar quién recibió las órdenes; `MECANICO` solo puede leer su propio perfil. No se deben alterar las demás políticas ni el esquema al incorporar esa migración.
