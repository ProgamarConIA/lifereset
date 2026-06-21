'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Event } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'

interface CalendarClientProps {
  initialEvents: Event[]
  userId: string
}

const emptyForm = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  color: '#6366f1',
}

export function CalendarClient({ initialEvents, userId }: CalendarClientProps) {
  const supabase = createClient()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.start_date), day))

  const selectedDayEvents = selectedDate ? eventsForDay(selectedDate) : []

  const openCreate = (date?: Date) => {
    setEditingEvent(null)
    const dateStr = date ? format(date, "yyyy-MM-dd'T'HH:mm") : ''
    setForm({ ...emptyForm, start_date: dateStr })
    setDialogOpen(true)
  }

  const openEdit = (event: Event) => {
    setEditingEvent(event)
    setForm({
      title: event.title,
      description: event.description ?? '',
      start_date: format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm"),
      end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
      color: event.color,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.start_date) return
    setLoading(true)

    const payload = {
      title: form.title,
      description: form.description || null,
      start_date: new Date(form.start_date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      color: form.color,
    }

    if (editingEvent) {
      const { data, error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', editingEvent.id)
        .select()
        .single()

      if (error) {
        toast.error('Error al actualizar el evento')
      } else {
        setEvents((prev) => prev.map((ev) => (ev.id === editingEvent.id ? data : ev)))
        toast.success('Evento actualizado')
        setDialogOpen(false)
      }
    } else {
      const { data, error } = await supabase
        .from('events')
        .insert({ user_id: userId, ...payload })
        .select()
        .single()

      if (error) {
        toast.error('Error al crear el evento')
      } else {
        setEvents((prev) => [...prev, data])
        toast.success('Evento creado')
        setDialogOpen(false)
      }
    }

    setLoading(false)
  }

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success('Evento eliminado')
    } else {
      toast.error('Error al eliminar el evento')
    }
  }

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendario</h2>
        <Button onClick={() => openCreate()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo evento
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy', { locale: es })}</h3>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day) => {
              const dayEvents = eventsForDay(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isCurrentDay = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`relative min-h-[56px] p-1 rounded-lg text-left transition-colors ${
                    !isCurrentMonth ? 'opacity-30' : 'hover:bg-muted'
                  } ${isSelected ? 'bg-primary/10 ring-1 ring-primary' : ''}`}
                >
                  <span
                    className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isCurrentDay
                        ? 'bg-primary text-primary-foreground'
                        : isSelected
                        ? 'text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="text-[9px] leading-tight px-1 py-0.5 rounded text-white truncate"
                        style={{ backgroundColor: event.color }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      {selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}</h3>
            <Button size="sm" variant="outline" onClick={() => openCreate(selectedDate)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar evento
            </Button>
          </div>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay eventos en este día.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.start_date), 'HH:mm')}
                          {event.end_date && ` – ${format(new Date(event.end_date), 'HH:mm')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(event)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Título</Label>
              <Input
                id="event-title"
                placeholder="Título del evento..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Descripción (opcional)</Label>
              <Textarea
                id="event-description"
                placeholder="Detalles del evento..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha y hora de inicio</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha y hora de fin (opcional)</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="event-color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{form.color}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : editingEvent ? 'Guardar cambios' : 'Crear evento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
