import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Loader2,
  ReceiptText,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import { BuscadorTrabajos } from '../components/BuscadorTrabajos'

import {
  buscarMotoPorPlaca,
  type MotoConCliente,
} from '../services/recepcion'

import {
  crearOrden,
  listarMecanicos,
  obtenerTrabajosDisponibles,
  type Mecanico,
} from '../services/ordenes'

import type {
  TipoTrabajo,
} from '../services/trabajos'

interface TrabajoSeleccionado {
  tipo: TipoTrabajo
  precio_final: number
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

export function NuevaOrdenPage() {
  const { placa } =
    useParams<{ placa: string }>()

  const [
    moto,
    setMoto,
  ] =
    useState<MotoConCliente | null>(
      null,
    )

  const [
    mecanicos,
    setMecanicos,
  ] =
    useState<Mecanico[]>([])

  const [
    catalogo,
    setCatalogo,
  ] =
    useState<TipoTrabajo[]>([])

  const [
    mecanicoId,
    setMecanicoId,
  ] =
    useState('')

  const [
    trabajosSeleccionados,
    setTrabajosSeleccionados,
  ] =
    useState<TrabajoSeleccionado[]>(
      [],
    )

  const [
    observaciones,
    setObservaciones,
  ] =
    useState('')

  const [
    cargando,
    setCargando,
  ] =
    useState(true)

  const [
    guardando,
    setGuardando,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    ordenCreada,
    setOrdenCreada,
  ] =
    useState<{
      id: number
      total: number
      pago_mecanico: number
      porcentaje_mecanico: number
    } | null>(null)

  useEffect(() => {
    async function cargar() {
      if (!placa) {
        setError(
          'La placa no es válida',
        )

        setCargando(false)
        return
      }

      try {
        setCargando(true)

        const [
          motoEncontrada,
          mecanicosDisponibles,
          trabajosDisponibles,
        ] = await Promise.all([
          buscarMotoPorPlaca(
            placa,
          ),

          listarMecanicos(),

          obtenerTrabajosDisponibles(),
        ])

        if (!motoEncontrada) {
          throw new Error(
            'No encontramos esta motocicleta',
          )
        }

        setMoto(
          motoEncontrada,
        )

        setMecanicos(
          mecanicosDisponibles,
        )

        setCatalogo(
          trabajosDisponibles,
        )
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar la orden',
        )
      } finally {
        setCargando(false)
      }
    }

    void cargar()
  }, [placa])

  const mecanicoSeleccionado =
    useMemo(
      () =>
        mecanicos.find(
          (mecanico) =>
            mecanico.id ===
            mecanicoId,
        ),
      [
        mecanicos,
        mecanicoId,
      ],
    )

  const total =
    useMemo(
      () =>
        trabajosSeleccionados.reduce(
          (
            acumulado,
            trabajo,
          ) =>
            acumulado +
            Number(
              trabajo.precio_final,
            ),
          0,
        ),
      [
        trabajosSeleccionados,
      ],
    )

  const pagoMecanicoEstimado =
    mecanicoSeleccionado
      ? Math.round(
          total *
            (
              mecanicoSeleccionado
                .porcentaje_mecanico /
              100
            ),
        )
      : 0

  const trabajosAgregadosIds =
    useMemo(
      () =>
        new Set(
          trabajosSeleccionados.map(
            (trabajo) =>
              trabajo.tipo.id,
          ),
        ),
      [trabajosSeleccionados],
    )

  function agregarTrabajo(
    tipo: TipoTrabajo,
  ) {
    setError('')

    const yaAgregado =
      trabajosSeleccionados.some(
        (trabajo) =>
          trabajo.tipo.id ===
          tipo.id,
      )

    if (yaAgregado) {
      setError(
        'Ese trabajo ya fue agregado a la orden',
      )

      return
    }

    setTrabajosSeleccionados(
      (actuales) => [
        ...actuales,
        {
          tipo,
          precio_final:
            Number(
              tipo.precio_base,
            ),
        },
      ],
    )

  }

  function cambiarPrecio(
    tipoId: number,
    precio: number,
  ) {
    setTrabajosSeleccionados(
      (actuales) =>
        actuales.map(
          (trabajo) =>
            trabajo.tipo.id ===
            tipoId
              ? {
                  ...trabajo,
                  precio_final:
                    precio,
                }
              : trabajo,
        ),
    )
  }

  function quitarTrabajo(
    tipoId: number,
  ) {
    setTrabajosSeleccionados(
      (actuales) =>
        actuales.filter(
          (trabajo) =>
            trabajo.tipo.id !==
            tipoId,
        ),
    )
  }

