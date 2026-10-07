import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type Rol = 'ADMIN' | 'VENDEDOR' | 'MECANICO'

export interface Perfil {
  id: string
  username: string
  nombre: string
  rol: Rol
  porcentaje_mecanico: number | null
  activo: boolean
}

export interface AuthContextType {
  user: User | null
  perfil: Perfil | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)
