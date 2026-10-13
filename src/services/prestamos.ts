import { supabase } from '../lib/supabase'

export interface PrestamoMecanico {
  prestamo_id: number
  mecanico_id: string
  mecanico_nombre: string
  descripcion: string
  monto_original: number
  monto_aplicado: number
  saldo_pendiente: number
  created_at: string
}

export interface RegistrarPrestamoData {
  mecanicoId: string
  descripcion: string
  monto: number
}

export interface MecanicoPrestamo {
  id: string
  nombre: string
}

export interface AplicacionPrestamo {
  liquidacion_id: number
  prestamo_id: number
  descripcion: string
  monto_original: number
  monto_aplicado: number
  prestamo_created_at: string
}

export async function listarPrestamosMecanicos():
Promise<PrestamoMecanico[]> {
  const { data, error } = await supabase.rpc(
    'listar_prestamos_mecanicos',
  )

  if (error) {
    throw new Error(error.message)
  }

  return (
    (data ?? []) as unknown as PrestamoMecanico[]
  ).map((prestamo) => ({
    ...prestamo,
    prestamo_id: Number(prestamo.prestamo_id),
    monto_original: Number(prestamo.monto_original),
    monto_aplicado: Number(prestamo.monto_aplicado),
    saldo_pendiente: Number(prestamo.saldo_pendiente),
  }))
}

export async function listarMecanicosParaPrestamos():
Promise<MecanicoPrestamo[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre')
    .eq('rol', 'MECANICO')
    .order('nombre')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as MecanicoPrestamo[]
}

export async function listarAplicacionesPrestamos():
Promise<AplicacionPrestamo[]> {
  const { data, error } = await supabase.rpc(
    'listar_aplicaciones_prestamos',
  )

  if (error) {
    throw new Error(error.message)
  }

  return (
    (data ?? []) as unknown as AplicacionPrestamo[]
  ).map((aplicacion) => ({
    ...aplicacion,
    liquidacion_id: Number(aplicacion.liquidacion_id),
    prestamo_id: Number(aplicacion.prestamo_id),
    monto_original: Number(aplicacion.monto_original),
    monto_aplicado: Number(aplicacion.monto_aplicado),
  }))
}

export async function registrarPrestamoMecanico(
  datos: RegistrarPrestamoData,
) {
  const { data, error } = await supabase.rpc(
    'registrar_prestamo_mecanico',
    {
      p_mecanico_id: datos.mecanicoId,
      p_descripcion: datos.descripcion.trim(),
      p_monto: Math.round(datos.monto),
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  const prestamo = data?.[0]

  if (!prestamo) {
    throw new Error('No fue posible registrar el préstamo')
  }

  return prestamo
}
