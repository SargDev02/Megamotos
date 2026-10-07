import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  Bike,
  CircleDot,
  History,
  IdCard,
  Loader2,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  Wrench,
} from 'lucide-react'

import {
  Link,
} from 'react-router-dom'

import {
  buscarMotoPorPlaca,
  crearMarca,
  listarHistorialMoto,
  listarMarcas,
  listarModelosPorMarca,
  normalizarPlaca,
  registrarClienteYMoto,
  type HistorialOrden,
  type MarcaMoto,
  type MotoConCliente,
} from '../services/recepcion'

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

export function RecepcionPage() {
  const [
    placaBusqueda,
    setPlacaBusqueda,
  ] = useState('')

  const [
    busquedaRealizada,
    setBusquedaRealizada,
  ] = useState(false)

  const [
    resultado,
    setResultado,
  ] =
    useState<MotoConCliente | null>(
      null,
    )

  const [
    historial,
    setHistorial,
  ] = useState<HistorialOrden[]>(
    [],
  )

  const [
    marcas,
    setMarcas,
  ] = useState<MarcaMoto[]>([])

  const [
    marcaId,
    setMarcaId,
  ] = useState('')

  const [
    modelos,
    setModelos,
  ] = useState<string[]>([])

  const [
    modelo,
    setModelo,
  ] = useState('')

  const [
    nuevaMarca,
    setNuevaMarca,
  ] = useState('')

  const [
    nombreCliente,
    setNombreCliente,
  ] = useState('')

  const [
    documentoCliente,
    setDocumentoCliente,
  ] = useState('')

  const [
    telefonoCliente,
    setTelefonoCliente,
  ] = useState('')

  const [
    buscando,
    setBuscando,
  ] = useState(false)

  const [
    registrando,
    setRegistrando,
  ] = useState(false)

  const [
    agregandoMarca,
    setAgregandoMarca,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    mensaje,
    setMensaje,
  ] = useState('')

  async function cargarHistorial(
    motoId: number,
  ) {
    const data =
      await listarHistorialMoto(
        motoId,
      )

    setHistorial(data)
  }

  useEffect(() => {
    let ignorarResultado = false

    void listarMarcas().then(
      (data) => {
        if (!ignorarResultado) {
          setMarcas(data)
        }
      },
      (error: unknown) => {
        if (ignorarResultado) {
          return
        }

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar las marcas',
        )
      },
    )

    return () => {
      ignorarResultado = true
    }
  }, [])

  useEffect(() => {
    async function cargarModelos() {
      if (!marcaId) {
        setModelos([])
        return
      }

      try {
        const data =
          await listarModelosPorMarca(
            Number(marcaId),
          )

        setModelos(data)
      } catch {
        setModelos([])
      }
    }

    void cargarModelos()
  }, [marcaId])

  async function handleBuscar(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setMensaje('')

    const placa =
      normalizarPlaca(
        placaBusqueda,
      )

    if (!placa) {
      setError(
        'Ingresa una placa para buscar',
      )
      return
    }

    try {
      setBuscando(true)

      const moto =
        await buscarMotoPorPlaca(
          placa,
        )

      setBusquedaRealizada(true)

      if (!moto) {
        setResultado(null)
        setHistorial([])
        setMensaje(
          'No encontramos esta placa. Puedes registrar la motocicleta.',
        )
        return
      }

      setResultado(moto)

      await cargarHistorial(
        moto.id,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible buscar la placa',
      )
    } finally {
      setBuscando(false)
    }
  }

  async function handleAgregarMarca() {
    const nombre =
      nuevaMarca.trim()

    if (!nombre) {
      setError(
        'Escribe el nombre de la marca',
      )
      return
    }

    try {
      setError('')
      setAgregandoMarca(true)

      const marca =
        await crearMarca(
          nombre,
        )

      setMarcas(
        (actuales) => [
          ...actuales,
          marca,
        ],
      )

      setMarcaId(
        String(marca.id),
      )

      setNuevaMarca('')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear la marca',
      )
    } finally {
      setAgregandoMarca(false)
    }
  }

  async function handleRegistrar(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setMensaje('')

    if (!nombreCliente.trim()) {
      setError(
        'El nombre del cliente es obligatorio',
      )
      return
    }

    if (!telefonoCliente.trim()) {
      setError(
        'El teléfono es obligatorio',
      )
      return
    }

    if (!marcaId) {
      setError(
        'Selecciona una marca',
      )
      return
    }

    try {
      setRegistrando(true)

      const moto =
        await registrarClienteYMoto({
          placa:
            normalizarPlaca(
              placaBusqueda,
            ),

          cliente: {
            nombre:
              nombreCliente,

            documento:
              documentoCliente,

            telefono:
              telefonoCliente,
          },

          moto: {
            marca_id:
              Number(marcaId),

            modelo,
          },
        })

      setResultado(moto)
      setBusquedaRealizada(true)

      await cargarHistorial(
        moto.id,
      )

      setMensaje(
        'La motocicleta fue registrada correctamente.',
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible registrar la motocicleta',
      )
    } finally {
      setRegistrando(false)
    }
  }

  function nuevaBusqueda() {
    setPlacaBusqueda('')
    setBusquedaRealizada(false)
    setResultado(null)
    setHistorial([])

    setMarcaId('')
    setModelo('')
    setModelos([])

    setNuevaMarca('')

    setNombreCliente('')
    setDocumentoCliente('')
    setTelefonoCliente('')

    setError('')
    setMensaje('')
  }

  const ordenesActuales =
    historial.filter(
      (orden) =>
        orden.estado !==
        'TERMINADA',
    )

  const revisionesTerminadas =
    historial.filter(
      (orden) =>
        orden.estado ===
        'TERMINADA',
    )

  const ordenActiva =
    ordenesActuales[0]

  return (
    <div className="space-y-8">
      {/* ENCABEZADO */}
      <section>
        <p className="text-sm font-medium text-zinc-500">
          Taller
        </p>

        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              Recepción
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Busca la placa para consultar
              la motocicleta, revisar su
              historial o registrar una nueva
              orden.
            </p>
          </div>

          {busquedaRealizada && (
            <button
              type="button"
              onClick={
                nuevaBusqueda
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              <RefreshCcw className="size-4" />

              Nueva búsqueda
            </button>
          )}
        </div>
      </section>

      {/* BUSCADOR */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="bg-zinc-950 px-5 py-4 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
              <Search className="size-5" />
            </div>

            <div>
              <h2 className="font-bold">
                Buscar motocicleta
              </h2>

              <p className="text-sm text-zinc-400">
                Ingresa la placa del vehículo
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleBuscar}
          className="p-5 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Bike className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />

              <input
                value={placaBusqueda}
                onChange={(event) =>
                  setPlacaBusqueda(
                    event.target.value
                      .toUpperCase(),
                  )
                }
                disabled={buscando}
                placeholder="Ej. ABC12D"
                className="h-14 w-full rounded-xl border border-zinc-300 bg-white pl-12 pr-4 text-lg font-bold uppercase tracking-wider text-zinc-950 outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </div>

            <button
              type="submit"
              disabled={buscando}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-7 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buscando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Buscar placa
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* MENSAJES */}
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

      {/* MOTO ENCONTRADA */}
      {resultado && (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            {/* MOTO */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                    <Bike className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Motocicleta
                    </p>

                    <h2 className="text-2xl font-bold tracking-wide text-zinc-950">
                      {resultado.placa}
                    </h2>
                  </div>
                </div>

                <Link
                  to={`/moto/${resultado.placa}/editar`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                  title="Editar datos"
                >
                  <Pencil className="size-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Marca
                  </p>

                  <p className="mt-1 font-semibold text-zinc-950">
                    {resultado.marca.nombre}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Modelo
                  </p>

                  <p className="mt-1 font-semibold text-zinc-950">
                    {resultado.modelo ||
                      'No registrado'}
                  </p>
                </div>
              </div>
            </article>

            {/* CLIENTE */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                  <UserRound className="size-5" />
                </div>

                <div>
                  <p className="text-sm text-zinc-500">
                    Propietario
                  </p>

                  <h2 className="text-lg font-bold text-zinc-950">
                    {
                      resultado.cliente
                        .nombre
                    }
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <IdCard className="size-4 shrink-0 text-zinc-400" />

                  <div>
                    <span className="text-zinc-500">
                      Documento:
                    </span>{' '}

                    <span className="font-medium text-zinc-900">
                      {resultado.cliente
                        .documento ||
                        'No registrado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Phone className="size-4 shrink-0 text-zinc-400" />

                  <div>
                    <span className="text-zinc-500">
                      Teléfono:
                    </span>{' '}

                    <span className="font-medium text-zinc-900">
                      {
                        resultado.cliente
                          .telefono
                      }
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to={`/moto/${resultado.placa}/editar`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-zinc-950 hover:underline"
              >
                <Pencil className="size-4" />
                Editar datos del cliente y moto
              </Link>
            </article>
          </section>

          {/* ORDEN ACTUAL */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-zinc-950">
                  Orden actual
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Estado actual de la motocicleta
                  en el taller.
                </p>
              </div>
            </div>

            {!ordenActiva ? (
              <article className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-100">
                  <Wrench className="size-5 text-zinc-600" />
                </div>

                <h3 className="mt-4 font-bold text-zinc-950">
                  No tiene una orden activa
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Esta motocicleta no tiene
                  trabajos pendientes en este
                  momento.
                </p>

                <Link
                  to={`/orden/nueva/${resultado.placa}`}
                  className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  <Plus className="size-4" />
                  Crear nueva orden
                </Link>
              </article>
            ) : (
              <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        'flex size-11 items-center justify-center rounded-xl',
                        ordenActiva.estado ===
                        'EN_PROCESO'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700',
                      ].join(' ')}
                    >
                      <CircleDot className="size-5" />
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">
                        Estado
                      </p>

                      <p className="font-bold text-zinc-950">
                        {ordenActiva.estado ===
                        'EN_PROCESO'
                          ? 'En proceso'
                          : 'Recibida'}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/orden/${ordenActiva.id}/editar`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Pencil className="size-4" />
                    Editar orden
                  </Link>
                </div>

                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500">
                      Trabajos
                    </h3>

                    <div className="space-y-2">
                      {ordenActiva.trabajos.map(
                        (trabajo) => (
                          <div
                            key={
                              trabajo.id
                            }
                            className="flex items-center justify-between gap-4 rounded-lg bg-zinc-50 px-4 py-3"
                          >
                            <span className="text-sm font-medium text-zinc-900">
                              {
                                trabajo.nombre_trabajo
                              }
                            </span>

                            <span className="whitespace-nowrap text-sm font-semibold text-zinc-950">
                              {formatoCOP.format(
                                trabajo.precio_final,
                              )}
                            </span>
                          </div>
                        ),
                      )}
                    </div>

                    {ordenActiva.observaciones && (
                      <div className="mt-5 rounded-xl border border-zinc-200 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                          Observaciones
                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-700">
                          {
                            ordenActiva.observaciones
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  <aside className="rounded-xl bg-zinc-950 p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Mecánico
                    </p>

                    <p className="mt-1 font-semibold">
                      {ordenActiva.mecanico
                        ?.nombre ||
                        'Sin asignar'}
                    </p>

                    <div className="my-5 border-t border-white/10" />

                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Total orden
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {formatoCOP.format(
                        ordenActiva.total,
                      )}
                    </p>
                  </aside>
                </div>
              </article>
            )}
          </section>

          {/* HISTORIAL */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-100">
                <History className="size-5 text-zinc-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-zinc-950">
                  Historial
                </h2>

                <p className="text-sm text-zinc-500">
                  Trabajos terminados anteriormente
                  en esta motocicleta.
                </p>
              </div>
            </div>

            {revisionesTerminadas.length ===
            0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
                Esta motocicleta todavía no tiene
                trabajos terminados registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {revisionesTerminadas.map(
                  (orden) => (
                    <article
                      key={orden.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Terminada
                            </span>

                            <span className="text-sm text-zinc-500">
                              {formatoFecha.format(
                                new Date(
                                  orden.completed_at ??
                                    orden.created_at,
                                ),
                              )}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-zinc-500">
                            Mecánico
                          </p>

                          <p className="font-semibold text-zinc-950">
                            {orden.mecanico
                              ?.nombre ||
                              'No registrado'}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Total
                          </p>

                          <p className="mt-1 text-xl font-bold text-zinc-950">
                            {formatoCOP.format(
                              orden.total,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-zinc-100 pt-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
                          Trabajos realizados
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {orden.trabajos.map(
                            (trabajo) => (
                              <div
                                key={
                                  trabajo.id
                                }
                                className="flex justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 text-sm"
                              >
                                <span className="text-zinc-700">
                                  {
                                    trabajo.nombre_trabajo
                                  }
                                </span>

                                <strong className="whitespace-nowrap text-zinc-950">
                                  {formatoCOP.format(
                                    trabajo.precio_final,
                                  )}
                                </strong>
                              </div>
                            ),
                          )}
                        </div>

                        {orden.observaciones && (
                          <p className="mt-4 text-sm leading-6 text-zinc-600">
                            <strong>
                              Observaciones:
                            </strong>{' '}
                            {
                              orden.observaciones
                            }
                          </p>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* NO EXISTE - REGISTRO */}
      {busquedaRealizada &&
        !resultado && (
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <Plus className="size-5" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-zinc-950">
                    Registrar motocicleta
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Placa{' '}
                    <strong className="text-zinc-950">
                      {normalizarPlaca(
                        placaBusqueda,
                      )}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleRegistrar}
              className="p-5 sm:p-6"
            >
              <div className="grid gap-8 lg:grid-cols-2">
                {/* CLIENTE */}
                <div>
                  <div className="mb-5">
                    <h3 className="font-bold text-zinc-950">
                      Datos del cliente
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      La cédula permite identificar
                      clientes ya registrados.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="nombre-cliente"
                        className="mb-2 block text-sm font-semibold text-zinc-700"
                      >
                        Nombre *
                      </label>

                      <input
                        id="nombre-cliente"
                        value={
                          nombreCliente
                        }
                        onChange={(event) =>
                          setNombreCliente(
                            event.target.value,
                          )
                        }
                        placeholder="Nombre completo"
                        className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="documento-cliente"
                        className="mb-2 block text-sm font-semibold text-zinc-700"
                      >
                        Cédula
                      </label>

                      <input
                        id="documento-cliente"
                        value={
                          documentoCliente
                        }
                        onChange={(event) =>
                          setDocumentoCliente(
                            event.target.value,
                          )
                        }
                        placeholder="Número de documento"
                        className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="telefono-cliente"
                        className="mb-2 block text-sm font-semibold text-zinc-700"
                      >
                        Teléfono *
                      </label>

                      <input
                        id="telefono-cliente"
                        type="tel"
                        value={
                          telefonoCliente
                        }
                        onChange={(event) =>
                          setTelefonoCliente(
                            event.target.value,
                          )
                        }
                        placeholder="300 123 4567"
                        className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                      />
                    </div>
                  </div>
                </div>

                {/* MOTO */}
                <div>
                  <div className="mb-5">
                    <h3 className="font-bold text-zinc-950">
                      Datos de la motocicleta
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      Selecciona la marca y escribe
                      el modelo.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="marca"
                        className="mb-2 block text-sm font-semibold text-zinc-700"
                      >
                        Marca *
                      </label>

                      <select
                        id="marca"
                        value={marcaId}
                        onChange={(event) =>
                          setMarcaId(
                            event.target.value,
                          )
                        }
                        className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                      >
                        <option value="">
                          Selecciona una marca
                        </option>

                        {marcas.map(
                          (marca) => (
                            <option
                              key={
                                marca.id
                              }
                              value={
                                marca.id
                              }
                            >
                              {
                                marca.nombre
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="modelo"
                        className="mb-2 block text-sm font-semibold text-zinc-700"
                      >
                        Modelo
                      </label>

                      <input
                        id="modelo"
                        list="modelos-moto"
                        value={modelo}
                        onChange={(event) =>
                          setModelo(
                            event.target.value,
                          )
                        }
                        placeholder="Ej. FZ 25"
                        className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                      />

                      <datalist id="modelos-moto">
                        {modelos.map(
                          (
                            modeloExistente,
                          ) => (
                            <option
                              key={
                                modeloExistente
                              }
                              value={
                                modeloExistente
                              }
                            />
                          ),
                        )}
                      </datalist>
                    </div>

                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
                      <p className="mb-3 text-sm font-semibold text-zinc-700">
                        ¿No aparece la marca?
                      </p>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={
                            nuevaMarca
                          }
                          onChange={(event) =>
                            setNuevaMarca(
                              event.target.value,
                            )
                          }
                          placeholder="Nueva marca"
                          className="h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950"
                        />

                        <button
                          type="button"
                          disabled={
                            agregandoMarca
                          }
                          onClick={() =>
                            void handleAgregarMarca()
                          }
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
                        >
                          <Plus className="size-4" />

                          {agregandoMarca
                            ? 'Agregando...'
                            : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end border-t border-zinc-200 pt-6">
                <button
                  type="submit"
                  disabled={
                    registrando
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {registrando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Bike className="size-4" />
                      Registrar motocicleta
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
    </div>
  )
}
