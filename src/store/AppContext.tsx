import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { BBQEvent, Session, UserPreferences } from '../domain/types'
import { EventRepository, SessionRepository } from '../repositories/db'
import { PreferencesService } from '../services/PreferencesService'
import { generateId } from '../utils/uuid'

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  events: BBQEvent[]
  activeSession: Session | null
  preferences: UserPreferences
  loading: boolean
  error: string | null
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT'; events: BBQEvent[]; preferences: UserPreferences; activeSession: Session | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'ADD_EVENT'; event: BBQEvent }
  | { type: 'UPDATE_EVENT'; event: BBQEvent }
  | { type: 'DELETE_EVENT'; id: string }
  | { type: 'SET_ACTIVE_SESSION'; session: Session | null }
  | { type: 'UPDATE_PREFERENCES'; preferences: UserPreferences }
  | { type: 'COMPLETE_STEP'; stepId: string }
  | { type: 'RESET_SESSION_STEPS' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, events: action.events, preferences: action.preferences, activeSession: action.activeSession, loading: false }

    case 'SET_LOADING':
      return { ...state, loading: action.loading }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.event] }

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => (e.id === action.event.id ? action.event : e)),
      }

    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.id) }

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSession: action.session }

    case 'UPDATE_PREFERENCES':
      return { ...state, preferences: action.preferences }

    case 'COMPLETE_STEP': {
      if (!state.activeSession) return state
      const alreadyDone = state.activeSession.completedStepIds.includes(action.stepId)
      if (alreadyDone) return state
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          completedStepIds: [...state.activeSession.completedStepIds, action.stepId],
        },
      }
    }

    case 'RESET_SESSION_STEPS':
      if (!state.activeSession) return state
      return { ...state, activeSession: { ...state.activeSession, completedStepIds: [] } }

    default:
      return state
  }
}

const initialState: AppState = {
  events: [],
  activeSession: null,
  preferences: PreferencesService.load(),
  loading: true,
  error: null,
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState
  addEvent: (event: Omit<BBQEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<BBQEvent>
  updateEvent: (event: BBQEvent) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  importEvent: (event: BBQEvent) => Promise<void>
  startSession: (eventId: string) => Promise<Session>
  endSession: () => Promise<void>
  completeStep: (stepId: string) => void
  resetSessionSteps: () => void
  updatePreferences: (partial: Partial<UserPreferences>) => void
}

const AppContext = createContext<AppContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    async function init() {
      try {
        const [events, activeSessions] = await Promise.all([
          EventRepository.getAll(),
          SessionRepository.getAllActive(),
        ])
        const preferences = PreferencesService.load()
        const activeSession = activeSessions[activeSessions.length - 1] ?? null
        dispatch({ type: 'INIT', events, preferences, activeSession })
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: String(err) })
        dispatch({ type: 'SET_LOADING', loading: false })
      }
    }
    void init()
  }, [])

  // Persist session changes
  useEffect(() => {
    if (state.activeSession) {
      void SessionRepository.save(state.activeSession)
    }
  }, [state.activeSession])

  const addEvent = useCallback(
    async (data: Omit<BBQEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<BBQEvent> => {
      const now = new Date().toISOString()
      const event: BBQEvent = { ...data, id: generateId(), createdAt: now, updatedAt: now }
      await EventRepository.save(event)
      dispatch({ type: 'ADD_EVENT', event })
      return event
    },
    [],
  )

  const updateEvent = useCallback(async (event: BBQEvent): Promise<void> => {
    const updated = { ...event, updatedAt: new Date().toISOString() }
    await EventRepository.save(updated)
    dispatch({ type: 'UPDATE_EVENT', event: updated })
    // Timeline is regenerated with new step IDs — clear stale completed refs
    if (state.activeSession?.eventId === event.id) {
      const resetSession = { ...state.activeSession, completedStepIds: [] }
      await SessionRepository.save(resetSession)
      dispatch({ type: 'SET_ACTIVE_SESSION', session: resetSession })
    }
  }, [state.activeSession])

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    await EventRepository.delete(id)
    dispatch({ type: 'DELETE_EVENT', id })
  }, [])

  const importEvent = useCallback(async (event: BBQEvent): Promise<void> => {
    await EventRepository.save(event)
    const existing = state.events.find(e => e.id === event.id)
    if (existing) {
      dispatch({ type: 'UPDATE_EVENT', event })
    } else {
      dispatch({ type: 'ADD_EVENT', event })
    }
  }, [state.events])

  const startSession = useCallback(async (eventId: string): Promise<Session> => {
    // Resume existing active session for this event if present
    if (state.activeSession?.eventId === eventId && state.activeSession.status === 'active') {
      return state.activeSession
    }
    const session: Session = {
      id: generateId(),
      eventId,
      startedAt: new Date().toISOString(),
      status: 'active',
      completedStepIds: [],
    }
    await SessionRepository.save(session)
    dispatch({ type: 'SET_ACTIVE_SESSION', session })
    return session
  }, [state.activeSession])

  const endSession = useCallback(async (): Promise<void> => {
    if (!state.activeSession) return
    const ended = { ...state.activeSession, status: 'completed' as const }
    await SessionRepository.save(ended)
    dispatch({ type: 'SET_ACTIVE_SESSION', session: null })
  }, [state.activeSession])

  const completeStep = useCallback((stepId: string): void => {
    dispatch({ type: 'COMPLETE_STEP', stepId })
  }, [])

  const resetSessionSteps = useCallback((): void => {
    dispatch({ type: 'RESET_SESSION_STEPS' })
  }, [])

  const updatePreferences = useCallback((partial: Partial<UserPreferences>): void => {
    const updated = PreferencesService.update(partial)
    dispatch({ type: 'UPDATE_PREFERENCES', preferences: updated })
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        addEvent,
        updateEvent,
        deleteEvent,
        importEvent,
        startSession,
        endSession,
        completeStep,
        resetSessionSteps,
        updatePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
