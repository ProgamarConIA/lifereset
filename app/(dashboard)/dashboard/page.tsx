import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfWeek, endOfWeek, isToday } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckSquare, Target, CalendarDays, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [tasksRes, habitsRes, habitLogsRes, eventsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed_date', todayStr),
    supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_date', today.toISOString())
      .order('start_date', { ascending: true })
      .limit(3),
  ])

  const pendingTasks = tasksRes.data ?? []
  const habits = habitsRes.data ?? []
  const todayLogs = habitLogsRes.data ?? []
  const upcomingEvents = eventsRes.data ?? []

  const habitsCompletedToday = todayLogs.length
  const habitsTotal = habits.length
  const habitPercentage = habitsTotal > 0 ? Math.round((habitsCompletedToday / habitsTotal) * 100) : 0

  const { data: weeklyTasks } = await supabase
    .from('tasks')
    .select('completed, created_at')
    .eq('user_id', user.id)
    .gte('created_at', `${weekStart}T00:00:00`)
    .lte('created_at', `${weekEnd}T23:59:59`)

  const weeklyCompleted = weeklyTasks?.filter((t) => t.completed).length ?? 0
  const weeklyTotal = weeklyTasks?.length ?? 0

  const priorityColors: Record<string, string> = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  }

  const categoryEmojis: Record<string, string> = {
    gym: '🏋️',
    study: '📚',
    work: '💼',
    personal: '👤',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">
          Good {today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening'}! 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-xs text-muted-foreground">Pending tasks</p>
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
                <p className="text-2xl font-bold">{habitsCompletedToday}/{habitsTotal}</p>
                <p className="text-xs text-muted-foreground">Habits today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
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
                <p className="text-2xl font-bold">{weeklyCompleted}/{weeklyTotal}</p>
                <p className="text-xs text-muted-foreground">Week tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {habits.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Today&apos;s Habits</CardTitle>
            <Link href="/habits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{habitsCompletedToday} of {habitsTotal} completed</span>
              <span className="font-medium">{habitPercentage}%</span>
            </div>
            <Progress value={habitPercentage} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {habits.slice(0, 6).map((habit) => {
                const done = todayLogs.some((l) => l.habit_id === habit.id)
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm border transition-colors ${
                      done ? 'bg-primary/10 border-primary/20 text-primary' : 'border-border'
                    }`}
                  >
                    <span>{habit.icon}</span>
                    <span className="truncate font-medium">{habit.name}</span>
                    {done && <span className="ml-auto text-primary">✓</span>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Pending Tasks</CardTitle>
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending tasks. Great job! 🎉
              </p>
            ) : (
              <ul className="space-y-2">
                {pendingTasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={priorityColors[task.priority] as 'destructive' | 'default' | 'secondary'} className="text-[10px] h-4">
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {categoryEmojis[task.category]} {task.category}
                        </span>
                      </div>
                    </div>
                    {task.due_date && (
                      <span className={`text-xs shrink-0 ${
                        isToday(new Date(task.due_date)) ? 'text-destructive font-medium' : 'text-muted-foreground'
                      }`}>
                        {format(new Date(task.due_date + 'T00:00:00'), 'MMM d')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming events scheduled.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div
                      className="w-1 self-stretch rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(event.start_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
