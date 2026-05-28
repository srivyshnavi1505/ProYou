import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { useAppStore } from '../store/useAppStore'
import { getEvents, createEvent, deleteEvent } from '../api'
import { CalendarDays, Plus, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
  { value: 'interview', label: '🎯 Interview', color: '#028090' },
  { value: 'deadline',  label: '⏰ Deadline',  color: '#f4978e' },
  { value: 'contest',   label: '⭐ Contest',   color: '#1e88e5' },
  { value: 'other',     label: '📌 Other',     color: '#fec89a' },
]

export default function CalendarPage() {
  const calendarEvents    = useAppStore(s => s.calendarEvents)
  const setCalendarEvents = useAppStore(s => s.setCalendarEvents)
  const contests          = useAppStore(s => s.contests)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ title: '', date: '', type: 'interview', note: '' })
  const [saving, setSaving]       = useState(false)
  const calRef = useRef(null)

  const load = async () => {
    try { const r = await getEvents(); setCalendarEvents(r.data) } catch {}
  }
  useEffect(() => { load() }, [])

  const allEvents = [
    ...calendarEvents.map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      backgroundColor: EVENT_TYPES.find(t => t.value === e.type)?.color || '#028090',
      borderColor: 'transparent',
      extendedProps: { type: e.type, note: e.note, isUser: true },
    })),
    ...(contests || []).map(c => ({
      title: `⭐ ${c.name}`,
      date: c.startTime?.split('T')[0],
      backgroundColor: '#1e88e5',
      borderColor: 'transparent',
      extendedProps: { type: 'contest', platform: c.platform },
    })),
  ]

  const save = async () => {
    if (!form.title || !form.date) { toast.error('Title and date are required'); return }
    setSaving(true)
    try {
      await createEvent(form)
      toast.success('Event added! 📅')
      setShowModal(false)
      setForm({ title: '', date: '', type: 'interview', note: '' })
      load()
    } catch { toast.error('Failed to save event') }
    finally { setSaving(false) }
  }

  const handleDateClick = (info) => {
    setForm(f => ({ ...f, date: info.dateStr }))
    setShowModal(true)
  }

  const handleEventClick = async (info) => {
    if (!info.event.extendedProps.isUser) return
    if (window.confirm(`Delete "${info.event.title}"?`)) {
      try { await deleteEvent(info.event.id); toast.success('Deleted'); load() }
      catch { toast.error('Delete failed') }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>📅 Placement Calendar</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Interviews, deadlines, contests — all in one place</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Event
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {EVENT_TYPES.map(t => (
          <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card" style={{ padding: '8px' }}>
        <style>{`
          .fc { color: var(--text-primary); font-family: var(--font-body); }
          .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: var(--border) !important; }
          .fc-daygrid-day { background: transparent !important; }
          .fc-daygrid-day:hover { background: rgba(254,200,154,0.04) !important; cursor: pointer; }
          .fc-daygrid-day-number { color: var(--text-muted) !important; font-size: 13px; }
          .fc-col-header-cell-cushion { color: var(--text-muted) !important; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .fc-button-primary { background: var(--bg-surface) !important; border-color: var(--border) !important; color: var(--text-primary) !important; font-size: 13px !important; }
          .fc-button-primary:hover { background: var(--bg-input) !important; }
          .fc-button-active { background: rgba(2,128,144,0.2) !important; border-color: var(--teal) !important; }
          .fc-today-button { opacity: .7 !important; }
          .fc-daygrid-day.fc-day-today { background: rgba(2,128,144,0.07) !important; }
          .fc-event { border-radius: 6px !important; font-size: 12px !important; padding: 2px 6px !important; }
          .fc-toolbar-title { font-family: var(--font-display) !important; font-size: 1.1rem !important; color: var(--text-primary) !important; }
          .fc-list-day-cushion { background: var(--bg-surface) !important; }
          .fc-list-event:hover td { background: var(--bg-input) !important; }
          .fc-list-event-title { color: var(--text-primary) !important; }
        `}</style>
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
          events={allEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="600px"
          eventDisplay="block"
        />
      </div>

      {/* Add event modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(3,0,39,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="card anim-bounce-in" style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <h3>Add Event</h3>
              <button className="btn btn-ghost btn-sm" style={{ padding: 8 }} onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Event Title *</label>
                <input className="input" placeholder="e.g. Google Phone Screen" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Date *</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Type</label>
                <select className="input" value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value} style={{ background: '#151e3f' }}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Note</label>
                <input className="input" placeholder="Optional note" value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Event'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
