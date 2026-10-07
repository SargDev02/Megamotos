import {
  useMemo,
  useState,
} from 'react'
import { Search } from 'lucide-react'

import type { TipoTrabajo } from '../services/trabajos'

interface BuscadorTrabajosProps {
  catalogo: TipoTrabajo[]
  trabajosAgregadosIds: ReadonlySet<number>
  onSeleccionar: (trabajo: TipoTrabajo) => void
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function normalizarBusqueda(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function BuscadorTrabajos({
  catalogo,
  trabajosAgregadosIds,
  onSeleccionar,
}: BuscadorTrabajosProps) {
  const [busqueda, setBusqueda] =
    useState('')

  const trabajosDisponibles =
    useMemo(() => {
      const texto =
        normalizarBusqueda(
          busqueda,
        )

      return catalogo.filter(
        (trabajo) =>
          !trabajosAgregadosIds.has(
            trabajo.id,
          ) &&
          normalizarBusqueda(
            trabajo.nombre,
          ).includes(texto),
      )
    }, [
      busqueda,
      catalogo,
      trabajosAgregadosIds,
    ])

  function seleccionar(
    trabajo: TipoTrabajo,
  ) {
    onSeleccionar(trabajo)
    setBusqueda('')
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

        <input
          type="search"
          value={busqueda}
          onChange={(event) =>
            setBusqueda(
              event.target.value,
            )
          }
          placeholder="Buscar trabajo..."
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 text-base outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 sm:text-sm"
        />
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto overscroll-contain pr-1">
        {trabajosDisponibles.length ===
        0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-medium text-zinc-500">
            No encontramos trabajos
          </div>
        ) : (
          trabajosDisponibles.map(
            (trabajo) => (
              <button
                key={trabajo.id}
                type="button"
                onClick={() =>
                  seleccionar(
                    trabajo,
                  )
                }
                className="flex min-h-16 w-full touch-manipulation items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100"
              >
                <span className="font-semibold text-zinc-950">
                  {trabajo.nombre}
                </span>

                <span className="shrink-0 text-sm font-bold text-zinc-700">
                  {formatoCOP.format(
                    Number(
                      trabajo.precio_base,
                    ),
                  )}
                </span>
              </button>
            ),
          )
        )}
      </div>
    </div>
  )
}
