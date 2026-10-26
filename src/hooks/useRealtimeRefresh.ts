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
}

export function useRealtimeRefresh({
  channelName,
  tables,
  onChange,
  debounceMs = 300,
}: UseRealtimeRefreshOptions) {
  const onChangeRef =
    useRef(onChange)

  const tablesKey =
    tables.join(',')

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
    let errorNotificado = false

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

    channel.subscribe(
      (status) => {
        if (
          status === 'SUBSCRIBED'
        ) {
          errorNotificado = false
          return
        }

        if (
          !errorNotificado &&
          (status ===
            'CHANNEL_ERROR' ||
            status === 'TIMED_OUT')
        ) {
          errorNotificado = true

          console.warn(
            `Realtime no disponible para ${channelName}. La actualización manual continúa activa.`,
          )
        }
      },
    )

    return () => {
      activo = false

      if (temporizador) {
        clearTimeout(temporizador)
      }

      void supabase.removeChannel(
        channel,
      )
    }
  }, [
    channelName,
    debounceMs,
    tablesKey,
  ])
}
