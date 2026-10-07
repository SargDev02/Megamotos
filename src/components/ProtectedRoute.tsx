import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Rol } from '../auth/auth-context'
import { useAuth } from '../auth/useAuth'

interface Props {
  children: ReactNode
  roles?: Rol[]
}

export function ProtectedRoute({ children, roles }: Props) {
  const { user, perfil, loading } = useAuth()

  if (loading) {
    return <p>Cargando...</p>
  }

  if (!user || !perfil) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(perfil.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}
