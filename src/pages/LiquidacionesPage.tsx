import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  History,
  Loader2,
  RefreshCcw,
  UserRound,
  X,
} from 'lucide-react'

import {
  listarHistorialPagos,
  listarPagosPendientes,
  registrarPagoMecanico,
  type PagoHistorial,
  type PagoPendiente,
} from '../services/liquidaciones'

interface GrupoPendiente {
  mecanico_id: string
  mecanico_nombre: string

  motos: PagoPendiente[]

  total_cobrado: number
  total_mecanico: number
}

interface GrupoDiaPendiente {
  fecha: string
  ordenes: PagoPendiente[]
}

interface GrupoHistorial {
  liquidacion_id: number
  fecha_pago: string

  mecanico_id: string
  mecanico_nombre: string

  total_cobrado: number
  total_pagado: number

  motos: PagoHistorial[]
}

interface MecanicoLiquidacion {
  id: string
  nombre: string
}

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
    },
  )

const formatoFechaPendiente =
  new Intl.DateTimeFormat(
    'es-CO',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Bogota',
    },
  )

const formatoPartesFechaColombia =
  new Intl.DateTimeFormat(
    'en-US',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Bogota',
    },
  )

const FECHA_SIN_REGISTRO =
  'SIN_FECHA'

function mostrarFecha(
  fecha: string,
) {
  return formatoFecha.format(
    new Date(
      `${fecha}T12:00:00`,
    ),
  )
}

function fechaColombia(
  fecha: string | null,
) {
  if (!fecha) {
    return FECHA_SIN_REGISTRO
  }

  const partes =
    formatoPartesFechaColombia
      .formatToParts(
        new Date(fecha),
      )

  const obtener = (
    tipo: Intl.DateTimeFormatPartTypes,
  ) =>
    partes.find(
      (parte) =>
        parte.type === tipo,
    )?.value ?? ''

  return `${obtener('year')}-${obtener('month')}-${obtener('day')}`
}

function mostrarFechaPendiente(
  fecha: string,
) {
  if (
    fecha === FECHA_SIN_REGISTRO
  ) {
    return 'Fecha no registrada'
  }

  const texto =
    formatoFechaPendiente.format(
      new Date(
        `${fecha}T12:00:00-05:00`,
      ),
    )

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  )
}

