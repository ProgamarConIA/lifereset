'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  CalendarDays,
  FileText,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/habits', label: 'Habits', icon: Target },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/95 backdrop-blur-sm h-16 px-2 safe-area-pb">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
