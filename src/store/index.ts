/**
 * GLOBAL STATE (Zustand)
 *
 * State philosophy:
 * - Tool-level state (files, options, results) lives in tool components or
 *   local hooks – NOT in global store.
 * - Global store holds only truly cross-cutting state: notifications, theme,
 *   and any persisted preferences.
 *
 * This keeps the store minimal, which makes debugging easy and prevents
 * the "everything in one giant store" antipattern.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Notification } from '@/types'

// ─── Notification store ───────────────────────────────────────────────────────

interface NotificationStore {
  notifications: Notification[]
  push: (n: Omit<Notification, 'id'>) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

export const useNotifications = create<NotificationStore>((set) => ({
  notifications: [],

  push: (n) => {
    const id = crypto.randomUUID()
    set(state => ({
      notifications: [...state.notifications, { ...n, id }]
    }))

    // Auto-dismiss
    const duration = n.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => {
        set(state => ({
          notifications: state.notifications.filter(x => x.id !== id)
        }))
      }, duration)
    }
  },

  dismiss: (id) => set(state => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  dismissAll: () => set({ notifications: [] }),
}))

// ─── Preferences store (persisted to localStorage) ────────────────────────────

interface Preferences {
  // Image defaults
  defaultImageQuality: number           // 0.0–1.0
  defaultOutputFormat: 'jpeg' | 'png' | 'webp'
  // PDF defaults
  // UI
  sidebarCollapsed: boolean
}

interface PreferencesStore extends Preferences {
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  reset: () => void
}

const DEFAULT_PREFS: Preferences = {
  defaultImageQuality:  0.8,
  defaultOutputFormat:  'jpeg',
  sidebarCollapsed:     false,
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFS,

      set: (key, value) => set(state => ({ ...state, [key]: value })),

      reset: () => set(DEFAULT_PREFS),
    }),
    {
      name: 'privatebox-prefs',
      // Only persist user preferences, not derived/transient state
    }
  )
)

// ─── Convenience notification helpers ────────────────────────────────────────

export function notify(n: Omit<Notification, 'id'>) {
  useNotifications.getState().push(n)
}

export function notifySuccess(title: string, body?: string) {
  notify({ type: 'success', title, body })
}

export function notifyError(title: string, body?: string) {
  notify({ type: 'error', title, body, duration: 6000 })
}

export function notifyInfo(title: string, body?: string) {
  notify({ type: 'info', title, body })
}
