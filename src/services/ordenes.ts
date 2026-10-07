import { supabase } from '../lib/supabase'

import {
  listarTrabajosActivos,
  type TipoTrabajo,
} from './trabajos'

export interface Mecanico {
  id: string
  nombre: string
  porcentaje_mecanico: number
}

export interface TrabajoOrdenNuevo {
  tipo_trabajo_id: number
  precio_final: number
}

export interface OrdenCreada {
  id: number
  estado: 'RECIBIDA'
  total: number
  pago_mecanico: number
  porcentaje_mecanico: number
}

export interface TrabajoOrdenEditable {
  id: number
  tipo_trabajo_id: number
  nombre_trabajo: string
  precio_base: number
  precio_final: number
}

export interface OrdenEditable {
  id: number
  estado: 'RECIBIDA' | 'EN_PROCESO' | 'TERMINADA'

  mecanico_id: string
  observaciones: string | null

  total: number
  pago_mecanico: number
  porcentaje_mecanico: number

  moto: {
    id: number
    placa: string
    modelo: string | null

    marca: {
      nombre: string
    }

    cliente: {
      nombre: string
      telefono: string
    }
  }

  trabajos: TrabajoOrdenEditable[]
}

export async function listarMecanicos(): Promise<Mecanico[]> {
  const { data, error } = await supabase
    .from('perfiles')
    .select(`
      id,
      nombre,
      porcentaje_mecanico
    `)
    .eq('rol', 'MECANICO')
    .eq('activo', true)
    .order('nombre')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((mecanico) => ({
    id: mecanico.id,
    nombre: mecanico.nombre,
    porcentaje_mecanico:
      Number(mecanico.porcentaje_mecanico),
  }))
}

export async function obtenerTrabajosDisponibles():
  Promise<TipoTrabajo[]> {
  return listarTrabajosActivos()
}

export async function crearOrden(params: {
  motoId: number
  mecanicoId: string
  observaciones: string
  trabajos: TrabajoOrdenNuevo[]
}): Promise<OrdenCreada> {
  const { data, error } = await supabase.rpc(
    'crear_orden',
    {
      p_moto_id: params.motoId,
      p_mecanico_id: params.mecanicoId,

      p_observaciones:
        params.observaciones.trim() || null,

      p_trabajos: params.trabajos.map(
        (trabajo) => ({
          tipo_trabajo_id:
            trabajo.tipo_trabajo_id,

          precio_final:
            Math.round(
              trabajo.precio_final,
            ),
        }),
      ),
    },
  )

  if (error) {
    if (
      error.message.includes(
        'ya tiene una orden activa',
      )
    ) {
      throw new Error(
        'Esta motocicleta ya tiene una orden activa',
      )
    }

    throw new Error(error.message)
  }

  const orden = data?.[0]

  if (!orden) {
    throw new Error(
      'No fue posible recuperar la orden creada',
    )
  }

  return {
    id: Number(orden.id),
    estado: orden.estado,
    total: Number(orden.total),
    pago_mecanico:
      Number(orden.pago_mecanico),
    porcentaje_mecanico:
      Number(orden.porcentaje_mecanico),
  }
}

