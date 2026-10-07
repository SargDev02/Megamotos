import { supabase } from '../lib/supabase'

export interface OrdenMecanico {
  id: number

  estado:
    | 'RECIBIDA'
    | 'EN_PROCESO'

  observaciones: string | null
  created_at: string

  moto: {
    placa: string
    modelo: string | null

    marca: {
      nombre: string
    }
  }

  trabajos: {
    id: number
    nombre_trabajo: string
  }[]
}

export async function listarMisOrdenes():
Promise<OrdenMecanico[]> {
  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser()

  if (errorUsuario || !user) {
    throw new Error(
      'No fue posible identificar al mecánico',
    )
  }

  const { data, error } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      observaciones,
      created_at,

      moto:motos!ordenes_moto_id_fkey (
        placa,
        modelo,

        marca:marcas_moto!motos_marca_id_fkey (
          nombre
        )
      ),

      trabajos:trabajos_orden (
        id,
        nombre_trabajo
      )
    `)
    .eq(
      'mecanico_id',
      user.id,
    )
    .in(
      'estado',
      [
        'RECIBIDA',
        'EN_PROCESO',
      ],
    )
    .order(
      'created_at',
      {
        ascending: true,
      },
    )

  if (error) {
    throw new Error(error.message)
  }

  return (
    data as unknown as OrdenMecanico[]
  ).map((orden) => ({
    ...orden,

    trabajos:
      [...orden.trabajos].sort(
        (a, b) =>
          a.id - b.id,
      ),
  }))
}