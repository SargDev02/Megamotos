import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserCog,
  UserRound,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'

import {
  cambiarEstadoUsuario,
  cambiarPasswordUsuario,
  cambiarPorcentajeMecanico,
  crearUsuario,
  listarUsuarios,
} from '../services/usuarios'

type Rol =
  | 'ADMIN'
  | 'VENDEDOR'
  | 'MECANICO'

interface Perfil {
  id: string
  nombre: string
  username: string
  rol: Rol
  activo: boolean
  porcentaje_mecanico:
    | number
    | null
}

export function UsuariosPage() {
  const [
    usuarios,
    setUsuarios,
  ] = useState<Perfil[]>([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    actualizando,
    setActualizando,
  ] = useState(false)

  const [
    guardandoCreacion,
    setGuardandoCreacion,
  ] = useState(false)

  const [
    accionandoUsuario,
    setAccionandoUsuario,
  ] = useState<string | null>(
    null,
  )

  const [
    mostrarCrear,
    setMostrarCrear,
  ] = useState(false)

  const [
    nombre,
    setNombre,
  ] = useState('')

  const [
    username,
    setUsername,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    mostrarPasswordCreacion,
    setMostrarPasswordCreacion,
  ] = useState(false)

  const [
    rol,
    setRol,
  ] =
    useState<Rol>('VENDEDOR')

  const [
    porcentaje,
    setPorcentaje,
  ] = useState('')

  const [
    filtroTexto,
    setFiltroTexto,
  ] = useState('')

  const [
    filtroRol,
    setFiltroRol,
  ] = useState('')

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState('')

  const [
    editandoPassword,
    setEditandoPassword,
  ] = useState<string | null>(
    null,
  )

  const [
    nuevoPassword,
    setNuevoPassword,
  ] = useState('')

  const [
    mostrarNuevoPassword,
    setMostrarNuevoPassword,
  ] = useState(false)

  const [
    mensaje,
    setMensaje,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  async function cargarUsuarios() {
    try {
      setError('')
      setActualizando(true)

      const data =
        await listarUsuarios()

      setUsuarios(data)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar los usuarios',
      )
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }

  useEffect(() => {
    let ignorarResultado = false

    void listarUsuarios().then(
      (data) => {
        if (ignorarResultado) {
          return
        }

        setUsuarios(data)
        setCargando(false)
      },
      (error: unknown) => {
        if (ignorarResultado) {
          return
        }

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los usuarios',
        )
        setCargando(false)
      },
    )

    return () => {
      ignorarResultado = true
    }
  }, [])

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

  const usuariosFiltrados =
    useMemo(() => {
      const texto =
        normalizarBusqueda(
          filtroTexto,
        )

      return usuarios.filter(
        (usuario) => {
          if (
            filtroRol &&
            usuario.rol !==
              filtroRol
          ) {
            return false
          }

          if (
            filtroEstado ===
              'ACTIVO' &&
            !usuario.activo
          ) {
            return false
          }

          if (
            filtroEstado ===
              'INACTIVO' &&
            usuario.activo
          ) {
            return false
          }

          if (!texto) {
            return true
          }

          const contenido =
            normalizarBusqueda(
              [
                usuario.nombre,
                usuario.username,
                usuario.rol,
              ].join(' '),
            )

          return contenido.includes(
            texto,
          )
        },
      )
    }, [
      usuarios,
      filtroTexto,
      filtroRol,
      filtroEstado,
    ])

  const filtrosActivos =
    Boolean(
      filtroTexto ||
      filtroRol ||
      filtroEstado,
    )

  const resumen =
    useMemo(() => {
      return {
        total:
          usuarios.length,

        activos:
          usuarios.filter(
            (usuario) =>
              usuario.activo,
          ).length,

        mecanicos:
          usuarios.filter(
            (usuario) =>
              usuario.rol ===
              'MECANICO' &&
              usuario.activo,
          ).length,
      }
    }, [usuarios])

  async function handleCrearUsuario(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setMensaje('')

    if (!nombre.trim()) {
      setError(
        'El nombre es obligatorio',
      )
      return
    }

    if (!username.trim()) {
      setError(
        'El usuario es obligatorio',
      )
      return
    }

    if (password.length < 8) {
      setError(
        'La contraseña debe tener al menos 8 caracteres',
      )
      return
    }

    let porcentajeMecanico:
      | number
      | undefined

    if (rol === 'MECANICO') {
      const valor =
        Number(porcentaje)

      if (
        Number.isNaN(valor) ||
        valor < 0 ||
        valor > 100
      ) {
        setError(
          'El porcentaje debe estar entre 0 y 100',
        )
        return
      }

      porcentajeMecanico =
        valor
    }

    try {
      setGuardandoCreacion(
        true,
      )

      await crearUsuario({
        nombre:
          nombre.trim(),

        username:
          username.trim(),

        password,

        rol,

        porcentaje_mecanico:
          porcentajeMecanico,
      })

      setNombre('')
      setUsername('')
      setPassword('')
      setPorcentaje('')
      setRol('VENDEDOR')

      setMostrarCrear(false)

      setMensaje(
        'Usuario creado correctamente.',
      )

      await cargarUsuarios()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear el usuario',
      )
    } finally {
      setGuardandoCreacion(
        false,
      )
    }
  }

  async function handleEstado(
    usuario: Perfil,
  ) {
    try {
      setError('')
      setMensaje('')

      setAccionandoUsuario(
        usuario.username,
      )

      await cambiarEstadoUsuario(
        usuario.username,
        !usuario.activo,
      )

      setMensaje(
        usuario.activo
          ? `${usuario.nombre} fue desactivado.`
          : `${usuario.nombre} fue activado.`,
      )

      await cargarUsuarios()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cambiar el estado',
      )
    } finally {
      setAccionandoUsuario(
        null,
      )
    }
  }

  async function handlePorcentaje(
    event:
      FormEvent<HTMLFormElement>,
    usuario: Perfil,
  ) {
    event.preventDefault()

    const formulario =
      new FormData(
        event.currentTarget,
      )

    const valor =
      Number(
        formulario.get(
          'porcentaje',
        ),
      )

    if (
      Number.isNaN(valor) ||
      valor < 0 ||
      valor > 100
    ) {
      setError(
        'El porcentaje debe estar entre 0 y 100',
      )
      return
    }

    try {
      setError('')
      setMensaje('')

      setAccionandoUsuario(
        usuario.username,
      )

      await cambiarPorcentajeMecanico(
        usuario.username,
        valor,
      )

      setMensaje(
        `Porcentaje de ${usuario.nombre} actualizado correctamente.`,
      )

      await cargarUsuarios()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar el porcentaje',
      )
    } finally {
      setAccionandoUsuario(
        null,
      )
    }
  }

  async function handlePassword(
    usuario: Perfil,
  ) {
    if (
      nuevoPassword.length <
      8
    ) {
      setError(
        'La contraseña debe tener al menos 8 caracteres',
      )
      return
    }

    try {
      setError('')
      setMensaje('')

      setAccionandoUsuario(
        usuario.username,
      )

      await cambiarPasswordUsuario(
        usuario.username,
        nuevoPassword,
      )

      setMensaje(
        `Contraseña de ${usuario.nombre} actualizada correctamente.`,
      )

      setNuevoPassword('')
      setEditandoPassword(null)
      setMostrarNuevoPassword(
        false,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cambiar la contraseña',
      )
    } finally {
      setAccionandoUsuario(
        null,
      )
    }
  }

  function iconoRol(
    rolUsuario: Rol,
  ) {
    if (
      rolUsuario ===
      'ADMIN'
    ) {
      return ShieldCheck
    }

    if (
      rolUsuario ===
      'MECANICO'
    ) {
      return Wrench
    }

    return UserRound
  }

  function textoRol(
    rolUsuario: Rol,
  ) {
    if (
      rolUsuario ===
      'ADMIN'
    ) {
      return 'Administrador'
    }

    if (
      rolUsuario ===
      'MECANICO'
    ) {
      return 'Mecánico'
    }

    return 'Vendedor'
  }

  if (cargando) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-7 animate-spin text-zinc-500" />

          <p className="mt-3 text-sm text-zinc-500">
            Cargando usuarios...
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
            Usuarios
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Administra las cuentas del
            personal que tiene acceso al
            sistema.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              actualizando
            }
            onClick={() =>
              void cargarUsuarios()
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
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
              : 'Nuevo usuario'}
          </button>
        </div>
      </section>

      {/* RESUMEN */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-500">
            Usuarios registrados
          </p>

          <p className="mt-1 text-4xl font-black text-zinc-950">
            {resumen.total}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700">
            Activos
          </p>

          <p className="mt-1 text-4xl font-black text-emerald-950">
            {resumen.activos}
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-700">
            Mecánicos activos
          </p>

          <p className="mt-1 text-4xl font-black text-blue-950">
            {resumen.mecanicos}
          </p>
        </div>
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

      {/* CREAR */}
      {mostrarCrear && (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-white">
                <UserCog className="size-5" />
              </div>

              <div>
                <h2 className="font-bold text-zinc-950">
                  Crear usuario
                </h2>

                <p className="text-sm text-zinc-500">
                  Registra una nueva cuenta
                  para el personal.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={
              handleCrearUsuario
            }
            className="p-5 sm:p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="nuevo-nombre"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Nombre completo *
                </label>

                <input
                  id="nuevo-nombre"
                  value={nombre}
                  onChange={(event) =>
                    setNombre(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Carlos Pérez"
                  className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>

              <div>
                <label
                  htmlFor="nuevo-username"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Usuario *
                </label>

                <input
                  id="nuevo-username"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. carlos"
                  autoComplete="off"
                  className="h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm lowercase outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>

              <div>
                <label
                  htmlFor="nuevo-rol"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Rol *
                </label>

                <select
                  id="nuevo-rol"
                  value={rol}
                  onChange={(event) => {
                    const nuevoRol =
                      event.target
                        .value as Rol

                    setRol(
                      nuevoRol,
                    )

                    if (
                      nuevoRol !==
                      'MECANICO'
                    ) {
                      setPorcentaje('')
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                >
                  <option value="VENDEDOR">
                    Vendedor
                  </option>

                  <option value="MECANICO">
                    Mecánico
                  </option>

                  <option value="ADMIN">
                    Administrador
                  </option>
                </select>
              </div>

              {rol ===
                'MECANICO' && (
                <div>
                  <label
                    htmlFor="nuevo-porcentaje"
                    className="mb-2 block text-sm font-semibold text-zinc-700"
                  >
                    Porcentaje *
                  </label>

                  <div className="relative">
                    <input
                      id="nuevo-porcentaje"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        porcentaje
                      }
                      onChange={(event) =>
                        setPorcentaje(
                          event.target.value,
                        )
                      }
                      placeholder="40"
                      className="h-11 w-full rounded-lg border border-zinc-300 px-3 pr-10 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                      %
                    </span>
                  </div>
                </div>
              )}

              <div
                className={
                  rol === 'MECANICO'
                    ? 'md:col-span-2'
                    : ''
                }
              >
                <label
                  htmlFor="nuevo-password"
                  className="mb-2 block text-sm font-semibold text-zinc-700"
                >
                  Contraseña *
                </label>

                <div className="relative">
                  <input
                    id="nuevo-password"
                    type={
                      mostrarPasswordCreacion
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="h-11 w-full rounded-lg border border-zinc-300 px-3 pr-11 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPasswordCreacion(
                        (actual) =>
                          !actual,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-950"
                  >
                    {mostrarPasswordCreacion ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-zinc-200 pt-5">
              <button
                type="submit"
                disabled={
                  guardandoCreacion
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardandoCreacion ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Crear usuario
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* FILTROS */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row">
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
              placeholder="Buscar nombre o usuario..."
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
          </div>

          <select
            value={filtroRol}
            onChange={(event) =>
              setFiltroRol(
                event.target.value,
              )
            }
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 xl:min-w-48"
          >
            <option value="">
              Todos los roles
            </option>

            <option value="ADMIN">
              Administradores
            </option>

            <option value="VENDEDOR">
              Vendedores
            </option>

            <option value="MECANICO">
              Mecánicos
            </option>
          </select>

          <select
            value={
              filtroEstado
            }
            onChange={(event) =>
              setFiltroEstado(
                event.target.value,
              )
            }
            className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950 xl:min-w-44"
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
                setFiltroRol('')
                setFiltroEstado('')
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
            >
              <X className="size-4" />
              Limpiar
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          {usuariosFiltrados.length ===
          usuarios.length
            ? `${usuarios.length} usuarios`
            : `Mostrando ${usuariosFiltrados.length} de ${usuarios.length} usuarios`}
        </p>
      </section>

      {/* USUARIOS */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-950">
            Personal
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Usuarios con acceso al sistema,
            incluidos los que fueron
            desactivados.
          </p>
        </div>

        {usuariosFiltrados.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <UserCog className="mx-auto size-9 text-zinc-300" />

            <p className="mt-3 font-semibold text-zinc-700">
              No encontramos usuarios
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Prueba cambiando los filtros.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {usuariosFiltrados.map(
              (usuario) => {
                const Icon =
                  iconoRol(
                    usuario.rol,
                  )

                const procesando =
                  accionandoUsuario ===
                  usuario.username

                const editandoClave =
                  editandoPassword ===
                  usuario.username

                return (
                  <article
                    key={
                      usuario.id
                    }
                    className={[
                      'overflow-hidden rounded-2xl border bg-white shadow-sm',
                      usuario.activo
                        ? 'border-zinc-200'
                        : 'border-zinc-200 opacity-75',
                    ].join(
                      ' ',
                    )}
                  >
                    {/* USUARIO */}
                    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5">
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            'flex size-11 shrink-0 items-center justify-center rounded-xl',
                            usuario.activo
                              ? 'bg-zinc-950 text-white'
                              : 'bg-zinc-100 text-zinc-500',
                          ].join(
                            ' ',
                          )}
                        >
                          <Icon className="size-5" />
                        </div>

                        <div>
                          <h3 className="font-bold text-zinc-950">
                            {
                              usuario.nombre
                            }
                          </h3>

                          <p className="mt-1 text-sm text-zinc-500">
                            @
                            {
                              usuario.username
                            }
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              {textoRol(
                                usuario.rol,
                              )}
                            </span>

                            <span
                              className={[
                                'rounded-full px-2.5 py-1 text-xs font-semibold',
                                usuario.activo
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-zinc-100 text-zinc-500',
                              ].join(
                                ' ',
                              )}
                            >
                              {usuario.activo
                                ? 'ACTIVO'
                                : 'INACTIVO'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={[
                          'size-2.5 shrink-0 rounded-full',
                          usuario.activo
                            ? 'bg-emerald-500'
                            : 'bg-zinc-300',
                        ].join(
                          ' ',
                        )}
                      />
                    </div>

                    <div className="space-y-4 p-5">
                      {/* PORCENTAJE */}
                      {usuario.rol ===
                        'MECANICO' && (
                        <form
                          onSubmit={(
                            event,
                          ) =>
                            void handlePorcentaje(
                              event,
                              usuario,
                            )
                          }
                          className="rounded-xl bg-zinc-50 p-4"
                        >
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-zinc-950">
                              Porcentaje del mecánico
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              Se aplicará a las nuevas
                              órdenes que se le asignen.
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                name="porcentaje"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                defaultValue={
                                  usuario.porcentaje_mecanico ??
                                  0
                                }
                                disabled={
                                  procesando
                                }
                                className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 pr-9 text-sm font-semibold outline-none focus:border-zinc-950"
                              />

                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                                %
                              </span>
                            </div>

                            <button
                              type="submit"
                              disabled={
                                procesando
                              }
                              className="h-10 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
                            >
                              Guardar
                            </button>
                          </div>
                        </form>
                      )}

                      {/* CONTRASEÑA */}
                      {editandoClave ? (
                        <div className="rounded-xl border border-zinc-200 p-4">
                          <p className="mb-3 text-sm font-semibold text-zinc-950">
                            Nueva contraseña
                          </p>

                          <div className="relative">
                            <input
                              type={
                                mostrarNuevoPassword
                                  ? 'text'
                                  : 'password'
                              }
                              value={
                                nuevoPassword
                              }
                              onChange={(event) =>
                                setNuevoPassword(
                                  event.target.value,
                                )
                              }
                              placeholder="Mínimo 8 caracteres"
                              disabled={
                                procesando
                              }
                              autoFocus
                              className="h-10 w-full rounded-lg border border-zinc-300 px-3 pr-10 text-sm outline-none focus:border-zinc-950"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setMostrarNuevoPassword(
                                  (actual) =>
                                    !actual,
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                            >
                              {mostrarNuevoPassword ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={
                                procesando
                              }
                              onClick={() =>
                                void handlePassword(
                                  usuario,
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-bold text-white disabled:opacity-60"
                            >
                              {procesando ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <KeyRound className="size-3.5" />
                              )}

                              Guardar contraseña
                            </button>

                            <button
                              type="button"
                              disabled={
                                procesando
                              }
                              onClick={() => {
                                setEditandoPassword(
                                  null,
                                )

                                setNuevoPassword(
                                  '',
                                )

                                setMostrarNuevoPassword(
                                  false,
                                )
                              }}
                              className="h-9 rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-600"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoPassword(
                                usuario.username,
                              )

                              setNuevoPassword(
                                '',
                              )

                              setMostrarNuevoPassword(
                                false,
                              )

                              setError('')
                              setMensaje('')
                            }}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                          >
                            <KeyRound className="size-4" />
                            Cambiar contraseña
                          </button>

                          <button
                            type="button"
                            disabled={
                              procesando
                            }
                            onClick={() =>
                              void handleEstado(
                                usuario,
                              )
                            }
                            className={[
                              'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60',
                              usuario.activo
                                ? 'border border-red-200 bg-white text-red-700 hover:bg-red-50'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700',
                            ].join(
                              ' ',
                            )}
                          >
                            {procesando ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : usuario.activo ? (
                              <XCircle className="size-4" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}

                            {usuario.activo
                              ? 'Desactivar'
                              : 'Activar'}
                          </button>
                        </div>
                      )}
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
