import { Check } from 'lucide-react'

export const TITLES = ['Brief received', 'Designer review', 'Your proposal', 'Kick-off']
// In the admin, clicking step 1–4 moves the project to these statuses.
export const STAGE_STATUS = ['new', 'in_review', 'proposal_sent', 'in_progress']
export const CLIENT_LABEL = {
  new: 'Received', in_review: 'In review', awaiting_reply: 'Awaiting your reply', proposal_sent: 'Proposal sent',
  in_progress: 'In progress', delivered: 'Delivered', archived: 'On hold',
}
const DONE = { new: 1, in_review: 1, awaiting_reply: 1, proposal_sent: 2, in_progress: 3, delivered: 4, archived: 1 }
const NO_ACTIVE = ['new', 'archived', 'delivered']

// Turns a brief's status into the four steps the client sees.
export function stagesFor(status, created, due) {
  const done = DONE[status] ?? 1
  const active = NO_ACTIVE.includes(status) ? -1 : done
  const received = new Date(created).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(', ', ' · ')
  const by = due ? `By ${new Date(due).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}` : 'Date to be confirmed'
  return TITLES.map((title, i) => {
    const state = i < done ? 'done' : i === active ? 'active' : 'todo'
    let text
    if (i === 0) text = received
    else if (i === 1) text = state === 'done' ? 'Complete' : state === 'active' ? (status === 'awaiting_reply' ? 'Waiting for your reply' : 'In progress') : status === 'archived' ? 'On hold' : 'Up next'
    else if (i === 2) text = state === 'done' ? 'Sent' : state === 'active' ? 'Sent · awaiting your decision' : by
    else text = state === 'done' ? 'Complete' : state === 'active' ? 'In progress' : 'Once you’re happy'
    return { title, state, text }
  })
}

// Read-only for clients. Pass onPick to make the steps clickable (admin).
export function Timeline({ stages, onPick }) {
  return (
    <div className="card" style={{ padding: 28, flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
      {stages.map((s, i) => {
        const Tag = onPick ? 'button' : 'div'
        const props = onPick ? { type: 'button', onClick: () => onPick(i), title: `Move project to: ${s.title}` } : {}
        return (
          <Tag key={s.title} {...props} className="between" style={{ justifyContent: 'flex-start', gap: 12, flex: 1, minWidth: 180, textAlign: 'left', cursor: onPick ? 'pointer' : undefined }}>
            <span className="dot" style={{ width: 32, height: 32, ...(s.state !== 'todo' ? { background: '#244df0', borderColor: '#244df0', color: '#fff' } : { background: 'var(--bg)' }) }}>
              {s.state === 'done' ? <Check size={16} /> : i + 1}
            </span>
            <span className="col" style={{ gap: 5 }}>
              <b style={{ fontWeight: 500, fontSize: 14 }}>{s.title}</b>
              <small style={{ fontSize: 12, color: s.state === 'active' ? '#244df0' : undefined }}>{s.text}</small>
            </span>
          </Tag>
        )
      })}
    </div>
  )
}
