import { supabase } from '../lib/supabase'

export interface Cliente {
  id: number
  nombre: string
  documento: string | null
  telefono: string
}

export interface MarcaMoto {
  id: number
  nombre: string
  activo: boolean
}

export interface MotoConCliente {
  id: number
  cliente_id: number
  marca_id: number
  placa: string
  modelo: string | null

  cliente: Cliente

  marca: {
    id: number
    nombre: string
  }
}

export type EstadoOrden =
  | 'RECIBIDA'
  | 'EN_PROCESO'
  | 'TERMINADA'

export interface HistorialOrden {
  id: number
  estado: EstadoOrden
  total: number
  observaciones: string | null
  created_at: string
  completed_at: string | null

  mecanico: {
    nombre: string
  } | null

  trabajos: {
    id: number
    nombre_trabajo: string
    precio_final: number
  }[]
}

export interface RegistrarMotoData {
  placa: string

  cliente: {
    nombre: string
    documento?: string
    telefono: string
  }

  moto: {
    marca_id: number
    modelo?: string
  }
}

export function normalizarPlaca(placa: string) {
  return placa
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
}

function textoOpcional(valor?: string) {
  const limpio = valor
    ? normalizarTexto(valor)
    : ''

  return limpio || null
}

function mensajeError(error: {
  code?: string
  message?: string
}) {
  if (error.code === '23505') {
    return 'Ya existe un registro con esos datos'
  }

  return error.message || 'Ocurrió un error'
}

export async function listarMarcas(): Promise<MarcaMoto[]> {
  const { data, error } = await supabase
    .from('marcas_moto')
    .select('id, nombre, activo')
    .eq('activo', true)
    .order('nombre')

  if (error) {
    throw new Error(mensajeError(error))
  }

  return data as MarcaMoto[]
}

export async function crearMarca(
  nombre: string,
): Promise<MarcaMoto> {
  const nombreLimpio = normalizarTexto(nombre)

  if (!nombreLimpio) {
    throw new Error('Ingresa el nombre de la marca')
  }

  const { data, error } = await supabase
    .from('marcas_moto')
    .insert({
      nombre: nombreLimpio,
      activo: true,
    })
    .select('id, nombre, activo')
    .single()

  if (!error && data) {
    return data as MarcaMoto
  }

  /*
   * Si ya existía con otra combinación de
   * mayúsculas/minúsculas, recuperamos esa marca.
   */
  if (error?.code === '23505') {
    const { data: existente, error: errorExistente } =
      await supabase
        .from('marcas_moto')
        .select('id, nombre, activo')
        .ilike('nombre', nombreLimpio)
        .maybeSingle()

    if (errorExistente || !existente) {
      throw new Error(
        'La marca ya existe pero no fue posible recuperarla',
      )
    }

    return existente as MarcaMoto
  }

  throw new Error(
    mensajeError(error ?? {}),
  )
}

export async function listarModelosPorMarca(
  marcaId: number,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('motos')
    .select('modelo')
    .eq('marca_id', marcaId)
    .not('modelo', 'is', null)
    .order('modelo')

  if (error) {
    throw new Error(mensajeError(error))
  }

  const modelos = (data ?? [])
    .map((item) => item.modelo?.trim())
    .filter(
      (modelo): modelo is string =>
        Boolean(modelo),
    )

  /*
   * Evita mostrar dos veces:
   * FZ 2.0
   * fz 2.0
   */
  return modelos.filter(
    (modelo, index, array) =>
      array.findIndex(
        (otro) =>
          otro.toLowerCase() ===
          modelo.toLowerCase(),
      ) === index,
  )
}

export async function buscarMotoPorPlaca(
  placa: string,
): Promise<MotoConCliente | null> {
  const placaNormalizada =
    normalizarPlaca(placa)

  const { data, error } = await supabase
    .from('motos')
    .select(`
      id,
      cliente_id,
      marca_id,
      placa,
      modelo,

      cliente:clientes (
        id,
        nombre,
        documento,
        telefono
      ),

      marca:marcas_moto!motos_marca_id_fkey (
        id,
        nombre
      )
    `)
    .eq('placa', placaNormalizada)
    .maybeSingle()

  if (error) {
    throw new Error(mensajeError(error))
  }

  if (!data) {
    return null
  }

  return data as unknown as MotoConCliente
}

