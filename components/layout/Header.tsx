'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Settings, LogOut, Zap } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/tasks': 'Tareas',
  '/habits': 'Hábitos',
  '/calendar': 'Calendario',
  '/notes': 'Notas',
  '/stats': 'Estadísticas',
  '/settings': 'Configuración',
}

interface HeaderProps {
  userName?: string | null
  userEmail?: string | null
}

export function Header({ userName, userEmail }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] ?? 'Life Reset'

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? 'U'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada correctamente')
    router.push('/login')
    router.refresh()
  }

  const handleSettings = () => {
    router.push('/settings')
  }

  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
          <Zap className="h-3.5 w-3.5" />
        </div>
        <h1 className="font-semibold text-base">{title}</h1>
      </div>
      <h1 className="hidden md:block font-semibold text-lg">{title}</h1>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative h-8 w-8 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Menú de usuario"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName ?? 'Usuario'}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
