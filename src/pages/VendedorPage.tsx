import {
  ArrowRight,
  Bike,
  ClipboardList,
  Search,
  UserRound,
  Wrench,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

export function VendedorPage() {
  const { perfil } =
    useAuth()

  return (
    <div className="space-y-8">
      {/* ENCABEZADO */}
      <section>
        <p className="text-sm font-medium text-zinc-500">
          Panel de trabajo
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
          Hola
          {perfil?.nombre
            ? `, ${perfil.nombre}`
            : ''}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Desde aquí puedes recibir
          motocicletas, crear órdenes y
          controlar los trabajos activos
          del taller.
        </p>
      </section>

      {/* ACCIONES PRINCIPALES */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Link
          to="/recepcion"
          className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-white">
                <Search className="size-6" />
              </div>

              <ArrowRight className="size-5 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-950" />
            </div>

            <h2 className="mt-6 text-xl font-bold text-zinc-950">
              Recepción
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Busca una motocicleta por su
              placa, consulta su historial,
              registra una nueva moto o crea
              una orden de trabajo.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
              Ir a recepción

              <ArrowRight className="size-4" />
            </div>
          </div>
        </Link>

        <Link
          to="/ordenes"
          className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <ClipboardList className="size-6" />
              </div>

              <ArrowRight className="size-5 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-950" />
            </div>

            <h2 className="mt-6 text-xl font-bold text-zinc-950">
              Órdenes activas
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Consulta las motos recibidas,
              inicia trabajos, edita las
              órdenes y marca las motos como
              terminadas.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-zinc-950">
              Ver órdenes

              <ArrowRight className="size-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* FLUJO */}
      <section className="rounded-2xl bg-zinc-950 p-6 text-white sm:p-7">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Flujo diario
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Del ingreso de la moto hasta
            terminar el trabajo
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Megamotos mantiene un flujo
            sencillo para que recepción no
            tenga que llenar formularios
            innecesarios.
          </p>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Search className="size-4" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Paso 1
            </p>

            <h3 className="mt-1 font-bold">
              Buscar placa
            </h3>

            <p className="mt-2 text-sm leading-5 text-zinc-400">
              Consulta la motocicleta y su
              historial o registra una nueva.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Wrench className="size-4" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Paso 2
            </p>

            <h3 className="mt-1 font-bold">
              Crear orden
            </h3>

            <p className="mt-2 text-sm leading-5 text-zinc-400">
              Asigna el mecánico y registra
              los trabajos que se realizarán.
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Bike className="size-4" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Paso 3
            </p>

            <h3 className="mt-1 font-bold">
              Controlar trabajo
            </h3>

            <p className="mt-2 text-sm leading-5 text-zinc-400">
              Pasa la orden a proceso y
              finalmente márcala como
              terminada.
            </p>
          </div>
        </div>
      </section>

      {/* INFORMACIÓN */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
              <UserRound className="size-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Sesión
              </p>

              <p className="mt-1 font-bold text-zinc-950">
                {perfil?.nombre ||
                  'Vendedor'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Bike className="size-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Prioridad
              </p>

              <p className="mt-1 font-bold text-zinc-950">
                Atención rápida en recepción
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
