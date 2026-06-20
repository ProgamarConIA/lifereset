import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SettingsClient
      userId={user.id}
      initialFullName={profile?.full_name ?? user.user_metadata?.full_name ?? ''}
      initialEmail={profile?.email ?? user.email ?? ''}
    />
  )
}
