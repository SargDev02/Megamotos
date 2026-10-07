import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  ArrowLeft,
  Bike,
  CreditCard,
  Loader2,
  Phone,
  Save,
  UserRound,
} from 'lucide-react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  actualizarDatosRecepcion,
  buscarMotoPorPlaca,
  listarMarcas,
  listarModelosPorMarca,
  type MarcaMoto,
} from '../services/recepcion'

export function EditarDatosMotoPage() {
  const navigate =
    useNavigate()

  const { placa } =
    useParams<{ placa: string }>()

  const [
    motoId,
    setMotoId,
  ] =
    useState<number | null>(
      null,
    )

  const [
    nombre,
    setNombre,
  ] =
    useState('')

  const [
    documento,
    setDocumento,
  ] =
    useState('')

  const [
    telefono,
    setTelefono,
  ] =
    useState('')

  const [
    placaMoto,
    setPlacaMoto,
  ] =
    useState('')

  const [
    marcaId,
    setMarcaId,
  ] =
    useState('')

  const [
    modelo,
    setModelo,
  ] =
    useState('')

  const [
    marcas,
    setMarcas,
  ] =
    useState<MarcaMoto[]>([])

  const [
    modelosSugeridos,
    setModelosSugeridos,
  ] =
    useState<string[]>([])

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
      if (!placa) {
        setError(
          'La placa indicada no es válida',
        )

        setCargando(false)
        return
      }

      try {
        setCargando(true)
        setError('')

        const [
          motoEncontrada,
          marcasDisponibles,
        ] =
          await Promise.all([
            buscarMotoPorPlaca(
              placa,
            ),

            listarMarcas(),
          ])

        if (!motoEncontrada) {
          throw new Error(
            'No encontramos esta motocicleta',
          )
        }

        setMotoId(
          motoEncontrada.id,
        )

        setNombre(
          motoEncontrada
            .cliente.nombre,
        )

        setDocumento(
          motoEncontrada
            .cliente.documento ??
            '',
        )

        setTelefono(
          motoEncontrada
            .cliente.telefono,
        )

        setPlacaMoto(
          motoEncontrada.placa,
        )

        setMarcaId(
          String(
            motoEncontrada
              .marca.id,
          ),
        )

        setModelo(
          motoEncontrada.modelo ??
            '',
        )

        setMarcas(
          marcasDisponibles,
        )
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar la información',
        )
      } finally {
        setCargando(false)
      }
    }

    void cargar()
  }, [placa])

  useEffect(() => {
    async function cargarModelos() {
      if (!marcaId) {
        setModelosSugeridos(
          [],
        )

        return
      }

      try {
        const modelos =
          await listarModelosPorMarca(
            Number(
              marcaId,
            ),
          )

        setModelosSugeridos(
          modelos,
        )
      } catch {
        setModelosSugeridos(
          [],
        )
      }
    }

    void cargarModelos()
  }, [marcaId])

  const marcaSeleccionada =
    marcas.find(
      (marca) =>
        marca.id ===
        Number(
          marcaId,
        ),
    )

  async function handleGuardar(
    event: FormEvent,
  ) {
    event.preventDefault()

    setError('')

    if (!motoId) {
      setError(
        'No encontramos la motocicleta',
      )

      return
    }

    if (!nombre.trim()) {
      setError(
        'El nombre del cliente es obligatorio',
      )

      return
    }

    if (!telefono.trim()) {
      setError(
        'El teléfono es obligatorio',
      )

      return
    }

    if (!placaMoto.trim()) {
      setError(
        'La placa es obligatoria',
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
      setGuardando(true)

      await actualizarDatosRecepcion({
        motoId,

        cliente: {
          nombre:
            nombre.trim(),

          documento:
            documento.trim(),

          telefono:
            telefono.trim(),
        },

        moto: {
          placa:
            placaMoto
              .trim()
              .toUpperCase(),

          marca_id:
            Number(
              marcaId,
            ),

          modelo:
            modelo.trim(),
        },
      })

      navigate(
        '/recepcion',
        {
          replace: true,
        },
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar los datos',
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
    !motoId
  ) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(
              '/recepcion',
            )
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
        >
          <ArrowLeft className="size-4" />
          Volver a recepción
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* VOLVER */}
      <button
        type="button"
        onClick={() =>
          navigate(
            '/recepcion',
          )
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
      >
        <ArrowLeft className="size-4" />
        Volver a recepción
      </button>

      {/* ENCABEZADO */}
      <section>
        <p className="text-sm font-medium text-zinc-500">
          Recepción
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
          Editar datos
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Actualiza los datos del
          propietario o de la motocicleta
          registrada.
        </p>
      </section>

      {/* RESUMEN */}
      <section className="overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Bike className="size-6" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Motocicleta registrada
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {marcaSeleccionada
                  ?.nombre ||
                  'Motocicleta'}
                {' '}
                {modelo}
              </h2>

              <p className="mt-1 text-2xl font-black tracking-wider">
                {placaMoto}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Propietario
            </p>

            <p className="mt-1 font-semibold">
              {nombre ||
                'Sin nombre'}
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleGuardar}
        className="space-y-6"
      >
        <div className="grid gap-6 xl:grid-cols-2">
          {/* CLIENTE */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                  <UserRound className="size-5" />
                </div>

                <div>
                  <h2 className="font-bold text-zinc-950">
                    Datos del cliente
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Información del
                    propietario registrado.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="cliente-nombre"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Nombre completo *
                </label>

                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    id="cliente-nombre"
                    value={nombre}
                    onChange={(event) =>
                      setNombre(
                        event.target.value,
                      )
                    }
                    placeholder="Nombre del cliente"
                    className="h-11 w-full rounded-lg border border-zinc-300 pl-10 pr-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cliente-documento"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Cédula / documento
                </label>

                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    id="cliente-documento"
                    value={
                      documento
                    }
                    onChange={(event) =>
                      setDocumento(
                        event.target.value,
                      )
                    }
                    placeholder="Número de documento"
                    className="h-11 w-full rounded-lg border border-zinc-300 pl-10 pr-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Si cambias la cédula, no
                  puede coincidir con otro
                  cliente ya registrado.
                </p>
              </div>

              <div>
                <label
                  htmlFor="cliente-telefono"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Teléfono *
                </label>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                  <input
                    id="cliente-telefono"
                    value={
                      telefono
                    }
                    onChange={(event) =>
                      setTelefono(
                        event.target.value,
                      )
                    }
                    placeholder="Número de contacto"
                    className="h-11 w-full rounded-lg border border-zinc-300 pl-10 pr-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Este número también se
                  utiliza para el aviso por
                  WhatsApp al terminar la moto.
                </p>
              </div>
            </div>
          </section>

          {/* MOTO */}
          <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <Bike className="size-5" />
                </div>

                <div>
                  <h2 className="font-bold text-zinc-950">
                    Datos de la motocicleta
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Identificación principal
                    de la moto.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="moto-placa"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Placa *
                </label>

                <input
                  id="moto-placa"
                  value={
                    placaMoto
                  }
                  onChange={(event) =>
                    setPlacaMoto(
                      event.target.value
                        .toUpperCase()
                        .replace(
                          /\s/g,
                          '',
                        ),
                    )
                  }
                  placeholder="ABC12D"
                  maxLength={10}
                  className="h-12 w-full rounded-lg border border-zinc-300 px-3 text-lg font-black uppercase tracking-[0.16em] outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  La placa debe ser única en
                  el sistema.
                </p>
              </div>

              <div>
                <label
                  htmlFor="moto-marca"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Marca *
                </label>

                <select
                  id="moto-marca"
                  value={marcaId}
                  onChange={(event) => {
                    setMarcaId(
                      event.target.value,
                    )

                    setModelo('')
                  }}
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
                  htmlFor="moto-modelo"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Modelo
                </label>

                <input
                  id="moto-modelo"
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
                  {modelosSugeridos.map(
                    (
                      modeloSugerido,
                    ) => (
                      <option
                        key={
                          modeloSugerido
                        }
                        value={
                          modeloSugerido
                        }
                      />
                    ),
                  )}
                </datalist>

                {marcaId &&
                  modelosSugeridos.length >
                    0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Modelos registrados
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {modelosSugeridos
                          .slice(
                            0,
                            8,
                          )
                          .map(
                            (
                              modeloSugerido,
                            ) => (
                              <button
                                key={
                                  modeloSugerido
                                }
                                type="button"
                                onClick={() =>
                                  setModelo(
                                    modeloSugerido,
                                  )
                                }
                                className={[
                                  'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
                                  modelo ===
                                  modeloSugerido
                                    ? 'border-zinc-950 bg-zinc-950 text-white'
                                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100',
                                ].join(
                                  ' ',
                                )}
                              >
                                {
                                  modeloSugerido
                                }
                              </button>
                            ),
                          )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </section>
        </div>

        {/* ADVERTENCIA */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-950">
            Importante
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-800">
            Editar estos datos no elimina
            ni modifica el historial de
            trabajos de la motocicleta. Las
            órdenes anteriores continúan
            asociadas a esta moto.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ACCIONES */}
        <section className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={guardando}
            onClick={() =>
              navigate(
                '/recepcion',
              )
            }
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
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
        </section>
      </form>
    </div>
  )
}