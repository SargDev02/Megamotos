import {
  useState,
  type ReactNode,
} from 'react'

import {
  Bike,
  ClipboardList,
  DollarSign,
  House,
  LogOut,
  Menu,
  Search,
  UserCog,
  Wrench,
} from 'lucide-react'

import {
  Link,
  NavLink,
} from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'

import { Button } from '@/components/ui/button'

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

import { Separator } from '@/components/ui/separator'

interface AppLayoutProps {
  children: ReactNode
}

interface MenuItem {
  texto: string
  ruta: string
  icono: typeof House
}

function obtenerMenu(
  rol:
    | 'ADMIN'
    | 'VENDEDOR'
    | 'MECANICO'
    | undefined,
): MenuItem[] {
  if (rol === 'ADMIN') {
    return [
      {
        texto: 'Inicio',
        ruta: '/admin',
        icono: House,
      },
      {
        texto: 'Recepción',
        ruta: '/recepcion',
        icono: Search,
      },
      {
        texto: 'Órdenes activas',
        ruta: '/ordenes',
        icono: ClipboardList,
      },
      {
        texto: 'Trabajos',
        ruta: '/admin/trabajos',
        icono: Wrench,
      },
      {
        texto: 'Usuarios',
        ruta: '/admin/usuarios',
        icono: UserCog,
      },
      {
        texto: 'Liquidaciones',
        ruta: '/admin/liquidaciones',
        icono: DollarSign,
      },
    ]
  }

  if (rol === 'VENDEDOR') {
    return [
      {
        texto: 'Inicio',
        ruta: '/vendedor',
        icono: House,
      },
      {
        texto: 'Recepción',
        ruta: '/recepcion',
        icono: Search,
      },
      {
        texto: 'Órdenes activas',
        ruta: '/ordenes',
        icono: ClipboardList,
      },
    ]
  }

  if (rol === 'MECANICO') {
    return [
      {
        texto: 'Mis motos',
        ruta: '/mecanico',
        icono: Bike,
      },
    ]
  }

  return []
}

function SidebarContent({
  cerrarMenu,
}: {
  cerrarMenu?: () => void
}) {
  const {
    perfil,
    logout,
  } = useAuth()

  const menu =
    obtenerMenu(
      perfil?.rol,
    )

  async function cerrarSesion() {
    cerrarMenu?.()

    await logout()
  }

  return (
    <div className="flex h-full flex-col">
      {/* LOGO */}
      <div className="flex min-h-24 items-center gap-3 px-5 py-4">
        <img
          src="/logo-megamotos.jpg"
          alt="Megamotos"
          className="h-16 w-20 rounded-md bg-white object-contain"
        />

        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight">
            Megamotos
          </p>

          <p className="text-xs text-muted-foreground">
            Almacén y taller
          </p>
        </div>
      </div>

      <Separator />

      {/* NAVEGACIÓN */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {menu.map(
          (item) => {
            const Icon =
              item.icono

            return (
              <NavLink
                key={
                  item.ruta
                }
                to={
                  item.ruta
                }
                end={
                  item.ruta ===
                    '/admin' ||
                  item.ruta ===
                    '/vendedor' ||
                  item.ruta ===
                    '/mecanico'
                }
                onClick={
                  cerrarMenu
                }
                className={({
                  isActive,
                }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(
                    ' ',
                  )
                }
              >
                <Icon className="size-4 shrink-0" />

                <span>
                  {item.texto}
                </span>
              </NavLink>
            )
          },
        )}
      </nav>

      {/* USUARIO */}
      <div className="p-3">
        <Separator className="mb-3" />

        <div className="mb-3 px-3">
          <p className="truncate text-sm font-medium">
            {perfil?.nombre}
          </p>

          <p className="text-xs text-muted-foreground">
            {perfil?.rol}
          </p>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() =>
            void cerrarSesion()
          }
        >
          <LogOut className="size-4" />

          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

export function AppLayout({
  children,
}: AppLayoutProps) {
  const {
    perfil,
  } = useAuth()

  const [
    menuAbierto,
    setMenuAbierto,
  ] =
    useState(false)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* SIDEBAR DE ESCRITORIO */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>

      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur lg:ml-64 lg:px-8">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            {/* MENÚ MÓVIL */}
            <Sheet
              open={
                menuAbierto
              }
              onOpenChange={
                setMenuAbierto
              }
            >
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Abrir menú"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-72 p-0"
              >
                <SidebarContent
                  cerrarMenu={() =>
                    setMenuAbierto(
                      false,
                    )
                  }
                />
              </SheetContent>
            </Sheet>

            <Link
              to="/"
              className="font-semibold lg:hidden"
              onClick={() =>
                setMenuAbierto(
                  false,
                )
              }
            >
              Megamotos
            </Link>
          </div>

          {/* USUARIO HEADER */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {perfil?.nombre}
              </p>

              <p className="text-xs text-muted-foreground">
                {perfil?.rol}
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {perfil?.nombre
                ?.trim()
                .charAt(0)
                .toUpperCase() ??
                'M'}
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="lg:ml-64">
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
