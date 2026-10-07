import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  History,
  Loader2,
  RefreshCcw,
  UserRound,
  Wrench,
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

function mostrarFecha(
  fecha: string,
) {
  return formatoFecha.format(
    new Date(
      `${fecha}T12:00:00`,
    ),
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

  async function pagar(
    grupo: GrupoPendiente,
  ) {
    try {
      setError('')
      setMensaje('')

      setPagandoMecanicoId(
        grupo.mecanico_id,
      )

      const resultado =
        await registrarPagoMecanico(
          grupo.mecanico_id,
        )

      setConfirmandoMecanicoId(
        null,
      )

      setDetalleAbierto(
        null,
      )

      setMensaje(
        `Pago registrado a ${grupo.mecanico_nombre} por ${formatoCOP.format(
          resultado.total_pagado,
        )}.`,
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
                  Motos pendientes
                </p>

                <p className="mt-2 text-2xl font-black">
                  {pendienteSeleccionado
                    ?.motos.length ??
                    0}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Total cobrado
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
                  Pendiente mecánico
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
                  Todas las órdenes terminadas
                  y aún no liquidadas.
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
              <div className="space-y-4">
                {/* MOTOS */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {pendienteSeleccionado.motos.map(
                    (moto) => (
                      <article
                        key={
                          moto.orden_id
                        }
                        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-zinc-950">
                              {
                                moto.moto_marca
                              }
                              {' '}
                              {moto.moto_modelo ||
                                ''}
                            </h3>

                            <p className="mt-1 text-xl font-black tracking-wider text-zinc-950">
                              {
                                moto.moto_placa
                              }
                            </p>
                          </div>

                          <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                            <Wrench className="size-5" />
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                            Trabajos realizados
                          </p>

                          {moto.trabajos.length >
                          0 ? (
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
                          ) : (
                            <p className="text-sm text-zinc-500">
                              Sin trabajos registrados.
                            </p>
                          )}
                        </div>

                        <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Total cliente
                            </p>

                            <p className="mt-1 font-bold text-zinc-950">
                              {formatoCOP.format(
                                moto.total_cobrado,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Pago mecánico
                            </p>

                            <p className="mt-1 font-bold text-emerald-700">
                              {formatoCOP.format(
                                moto.pago_mecanico,
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    ),
                  )}
                </div>

                {/* TOTAL */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-zinc-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                        Total cobrado al cliente
                      </p>

                      <p className="mt-2 text-2xl font-black text-zinc-950">
                        {formatoCOP.format(
                          pendienteSeleccionado.total_cobrado,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Total a pagar al mecánico
                      </p>

                      <p className="mt-2 text-2xl font-black text-emerald-800">
                        {formatoCOP.format(
                          pendienteSeleccionado.total_mecanico,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    {confirmandoMecanicoId !==
                    pendienteSeleccionado.mecanico_id ? (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmandoMecanicoId(
                            pendienteSeleccionado.mecanico_id,
                          )
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
                      >
                        <CreditCard className="size-4" />
                        Registrar pago
                      </button>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-amber-950">
                          ¿Confirmas este pago?
                        </p>

                        <p className="mt-1 text-sm leading-6 text-amber-800">
                          Se registrarán como pagadas
                          todas las órdenes terminadas
                          actualmente pendientes de{' '}
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
                              pendienteSeleccionado.total_mecanico,
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
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                            className="h-10 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
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
