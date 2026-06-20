export type Priority = 'high' | 'medium' | 'low'
export type Category = 'gym' | 'study' | 'work' | 'personal'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: Priority
  category: Category
  completed: boolean
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  icon: string
  frequency: string
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_date: string
  created_at: string
}

export interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[]
  streak?: number
  completedToday?: boolean
}

export interface Event {
  id: string
  user_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  color: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string | null
  content: string | null
  created_at: string
  updated_at: string
}
