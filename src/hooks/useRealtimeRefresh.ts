import {
  useEffect,
  useRef,
} from 'react'

import { supabase } from '../lib/supabase'

interface UseRealtimeRefreshOptions {
  channelName: string
  tables: readonly string[]
  onChange: () => void | Promise<void>
  debounceMs?: number
  broadcast?: {
    topic: string
    event: string
  }
}

export function useRealtimeRefresh({
  channelName,
  tables,
  onChange,
  debounceMs = 300,
  broadcast,
}: UseRealtimeRefreshOptions) {
  const onChangeRef =
    useRef(onChange)

  const tablesKey =
    tables.join(',')
  const broadcastTopic = broadcast?.topic
  const broadcastEvent = broadcast?.event

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let temporizador:
      | ReturnType<
          typeof setTimeout
        >
      | undefined

    let activo = true
    const erroresNotificados = new Set<string>()

    const programarRefresco = () => {
      if (!activo) {
        return
      }

      if (temporizador) {
        clearTimeout(temporizador)
      }

      temporizador = setTimeout(
        () => {
          temporizador = undefined

          if (!activo) {
            return
          }

          void Promise.resolve(
            onChangeRef.current(),
          ).catch(() => undefined)
        },
        debounceMs,
      )
    }

    let channel =
      supabase.channel(channelName)

    for (
      const table of
        tablesKey.split(',')
    ) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        programarRefresco,
      )
    }

    const manejarEstado = (
      status: string,
      nombreCanal: string,
    ) => {
      if (status === 'SUBSCRIBED') {
        erroresNotificados.delete(nombreCanal)
        return
      }

      if (
        !erroresNotificados.has(nombreCanal) &&
        (status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT')
      ) {
        erroresNotificados.add(nombreCanal)

        console.warn(
          `Realtime no disponible para ${nombreCanal}. La actualización manual continúa activa.`,
        )
      }
    }

    channel.subscribe((status) =>
      manejarEstado(status, channelName),
    )

    const broadcastChannel =
      broadcastTopic && broadcastEvent
        ? supabase
            .channel(broadcastTopic, {
              config: { private: true },
            })
            .on(
              'broadcast',
              { event: broadcastEvent },
              programarRefresco,
            )
        : null

    broadcastChannel?.subscribe((status) =>
      manejarEstado(status, broadcastTopic ?? channelName),
    )

    return () => {
      activo = false

      if (temporizador) {
        clearTimeout(temporizador)
      }

      void supabase.removeChannel(
        channel,
      )
      if (broadcastChannel) {
        void supabase.removeChannel(
          broadcastChannel,
        )
      }
    }
  }, [
    channelName,
    debounceMs,
    tablesKey,
    broadcastTopic,
    broadcastEvent,
  ])
}