  async function handleGuardar(
    event: FormEvent,
  ) {
    event.preventDefault()

    setError('')

    if (!moto) {
      return
    }

    if (!mecanicoId) {
      setError(
        'Selecciona un mecánico',
      )

      return
    }

    if (
      trabajosSeleccionados.length ===
      0
    ) {
      setError(
        'Agrega al menos un trabajo',
      )

      return
    }

    if (
      trabajosSeleccionados.some(
        (trabajo) =>
          Number.isNaN(
            Number(
              trabajo.precio_final,
            ),
          ) ||
          Number(
            trabajo.precio_final,
          ) < 0,
      )
    ) {
      setError(
        'Revisa los precios de los trabajos',
      )

      return
    }

    try {
      setGuardando(true)

      const orden =
        await crearOrden({
          motoId:
            moto.id,

          mecanicoId,

          observaciones,

          trabajos:
            trabajosSeleccionados.map(
              (trabajo) => ({
                tipo_trabajo_id:
                  trabajo.tipo.id,

                precio_final:
                  Number(
                    trabajo.precio_final,
                  ),
              }),
            ),
        })

      setOrdenCreada({
        id:
          orden.id,

        total:
          orden.total,

        pago_mecanico:
          orden.pago_mecanico,

        porcentaje_mecanico:
          orden.porcentaje_mecanico,
      })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear la orden',
      )
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-7 animate-spin text-zinc-500" />

          <p className="mt-3 text-sm text-zinc-500">
            Cargando información...
          </p>
        </div>
      </div>
    )
  }

  if (
    error &&
    !moto
  ) {
    return (
      <div className="space-y-6">
        <Link
          to="/recepcion"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
        >
          <ArrowLeft className="size-4" />
          Volver a recepción
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (!moto) {
    return null
  }

  if (ordenCreada) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <div className="border-b border-emerald-100 bg-emerald-50 p-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="size-7" />
            </div>

            <h1 className="mt-4 text-2xl font-bold text-emerald-950">
              Orden creada correctamente
            </h1>

            <p className="mt-1 text-sm text-emerald-700">
              La motocicleta quedó
              registrada como recibida.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6 text-center">
              <p className="text-sm text-zinc-500">
                Orden
              </p>

              <p className="text-3xl font-black text-zinc-950">
                #{ordenCreada.id}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Motocicleta
                </p>

                <p className="mt-1 font-bold text-zinc-950">
                  {moto.marca.nombre}
                  {' '}
                  {moto.modelo || ''}
                </p>

                <p className="mt-1 text-lg font-black tracking-wide">
                  {moto.placa}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Estado
                </p>

                <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  RECIBIDA
                </span>
              </div>

              <div className="rounded-xl bg-zinc-950 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Total orden
                </p>

                <p className="mt-2 text-2xl font-black">
                  {formatoCOP.format(
                    ordenCreada.total,
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Pago mecánico
                </p>

                <p className="mt-2 text-xl font-bold text-zinc-950">
                  {formatoCOP.format(
                    ordenCreada
                      .pago_mecanico,
                  )}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {
                    ordenCreada
                      .porcentaje_mecanico
                  }
                  % de la orden
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/recepcion"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Volver a recepción
              </Link>

              <Link
                to="/ordenes"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Ver órdenes activas
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* VOLVER */}
      <Link
        to="/recepcion"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
      >
        <ArrowLeft className="size-4" />
        Volver a recepción
      </Link>

      {/* ENCABEZADO */}
      <section>
        <p className="text-sm font-medium text-zinc-500">
          Taller
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
          Nueva orden
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Selecciona el mecánico,
          agrega los trabajos y confirma
          el valor que tendrá la orden.
        </p>
      </section>

      {/* INFORMACIÓN MOTO */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Bike className="size-6" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Motocicleta
              </p>

              <h2 className="mt-1 text-xl font-bold text-zinc-950">
                {moto.marca.nombre}
                {' '}
                {moto.modelo || ''}
              </h2>

              <p className="mt-1 text-2xl font-black tracking-wider text-zinc-950">
                {moto.placa}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <UserRound className="size-6" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Cliente
              </p>

              <h2 className="mt-1 font-bold text-zinc-950">
                {moto.cliente.nombre}
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {moto.cliente.telefono}
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleGuardar}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* COLUMNA PRINCIPAL */}
        <div className="space-y-6">
          {/* MECÁNICO */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <Wrench className="size-5" />
              </div>

              <div>
                <h2 className="font-bold text-zinc-950">
                  Mecánico
                </h2>

                <p className="text-sm text-zinc-500">
                  Responsable de toda la orden
                </p>
              </div>
            </div>

            <label
              htmlFor="mecanico"
              className="mb-2 block text-sm font-semibold text-zinc-700"
            >
              Asignar mecánico *
            </label>

            <select
              id="mecanico"
              value={mecanicoId}
              onChange={(event) =>
                setMecanicoId(
                  event.target.value,
                )
              }
              required
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            >
              <option value="">
                Selecciona un mecánico
              </option>

              {mecanicos.map(
                (mecanico) => (
                  <option
                    key={mecanico.id}
                    value={mecanico.id}
                  >
                    {mecanico.nombre}
                    {' · '}
                    {
                      mecanico
                        .porcentaje_mecanico
                    }
                    %
                  </option>
                ),
              )}
            </select>

            {mecanicoSeleccionado && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    {
                      mecanicoSeleccionado
                        .nombre
                    }
                  </p>

                  <p className="text-xs text-zinc-500">
                    Porcentaje actual
                  </p>
                </div>

                <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white">
                  {
                    mecanicoSeleccionado
                      .porcentaje_mecanico
                  }
                  %
                </span>
              </div>
            )}
          </section>

          {/* TRABAJOS */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                <ClipboardList className="size-5" />
              </div>

              <div>
                <h2 className="font-bold text-zinc-950">
                  Trabajos
                </h2>

                <p className="text-sm text-zinc-500">
                  Agrega los trabajos que se
                  realizarán a la motocicleta.
                </p>
              </div>
            </div>

            <BuscadorTrabajos
              catalogo={catalogo}
              trabajosAgregadosIds={
                trabajosAgregadosIds
              }
              onSeleccionar={
                agregarTrabajo
              }
            />

            {trabajosSeleccionados.length ===
            0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                <ReceiptText className="mx-auto size-8 text-zinc-300" />

                <p className="mt-3 font-semibold text-zinc-700">
                  Sin trabajos agregados
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Selecciona un trabajo del
                  catálogo para comenzar.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {trabajosSeleccionados.map(
                  (trabajo) => (
                    <article
                      key={
                        trabajo.tipo.id
                      }
                      className="rounded-xl border border-zinc-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-zinc-950">
                            {
                              trabajo.tipo
                                .nombre
                            }
                          </h3>

                          <p className="mt-1 text-xs text-zinc-500">
                            Precio catálogo:{' '}
                            <strong>
                              {formatoCOP.format(
                                Number(
                                  trabajo.tipo
                                    .precio_base,
                                ),
                              )}
                            </strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          title="Quitar trabajo"
                          onClick={() =>
                            quitarTrabajo(
                              trabajo.tipo.id,
                            )
                          }
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-4">
                        <label
                          htmlFor={`precio-${trabajo.tipo.id}`}
                          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        >
                          Precio para esta orden
                        </label>

                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                          <input
                            id={`precio-${trabajo.tipo.id}`}
                            type="number"
                            min="0"
                            step="1000"
                            value={
                              trabajo
                                .precio_final
                            }
                            onChange={(
                              event,
                            ) =>
                              cambiarPrecio(
                                trabajo.tipo.id,
                                Number(
                                  event.target
                                    .value,
                                ),
                              )
                            }
                            className="h-11 w-full rounded-lg border border-zinc-300 pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                          />
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          {/* OBSERVACIONES */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-zinc-950">
              Observaciones
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Información adicional que el
              mecánico deba tener en cuenta.
            </p>

            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(event) =>
                setObservaciones(
                  event.target.value,
                )
              }
              placeholder="Ej. El cliente reporta ruido en la parte delantera..."
              rows={5}
              className="mt-4 w-full resize-y rounded-xl border border-zinc-300 p-3 text-sm leading-6 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
          </section>
        </div>

        {/* RESUMEN */}
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-sm">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <ReceiptText className="size-5 text-zinc-400" />

                <h2 className="font-bold">
                  Resumen de la orden
                </h2>
              </div>
            </div>

            <div className="p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total cliente
                </p>

                <p className="mt-2 text-3xl font-black">
                  {formatoCOP.format(
                    total,
                  )}
                </p>
              </div>

              <div className="my-5 border-t border-white/10" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-400">
                    Trabajos
                  </span>

                  <strong>
                    {
                      trabajosSeleccionados
                        .length
                    }
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-400">
                    Mecánico
                  </span>

                  <strong className="text-right text-sm">
                    {mecanicoSeleccionado
                      ?.nombre ||
                      'Sin seleccionar'}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-400">
                    Porcentaje
                  </span>

                  <strong>
                    {mecanicoSeleccionado
                      ? `${mecanicoSeleccionado.porcentaje_mecanico}%`
                      : '—'}
                  </strong>
                </div>
              </div>

              <div className="my-5 border-t border-white/10" />

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Pago estimado al mecánico
                </p>

                <p className="mt-2 text-xl font-bold">
                  {formatoCOP.format(
                    pagoMecanicoEstimado,
                  )}
                </p>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={guardando}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creando orden...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Crear orden
                  </>
                )}
              </button>
            </div>
          </section>
        </aside>
      </form>
    </div>
  )
}