async function obtenerOCrearCliente(
  nombre: string,
  documento: string,
  telefono: string,
): Promise<Cliente> {
  const documentoLimpio = documento.trim()
  const nombreLimpio = normalizarTexto(nombre)
  const telefonoLimpio = telefono.trim()

  function normalizarComparacion(valor: string) {
    return valor
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
  }

  if (documentoLimpio) {
    const {
      data: existente,
      error: errorBusqueda,
    } = await supabase
      .from('clientes')
      .select(`
        id,
        nombre,
        documento,
        telefono
      `)
      .ilike(
        'documento',
        documentoLimpio,
      )
      .maybeSingle()

    if (errorBusqueda) {
      throw new Error(
        mensajeError(errorBusqueda),
      )
    }

    if (existente) {
      const nombreExistente =
        normalizarComparacion(
          existente.nombre,
        )

      const nombreIngresado =
        normalizarComparacion(
          nombreLimpio,
        )

      if (
        nombreExistente !==
        nombreIngresado
      ) {
        throw new Error(
          `La cédula ${documentoLimpio} ya está registrada a nombre de ${existente.nombre}. No se modificó ningún dato.`,
        )
      }

      /*
       * La cédula ya pertenece a este cliente.
       * Reutilizamos el registro existente SIN
       * modificar nombre ni teléfono.
       */
      return existente as Cliente
    }
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: nombreLimpio,
      documento:
        documentoLimpio || null,
      telefono: telefonoLimpio,
    })
    .select(`
      id,
      nombre,
      documento,
      telefono
    `)
    .single()

  if (error) {
    throw new Error(
      mensajeError(error),
    )
  }

  return data as Cliente
}

export async function registrarClienteYMoto(
  datos: RegistrarMotoData,
): Promise<MotoConCliente> {
  const placa =
    normalizarPlaca(datos.placa)

  const existente =
    await buscarMotoPorPlaca(placa)

  if (existente) {
    throw new Error(
      `La placa ${placa} ya se encuentra registrada`,
    )
  }

  const cliente =
    await obtenerOCrearCliente(
      datos.cliente.nombre,
      datos.cliente.documento ?? '',
      datos.cliente.telefono,
    )

  const { error } = await supabase
    .from('motos')
    .insert({
      cliente_id: cliente.id,
      placa,
      marca_id: datos.moto.marca_id,
      modelo: textoOpcional(
        datos.moto.modelo,
      ),
    })

  if (error) {
    throw new Error(mensajeError(error))
  }

  const motoCreada =
    await buscarMotoPorPlaca(placa)

  if (!motoCreada) {
    throw new Error(
      'La moto fue registrada pero no fue posible recuperarla',
    )
  }

  return motoCreada
}

export async function listarHistorialMoto(
  motoId: number,
): Promise<HistorialOrden[]> {
  const { data, error } = await supabase
    .from('ordenes')
    .select(`
      id,
      estado,
      total,
      observaciones,
      created_at,
      completed_at,

      mecanico:perfiles!ordenes_mecanico_id_fkey (
        nombre
      ),

      trabajos:trabajos_orden (
        id,
        nombre_trabajo,
        precio_final
      )
    `)
    .eq('moto_id', motoId)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(mensajeError(error))
  }

  return (
    data as unknown as HistorialOrden[]
  ).map((orden) => ({
    ...orden,

    trabajos: [...orden.trabajos].sort(
      (a, b) => a.id - b.id,
    ),
  }))
}
export interface ActualizarDatosRecepcionParams {
  motoId: number

  cliente: {
    nombre: string
    documento: string
    telefono: string
  }

  moto: {
    placa: string
    marca_id: number
    modelo: string
  }
}

export async function actualizarDatosRecepcion(
  params: ActualizarDatosRecepcionParams,
) {
  const { data, error } = await supabase.rpc(
    'actualizar_datos_recepcion',
    {
      p_moto_id: params.motoId,

      p_nombre_cliente:
        params.cliente.nombre.trim(),

      p_documento_cliente:
        params.cliente.documento.trim() || null,

      p_telefono_cliente:
        params.cliente.telefono.trim(),

      p_placa:
        normalizarPlaca(
          params.moto.placa,
        ),

      p_marca_id:
        params.moto.marca_id,

      p_modelo:
        params.moto.modelo.trim() || null,
    },
  )

  if (error) {
    if (
      error.message.includes(
        'clientes_documento_uq',
      )
    ) {
      throw new Error(
        'Esa cédula ya está registrada a otro cliente',
      )
    }

    if (
      error.message.includes(
        'motos_placa_key',
      )
    ) {
      throw new Error(
        'Esa placa ya está registrada en otra motocicleta',
      )
    }

    throw new Error(error.message)
  }

  const resultado = data?.[0]

  if (!resultado) {
    throw new Error(
      'No fue posible actualizar los datos',
    )
  }

  return {
    moto_id:
      Number(resultado.moto_id),

    cliente_id:
      Number(resultado.cliente_id),

    placa:
      resultado.placa as string,
  }
}