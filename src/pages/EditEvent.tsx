import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { CreateEvent } from './CreateEvent'

interface Props {
  eventId: string
}

export function EditEvent({ eventId }: Props) {
  const { state } = useApp()
  const { navigate } = useRouter()
  const event = state.events.find(e => e.id === eventId)

  if (!event) {
    navigate({ page: 'home' })
    return null
  }

  return <CreateEvent event={event} />
}