export async function obtenerOrden(
  ordenId: number,
): Promise<OrdenEditable> {
  const { data, error } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      mecanico_id,
      observaciones,
      total,
      pago_mecanico,
      porcentaje_mecanico,

      moto:motos!ordenes_moto_id_fkey (
        id,
        placa,
        modelo,

        marca:marcas_moto!motos_marca_id_fkey (
          nombre
        ),

        cliente:clientes!motos_cliente_id_fkey (
          nombre,
          telefono
        )
      ),

      trabajos:trabajos_orden (
        id,
        tipo_trabajo_id,
        nombre_trabajo,
        precio_base,
        precio_final
      )
    `)
    .eq('id', ordenId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const orden =
    data as unknown as OrdenEditable

  orden.total =
    Number(orden.total)

  orden.pago_mecanico =
    Number(orden.pago_mecanico)

  orden.porcentaje_mecanico =
    Number(orden.porcentaje_mecanico)

  orden.trabajos =
    orden.trabajos
      .map((trabajo) => ({
        ...trabajo,

        precio_base:
          Number(trabajo.precio_base),

        precio_final:
          Number(trabajo.precio_final),
      }))
      .sort(
        (a, b) =>
          a.id - b.id,
      )

  return orden
}

export async function actualizarOrden(params: {
  ordenId: number
  mecanicoId: string
  observaciones: string

  trabajos: {
    id?: number
    tipo_trabajo_id: number
    precio_final: number
  }[]
}) {
  const { data, error } = await supabase.rpc(
    'actualizar_orden',
    {
      p_orden_id:
        params.ordenId,

      p_mecanico_id:
        params.mecanicoId,

      p_observaciones:
        params.observaciones.trim() || null,

      p_trabajos:
        params.trabajos.map(
          (trabajo) => ({
            ...(trabajo.id
              ? { id: trabajo.id }
              : {}),

            tipo_trabajo_id:
              trabajo.tipo_trabajo_id,

            precio_final:
              Math.round(
                trabajo.precio_final,
              ),
          }),
        ),
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  const orden = data?.[0]

  if (!orden) {
    throw new Error(
      'No fue posible recuperar la orden actualizada',
    )
  }

  return {
    id: Number(orden.id),
    estado: orden.estado,

    total:
      Number(orden.total),

    pago_mecanico:
      Number(orden.pago_mecanico),

    porcentaje_mecanico:
      Number(
        orden.porcentaje_mecanico,
      ),
  }
}
export interface OrdenActivaResumen {
  id: number

  estado:
  | 'RECIBIDA'
  | 'EN_PROCESO'

  total: number
  created_at: string
  observaciones: string | null

  moto: {
    placa: string
    modelo: string | null

    marca: {
      nombre: string
    }

    cliente: {
      nombre: string
      telefono: string
    }
  }

  mecanico: {
    nombre: string
  }

  vendedor: {
    nombre: string
  }

  trabajos: {
    id: number
    nombre_trabajo: string
    precio_final: number
  }[]
}

export async function listarOrdenesActivas():
  Promise<OrdenActivaResumen[]> {
  const { data, error } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      total,
      created_at,
      observaciones,

      moto:motos!ordenes_moto_id_fkey (
      placa,
      modelo,

      marca:marcas_moto!motos_marca_id_fkey (
        nombre
      ),

  cliente:clientes!motos_cliente_id_fkey (
    nombre,
    telefono
  )
),

      mecanico:perfiles!ordenes_mecanico_id_fkey (
        nombre
      ),

      vendedor:perfiles!ordenes_vendedor_id_fkey (
        nombre
      ),

      trabajos:trabajos_orden (
        id,
        nombre_trabajo,
        precio_final
      )
    `)
    .in(
      'estado',
      ['RECIBIDA', 'EN_PROCESO'],
    )
    .order(
      'created_at',
      { ascending: true },
    )

  if (error) {
    throw new Error(error.message)
  }

  return (
    data as unknown as OrdenActivaResumen[]
  ).map((orden) => ({
    ...orden,

    total:
      Number(orden.total),

    trabajos:
      orden.trabajos.map(
        (trabajo) => ({
          ...trabajo,

          precio_final:
            Number(
              trabajo.precio_final,
            ),
        }),
      ),
  }))
}
export async function cambiarEstadoOrden(
  ordenId: number,
  nuevoEstado:
    | 'EN_PROCESO'
    | 'TERMINADA',
) {
  const { data, error } = await supabase
    .from('ordenes')
    .update({
      estado: nuevoEstado,
    })
    .eq('id', ordenId)
    .select(`
      id,
      estado
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}