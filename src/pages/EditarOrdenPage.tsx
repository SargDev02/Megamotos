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
  Plus,
  ReceiptText,
  Save,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  actualizarOrden,
  listarMecanicos,
  obtenerOrden,
  obtenerTrabajosDisponibles,
  type Mecanico,
  type OrdenEditable,
} from '../services/ordenes'

import type {
  TipoTrabajo,
} from '../services/trabajos'

interface TrabajoEdicion {
  id?: number
  tipo_trabajo_id: number
  nombre: string
  precio_base: number
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

export function EditarOrdenPage() {
  const navigate =
    useNavigate()

  const { id } =
    useParams<{ id: string }>()

  const [
    orden,
    setOrden,
  ] =
    useState<OrdenEditable | null>(
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
    observaciones,
    setObservaciones,
  ] =
    useState('')

  const [
    tipoTrabajoId,
    setTipoTrabajoId,
  ] =
    useState('')

  const [
    trabajos,
    setTrabajos,
  ] =
    useState<TrabajoEdicion[]>([])

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

  useEffect(() => {
    async function cargar() {
      const ordenId =
        Number(id)

      if (
        !ordenId ||
        Number.isNaN(
          ordenId,
        )
      ) {
        setError(
          'La orden indicada no es válida',
        )

        setCargando(false)
        return
      }

      try {
        setCargando(true)
        setError('')

        const [
          ordenEncontrada,
          mecanicosDisponibles,
          trabajosDisponibles,
        ] =
          await Promise.all([
            obtenerOrden(
              ordenId,
            ),

            listarMecanicos(),

            obtenerTrabajosDisponibles(),
          ])

        setOrden(
          ordenEncontrada,
        )

        setMecanicos(
          mecanicosDisponibles,
        )

        setCatalogo(
          trabajosDisponibles,
        )

        setMecanicoId(
          ordenEncontrada
            .mecanico_id,
        )

        setObservaciones(
          ordenEncontrada
            .observaciones ??
            '',
        )

        setTrabajos(
          ordenEncontrada.trabajos.map(
            (trabajo) => ({
              id:
                trabajo.id,

              tipo_trabajo_id:
                trabajo.tipo_trabajo_id,

              nombre:
                trabajo.nombre_trabajo,

              precio_base:
                Number(
                  trabajo.precio_base,
                ),

              precio_final:
                Number(
                  trabajo.precio_final,
                ),
            }),
          ),
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
  }, [id])

  const total =
    useMemo(
      () =>
        trabajos.reduce(
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
      [trabajos],
    )

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

  const porcentajeEstimado =
    orden &&
    mecanicoId ===
      orden.mecanico_id
      ? Number(
          orden.porcentaje_mecanico,
        )
      : Number(
          mecanicoSeleccionado
            ?.porcentaje_mecanico ??
            0,
        )

  const pagoEstimado =
    Math.round(
      total *
        (
          porcentajeEstimado /
          100
        ),
    )

  function agregarTrabajo() {
    setError('')

    if (!tipoTrabajoId) {
      setError(
        'Selecciona un trabajo',
      )

      return
    }

    const tipo =
      catalogo.find(
        (trabajo) =>
          trabajo.id ===
          Number(
            tipoTrabajoId,
          ),
      )

    if (!tipo) {
      setError(
        'El trabajo seleccionado no existe',
      )

      return
    }

    const repetido =
      trabajos.some(
        (trabajo) =>
          trabajo.tipo_trabajo_id ===
          tipo.id,
      )

    if (repetido) {
      setError(
        'Ese trabajo ya está agregado a la orden',
      )

      return
    }

    setTrabajos(
      (actuales) => [
        ...actuales,
        {
          tipo_trabajo_id:
            tipo.id,

          nombre:
            tipo.nombre,

          precio_base:
            Number(
              tipo.precio_base,
            ),

          precio_final:
            Number(
              tipo.precio_base,
            ),
        },
      ],
    )

    setTipoTrabajoId('')
  }

  function cambiarPrecio(
    indice: number,
    precio: number,
  ) {
    setTrabajos(
      (actuales) =>
        actuales.map(
          (
            trabajo,
            posicion,
          ) =>
            posicion ===
            indice
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
    indice: number,
  ) {
    setTrabajos(
      (actuales) =>
        actuales.filter(
          (
            _,
            posicion,
          ) =>
            posicion !==
            indice,
        ),
    )
  }

  async function handleGuardar(
    event: FormEvent,
  ) {
    event.preventDefault()

    setError('')

    if (!orden) {
      return
    }

    if (
      orden.estado ===
      'TERMINADA'
    ) {
      setError(
        'Una orden terminada no puede modificarse',
      )

      return
    }

    if (!mecanicoId) {
      setError(
        'Selecciona un mecánico',
      )

      return
    }

    if (
      trabajos.length === 0
    ) {
      setError(
        'La orden debe tener al menos un trabajo',
      )

      return
    }

    if (
      trabajos.some(
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

      await actualizarOrden({
        ordenId:
          orden.id,

        mecanicoId,

        observaciones,

        trabajos:
          trabajos.map(
            (trabajo) => ({
              id:
                trabajo.id,

              tipo_trabajo_id:
                trabajo.tipo_trabajo_id,

              precio_final:
                Number(
                  trabajo.precio_final,
                ),
            }),
          ),
      })

      navigate(-1)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la orden',
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
            Cargando orden...
          </p>
        </div>
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          {error ||
            'No encontramos la orden'}
        </div>
      </div>
    )
  }

  if (
    orden.estado ===
    'TERMINADA'
  ) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-zinc-950 p-6 text-white">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500">
              <CheckCircle2 className="size-6" />
            </div>

            <p className="mt-5 text-sm text-zinc-400">
              Orden #{orden.id}
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Orden terminada
            </h1>

            <span className="mt-3 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
              TERMINADA
            </span>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <Bike className="size-6" />
              </div>

              <div>
                <p className="font-bold text-zinc-950">
                  {
                    orden.moto.marca
                      .nombre
                  }
                  {' '}
                  {orden.moto.modelo ||
                    ''}
                </p>

                <p className="text-xl font-black tracking-wider text-zinc-950">
                  {orden.moto.placa}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
              Esta orden ya fue terminada y
              no puede modificarse desde
              esta pantalla.
            </div>
          </div>
        </section>
      </div>
    )
  }

  const enProceso =
    orden.estado ===
    'EN_PROCESO'

  return (
    <div className="space-y-6">
      {/* VOLVER */}
      <button
        type="button"
        onClick={() =>
          navigate(-1)
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
      >
        <ArrowLeft className="size-4" />
        Volver a órdenes
      </button>

      {/* ENCABEZADO */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Orden #{orden.id}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              Editar orden
            </h1>

            <span
              className={[
                'inline-flex rounded-full px-3 py-1 text-xs font-bold',
                enProceso
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              {enProceso
                ? 'EN PROCESO'
                : 'RECIBIDA'}
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Ajusta el mecánico, trabajos,
            precios u observaciones de esta
            orden.
          </p>
        </div>
      </section>

      {/* MOTO Y CLIENTE */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
              <Bike className="size-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Motocicleta
              </p>

              <h2 className="mt-1 text-lg font-bold text-zinc-950">
                {
                  orden.moto.marca
                    .nombre
                }
                {' '}
                {orden.moto.modelo ||
                  ''}
              </h2>

              <p className="mt-1 text-2xl font-black tracking-wider text-zinc-950">
                {orden.moto.placa}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <UserRound className="size-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                Cliente
              </p>

              <h2 className="mt-1 text-lg font-bold text-zinc-950">
                {
                  orden.moto.cliente
                    .nombre
                }
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Propietario registrado
              </p>
            </div>
          </div>
        </article>
      </section>

      <form
        onSubmit={handleGuardar}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* CONTENIDO */}
        <div className="space-y-6">
          {/* MECÁNICO */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <Wrench className="size-5" />
              </div>

              <div>
                <h2 className="font-bold text-zinc-950">
                  Mecánico
                </h2>

                <p className="text-sm text-zinc-500">
                  Responsable de la motocicleta
                </p>
              </div>
            </div>

            <label
              htmlFor="mecanico"
              className="mb-2 block text-sm font-semibold text-zinc-700"
            >
              Mecánico asignado *
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
                  <p className="font-semibold text-zinc-950">
                    {
                      mecanicoSeleccionado
                        .nombre
                    }
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Porcentaje aplicado a
                    esta orden
                  </p>
                </div>

                <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white">
                  {porcentajeEstimado}%
                </span>
              </div>
            )}
          </section>

          {/* TRABAJOS */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                <ClipboardList className="size-5" />
              </div>

              <div>
                <h2 className="font-bold text-zinc-950">
                  Trabajos
                </h2>

                <p className="text-sm text-zinc-500">
                  Agrega, elimina o modifica
                  los valores de la orden.
                </p>
              </div>
            </div>

            {/* AGREGAR */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={tipoTrabajoId}
                onChange={(event) =>
                  setTipoTrabajoId(
                    event.target.value,
                  )
                }
                className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              >
                <option value="">
                  Selecciona un trabajo
                </option>

                {catalogo.map(
                  (tipo) => (
                    <option
                      key={tipo.id}
                      value={tipo.id}
                    >
                      {tipo.nombre}
                      {' · '}
                      {formatoCOP.format(
                        Number(
                          tipo.precio_base,
                        ),
                      )}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                onClick={agregarTrabajo}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800"
              >
                <Plus className="size-4" />
                Agregar
              </button>
            </div>

            {/* LISTA */}
            {trabajos.length ===
            0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
                <ReceiptText className="mx-auto size-8 text-zinc-300" />

                <p className="mt-3 font-semibold text-zinc-700">
                  No hay trabajos
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  La orden debe conservar al
                  menos un trabajo.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {trabajos.map(
                  (
                    trabajo,
                    indice,
                  ) => (
                    <article
                      key={
                        trabajo.id ??
                        `nuevo-${trabajo.tipo_trabajo_id}`
                      }
                      className="rounded-xl border border-zinc-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-zinc-950">
                              {
                                trabajo.nombre
                              }
                            </h3>

                            {!trabajo.id && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                                NUEVO
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-zinc-500">
                            Precio base:{' '}
                            <strong>
                              {formatoCOP.format(
                                Number(
                                  trabajo.precio_base,
                                ),
                              )}
                            </strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            quitarTrabajo(
                              indice,
                            )
                          }
                          title="Quitar trabajo"
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      <div className="mt-4">
                        <label
                          htmlFor={`precio-${indice}`}
                          className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500"
                        >
                          Precio de esta orden
                        </label>

                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                          <input
                            id={`precio-${indice}`}
                            type="number"
                            min="0"
                            step="1000"
                            value={
                              trabajo.precio_final
                            }
                            onChange={(event) =>
                              cambiarPrecio(
                                indice,
                                Number(
                                  event.target.value,
                                ),
                              )
                            }
                            className="h-11 w-full rounded-lg border border-zinc-300 pl-9 pr-3 text-sm font-bold outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
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
              Información adicional para el
              mecánico o recepción.
            </p>

            <textarea
              value={observaciones}
              onChange={(event) =>
                setObservaciones(
                  event.target.value,
                )
              }
              placeholder="Información relevante para esta orden..."
              rows={5}
              className="mt-4 w-full resize-y rounded-xl border border-zinc-300 p-3 text-sm leading-6 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
          </section>
        </div>

        {/* RESUMEN LATERAL */}
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
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Total cliente
              </p>

              <p className="mt-2 text-3xl font-black">
                {formatoCOP.format(
                  total,
                )}
              </p>

              <div className="my-5 border-t border-white/10" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">
                    Estado
                  </span>

                  <span
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-bold',
                      enProceso
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300',
                    ].join(' ')}
                  >
                    {enProceso
                      ? 'EN PROCESO'
                      : 'RECIBIDA'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">
                    Trabajos
                  </span>

                  <strong>
                    {trabajos.length}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">
                    Mecánico
                  </span>

                  <strong className="max-w-40 text-right text-sm">
                    {mecanicoSeleccionado
                      ?.nombre ||
                      'Sin seleccionar'}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-zinc-400">
                    Porcentaje
                  </span>

                  <strong>
                    {porcentajeEstimado}%
                  </strong>
                </div>
              </div>

              <div className="my-5 border-t border-white/10" />

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Pago estimado al mecánico
                </p>

                <p className="mt-2 text-xl font-black">
                  {formatoCOP.format(
                    pagoEstimado,
                  )}
                </p>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm leading-5 text-red-200">
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Guardar cambios
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