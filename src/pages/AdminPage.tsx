import {
  ArrowRight,
  ClipboardList,
  DollarSign,
  Search,
  UserCog,
  Wrench,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

interface AccesoRapido {
  titulo: string
  descripcion: string
  ruta: string
  icono: typeof Search
}

const accesos: AccesoRapido[] = [
  {
    titulo: 'Recepción',
    descripcion:
      'Buscar una placa, registrar una moto o consultar su historial.',
    ruta: '/recepcion',
    icono: Search,
  },

  {
    titulo: 'Órdenes activas',
    descripcion:
      'Consulta las motos recibidas y las que están actualmente en proceso.',
    ruta: '/ordenes',
    icono: ClipboardList,
  },

  {
    titulo: 'Trabajos',
    descripcion:
      'Administra los trabajos disponibles y sus precios base.',
    ruta: '/admin/trabajos',
    icono: Wrench,
  },

  {
    titulo: 'Usuarios',
    descripcion:
      'Administra vendedores, mecánicos, contraseñas y porcentajes.',
    ruta: '/admin/usuarios',
    icono: UserCog,
  },

  {
    titulo: 'Liquidaciones',
    descripcion:
      'Consulta pagos pendientes y registra pagos a los mecánicos.',
    ruta: '/admin/liquidaciones',
    icono: DollarSign,
  },
]

export function AdminPage() {
  const {
    perfil,
  } = useAuth()

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm font-medium text-zinc-500">
          Panel administrativo
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
          Hola, {perfil?.nombre}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Desde aquí puedes controlar las
          operaciones principales del taller.
        </p>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-zinc-950">
            Accesos rápidos
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Selecciona la operación que deseas realizar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accesos.map(
            (acceso) => {
              const Icon =
                acceso.icono

              return (
                <Link
                  key={acceso.ruta}
                  to={acceso.ruta}
                  className="group flex min-h-48 flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="mb-6 flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="text-lg font-bold text-zinc-950">
                    {acceso.titulo}
                  </h3>

                  <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">
                    {acceso.descripcion}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-zinc-950">
                    Abrir

                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            },
          )}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-zinc-950 p-6 text-white">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-zinc-400">
            MEGAMOTOS
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Gestión del taller
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Las motos recibidas, trabajos,
            mecánicos, historial y pagos
            permanecen centralizados en el
            mismo sistema.
          </p>
        </div>
      </section>
    </div>
  )
}
