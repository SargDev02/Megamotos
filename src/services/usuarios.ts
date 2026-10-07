import { supabase } from '../lib/supabase'
import type { Perfil, Rol } from '../auth/auth-context'

export interface CrearUsuarioData {
  nombre: string
  username: string
  password: string
  rol: Rol
  porcentaje_mecanico?: number | null
}

export async function listarUsuarios(): Promise<Perfil[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select(`
      id,
      username,
      nombre,
      rol,
      porcentaje_mecanico,
      activo
    `)
    .order('nombre')

  if (error) {
    throw new Error(error.message)
  }

  return data as Perfil[]
}

export async function crearUsuario(datos: CrearUsuarioData) {
  const { data, error } = await supabase.functions.invoke(
    'gestionar-usuarios',
    {
      body: {
        action: 'create',
        nombre: datos.nombre.trim(),
        username: datos.username.trim().toLowerCase(),
        password: datos.password,
        rol: datos.rol,
        porcentaje_mecanico:
          datos.rol === 'MECANICO'
            ? datos.porcentaje_mecanico
            : null,
      },
    },
  )

  if (error) {
    throw new Error(
      data?.error ||
        error.message ||
        'No fue posible crear el usuario',
    )
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

export async function cambiarEstadoUsuario(
  username: string,
  activo: boolean,
) {
  const { data, error } = await supabase.functions.invoke(
    'gestionar-usuarios',
    {
      body: {
        action: 'set_active',
        username,
        activo,
      },
    },
  )

  if (error) {
    throw new Error(data?.error || error.message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

export async function cambiarNombreUsuario(
  username: string,
  nombre: string,
) {
  const { data, error } = await supabase.functions.invoke(
    'gestionar-usuarios',
    {
      body: {
        action: 'update_name',
        username,
        nombre,
      },
    },
  )

  if (error) {
    throw new Error(data?.error || error.message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

export async function cambiarPorcentajeMecanico(
  username: string,
  porcentaje: number,
) {
  const { data, error } = await supabase.functions.invoke(
    'gestionar-usuarios',
    {
      body: {
        action: 'set_percentage',
        username,
        porcentaje_mecanico: porcentaje,
      },
    },
  )

  if (error) {
    throw new Error(data?.error || error.message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

export async function cambiarPasswordUsuario(
  username: string,
  password: string,
) {
  const { data, error } = await supabase.functions.invoke(
    'gestionar-usuarios',
    {
      body: {
        action: 'set_password',
        username,
        password,
      },
    },
  )

  if (error) {
    throw new Error(data?.error || error.message)
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}
