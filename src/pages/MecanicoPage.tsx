import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Bike,
  CircleDot,
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCcw,
  Wrench,
} from 'lucide-react'

import {
  listarMisOrdenes,
  type OrdenMecanico,
} from '../services/mecanico'

const formatoFecha =
  new Intl.DateTimeFormat(
    'es-CO',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )

export function MecanicoPage() {
  const [
    ordenes,
    setOrdenes,
  ] =
    useState<OrdenMecanico[]>([])

  const [
    cargando,
    setCargando,
  ] =
    useState(true)

  const [
    actualizando,
    setActualizando,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  async function cargarOrdenes() {
    try {
      setError('')
      setActualizando(true)

      const data =
        await listarMisOrdenes()

      setOrdenes(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar tus motos',
      )
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }

  useEffect(() => {
    let ignorarResultado = false

    void listarMisOrdenes().then(
      (data) => {
        if (ignorarResultado) {
          return
        }

        setOrdenes(data)
        setCargando(false)
      },
      (error: unknown) => {
        if (ignorarResultado) {
          return
        }

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar tus motos',
        )
        setCargando(false)
      },
    )

    return () => {
      ignorarResultado = true
    }
  }, [])

  const enProceso =
    useMemo(
      () =>
        ordenes.filter(
          (orden) =>
            orden.estado ===
            'EN_PROCESO',
        ),
      [ordenes],
    )

  const pendientes =
    useMemo(
      () =>
        ordenes.filter(
          (orden) =>
            orden.estado ===
            'RECIBIDA',
        ),
      [ordenes],
    )

  function renderOrden(
    orden: OrdenMecanico,
  ) {
    const trabajando =
      orden.estado ===
      'EN_PROCESO'

    return (
      <article
        key={orden.id}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      >
        {/* CABECERA */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5">
          <div className="flex items-start gap-4">
            <div
              className={[
                'flex size-12 shrink-0 items-center justify-center rounded-xl',
                trabajando
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              <Bike className="size-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-zinc-950">
                {
                  orden.moto.marca
                    .nombre
                }
                {' '}
                {orden.moto.modelo ||
                  ''}
              </h3>

              <p className="mt-1 text-2xl font-black tracking-wider text-zinc-950">
                {orden.moto.placa}
              </p>
            </div>
          </div>

          <span
            className={[
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
              trabajando
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700',
            ].join(' ')}
          >
            {trabajando
              ? 'EN PROCESO'
              : 'RECIBIDA'}
          </span>
        </div>

        {/* CONTENIDO */}
        <div className="p-5">
          <div className="mb-5 flex items-center gap-2 text-sm text-zinc-500">
            <Clock3 className="size-4" />

            <span>
              Ingreso:{' '}
              {formatoFecha.format(
                new Date(
                  orden.created_at,
                ),
              )}
            </span>
          </div>

          {/* TRABAJOS */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="size-4 text-zinc-500" />

              <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Trabajos por realizar
              </h4>
            </div>

            {orden.trabajos.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
                No hay trabajos registrados.
              </div>
            ) : (
              <div className="space-y-2">
                {orden.trabajos.map(
                  (trabajo) => (
                    <div
                      key={
                        trabajo.id
                      }
                      className="flex items-center gap-3 rounded-xl bg-zinc-50 px-4 py-3"
                    >
                      <div
                        className={[
                          'size-2 shrink-0 rounded-full',
                          trabajando
                            ? 'bg-blue-500'
                            : 'bg-amber-500',
                        ].join(' ')}
                      />

                      <span className="text-sm font-semibold text-zinc-800">
                        {
                          trabajo.nombre_trabajo
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* OBSERVACIONES */}
          {orden.observaciones && (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Observaciones
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {
                  orden.observaciones
                }
              </p>
            </div>
          )}
        </div>
      </article>
    )
  }

  if (cargando) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-7 animate-spin text-zinc-500" />

          <p className="mt-3 text-sm text-zinc-500">
            Cargando tus motos...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ENCABEZADO */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Taller
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Mis motos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Consulta las motocicletas que
            tienes asignadas y los trabajos
            que debes realizar.
          </p>
        </div>

        <button
          type="button"
          disabled={actualizando}
          onClick={() =>
            void cargarOrdenes()
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actualizando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCcw className="size-4" />
          )}

          {actualizando
            ? 'Actualizando...'
            : 'Actualizar lista'}
        </button>
      </section>

      {/* RESUMEN */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                En proceso
              </p>

              <p className="mt-1 text-4xl font-black text-blue-950">
                {enProceso.length}
              </p>

              <p className="mt-1 text-sm text-blue-700/70">
                Trabajándose ahora
              </p>
            </div>

            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <CircleDot className="size-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Pendientes
              </p>

              <p className="mt-1 text-4xl font-black text-amber-950">
                {pendientes.length}
              </p>

              <p className="mt-1 text-sm text-amber-700/70">
                Pendientes por iniciar
              </p>
            </div>

            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ClipboardList className="size-6" />
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* EN PROCESO */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <CircleDot className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              En proceso
            </h2>

            <p className="text-sm text-zinc-500">
              Motos que actualmente están
              siendo trabajadas.
            </p>
          </div>
        </div>

        {enProceso.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <Wrench className="mx-auto size-8 text-zinc-300" />

            <p className="mt-3 font-semibold text-zinc-700">
              No tienes motos en proceso
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {enProceso.map(
              renderOrden,
            )}
          </div>
        )}
      </section>

      {/* PENDIENTES */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ClipboardList className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              Pendientes por iniciar
            </h2>

            <p className="text-sm text-zinc-500">
              Motos recibidas que todavía
              no han pasado a proceso.
            </p>
          </div>
        </div>

        {pendientes.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <Bike className="mx-auto size-8 text-zinc-300" />

            <p className="mt-3 font-semibold text-zinc-700">
              No tienes motos pendientes
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {pendientes.map(
              renderOrden,
            )}
          </div>
        )}
      </section>
    </div>
  )
}
