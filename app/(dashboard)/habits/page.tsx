import { createClient } from '@/lib/supabase/server'
import { HabitsClient } from '@/components/habits/HabitsClient'
import { format } from 'date-fns'

export default async function HabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const today = format(new Date(), 'yyyy-MM-dd')

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
      .lte('completed_date', today),
  ])

  return (
    <HabitsClient
      initialHabits={habitsRes.data ?? []}
      initialLogs={logsRes.data ?? []}
      userId={user.id}
    />
  )
}
