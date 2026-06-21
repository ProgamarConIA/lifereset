'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  format,
  subDays,
  eachDayOfInterval,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Flame, CheckSquare, Target, TrendingUp } from 'lucide-react'

interface StatsClientProps {
  tasks: { completed: boolean; created_at: string; category: string; priority: string }[]
  habits: { id: string; name: string; color: string; icon: string }[]
  habitLogs: { habit_id: string; completed_date: string }[]
}

function calculateStreak(habitId: string, logs: { habit_id: string; completed_date: string }[]): number {
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

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

export function StatsClient({ tasks, habits, habitLogs }: StatsClientProps) {
  const [period, setPeriod] = useState<'7' | '14' | '30'>('7')

  const days = parseInt(period)
  const today = new Date()
  const interval = eachDayOfInterval({ start: subDays(today, days - 1), end: today })

  // Daily task completion chart
  const dailyTaskData = interval.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTasks = tasks.filter((t) => t.created_at.startsWith(dayStr))
    const completed = dayTasks.filter((t) => t.completed).length
    const total = dayTasks.length
    return {
      date: format(day, 'd MMM', { locale: es }),
      completed,
      total,
      pending: total - completed,
    }
  })

  // Daily habit completion chart
  const dailyHabitData = interval.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const completedCount = habitLogs.filter((l) => l.completed_date === dayStr).length
    const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0
    return {
      date: format(day, 'd MMM', { locale: es }),
      completed: completedCount,
      percentage,
    }
  })

  const categoryTranslations: Record<string, string> = {
    gym: 'Gimnasio',
    study: 'Estudio',
    work: 'Trabajo',
    personal: 'Personal',
  }

  // Category breakdown
  const categoryCount: Record<string, number> = {}
  tasks.forEach((t) => {
    categoryCount[t.category] = (categoryCount[t.category] ?? 0) + 1
  })
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name: categoryTranslations[name] ?? (name.charAt(0).toUpperCase() + name.slice(1)),
    value,
  }))

  // Priority breakdown
  const priorityCount: Record<string, number> = { high: 0, medium: 0, low: 0 }
  tasks.forEach((t) => {
    priorityCount[t.priority] = (priorityCount[t.priority] ?? 0) + 1
  })
  const priorityData = [
    { name: 'Alta', value: priorityCount.high, color: '#ef4444' },
    { name: 'Media', value: priorityCount.medium, color: '#f59e0b' },
    { name: 'Baja', value: priorityCount.low, color: '#22c55e' },
  ]

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalHabitCheckins = habitLogs.length
  const maxPossibleCheckins = habits.length * days
  const habitRate = maxPossibleCheckins > 0 ? Math.round((totalHabitCheckins / maxPossibleCheckins) * 100) : 0

  const bestStreak = habits.reduce((max, habit) => {
    const s = calculateStreak(habit.id, habitLogs)
    return s > max ? s : max
  }, 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Estadísticas</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="7">7 días</TabsTrigger>
            <TabsTrigger value="14">14 días</TabsTrigger>
            <TabsTrigger value="30">30 días</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Cumplimiento de tareas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{habitRate}%</p>
                <p className="text-xs text-muted-foreground">Consistencia de hábitos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bestStreak}</p>
                <p className="text-xs text-muted-foreground">Mejor racha</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks}</p>
                <p className="text-xs text-muted-foreground">Tareas completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task completion chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad de tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyTaskData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="completed" name="Completadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pendientes" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Habit completion chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasa de cumplimiento de hábitos (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyHabitData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value) => [`${value}%`, 'Cumplimiento']}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tareas por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aún no hay datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={false}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Habits streaks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rachas de hábitos</CardTitle>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aún no hay hábitos</p>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const streak = calculateStreak(habit.id, habitLogs)
                  const logsForHabit = habitLogs.filter((l) => l.habit_id === habit.id).length
                  const rate = days > 0 ? Math.round((logsForHabit / days) * 100) : 0
                  return (
                    <div key={habit.id} className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{habit.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{habit.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {streak > 0 && (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Flame className="h-2.5 w-2.5 text-orange-500" />
                                {streak}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{rate}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${rate}%`, backgroundColor: habit.color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