export function LiquidacionesPage() {
  const [
    pendientes,
    setPendientes,
  ] =
    useState<PagoPendiente[]>([])

  const [
    historial,
    setHistorial,
  ] =
    useState<PagoHistorial[]>([])

  const [
    mecanicoElegidoId,
    setMecanicoSeleccionadoId,
  ] =
    useState('')

  const [
    ordenesSeleccionadas,
    setOrdenesSeleccionadas,
  ] = useState<Set<number>>(
    () => new Set(),
  )

  const [
    detalleAbierto,
    setDetalleAbierto,
  ] =
    useState<number | null>(
      null,
    )

  const [
    fechaDesde,
    setFechaDesde,
  ] =
    useState('')

  const [
    fechaHasta,
    setFechaHasta,
  ] =
    useState('')

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
    pagandoMecanicoId,
    setPagandoMecanicoId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    confirmandoMecanicoId,
    setConfirmandoMecanicoId,
  ] =
    useState<string | null>(
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

  async function cargarDatos() {
    try {
      setError('')
      setActualizando(true)
      setOrdenesSeleccionadas(
        new Set(),
      )
      setConfirmandoMecanicoId(
        null,
      )

      const [
        pagosPendientes,
        historialPagos,
      ] =
        await Promise.all([
          listarPagosPendientes(),
          listarHistorialPagos(),
        ])

      setPendientes(
        pagosPendientes,
      )

      setHistorial(
        historialPagos,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar las liquidaciones',
      )
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }

  useEffect(() => {
    let ignorarResultado = false

    void Promise.all([
      listarPagosPendientes(),
      listarHistorialPagos(),
    ]).then(
      ([pagosPendientes, historialPagos]) => {
        if (ignorarResultado) {
          return
        }

        setPendientes(pagosPendientes)
        setHistorial(historialPagos)
        setCargando(false)
      },
      (error: unknown) => {
        if (ignorarResultado) {
          return
        }

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar las liquidaciones',
        )
        setCargando(false)
      },
    )

    return () => {
      ignorarResultado = true
    }
  }, [])

  const gruposPendientes =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          GrupoPendiente
        >()

      for (
        const pago of pendientes
      ) {
        const existente =
          mapa.get(
            pago.mecanico_id,
          )

        if (existente) {
          existente.motos.push(
            pago,
          )

          existente.total_cobrado +=
            pago.total_cobrado

          existente.total_mecanico +=
            pago.pago_mecanico

          continue
        }

        mapa.set(
          pago.mecanico_id,
          {
            mecanico_id:
              pago.mecanico_id,

            mecanico_nombre:
              pago.mecanico_nombre,

            motos: [
              pago,
            ],

            total_cobrado:
              pago.total_cobrado,

            total_mecanico:
              pago.pago_mecanico,
          },
        )
      }

      return Array.from(
        mapa.values(),
      )
    }, [pendientes])

  const gruposHistorial =
    useMemo(() => {
      const mapa =
        new Map<
          number,
          GrupoHistorial
        >()

      for (
        const pago of historial
      ) {
        const existente =
          mapa.get(
            pago.liquidacion_id,
          )

        if (existente) {
          existente.motos.push(
            pago,
          )

          existente.total_cobrado +=
            pago.total_cobrado

          continue
        }

        mapa.set(
          pago.liquidacion_id,
          {
            liquidacion_id:
              pago.liquidacion_id,

            fecha_pago:
              pago.fecha_pago,

            mecanico_id:
              pago.mecanico_id,

            mecanico_nombre:
              pago.mecanico_nombre,

            total_cobrado:
              pago.total_cobrado,

            total_pagado:
              pago.total_pagado,

            motos: [
              pago,
            ],
          },
        )
      }

      return Array.from(
        mapa.values(),
      )
    }, [historial])

  const mecanicos =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          MecanicoLiquidacion
        >()

      for (
        const grupo of gruposPendientes
      ) {
        mapa.set(
          grupo.mecanico_id,
          {
            id:
              grupo.mecanico_id,

            nombre:
              grupo.mecanico_nombre,
          },
        )
      }

      for (
        const grupo of gruposHistorial
      ) {
        if (
          !mapa.has(
            grupo.mecanico_id,
          )
        ) {
          mapa.set(
            grupo.mecanico_id,
            {
              id:
                grupo.mecanico_id,

              nombre:
                grupo.mecanico_nombre,
            },
          )
        }
      }

      return Array.from(
        mapa.values(),
      ).sort(
        (a, b) =>
          a.nombre.localeCompare(
            b.nombre,
          ),
      )
    }, [
      gruposPendientes,
      gruposHistorial,
    ])

  const mecanicoSeleccionadoId =
    mecanicos.some(
      (mecanico) =>
        mecanico.id ===
        mecanicoElegidoId,
    )
      ? mecanicoElegidoId
      : (mecanicos[0]?.id ?? '')

  const mecanicoSeleccionado =
    mecanicos.find(
      (mecanico) =>
        mecanico.id ===
        mecanicoSeleccionadoId,
    )

  const pendienteSeleccionado =
    gruposPendientes.find(
      (grupo) =>
        grupo.mecanico_id ===
        mecanicoSeleccionadoId,
    )

  const pendientesPorDia =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          GrupoDiaPendiente
        >()

      for (
        const orden of
          pendienteSeleccionado
            ?.motos ?? []
      ) {
        const fecha =
          fechaColombia(
            orden.completed_at,
          )

        const grupo =
          mapa.get(fecha)

        if (grupo) {
          grupo.ordenes.push(
            orden,
          )
          continue
        }

        mapa.set(fecha, {
          fecha,
          ordenes: [orden],
        })
      }

      return Array.from(
        mapa.values(),
      ).sort((a, b) => {
        if (
          a.fecha ===
          FECHA_SIN_REGISTRO
        ) {
          return 1
        }

        if (
          b.fecha ===
          FECHA_SIN_REGISTRO
        ) {
          return -1
        }

        return a.fecha.localeCompare(
          b.fecha,
        )
      })
    }, [pendienteSeleccionado])

  const pagosSeleccionados =
    pendienteSeleccionado
      ?.motos.filter((orden) =>
        ordenesSeleccionadas.has(
          orden.orden_id,
        ),
      ) ?? []

  const totalCobradoSeleccionado =
    pagosSeleccionados.reduce(
      (total, orden) =>
        total +
        orden.total_cobrado,
      0,
    )

  const totalMecanicoSeleccionado =
    pagosSeleccionados.reduce(
      (total, orden) =>
        total +
        orden.pago_mecanico,
      0,
    )

  const historialSeleccionado =
    useMemo(() => {
      return gruposHistorial.filter(
        (grupo) => {
          if (
            grupo.mecanico_id !==
            mecanicoSeleccionadoId
          ) {
            return false
          }

          if (
            fechaDesde &&
            grupo.fecha_pago <
              fechaDesde
          ) {
            return false
          }

          if (
            fechaHasta &&
            grupo.fecha_pago >
              fechaHasta
          ) {
            return false
          }

          return true
        },
      )
    }, [
      gruposHistorial,
      mecanicoSeleccionadoId,
      fechaDesde,
      fechaHasta,
    ])

  const filtrosFechaActivos =
    Boolean(
      fechaDesde ||
      fechaHasta,
    )

  function alternarOrden(
    ordenId: number,
  ) {
    setOrdenesSeleccionadas(
      (seleccionadas) => {
        const siguientes =
          new Set(
            seleccionadas,
          )

        if (
          siguientes.has(
            ordenId,
          )
        ) {
          siguientes.delete(
            ordenId,
          )
        } else {
          siguientes.add(
            ordenId,
          )
        }

        return siguientes
      },
    )

    setConfirmandoMecanicoId(
      null,
    )
  }

  function alternarDia(
    ordenes: PagoPendiente[],
  ) {
    setOrdenesSeleccionadas(
      (seleccionadas) => {
        const siguientes =
          new Set(
            seleccionadas,
          )

        const todasSeleccionadas =
          ordenes.every((orden) =>
            siguientes.has(
              orden.orden_id,
            ),
          )

        for (const orden of ordenes) {
          if (todasSeleccionadas) {
            siguientes.delete(
              orden.orden_id,
            )
          } else {
            siguientes.add(
              orden.orden_id,
            )
          }
        }

        return siguientes
      },
    )

    setConfirmandoMecanicoId(
      null,
    )
  }

  async function pagar(
    grupo: GrupoPendiente,
  ) {
    const ordenIds =
      pagosSeleccionados
        .map(
          (orden) =>
            orden.orden_id,
        )
        .sort((a, b) => a - b)

    if (ordenIds.length === 0) {
      setError(
        'Selecciona al menos una orden para registrar el pago',
      )
      return
    }

    try {
      setError('')
      setMensaje('')

      setPagandoMecanicoId(
        grupo.mecanico_id,
      )

      const resultado =
        await registrarPagoMecanico(
          grupo.mecanico_id,
          ordenIds,
        )

      setConfirmandoMecanicoId(
        null,
      )

      setDetalleAbierto(
        null,
      )

      setOrdenesSeleccionadas(
        new Set(),
      )

      setMensaje(
        `Pago registrado a ${grupo.mecanico_nombre} por ${formatoCOP.format(
          resultado.total_pagado,
        )} correspondiente a ${resultado.cantidad_ordenes} ${
          resultado.cantidad_ordenes === 1
            ? 'orden'
            : 'órdenes'
        }.`,
      )

      await cargarDatos()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible registrar el pago',
      )
    } finally {
      setPagandoMecanicoId(
        null,
      )
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-7 animate-spin text-zinc-500" />

          <p className="mt-3 text-sm text-zinc-500">
            Cargando liquidaciones...
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
            Administración
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
            Liquidaciones
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Consulta lo pendiente por pagar
            y revisa el historial de cada
            mecánico de forma individual.
          </p>
        </div>

        <button
          type="button"
          disabled={
            actualizando
          }
          onClick={() =>
            void cargarDatos()
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
            : 'Actualizar'}
        </button>
      </section>

      {/* MENSAJES */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          {mensaje}
        </div>
      )}

      {/* MECÁNICOS */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <UserRound className="size-5" />
            </div>

            <div>
              <h2 className="font-bold text-zinc-950">
                Selecciona un mecánico
              </h2>

              <p className="text-sm text-zinc-500">
                Solo se mostrará la información
                del mecánico seleccionado.
              </p>
            </div>
          </div>
        </div>

        {mecanicos.length ===
        0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
            Todavía no hay información
            de liquidaciones.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mecanicos.map(
              (mecanico) => {
                const activo =
                  mecanico.id ===
                  mecanicoSeleccionadoId

                const pendiente =
                  gruposPendientes.find(
                    (grupo) =>
                      grupo.mecanico_id ===
                      mecanico.id,
                  )

                return (
                  <button
                    type="button"
                    key={
                      mecanico.id
                    }
                    onClick={() => {
                      setMecanicoSeleccionadoId(
                        mecanico.id,
                      )

                      setOrdenesSeleccionadas(
                        new Set(),
                      )

                      setDetalleAbierto(
                        null,
                      )

                      setConfirmandoMecanicoId(
                        null,
                      )

                      setMensaje('')
                      setError('')
                    }}
                    className={[
                      'relative inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition',
                      activo
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
                    ].join(
                      ' ',
                    )}
                  >
                    <UserRound className="size-4" />

                    {
                      mecanico.nombre
                    }

                    {pendiente && (
                      <span
                        className={[
                          'ml-1 rounded-full px-2 py-0.5 text-xs font-bold',
                          activo
                            ? 'bg-white text-zinc-950'
                            : 'bg-amber-100 text-amber-700',
                        ].join(
                          ' ',
                        )}
                      >
                        {
                          pendiente
                            .motos.length
                        }
                      </span>
                    )}
                  </button>
                )
              },
            )}
          </div>
        )}
      </section>

      {mecanicoSeleccionado && (
        <>
          {/* MECÁNICO ACTUAL */}
          <section className="rounded-2xl bg-zinc-950 p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Mecánico seleccionado
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {
                mecanicoSeleccionado.nombre
              }
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Órdenes pendientes totales
                </p>

                <p className="mt-2 text-2xl font-black">
                  {pendienteSeleccionado
                    ?.motos.length ??
                    0}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Total cobrado pendiente
                </p>

                <p className="mt-2 text-xl font-black">
                  {formatoCOP.format(
                    pendienteSeleccionado
                      ?.total_cobrado ??
                      0,
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Pendiente total mecánico
                </p>

                <p className="mt-2 text-xl font-black">
                  {formatoCOP.format(
                    pendienteSeleccionado
                      ?.total_mecanico ??
                      0,
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* PENDIENTE */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <CircleDollarSign className="size-5" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-zinc-950">
                  Pendiente de pago
                </h2>

                <p className="text-sm text-zinc-500">
                  Selecciona las órdenes terminadas
                  que deseas pagar.
                </p>
              </div>
            </div>

            {!pendienteSeleccionado ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                <CheckCircle2 className="mx-auto size-9 text-emerald-500" />

                <p className="mt-3 font-semibold text-zinc-700">
                  No hay pagos pendientes
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Este mecánico se encuentra
                  al día.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* PENDIENTES POR DÍA */}
                {pendientesPorDia.map(
                  (grupoDia) => {
                    const todasSeleccionadas =
                      grupoDia.ordenes.every(
                        (orden) =>
                          ordenesSeleccionadas.has(
                            orden.orden_id,
                          ),
                      )

                    return (
                      <section
                        key={grupoDia.fecha}
                        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                      >
                        <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <div className="min-w-0">
                            <h3 className="break-words font-bold text-zinc-950">
                              {mostrarFechaPendiente(
                                grupoDia.fecha,
                              )}
                            </h3>

                            <p className="mt-1 text-sm text-zinc-500">
                              {
                                grupoDia
                                  .ordenes
                                  .length
                              }{' '}
                              {grupoDia
                                .ordenes
                                .length === 1
                                ? 'orden'
                                : 'órdenes'}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={
                              pagandoMecanicoId !==
                              null
                            }
                            onClick={() =>
                              alternarDia(
                                grupoDia.ordenes,
                              )
                            }
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          >
                            {todasSeleccionadas
                              ? 'Quitar selección del día'
                              : 'Seleccionar día'}
                          </button>
                        </div>

                        <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
                          {grupoDia.ordenes.map(
                            (moto) => {
                              const seleccionada =
                                ordenesSeleccionadas.has(
                                  moto.orden_id,
                                )

                              return (
                                <button
                                  key={
                                    moto.orden_id
                                  }
                                  type="button"
                                  aria-pressed={
                                    seleccionada
                                  }
                                  disabled={
                                    pagandoMecanicoId !==
                                    null
                                  }
                                  onClick={() =>
                                    alternarOrden(
                                      moto.orden_id,
                                    )
                                  }
                                  className={[
                                    'min-w-0 touch-manipulation rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 sm:p-5',
                                    seleccionada
                                      ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950/10'
                                      : 'border-zinc-200 bg-white hover:border-zinc-400',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  <span className="flex min-w-0 items-start gap-3">
                                    <span
                                      aria-hidden="true"
                                      className={[
                                        'flex size-7 shrink-0 items-center justify-center rounded-md border-2 transition',
                                        seleccionada
                                          ? 'border-zinc-950 bg-zinc-950 text-white'
                                          : 'border-zinc-300 bg-white text-transparent',
                                      ].join(
                                        ' ',
                                      )}
                                    >
                                      <Check className="size-4" />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                      <span className="block break-words font-bold text-zinc-950">
                                        {
                                          moto.moto_marca
                                        }{' '}
                                        {moto.moto_modelo ||
                                          ''}
                                      </span>

                                      <span className="mt-1 block text-xl font-black tracking-wider text-zinc-950">
                                        {
                                          moto.moto_placa
                                        }
                                      </span>
                                    </span>
                                  </span>

                                  <span className="mt-5 block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">
                                      Trabajos realizados
                                    </span>

                                    {moto.trabajos
                                      .length > 0 ? (
                                      <span className="flex flex-wrap gap-2">
                                        {moto.trabajos.map(
                                          (
                                            trabajo,
                                          ) => (
                                            <span
                                              key={
                                                trabajo.id
                                              }
                                              className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700"
                                            >
                                              {
                                                trabajo.nombre_trabajo
                                              }
                                            </span>
                                          ),
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-zinc-500">
                                        Sin trabajos
                                        registrados.
                                      </span>
                                    )}
                                  </span>

                                  <span className="mt-5 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2">
                                    <span>
                                      <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                        Total cliente
                                      </span>

                                      <span className="mt-1 block font-bold text-zinc-950">
                                        {formatoCOP.format(
                                          moto.total_cobrado,
                                        )}
                                      </span>
                                    </span>

                                    <span>
                                      <span className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                        Pago mecánico
                                      </span>

                                      <span className="mt-1 block font-bold text-emerald-700">
                                        {formatoCOP.format(
                                          moto.pago_mecanico,
                                        )}
                                      </span>
                                    </span>
                                  </span>
                                </button>
                              )
                            },
                          )}
                        </div>
                      </section>
                    )
                  },
                )}

                {/* RESUMEN SELECCIONADO */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                      Seleccionado para pagar
                    </p>

                    <p className="mt-1 text-lg font-bold text-zinc-950">
                      {
                        pagosSeleccionados.length
                      }{' '}
                      {pagosSeleccionados.length ===
                      1
                        ? 'orden seleccionada'
                        : 'órdenes seleccionadas'}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-zinc-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Total cobrado seleccionado
                      </p>

                      <p className="mt-2 text-2xl font-black text-zinc-950">
                        {formatoCOP.format(
                          totalCobradoSeleccionado,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Total a pagar al mecánico
                      </p>

                      <p className="mt-2 text-2xl font-black text-emerald-800">
                        {formatoCOP.format(
                          totalMecanicoSeleccionado,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    {confirmandoMecanicoId !==
                    pendienteSeleccionado.mecanico_id ? (
                      <button
                        type="button"
                        disabled={
                          pagosSeleccionados.length ===
                            0 ||
                          pagandoMecanicoId !==
                            null
                        }
                        onClick={() =>
                          setConfirmandoMecanicoId(
                            pendienteSeleccionado.mecanico_id,
                          )
                        }
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        <CreditCard className="size-4" />
                        Registrar pago seleccionado
                      </button>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-amber-950">
                          ¿Confirmas este pago?
                        </p>

                        <p className="mt-1 text-sm leading-6 text-amber-800">
                          Se registrarán como pagadas
                          únicamente{' '}
                          <strong>
                            {
                              pagosSeleccionados.length
                            }{' '}
                            {pagosSeleccionados.length ===
                            1
                              ? 'orden seleccionada'
                              : 'órdenes seleccionadas'}
                          </strong>{' '}
                          de{' '}
                          <strong>
                            {
                              pendienteSeleccionado.mecanico_nombre
                            }
                          </strong>
                          .
                        </p>

                        <div className="mt-4 rounded-lg bg-white/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Total a pagar
                          </p>

                          <p className="mt-1 text-xl font-black text-amber-950">
                            {formatoCOP.format(
                              totalMecanicoSeleccionado,
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={
                              pagandoMecanicoId ===
                              pendienteSeleccionado.mecanico_id
                            }
                            onClick={() =>
                              void pagar(
                                pendienteSeleccionado,
                              )
                            }
                            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                          >
                            {pagandoMecanicoId ===
                            pendienteSeleccionado.mecanico_id ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Registrando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-4" />
                                Sí, registrar pago
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={
                              pagandoMecanicoId ===
                              pendienteSeleccionado.mecanico_id
                            }
                            onClick={() =>
                              setConfirmandoMecanicoId(
                                null,
                              )
                            }
                            className="min-h-10 flex-1 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 sm:flex-none"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* HISTORIAL */}
          <section>
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                  <History className="size-5" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-zinc-950">
                    Historial de pagos
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Liquidaciones ya registradas.
                  </p>
                </div>
              </div>
            </div>

            {/* FILTRO FECHAS */}
            <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="fecha-desde"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500"
                  >
                    Desde
                  </label>

                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      id="fecha-desde"
                      type="date"
                      value={
                        fechaDesde
                      }
                      onChange={(event) =>
                        setFechaDesde(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="fecha-hasta"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500"
                  >
                    Hasta
                  </label>

                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      id="fecha-hasta"
                      type="date"
                      value={
                        fechaHasta
                      }
                      onChange={(event) =>
                        setFechaHasta(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                    />
                  </div>
                </div>

                {filtrosFechaActivos && (
                  <button
                    type="button"
                    onClick={() => {
                      setFechaDesde('')
                      setFechaHasta('')
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
                  >
                    <X className="size-4" />
                    Limpiar
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                {filtrosFechaActivos
                  ? `${historialSeleccionado.length} pagos encontrados en este periodo`
                  : `${historialSeleccionado.length} pagos registrados`}
              </p>
            </div>

            {historialSeleccionado.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                <History className="mx-auto size-9 text-zinc-300" />

                <p className="mt-3 font-semibold text-zinc-700">
                  {filtrosFechaActivos
                    ? 'No hay pagos en este periodo'
                    : 'Todavía no hay pagos registrados'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historialSeleccionado.map(
                  (liquidacion) => {
                    const abierto =
                      detalleAbierto ===
                      liquidacion.liquidacion_id

                    return (
                      <article
                        key={
                          liquidacion.liquidacion_id
                        }
                        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                      >
                        {/* RESUMEN */}
                        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
                          <div className="flex min-w-40 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                              <CalendarDays className="size-5" />
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                Fecha
                              </p>

                              <p className="mt-1 font-bold text-zinc-950">
                                {mostrarFecha(
                                  liquidacion.fecha_pago,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="grid flex-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-zinc-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                Total cliente
                              </p>

                              <p className="mt-1 text-lg font-black text-zinc-950">
                                {formatoCOP.format(
                                  liquidacion.total_cobrado,
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                Pagado al mecánico
                              </p>

                              <p className="mt-1 text-lg font-black text-emerald-800">
                                {formatoCOP.format(
                                  liquidacion.total_pagado,
                                )}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setDetalleAbierto(
                                abierto
                                  ? null
                                  : liquidacion.liquidacion_id,
                              )
                            }
                            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                          >
                            {abierto ? (
                              <>
                                <ChevronUp className="size-4" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-4" />
                                Detalle
                              </>
                            )}
                          </button>
                        </div>

                        {/* DETALLE */}
                        {abierto && (
                          <div className="border-t border-zinc-200 bg-zinc-50/70 p-5 sm:p-6">
                            <div className="grid gap-4 lg:grid-cols-2">
                              {liquidacion.motos.map(
                                (moto) => (
                                  <div
                                    key={`${liquidacion.liquidacion_id}-${moto.moto_placa}`}
                                    className="rounded-xl border border-zinc-200 bg-white p-4"
                                  >
                                    <div>
                                      <h4 className="font-bold text-zinc-950">
                                        {
                                          moto.moto_marca
                                        }
                                        {' '}
                                        {moto.moto_modelo ||
                                          ''}
                                      </h4>

                                      <p className="mt-1 text-lg font-black tracking-wider text-zinc-950">
                                        {
                                          moto.moto_placa
                                        }
                                      </p>
                                    </div>

                                    <div className="mt-4">
                                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                                        Trabajos realizados
                                      </p>

                                      <div className="flex flex-wrap gap-2">
                                        {moto.trabajos.map(
                                          (
                                            trabajo,
                                          ) => (
                                            <span
                                              key={
                                                trabajo.id
                                              }
                                              className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700"
                                            >
                                              {
                                                trabajo.nombre_trabajo
                                              }
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2">
                                      <div>
                                        <p className="text-xs text-zinc-500">
                                          Cobrado
                                        </p>

                                        <p className="mt-1 font-bold text-zinc-950">
                                          {formatoCOP.format(
                                            moto.total_cobrado,
                                          )}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-xs text-zinc-500">
                                          Pagado
                                        </p>

                                        <p className="mt-1 font-bold text-emerald-700">
                                          {formatoCOP.format(
                                            moto.monto_pagado,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  },
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
