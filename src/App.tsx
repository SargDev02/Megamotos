import {
  lazy,
  Suspense,
} from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'

import { ProtectedRoute } from './components/ProtectedRoute'

const AppLayout = lazy(() =>
  import('./components/layout/AppLayout').then((module) => ({
    default: module.AppLayout,
  })),
)

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({
    default: module.AdminPage,
  })),
)

const EditarDatosMotoPage = lazy(() =>
  import('./pages/EditarDatosMotoPage').then((module) => ({
    default: module.EditarDatosMotoPage,
  })),
)

const EditarOrdenPage = lazy(() =>
  import('./pages/EditarOrdenPage').then((module) => ({
    default: module.EditarOrdenPage,
  })),
)

const LiquidacionesPage = lazy(() =>
  import('./pages/LiquidacionesPage').then((module) => ({
    default: module.LiquidacionesPage,
  })),
)

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)

const MecanicoPage = lazy(() =>
  import('./pages/MecanicoPage').then((module) => ({
    default: module.MecanicoPage,
  })),
)

const NuevaOrdenPage = lazy(() =>
  import('./pages/NuevaOrdenPage').then((module) => ({
    default: module.NuevaOrdenPage,
  })),
)

const OrdenesActivasPage = lazy(() =>
  import('./pages/OrdenesActivasPage').then((module) => ({
    default: module.OrdenesActivasPage,
  })),
)

const RecepcionPage = lazy(() =>
  import('./pages/RecepcionPage').then((module) => ({
    default: module.RecepcionPage,
  })),
)

const TrabajosPage = lazy(() =>
  import('./pages/TrabajosPage').then((module) => ({
    default: module.TrabajosPage,
  })),
)

const UsuariosPage = lazy(() =>
  import('./pages/UsuariosPage').then((module) => ({
    default: module.UsuariosPage,
  })),
)

const VendedorPage = lazy(() =>
  import('./pages/VendedorPage').then((module) => ({
    default: module.VendedorPage,
  })),
)

function CargandoRuta() {
  return (
    <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
      Cargando...
    </div>
  )
}

function Inicio() {
  const { perfil } = useAuth()

  if (!perfil) {
    return null
  }

  switch (perfil.rol) {
    case 'ADMIN':
      return (
        <Navigate
          to="/admin"
          replace
        />
      )

    case 'VENDEDOR':
      return (
        <Navigate
          to="/vendedor"
          replace
        />
      )

    case 'MECANICO':
      return (
        <Navigate
          to="/mecanico"
          replace
        />
      )

    default:
      return (
        <Navigate
          to="/login"
          replace
        />
      )
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<CargandoRuta />}>
          <Routes>
          <Route
            path="/login"
            element={
              <LoginPage />
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Inicio />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                roles={['ADMIN']}
              >
                <AppLayout>
                  <AdminPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendedor"
            element={
              <ProtectedRoute
                roles={[
                  'ADMIN',
                  'VENDEDOR',
                ]}
              >
                <AppLayout>
                  <VendedorPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/mecanico"
            element={
              <ProtectedRoute
                roles={['MECANICO']}
              >
                <AppLayout>
                  <MecanicoPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute
                roles={['ADMIN']}
              >
                <AppLayout>
                  <UsuariosPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/trabajos"
            element={
              <ProtectedRoute
                roles={['ADMIN']}
              >
                <AppLayout>
                  <TrabajosPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/recepcion"
            element={
              <ProtectedRoute
                roles={[
                  'ADMIN',
                  'VENDEDOR',
                ]}
              >
                <AppLayout>
                  <RecepcionPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orden/nueva/:placa"
            element={
              <ProtectedRoute
                roles={[
                  'ADMIN',
                  'VENDEDOR',
                ]}
              >
                <AppLayout>
                  <NuevaOrdenPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orden/:id/editar"
            element={
              <ProtectedRoute
                roles={[
                  'ADMIN',
                  'VENDEDOR',
                ]}
              >
                <AppLayout>
                  <EditarOrdenPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ordenes"
            element={
              <ProtectedRoute
                roles={[
                  'ADMIN',
                  'VENDEDOR',
                ]}
              >
                <AppLayout>
                  <OrdenesActivasPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/liquidaciones"
            element={
              <ProtectedRoute
                roles={['ADMIN']}
              >
                <AppLayout>
                  <LiquidacionesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/moto/:placa/editar"
            element={
              <ProtectedRoute
                roles={[
                  'ADMIN',
                  'VENDEDOR',
                ]}
              >
                <AppLayout>
                  <EditarDatosMotoPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
