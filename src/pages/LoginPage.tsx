import {
  useState,
  type FormEvent,
} from 'react'

import {
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from 'lucide-react'

import {
  Navigate,
} from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const {
    login,
    user,
    perfil,
  } = useAuth()

  const [
    username,
    setUsername,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false)

  const [
    ingresando,
    setIngresando,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  if (user && perfil) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    if (!username.trim()) {
      setError(
        'Ingresa tu usuario',
      )
      return
    }

    if (!password) {
      setError(
        'Ingresa tu contraseña',
      )
      return
    }

    try {
      setIngresando(true)

      await login(
        username,
        password,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión',
      )
    } finally {
      setIngresando(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LADO IZQUIERDO */}
        <section className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-[0.05]">
            <div className="absolute -left-32 top-20 size-96 rounded-full border-[70px] border-white" />

            <div className="absolute -bottom-48 -right-32 size-[500px] rounded-full border-[90px] border-white" />
          </div>

          <div className="relative z-10 p-12">
            <img
              src="/logo-megamotos.jpg"
              alt="Megamotos"
              className="h-28 w-36 rounded-xl bg-white object-contain p-2"
            />
          </div>

          <div className="relative z-10 max-w-xl p-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-400">
              Almacén y Taller
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
              Control del taller,
              <br />
              simple y organizado.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              Gestiona motos, órdenes de
              trabajo, mecánicos y pagos
              desde un solo lugar.
            </p>
          </div>

          <div className="relative z-10 p-12 text-sm text-zinc-500">
            Megamotos · Sistema interno
          </div>
        </section>

        {/* LOGIN */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-10 flex justify-center lg:hidden">
              <img
                src="/logo-megamotos.jpg"
                alt="Megamotos"
                className="h-24 w-32 rounded-xl bg-white object-contain p-2 shadow-sm"
              />
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <p className="mb-2 text-sm font-medium text-zinc-500">
                  Bienvenido
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
                  Iniciar sesión
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Ingresa con el usuario
                  asignado por el administrador.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-semibold text-zinc-800"
                  >
                    Usuario
                  </label>

                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(event) =>
                        setUsername(
                          event.target.value,
                        )
                      }
                      placeholder="Ej. carlos"
                      className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-zinc-800"
                  >
                    Contraseña
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                    <input
                      id="password"
                      type={
                        mostrarPassword
                          ? 'text'
                          : 'password'
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      placeholder="••••••••"
                      className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-11 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
                    />

                    <button
                      type="button"
                      aria-label={
                        mostrarPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      onClick={() =>
                        setMostrarPassword(
                          (actual) =>
                            !actual,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-950"
                    >
                      {mostrarPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={ingresando}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ingresando
                    ? 'Ingresando...'
                    : 'Ingresar'}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Acceso exclusivo para personal de Megamotos
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
