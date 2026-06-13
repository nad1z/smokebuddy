import { useRouter } from './hooks/useRouter'
import { AppProvider } from './store/AppContext'
import { Home } from './pages/Home'
import { CreateEvent } from './pages/CreateEvent'
import { EditEvent } from './pages/EditEvent'
import { EventDetail } from './pages/EventDetail'
import { AddMeat } from './pages/AddMeat'
import { Timeline } from './pages/Timeline'
import { LiveDashboard } from './pages/LiveDashboard'
import { Settings } from './pages/Settings'

function Router() {
  const { route, navigate } = useRouter()

  switch (route.page) {
    case 'home':
      return <Home />
    case 'createEvent':
      return <CreateEvent />
    case 'editEvent':
      return <EditEvent eventId={route.eventId} />
    case 'eventDetail':
      return <EventDetail eventId={route.eventId} />
    case 'addMeat':
      return <AddMeat eventId={route.eventId} meatId={route.meatId} />
    case 'timeline':
      return <Timeline eventId={route.eventId} />
    case 'dashboard':
      return <LiveDashboard eventId={route.eventId} />
    case 'settings':
      return <Settings />
    default:
      navigate({ page: 'home' })
      return null
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}
