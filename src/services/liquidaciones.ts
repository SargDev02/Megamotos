import { supabase } from '../lib/supabase'

export interface TrabajoPago {
  id: number
  nombre_trabajo: string
}

export interface PagoPendiente {
  orden_id: number

  mecanico_id: string
  mecanico_nombre: string

  moto_placa: string
  moto_marca: string
  moto_modelo: string | null

  total_cobrado: number
  pago_mecanico: number

  completed_at: string | null

  trabajos: TrabajoPago[]
}

export interface PagoHistorial {
  liquidacion_id: number

  fecha_pago: string
  created_at: string

  mecanico_id: string
  mecanico_nombre: string

  total_pagado: number
  total_cobrado: number

  moto_placa: string
  moto_marca: string
  moto_modelo: string | null

  monto_pagado: number

  trabajos: TrabajoPago[]
}

export interface ResultadoLiquidacion {
  liquidacion_id: number
  total_pagado: number
  cantidad_ordenes: number
  fecha_pago: string
}

export async function listarPagosPendientes():
Promise<PagoPendiente[]> {
  const { data, error } =
    await supabase.rpc(
      'listar_pagos_pendientes',
    )

  if (error) {
    throw new Error(error.message)
  }

  return (
    (data ?? []) as unknown as PagoPendiente[]
  ).map((item) => ({
    ...item,

    total_cobrado:
      Number(item.total_cobrado),

    pago_mecanico:
      Number(item.pago_mecanico),

    trabajos:
      item.trabajos ?? [],
  }))
}

export async function listarHistorialPagos():
Promise<PagoHistorial[]> {
  const { data, error } =
    await supabase.rpc(
      'listar_historial_pagos',
    )

  if (error) {
    throw new Error(error.message)
  }

  return (
    (data ?? []) as unknown as PagoHistorial[]
  ).map((item) => ({
    ...item,

    total_pagado:
      Number(item.total_pagado),

    total_cobrado:
      Number(item.total_cobrado),

    monto_pagado:
      Number(item.monto_pagado),

    trabajos:
      item.trabajos ?? [],
  }))
}

export async function registrarPagoMecanico(
  mecanicoId: string,
): Promise<ResultadoLiquidacion> {
  const { data, error } =
    await supabase.rpc(
      'liquidar_mecanico',
      {
        p_mecanico_id:
          mecanicoId,
      },
    )

  if (error) {
    throw new Error(error.message)
  }

  const resultado = data?.[0]

  if (!resultado) {
    throw new Error(
      'No fue posible registrar el pago',
    )
  }

  return {
    liquidacion_id:
      Number(
        resultado.liquidacion_id,
      ),

    total_pagado:
      Number(
        resultado.total_pagado,
      ),

    cantidad_ordenes:
      Number(
        resultado.cantidad_ordenes,
      ),

    fecha_pago:
      resultado.fecha_pago,
  }
}