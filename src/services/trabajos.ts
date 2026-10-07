import { supabase } from '../lib/supabase'

export interface TipoTrabajo {
  id: number
  nombre: string
  precio_base: number
  activo: boolean
  created_at: string
  updated_at: string
}

function mensajeError(error: {
  code?: string
  message?: string
}) {
  if (error.code === '23505') {
    return 'Ya existe un trabajo con ese nombre'
  }

  return error.message || 'Ocurrió un error'
}

export async function listarTrabajos(): Promise<TipoTrabajo[]> {
  const { data, error } = await supabase
    .from('tipos_trabajo')
    .select(`
      id,
      nombre,
      precio_base,
      activo,
      created_at,
      updated_at
    `)
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true })

  if (error) {
    throw new Error(mensajeError(error))
  }

  return data as TipoTrabajo[]
}

export async function listarTrabajosActivos(): Promise<TipoTrabajo[]> {
  const { data, error } = await supabase
    .from('tipos_trabajo')
    .select(`
      id,
      nombre,
      precio_base,
      activo,
      created_at,
      updated_at
    `)
    .eq('activo', true)
    .order('nombre')

  if (error) {
    throw new Error(mensajeError(error))
  }

  return data as TipoTrabajo[]
}

export async function crearTrabajo(
  nombre: string,
  precioBase: number,
) {
  const { data, error } = await supabase
    .from('tipos_trabajo')
    .insert({
      nombre: nombre.trim(),
      precio_base: Math.round(precioBase),
      activo: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(mensajeError(error))
  }

  return data
}

export async function actualizarTrabajo(
  id: number,
  nombre: string,
  precioBase: number,
) {
  const { data, error } = await supabase
    .from('tipos_trabajo')
    .update({
      nombre: nombre.trim(),
      precio_base: Math.round(precioBase),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(mensajeError(error))
  }

  return data
}

export async function cambiarEstadoTrabajo(
  id: number,
  activo: boolean,
) {
  const { data, error } = await supabase
    .from('tipos_trabajo')
    .update({
      activo,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(mensajeError(error))
  }

  return data
}