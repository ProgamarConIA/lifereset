'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Note } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Trash2, Search, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface NotesClientProps {
  initialNotes: Note[]
  userId: string
}

export function NotesClient({ initialNotes, userId }: NotesClientProps) {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [selectedNote, setSelectedNote] = useState<Note | null>(initialNotes[0] ?? null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredNotes = notes.filter(
    (n) =>
      (n.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (n.content ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const createNote = async () => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: userId, title: 'Untitled note', content: '' })
      .select()
      .single()

    if (!error && data) {
      setNotes((prev) => [data, ...prev])
      setSelectedNote(data)
      toast.success('Note created')
    } else {
      toast.error('Failed to create note')
    }
  }

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) {
      const remaining = notes.filter((n) => n.id !== id)
      setNotes(remaining)
      if (selectedNote?.id === id) {
        setSelectedNote(remaining[0] ?? null)
      }
      toast.success('Note deleted')
    } else {
      toast.error('Failed to delete note')
    }
  }

  const autoSave = useCallback(
    (noteId: string, title: string, content: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      setSaving(true)
      saveTimeoutRef.current = setTimeout(async () => {
        const { data, error } = await supabase
          .from('notes')
          .update({ title: title || null, content: content || null })
          .eq('id', noteId)
          .select()
          .single()

        if (!error && data) {
          setNotes((prev) => prev.map((n) => (n.id === noteId ? data : n)))
        }
        setSaving(false)
      }, 800)
    },
    [supabase]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedNote) return
    const title = e.target.value
    const updated = { ...selectedNote, title }
    setSelectedNote(updated)
    autoSave(selectedNote.id, title, selectedNote.content ?? '')
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedNote) return
    const content = e.target.value
    const updated = { ...selectedNote, content }
    setSelectedNote(updated)
    autoSave(selectedNote.id, selectedNote.title ?? '', content)
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] max-w-5xl">
      {/* Sidebar */}
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={createNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No notes yet</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`w-full text-left p-2.5 rounded-lg transition-colors group ${
                  selectedNote?.id === note.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted border border-transparent'
                }`}
              >
                <p className="font-medium text-sm truncate">{note.title || 'Untitled note'}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {note.content || 'Empty note'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(note.updated_at), 'MMM d, yyyy')}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="text-xs text-muted-foreground">
                {saving ? 'Saving...' : `Last saved ${format(new Date(selectedNote.updated_at), 'h:mm a')}`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-destructive hover:text-destructive"
                onClick={() => deleteNote(selectedNote.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
            <CardContent className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
              <Input
                className="text-xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Note title..."
                value={selectedNote.title ?? ''}
                onChange={handleTitleChange}
              />
              <Textarea
                className="flex-1 resize-none border-none shadow-none px-0 focus-visible:ring-0 text-sm bg-transparent"
                placeholder="Start writing..."
                value={selectedNote.content ?? ''}
                onChange={handleContentChange}
              />
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Select a note or create a new one</p>
            <Button onClick={createNote}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
