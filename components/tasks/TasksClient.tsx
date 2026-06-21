'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, Priority, Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'

interface TasksClientProps {
  initialTasks: Task[]
  userId: string
}

const priorityColors: Record<Priority, string> = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
}

const categoryEmojis: Record<Category, string> = {
  gym: '🏋️',
  study: '📚',
  work: '💼',
  personal: '👤',
}

const categoryLabels: Record<Category, string> = {
  gym: 'Gimnasio',
  study: 'Estudio',
  work: 'Trabajo',
  personal: 'Personal',
}

const priorityLabels: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium' as Priority,
  category: 'personal' as Category,
  due_date: '',
}

export function TasksClient({ initialTasks, userId }: TasksClientProps) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')

  const openCreate = () => {
    setEditingTask(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      category: task.category,
      due_date: task.due_date ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)

    if (editingTask) {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: form.title,
          description: form.description || null,
          priority: form.priority,
          category: form.category,
          due_date: form.due_date || null,
        })
        .eq('id', editingTask.id)
        .select()
        .single()

      if (error) {
        toast.error('Error al actualizar la tarea')
      } else {
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? data : t)))
        toast.success('Tarea actualizada')
        setDialogOpen(false)
      }
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: form.title,
          description: form.description || null,
          priority: form.priority,
          category: form.category,
          due_date: form.due_date || null,
        })
        .select()
        .single()

      if (error) {
        toast.error('Error al crear la tarea')
      } else {
        setTasks((prev) => [data, ...prev])
        toast.success('Tarea creada')
        setDialogOpen(false)
      }
    }

    setLoading(false)
  }

  const toggleComplete = async (task: Task) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .select()
      .single()

    if (!error && data) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)))
      toast.success(data.completed ? '¡Tarea completada!' : 'Tarea reabierta')
    }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tarea eliminada')
    } else {
      toast.error('Error al eliminar la tarea')
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending' && task.completed) return false
    if (filter === 'completed' && !task.completed) return false
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false
    return true
  })

  const pendingCount = tasks.filter((t) => !t.completed).length
  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tareas</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {pendingCount} pendientes · {completedCount} completadas
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva tarea
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="gym">🏋️ Gimnasio</SelectItem>
            <SelectItem value="study">📚 Estudio</SelectItem>
            <SelectItem value="work">💼 Trabajo</SelectItem>
            <SelectItem value="personal">👤 Personal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Sin tareas encontradas.</p>
            <Button onClick={openCreate} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crea tu primera tarea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={task.completed ? 'opacity-60' : ''}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(task)}
                    className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <Badge variant={priorityColors[task.priority] as 'destructive' | 'default' | 'secondary'} className="text-[10px] h-4">
                        {priorityLabels[task.priority]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {categoryEmojis[task.category]} {categoryLabels[task.category]}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Vence {format(new Date(task.due_date + 'T00:00:00'), 'd MMM')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(task)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteTask(task.id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Título de la tarea..."
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Agregar detalles..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                    <SelectItem value="medium">🟡 Media</SelectItem>
                    <SelectItem value="low">🟢 Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gym">🏋️ Gimnasio</SelectItem>
                    <SelectItem value="study">📚 Estudio</SelectItem>
                    <SelectItem value="work">💼 Trabajo</SelectItem>
                    <SelectItem value="personal">👤 Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de vencimiento (opcional)</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : editingTask ? 'Guardar cambios' : 'Crear tarea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
