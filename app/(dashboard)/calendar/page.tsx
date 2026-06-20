import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from '@/components/calendar/CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: true })

  return <CalendarClient initialEvents={events ?? []} userId={user.id} />
}
