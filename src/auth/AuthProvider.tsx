import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import {
  AuthContext,
  type Perfil,
} from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  async function cargarPerfil(userId: string) {
    const { data, error } = await supabase
      .from('perfiles')
      .select(
        'id, username, nombre, rol, porcentaje_mecanico, activo'
      )
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    if (!data.activo) {
      await supabase.auth.signOut({
        scope: 'local',
      })
      throw new Error('Esta cuenta se encuentra desactivada')
    }

    setPerfil(data as Perfil)
  }

  useEffect(() => {
    async function inicializar() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await cargarPerfil(session.user.id)
        }
      } catch (error) {
        console.error(error)
        setUser(null)
        setPerfil(null)
      } finally {
        setLoading(false)
      }
    }

    void inicializar()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null)
        setPerfil(null)
        return
      }

      setUser(session.user)

      void cargarPerfil(session.user.id).catch(async (error) => {
        console.error(error)
        setPerfil(null)
        await supabase.auth.signOut({
          scope: 'local',
        })
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(username: string, password: string) {
    const usuario = username.trim().toLowerCase()

    if (!usuario) {
      throw new Error('Ingresa el nombre de usuario')
    }

    /*
     * El trabajador nunca ve ni utiliza este correo.
     * Es únicamente la identidad interna utilizada por Supabase Auth.
     */
    const emailInterno = `${usuario}@megamotos.invalid`

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInterno,
      password,
    })

    if (error) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    if (!data.user) {
      throw new Error('No fue posible iniciar sesión')
    }

    setUser(data.user)

    try {
      await cargarPerfil(data.user.id)
    } catch (error) {
      await supabase.auth.signOut({
        scope: 'local',
      })
      throw error
    }
  }

  async function logout() {
    await supabase.auth.signOut({
      scope: 'local',
    })

    setUser(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
