import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'

import {
  actualizarTrabajo,
  cambiarEstadoTrabajo,
  crearTrabajo,
  listarTrabajos,
  type TipoTrabajo,
} from '../services/trabajos'

const formatoCOP =
  new Intl.NumberFormat(
    'es-CO',
    {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    },
  )

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

export function TrabajosPage() {
  const [
    trabajos,
    setTrabajos,
  ] =
    useState<TipoTrabajo[]>([])

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
    guardandoNuevo,
    setGuardandoNuevo,
  ] =
    useState(false)

  const [
    accionandoId,
    setAccionandoId,
  ] =
    useState<number | null>(
      null,
    )

  const [
    mostrarCrear,
    setMostrarCrear,
  ] =
    useState(false)

  const [
    nuevoNombre,
    setNuevoNombre,
  ] =
    useState('')

  const [
    nuevoPrecio,
    setNuevoPrecio,
  ] =
    useState('')

  const [
    editandoId,
    setEditandoId,
  ] =
    useState<number | null>(
      null,
    )

  const [
    nombreEdicion,
    setNombreEdicion,
  ] =
    useState('')

  const [
    precioEdicion,
    setPrecioEdicion,
  ] =
    useState('')

  const [
    filtroTexto,
    setFiltroTexto,
  ] =
    useState('')

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState('')

  const [
    mensaje,
    setMensaje,
  ] =
    useState('')

  const [
    error,
    setError,
  ] =
    useState('')

  async function cargarTrabajos() {
    try {
      setError('')
      setActualizando(true)

      const data =
        await listarTrabajos()

      setTrabajos(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar los trabajos',
      )
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }

  useEffect(() => {
    let ignorarResultado = false

    void listarTrabajos().then(
      (data) => {
        if (ignorarResultado) {
          return
        }

        setTrabajos(data)
        setCargando(false)
      },
      (error: unknown) => {
        if (ignorarResultado) {
          return
        }

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los trabajos',
        )
        setCargando(false)
      },
    )

    return () => {
      ignorarResultado = true
    }
  }, [])

  const trabajosFiltrados =
    useMemo(() => {
      const texto =
        normalizarBusqueda(
          filtroTexto,
        )

      return trabajos.filter(
        (trabajo) => {
          if (
            filtroEstado ===
              'ACTIVO' &&
            !trabajo.activo
          ) {
            return false
          }

          if (
            filtroEstado ===
              'INACTIVO' &&
            trabajo.activo
          ) {
            return false
          }

          if (!texto) {
            return true
          }

          return normalizarBusqueda(
            trabajo.nombre,
          ).includes(texto)
        },
      )
    }, [
      trabajos,
      filtroTexto,
      filtroEstado,
    ])

  const resumen =
    useMemo(() => {
      const activos =
        trabajos.filter(
          (trabajo) =>
            trabajo.activo,
        ).length

      return {
        total:
          trabajos.length,

        activos,

        inactivos:
          trabajos.length -
          activos,
      }
    }, [trabajos])

  const filtrosActivos =
    Boolean(
      filtroTexto ||
      filtroEstado,
    )

  async function handleCrear(
    event: FormEvent,
  ) {
    event.preventDefault()

    setError('')
    setMensaje('')

    const nombre =
      nuevoNombre.trim()

    const precio =
      Number(
        nuevoPrecio,
      )

    if (!nombre) {
      setError(
        'El nombre del trabajo es obligatorio',
      )

      return
    }

    if (
      Number.isNaN(precio) ||
      precio < 0
    ) {
      setError(
        'Ingresa un precio válido',
      )

      return
    }

    try {
      setGuardandoNuevo(
        true,
      )

      await crearTrabajo(
        nombre,
        precio,
      )

      setNuevoNombre('')
      setNuevoPrecio('')
      setMostrarCrear(false)

      setMensaje(
        'Trabajo creado correctamente.',
      )

      await cargarTrabajos()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear el trabajo',
      )
    } finally {
      setGuardandoNuevo(
        false,
      )
    }
  }

  function iniciarEdicion(
    trabajo: TipoTrabajo,
  ) {
    setEditandoId(
      trabajo.id,
    )

    setNombreEdicion(
      trabajo.nombre,
    )

    setPrecioEdicion(
      String(
        trabajo.precio_base,
      ),
    )

    setError('')
    setMensaje('')
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setNombreEdicion('')
    setPrecioEdicion('')
  }

  async function handleActualizar(
    event:
      FormEvent<HTMLFormElement>,
    trabajo: TipoTrabajo,
  ) {
    event.preventDefault()

    setError('')
    setMensaje('')

    const nombre =
      nombreEdicion.trim()

    const precio =
      Number(
        precioEdicion,
      )

    if (!nombre) {
      setError(
        'El nombre del trabajo es obligatorio',
      )

      return
    }

    if (
      Number.isNaN(precio) ||
      precio < 0
    ) {
      setError(
        'Ingresa un precio válido',
      )

      return
    }

    try {
      setAccionandoId(
        trabajo.id,
      )

      await actualizarTrabajo(
        trabajo.id,
        nombre,
        precio,
      )

      cancelarEdicion()

      setMensaje(
        'Trabajo actualizado correctamente.',
      )

      await cargarTrabajos()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el trabajo',
      )
    } finally {
      setAccionandoId(
        null,
      )
    }
  }

  async function handleEstado(
    trabajo: TipoTrabajo,
  ) {
    try {
      setError('')
      setMensaje('')

      setAccionandoId(
        trabajo.id,
      )

      await cambiarEstadoTrabajo(
        trabajo.id,
        !trabajo.activo,
      )

      setMensaje(
        trabajo.activo
          ? `${trabajo.nombre} fue desactivado.`
          : `${trabajo.nombre} fue activado.`,
      )

      await cargarTrabajos()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cambiar el estado del trabajo',
      )
    } finally {
      setAccionandoId(
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
            Cargando trabajos...
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
            Trabajos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Administra los servicios del
            taller y sus precios base.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              actualizando
            }
            onClick={() =>
              void cargarTrabajos()
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actualizando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}

            Actualizar
          </button>

          <button
            type="button"
            onClick={() => {
              setMostrarCrear(
                (actual) =>
                  !actual,
              )

              setError('')
              setMensaje('')
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            {mostrarCrear ? (
              <X className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}

            {mostrarCrear
              ? 'Cancelar'
              : 'Nuevo trabajo'}
          </button>
        </div>
      </section>

      {/* RESUMEN */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-500">
                Registrados
              </p>

              <p className="mt-1 text-4xl font-black text-zinc-950">
                {resumen.total}
              </p>
            </div>

            <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <Wrench className="size-6" />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700">
            Activos
          </p>

          <p className="mt-1 text-4xl font-black text-emerald-950">
            {resumen.activos}
          </p>

          <p className="mt-1 text-sm text-emerald-700/70">
            Disponibles para nuevas órdenes
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm font-semibold text-zinc-600">
            Inactivos
          </p>

          <p className="mt-1 text-4xl font-black text-zinc-950">
            {resumen.inactivos}
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Conservados para el historial
          </p>
        </article>
      </section>

      {/* MENSAJES */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" />

          {mensaje}
        </div>
      )}

      {/* CREAR TRABAJO */}
      {mostrarCrear && (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                <Plus className="size-5" />
              </div>

              <div>
                <h2 className="font-bold text-zinc-950">
                  Nuevo trabajo
                </h2>

                <p className="text-sm text-zinc-500">
                  Agrega un nuevo servicio
                  al catálogo de Megamotos.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleCrear}
            className="p-5 sm:p-6"
          >
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <label
                  htmlFor="nuevo-trabajo"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Nombre del trabajo *
                </label>

                <input
                  id="nuevo-trabajo"
                  value={
                    nuevoNombre
                  }
                  onChange={(event) =>
                    setNuevoNombre(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Cambio de aceite"
                  className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>

              <div>
                <label
                  htmlFor="nuevo-precio"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Precio base *
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                    $
                  </span>

                  <input
                    id="nuevo-precio"
                    type="number"
                    min="0"
                    step="1000"
                    value={
                      nuevoPrecio
                    }
                    onChange={(event) =>
                      setNuevoPrecio(
                        event.target.value,
                      )
                    }
                    placeholder="35000"
                    className="h-11 w-full rounded-lg border border-zinc-300 pl-8 pr-3 text-sm font-semibold outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-zinc-200 pt-5">
              <button
                type="submit"
                disabled={
                  guardandoNuevo
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardandoNuevo ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Crear trabajo
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* FILTROS */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

            <input
              type="search"
              value={
                filtroTexto
              }
              onChange={(event) =>
                setFiltroTexto(
                  event.target.value,
                )
              }
              placeholder="Buscar trabajo..."
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
          </div>

          <select
            value={
              filtroEstado
            }
            onChange={(event) =>
              setFiltroEstado(
                event.target.value,
              )
            }
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 md:min-w-48"
          >
            <option value="">
              Todos los estados
            </option>

            <option value="ACTIVO">
              Activos
            </option>

            <option value="INACTIVO">
              Inactivos
            </option>
          </select>

          {filtrosActivos && (
            <button
              type="button"
              onClick={() => {
                setFiltroTexto('')
                setFiltroEstado('')
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
            >
              <X className="size-4" />
              Limpiar
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          {trabajosFiltrados.length ===
          trabajos.length
            ? `${trabajos.length} trabajos registrados`
            : `Mostrando ${trabajosFiltrados.length} de ${trabajos.length} trabajos`}
        </p>
      </section>

      {/* CATÁLOGO */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-950">
            Catálogo
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Los precios son valores base.
            En una orden el vendedor podrá
            establecer un valor diferente.
          </p>
        </div>

        {trabajosFiltrados.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <Wrench className="mx-auto size-9 text-zinc-300" />

            <p className="mt-3 font-semibold text-zinc-700">
              No encontramos trabajos
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Prueba cambiando los filtros.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {trabajosFiltrados.map(
              (trabajo) => {
                const editando =
                  editandoId ===
                  trabajo.id

                const procesando =
                  accionandoId ===
                  trabajo.id

                if (editando) {
                  return (
                    <form
                      key={
                        trabajo.id
                      }
                      onSubmit={(event) =>
                        void handleActualizar(
                          event,
                          trabajo,
                        )
                      }
                      className="overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-sm"
                    >
                      <div className="border-b border-zinc-100 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                            <Pencil className="size-5" />
                          </div>

                          <div>
                            <h3 className="font-bold text-zinc-950">
                              Editar trabajo
                            </h3>

                            <p className="text-sm text-zinc-500">
                              Modifica el nombre
                              o precio base.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-5">
                        <div>
                          <label
                            htmlFor={`nombre-${trabajo.id}`}
                            className="mb-2 block text-sm font-semibold text-zinc-700"
                          >
                            Nombre
                          </label>

                          <input
                            id={`nombre-${trabajo.id}`}
                            value={
                              nombreEdicion
                            }
                            onChange={(event) =>
                              setNombreEdicion(
                                event.target.value,
                              )
                            }
                            disabled={
                              procesando
                            }
                            className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`precio-${trabajo.id}`}
                            className="mb-2 block text-sm font-semibold text-zinc-700"
                          >
                            Precio base
                          </label>

                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                              $
                            </span>

                            <input
                              id={`precio-${trabajo.id}`}
                              type="number"
                              min="0"
                              step="1000"
                              value={
                                precioEdicion
                              }
                              onChange={(event) =>
                                setPrecioEdicion(
                                  event.target.value,
                                )
                              }
                              disabled={
                                procesando
                              }
                              className="h-11 w-full rounded-lg border border-zinc-300 pl-8 pr-3 text-sm font-semibold outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                          <button
                            type="submit"
                            disabled={
                              procesando
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                          >
                            {procesando ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-4" />
                                Guardar cambios
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={
                              procesando
                            }
                            onClick={
                              cancelarEdicion
                            }
                            className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </form>
                  )
                }

                return (
                  <article
                    key={
                      trabajo.id
                    }
                    className={[
                      'overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md',
                      trabajo.activo
                        ? 'border-zinc-200'
                        : 'border-zinc-200 opacity-75',
                    ].join(
                      ' ',
                    )}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={[
                              'flex size-11 shrink-0 items-center justify-center rounded-xl',
                              trabajo.activo
                                ? 'bg-zinc-950 text-white'
                                : 'bg-zinc-100 text-zinc-500',
                            ].join(
                              ' ',
                            )}
                          >
                            <Wrench className="size-5" />
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-zinc-950">
                              {
                                trabajo.nombre
                              }
                            </h3>

                            <span
                              className={[
                                'mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                trabajo.activo
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-zinc-100 text-zinc-500',
                              ].join(
                                ' ',
                              )}
                            >
                              {trabajo.activo
                                ? 'ACTIVO'
                                : 'INACTIVO'}
                            </span>
                          </div>
                        </div>

                        <div
                          className={[
                            'size-2.5 shrink-0 rounded-full',
                            trabajo.activo
                              ? 'bg-emerald-500'
                              : 'bg-zinc-300',
                          ].join(
                            ' ',
                          )}
                        />
                      </div>

                      <div className="mt-5 rounded-xl bg-zinc-50 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                          <CircleDollarSign className="size-4" />

                          Precio base
                        </div>

                        <p className="mt-2 text-2xl font-black text-zinc-950">
                          {formatoCOP.format(
                            Number(
                              trabajo.precio_base,
                            ),
                          )}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Puede modificarse
                          individualmente en cada orden.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-zinc-100 bg-zinc-50/60 p-4">
                      <button
                        type="button"
                        disabled={
                          procesando
                        }
                        onClick={() =>
                          iniciarEdicion(
                            trabajo,
                          )
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                      >
                        <Pencil className="size-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        disabled={
                          procesando
                        }
                        onClick={() =>
                          void handleEstado(
                            trabajo,
                          )
                        }
                        className={[
                          'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60',
                          trabajo.activo
                            ? 'border border-red-200 bg-white text-red-700 hover:bg-red-50'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700',
                        ].join(
                          ' ',
                        )}
                      >
                        {procesando ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : trabajo.activo ? (
                          <XCircle className="size-4" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}

                        {trabajo.activo
                          ? 'Desactivar'
                          : 'Activar'}
                      </button>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
      </section>
    </div>
  )
}
