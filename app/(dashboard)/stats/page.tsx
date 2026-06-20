import { createClient } from '@/lib/supabase/server'
import { StatsClient } from '@/components/stats/StatsClient'
import { format, subDays, startOfMonth } from 'date-fns'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const today = new Date()
  const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')

  const [tasksRes, habitsRes, logsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('completed, created_at, updated_at, category, priority')
      .eq('user_id', user.id)
      .gte('created_at', `${thirtyDaysAgo}T00:00:00`),
    supabase
      .from('habits')
      .select('id, name, color, icon')
      .eq('user_id', user.id),
    supabase
      .from('habit_logs')
      .select('habit_id, completed_date')
      .eq('user_id', user.id)
      .gte('completed_date', thirtyDaysAgo),
  ])

  return (
    <StatsClient
      tasks={tasksRes.data ?? []}
      habits={habitsRes.data ?? []}
      habitLogs={logsRes.data ?? []}
    />
  )
}
