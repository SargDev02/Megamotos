import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Bike,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardList,
  Clock3,
  Loader2,
  MessageCircle,
  Pencil,
  RefreshCcw,
  Search,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  cambiarEstadoOrden,
  listarOrdenesActivas,
  type OrdenActivaResumen,
} from '../services/ordenes'

const formatoCOP =
  new Intl.NumberFormat(
    'es-CO',
    {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    },
  )

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

function normalizarTelefonoWhatsApp(
  telefono: string,
) {
  let numero =
    telefono.replace(
      /\D/g,
      '',
    )

  if (
    numero.startsWith('00')
  ) {
    numero =
      numero.substring(2)
  }

  if (
    numero.length === 10 &&
    numero.startsWith('3')
  ) {
    numero = `57${numero}`
  }

  return numero
}

function crearEnlaceWhatsApp(
  orden: OrdenActivaResumen,
) {
  const telefono =
    normalizarTelefonoWhatsApp(
      orden.moto.cliente.telefono,
    )

  const moto =
    [
      orden.moto.marca.nombre,
      orden.moto.modelo,
    ]
      .filter(Boolean)
      .join(' ')

  const trabajos =
    orden.trabajos
      .map(
        (trabajo) =>
          trabajo.nombre_trabajo,
      )
      .join(', ')

  const mensaje =
    `Hola ${orden.moto.cliente.nombre}, ` +
    `te informamos que tu ${moto} ` +
    `de placa ${orden.moto.placa} ya está lista. ` +
    `Se realizaron: ${trabajos}. ` +
    `Puedes pasar por Megamotos.`

  return (
    `https://wa.me/${telefono}` +
    `?text=${encodeURIComponent(mensaje)}`
  )
}

function normalizarBusqueda(
  valor: string,
) {
  return valor
    .normalize('NFD')
    .replace(
      /\p{Diacritic}/gu,
      '',
    )
    .toLowerCase()
    .trim()
}

