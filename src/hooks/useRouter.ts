import { useState, useEffect, useCallback } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'createEvent' }
  | { page: 'editEvent'; eventId: string }
  | { page: 'eventDetail'; eventId: string }
  | { page: 'addMeat'; eventId: string; meatId?: string }
  | { page: 'timeline'; eventId: string }
  | { page: 'dashboard'; eventId: string }
  | { page: 'settings' }

function parseHash(hash: string): Route {
  const [path, ...queryParts] = hash.replace(/^#/, '').split('?')
  const params = new URLSearchParams(queryParts.join('?'))

  switch (path) {
    case 'create':
      return { page: 'createEvent' }
    case 'editEvent': {
      const eventId = params.get('id') ?? ''
      return { page: 'editEvent', eventId }
    }
    case 'event': {
      const eventId = params.get('id') ?? ''
      return { page: 'eventDetail', eventId }
    }
    case 'addMeat': {
      const eventId = params.get('eventId') ?? ''
      const meatId = params.get('meatId') ?? undefined
      return { page: 'addMeat', eventId, meatId }
    }
    case 'timeline': {
      const eventId = params.get('id') ?? ''
      return { page: 'timeline', eventId }
    }
    case 'dashboard': {
      const eventId = params.get('id') ?? ''
      return { page: 'dashboard', eventId }
    }
    case 'settings':
      return { page: 'settings' }
    default:
      return { page: 'home' }
  }
}

function routeToHash(route: Route): string {
  switch (route.page) {
    case 'home':
      return '#'
    case 'createEvent':
      return '#create'
    case 'editEvent':
      return `#editEvent?id=${route.eventId}`
    case 'eventDetail':
      return `#event?id=${route.eventId}`
    case 'addMeat': {
      const base = `#addMeat?eventId=${route.eventId}`
      return route.meatId ? `${base}&meatId=${route.meatId}` : base
    }
    case 'timeline':
      return `#timeline?id=${route.eventId}`
    case 'dashboard':
      return `#dashboard?id=${route.eventId}`
    case 'settings':
      return '#settings'
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseHash(window.location.hash))
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = useCallback((to: Route) => {
    window.location.hash = routeToHash(to)
  }, [])

  const back = useCallback(() => {
    history.back()
  }, [])

  return { route, navigate, back }
}
