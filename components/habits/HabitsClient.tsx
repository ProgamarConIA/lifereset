'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Habit, HabitLog } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Flame, CheckCircle2, Circle } from 'lucide-react'
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns'

interface HabitsClientProps {
  initialHabits: Habit[]
  initialLogs: HabitLog[]
  userId: string
}

const emptyForm = {
  name: '',
  description: '',
  color: '#6366f1',
  icon: '⭐',
}

function calculateStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs
    .filter((l) => l.habit_id === habitId)
    .map((l) => l.completed_date)
    .sort()
    .reverse()

  let streak = 0
  let currentDate = new Date()

  for (const log of habitLogs) {
    const logDate = format(parseISO(log), 'yyyy-MM-dd')
    const checkDate = format(currentDate, 'yyyy-MM-dd')

    if (logDate === checkDate) {
      streak++
      currentDate = subDays(currentDate, 1)
    } else {
      break
    }
  }

  return streak
}

export function HabitsClient({ initialHabits, initialLogs, userId }: HabitsClientProps) {
  const supabase = createClient()
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [logs, setLogs] = useState<HabitLog[]>(initialLogs)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  const isCompletedToday = (habitId: string) =>
    logs.some((l) => l.habit_id === habitId && l.completed_date === today)

  const toggleHabit = async (habit: Habit) => {
    if (isCompletedToday(habit.id)) {
      // Remove log
      const log = logs.find((l) => l.habit_id === habit.id && l.completed_date === today)
      if (!log) return

      const { error } = await supabase.from('habit_logs').delete().eq('id', log.id)
      if (!error) {
        setLogs((prev) => prev.filter((l) => l.id !== log.id))
        toast.success('Habit unchecked')
      }
    } else {
      // Add log
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habit.id, user_id: userId, completed_date: today })
        .select()
        .single()

      if (!error && data) {
        setLogs((prev) => [...prev, data])
        toast.success(`${habit.icon} ${habit.name} done! Keep it up!`)
      }
    }
  }

  const openCreate = () => {
    setEditingHabit(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setForm({
      name: habit.name,
      description: habit.description ?? '',
      color: habit.color,
      icon: habit.icon,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)

    if (editingHabit) {
      const { data, error } = await supabase
        .from('habits')
        .update({ name: form.name, description: form.description || null, color: form.color, icon: form.icon })
        .eq('id', editingHabit.id)
        .select()
        .single()

      if (error) {
        toast.error('Failed to update habit')
      } else {
        setHabits((prev) => prev.map((h) => (h.id === editingHabit.id ? data : h)))
        toast.success('Habit updated')
        setDialogOpen(false)
      }
    } else {
      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: userId, name: form.name, description: form.description || null, color: form.color, icon: form.icon })
        .select()
        .single()

      if (error) {
        toast.error('Failed to create habit')
      } else {
        setHabits((prev) => [data, ...prev])
        toast.success('Habit created!')
        setDialogOpen(false)
      }
    }

    setLoading(false)
  }

  const deleteHabit = async (id: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (!error) {
      setHabits((prev) => prev.filter((h) => h.id !== id))
      setLogs((prev) => prev.filter((l) => l.habit_id !== id))
      toast.success('Habit deleted')
    } else {
      toast.error('Failed to delete habit')
    }
  }

  const completedToday = habits.filter((h) => isCompletedToday(h.id)).length
  const percentage = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0

  // Last 7 days for mini calendar
  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })

  const icons = ['⭐', '🏋️', '📚', '💧', '🧘', '🏃', '😴', '🥗', '💊', '📝', '🎯', '💪']

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Habits</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {completedToday} of {habits.length} completed today
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Habit
        </Button>
      </div>

      {habits.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Today&apos;s Progress</span>
              <span className="text-sm font-bold text-primary">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {habits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No habits yet.</p>
            <Button onClick={openCreate} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create your first habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const done = isCompletedToday(habit.id)
            const streak = calculateStreak(habit.id, logs)

            return (
              <Card key={habit.id} className={done ? 'border-primary/30' : ''}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleHabit(habit)}
                      className="shrink-0 transition-transform active:scale-95"
                    >
                      {done ? (
                        <CheckCircle2 className="h-7 w-7 text-primary" />
                      ) : (
                        <Circle className="h-7 w-7 text-muted-foreground" />
                      )}
                    </button>

                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-xl text-xl shrink-0"
                      style={{ backgroundColor: habit.color + '20' }}
                    >
                      {habit.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                        {habit.name}
                      </p>
                      {habit.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{habit.description}</p>
                      )}

                      {/* Mini streak calendar */}
                      <div className="flex gap-1 mt-2">
                        {last7Days.map((day) => {
                          const dayStr = format(day, 'yyyy-MM-dd')
                          const completed = logs.some((l) => l.habit_id === habit.id && l.completed_date === dayStr)
                          return (
                            <div
                              key={dayStr}
                              className={`w-5 h-5 rounded-sm text-[9px] flex items-center justify-center font-medium ${
                                completed
                                  ? 'text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                              style={completed ? { backgroundColor: habit.color } : {}}
                              title={format(day, 'MMM d')}
                            >
                              {format(day, 'd')}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-4 w-4" />
                          <span className="text-sm font-bold">{streak}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(habit)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteHabit(habit.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingHabit ? 'Edit Habit' : 'New Habit'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon }))}
                    className={`w-9 h-9 text-lg rounded-lg border-2 transition-colors ${
                      form.icon === icon ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Morning workout"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What does this habit involve?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{form.color}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingHabit ? 'Save changes' : 'Create habit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