export function OrdenesActivasPage() {
  const [
    ordenes,
    setOrdenes,
  ] =
    useState<OrdenActivaResumen[]>(
      [],
    )

  const [
    cargando,
    setCargando,
  ] =
    useState(true)

  const [
    actualizandoId,
    setActualizandoId,
  ] =
    useState<number | null>(
      null,
    )

  const [
    confirmandoTerminarId,
    setConfirmandoTerminarId,
  ] =
    useState<number | null>(
      null,
    )

  const [
    ordenTerminada,
    setOrdenTerminada,
  ] =
    useState<OrdenActivaResumen | null>(
      null,
    )

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    mensaje,
    setMensaje,
  ] =
    useState('')

  const [
    filtroTexto,
    setFiltroTexto,
  ] =
    useState('')

  const [
    filtroMecanico,
    setFiltroMecanico,
  ] =
    useState('')

  async function cargarOrdenes() {
    try {
      setError('')

      const data =
        await listarOrdenesActivas()

      setOrdenes(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar las órdenes',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    let ignorarResultado = false

    void listarOrdenesActivas().then(
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
            : 'No fue posible cargar las órdenes',
        )
        setCargando(false)
      },
    )

    return () => {
      ignorarResultado = true
    }
  }, [])

  const mecanicosFiltro =
    useMemo(() => {
      const nombres =
        new Set<string>()

      for (
        const orden of ordenes
      ) {
        nombres.add(
          orden.mecanico.nombre,
        )
      }

      return Array.from(
        nombres,
      ).sort(
        (a, b) =>
          a.localeCompare(
            b,
          ),
      )
    }, [ordenes])

  const ordenesFiltradas =
    useMemo(() => {
      const texto =
        normalizarBusqueda(
          filtroTexto,
        )

      return ordenes.filter(
        (orden) => {
          if (
            filtroMecanico &&
            orden.mecanico.nombre !==
            filtroMecanico
          ) {
            return false
          }

          if (!texto) {
            return true
          }

          const contenido = [
            orden.moto.placa,
            orden.moto.marca.nombre,
            orden.moto.modelo ?? '',
            orden.moto.cliente.nombre,
            orden.mecanico.nombre,
            orden.vendedor?.nombre ?? '',

            ...orden.trabajos.map(
              (trabajo) =>
                trabajo.nombre_trabajo,
            ),
          ]
            .map(
              normalizarBusqueda,
            )
            .join(' ')

          return contenido.includes(
            texto,
          )
        },
      )
    }, [
      ordenes,
      filtroTexto,
      filtroMecanico,
    ])

  const recibidas =
    useMemo(
      () =>
        ordenesFiltradas.filter(
          (orden) =>
            orden.estado ===
            'RECIBIDA',
        ),
      [ordenesFiltradas],
    )

  const enProceso =
    useMemo(
      () =>
        ordenesFiltradas.filter(
          (orden) =>
            orden.estado ===
            'EN_PROCESO',
        ),
      [ordenesFiltradas],
    )

  const filtrosActivos =
    Boolean(
      filtroTexto ||
      filtroMecanico,
    )

  async function iniciarOrden(
    orden: OrdenActivaResumen,
  ) {
    setError('')
    setMensaje('')

    try {
      setActualizandoId(
        orden.id,
      )

      await cambiarEstadoOrden(
        orden.id,
        'EN_PROCESO',
      )

      setMensaje(
        `${orden.moto.placa} pasó a trabajo en proceso.`,
      )

      await cargarOrdenes()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cambiar el estado',
      )
    } finally {
      setActualizandoId(
        null,
      )
    }
  }

  async function terminarOrden(
    orden: OrdenActivaResumen,
  ) {
    setError('')
    setMensaje('')

    try {
      setActualizandoId(
        orden.id,
      )

      await cambiarEstadoOrden(
        orden.id,
        'TERMINADA',
      )

      setConfirmandoTerminarId(
        null,
      )

      setOrdenTerminada(
        orden,
      )

      await cargarOrdenes()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible terminar la orden',
      )
    } finally {
      setActualizandoId(
        null,
      )
    }
  }

  function renderOrden(
    orden: OrdenActivaResumen,
  ) {
    const actualizando =
      actualizandoId ===
      orden.id

    const enTrabajo =
      orden.estado ===
      'EN_PROCESO'

    return (
      <article
        key={orden.id}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
      >
        {/* CABECERA */}
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-start sm:p-6">
          <div className="flex items-start gap-4">
            <div
              className={[
                'flex size-12 shrink-0 items-center justify-center rounded-xl',
                enTrabajo
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              <Bike className="size-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-zinc-950">
                  {
                    orden.moto.marca
                      .nombre
                  }
                  {' '}
                  {orden.moto.modelo ||
                    ''}
                </h3>

                <span
                  className={[
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                    enTrabajo
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700',
                  ].join(' ')}
                >
                  {enTrabajo
                    ? 'EN PROCESO'
                    : 'RECIBIDA'}
                </span>
              </div>

              <p className="mt-1 text-2xl font-black tracking-wider text-zinc-950">
                {
                  orden.moto
                    .placa
                }
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                Orden #{orden.id}
              </p>
            </div>
          </div>

          <Link
            to={`/orden/${orden.id}/editar`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            <Pencil className="size-4" />
            Editar orden
          </Link>
        </div>

        {/* INFORMACIÓN */}
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <UserRound className="size-4" />
                  Cliente
                </div>

                <p className="mt-2 font-semibold text-zinc-950">
                  {
                    orden.moto
                      .cliente.nombre
                  }
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Wrench className="size-4" />
                  Mecánico
                </div>

                <p className="mt-2 font-semibold text-zinc-950">
                  {
                    orden.mecanico
                      .nombre
                  }
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Clock3 className="size-4" />
                  Ingreso
                </div>

                <p className="mt-2 text-sm font-semibold text-zinc-950">
                  {formatoFecha.format(
                    new Date(
                      orden.created_at,
                    ),
                  )}
                </p>
              </div>
            </div>

            {/* TRABAJOS */}
            <div className="mt-6">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
                Trabajos
              </h4>

              {orden.trabajos.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
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
                        className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-white text-zinc-500 shadow-sm">
                            <Wrench className="size-4" />
                          </div>

                          <span className="text-sm font-medium text-zinc-800">
                            {
                              trabajo.nombre_trabajo
                            }
                          </span>
                        </div>

                        <span className="whitespace-nowrap text-sm font-bold text-zinc-950">
                          {formatoCOP.format(
                            Number(
                              trabajo.precio_final,
                            ),
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* OBSERVACIONES */}
            {orden.observaciones && (
              <div className="mt-5 rounded-xl border border-zinc-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Observaciones
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {
                    orden.observaciones
                  }
                </p>
              </div>
            )}
          </div>

          {/* RESUMEN */}
          <aside className="flex flex-col rounded-2xl bg-zinc-950 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Total orden
            </p>

            <p className="mt-2 text-3xl font-black">
              {formatoCOP.format(
                Number(
                  orden.total,
                ),
              )}
            </p>

            <div className="my-5 border-t border-white/10" />

            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Recibió
            </p>

            <p className="mt-1 text-sm font-semibold">
              {orden.vendedor?.nombre ??
                'No disponible'}
            </p>

            <div className="mt-auto pt-6">
              {!enTrabajo ? (
                <button
                  type="button"
                  disabled={
                    actualizando
                  }
                  onClick={() =>
                    void iniciarOrden(
                      orden,
                    )
                  }
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actualizando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="size-4" />
                      Iniciar trabajo
                    </>
                  )}
                </button>
              ) : confirmandoTerminarId !==
                orden.id ? (
                <button
                  type="button"
                  disabled={
                    actualizando
                  }
                  onClick={() =>
                    setConfirmandoTerminarId(
                      orden.id,
                    )
                  }
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  Marcar como terminada
                </button>
              ) : (
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-sm font-semibold">
                    ¿La moto ya está terminada?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    Después quedará disponible para liquidación.
                  </p>

                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      disabled={
                        actualizando
                      }
                      onClick={() =>
                        void terminarOrden(
                          orden,
                        )
                      }
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {actualizando ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Terminando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Sí, terminar
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={
                        actualizando
                      }
                      onClick={() =>
                        setConfirmandoTerminarId(
                          null,
                        )
                      }
                      className="h-10 w-full rounded-lg border border-white/20 px-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    )
  }

  if (
    cargando &&
    ordenes.length === 0
  ) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-7 animate-spin text-zinc-500" />

          <p className="mt-3 text-sm text-zinc-500">
            Cargando órdenes...
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
            Órdenes activas
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Controla las motos recibidas y los trabajos que están en proceso.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void cargarOrdenes()
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          <RefreshCcw className="size-4" />
          Actualizar
        </button>
      </section>

      {/* FILTROS */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

            <input
              type="search"
              value={filtroTexto}
              onChange={(event) =>
                setFiltroTexto(
                  event.target.value,
                )
              }
              placeholder="Buscar placa, cliente, moto, mecánico o trabajo..."
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
          </div>

          <select
            value={
              filtroMecanico
            }
            onChange={(event) =>
              setFiltroMecanico(
                event.target.value,
              )
            }
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 lg:min-w-56"
          >
            <option value="">
              Todos los mecánicos
            </option>

            {mecanicosFiltro.map(
              (nombre) => (
                <option
                  key={nombre}
                  value={nombre}
                >
                  {nombre}
                </option>
              ),
            )}
          </select>

          {filtrosActivos && (
            <button
              type="button"
              onClick={() => {
                setFiltroTexto('')
                setFiltroMecanico('')
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              <X className="size-4" />
              Limpiar
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>
            {ordenesFiltradas.length ===
              ordenes.length
              ? `${ordenes.length} órdenes activas`
              : `Mostrando ${ordenesFiltradas.length} de ${ordenes.length} órdenes`}
          </span>

          {filtrosActivos && (
            <span className="font-medium text-zinc-700">
              Filtros aplicados
            </span>
          )}
        </div>
      </section>

      {/* CONTADORES */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Recibidas
              </p>

              <p className="mt-1 text-4xl font-black text-amber-950">
                {recibidas.length}
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
                Trabajándose actualmente
              </p>
            </div>

            <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <CircleDot className="size-6" />
            </div>
          </div>
        </div>
      </section>

      {/* ERRORES */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {mensaje}
        </div>
      )}

      {/* MOTO TERMINADA */}
      {ordenTerminada && (
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
          <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="size-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-emerald-950">
                  Moto terminada correctamente
                </h2>

                <p className="mt-1 text-sm text-emerald-800">
                  {
                    ordenTerminada
                      .moto.cliente
                      .nombre
                  }
                </p>

                <p className="mt-1 font-semibold text-emerald-950">
                  {
                    ordenTerminada
                      .moto.marca
                      .nombre
                  }
                  {' '}
                  {ordenTerminada
                    .moto.modelo || ''}
                  {' · '}
                  {
                    ordenTerminada
                      .moto.placa
                  }
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={crearEnlaceWhatsApp(
                  ordenTerminada,
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="size-4" />
                Avisar por WhatsApp
              </a>

              <button
                type="button"
                onClick={() =>
                  setOrdenTerminada(
                    null,
                  )
                }
                className="h-10 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </section>
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
              Motos que están siendo trabajadas.
            </p>
          </div>
        </div>

        {enProceso.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <Wrench className="mx-auto size-8 text-zinc-300" />

            <p className="mt-3 font-semibold text-zinc-700">
              No hay motos en proceso
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {filtrosActivos
                ? 'No encontramos órdenes en proceso con estos filtros.'
                : 'Las motos iniciadas aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enProceso.map(
              renderOrden,
            )}
          </div>
        )}
      </section>

      {/* RECIBIDAS */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ClipboardList className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              Recibidas
            </h2>

            <p className="text-sm text-zinc-500">
              Motos pendientes por iniciar.
            </p>
          </div>
        </div>

        {recibidas.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto size-8 text-zinc-300" />

            <p className="mt-3 font-semibold text-zinc-700">
              No hay motos pendientes
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {filtrosActivos
                ? 'No encontramos órdenes recibidas con estos filtros.'
                : 'Las nuevas órdenes aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recibidas.map(
              renderOrden,
            )}
          </div>
        )}
      </section>
    </div>
  )
}
