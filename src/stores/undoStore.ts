import { create } from 'zustand';
import type { Asset, Booking } from '../types/entities';

/**
 * Undo action types
 */
export type UndoAction = {
  id: string;
  type: 'delete-asset' | 'delete-booking';
  timestamp: number;
  data: Asset | Booking;
  label: string;
};

interface UndoState {
  actions: UndoAction[];
  addAction: (action: Omit<UndoAction, 'id' | 'timestamp'>) => string;
  removeAction: (id: string) => void;
  getAction: (id: string) => UndoAction | undefined;
  clearAction: (id: string) => void;
  clearExpired: () => void;
}

/**
 * Undo store - maintains queue of undoable actions
 * Actions are automatically cleared after 10 seconds
 */
export const useUndoStore = create<UndoState>((set, get) => ({
  actions: [],

  /**
   * Add an undoable action to the queue
   * Returns the action ID for notification reference
   */
  addAction: (action) => {
    const id = `undo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const newAction: UndoAction = {
      id,
      timestamp,
      ...action,
    };

    set((state) => ({
      actions: [...state.actions, newAction],
    }));

    // Auto-clear after 10 seconds
    setTimeout(() => {
      get().clearAction(id);
    }, 10000);

    return id;
  },

  /**
   * Remove an action from the queue (when undone)
   */
  removeAction: (id) => {
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== id),
    }));
  },

  /**
   * Get an action by ID
   */
  getAction: (id) => {
    return get().actions.find((a) => a.id === id);
  },

  /**
   * Clear an action (when timer expires)
   */
  clearAction: (id) => {
    get().removeAction(id);
  },

  /**
   * Clear all expired actions (older than 10 seconds)
   */
  clearExpired: () => {
    const now = Date.now();
    set((state) => ({
      actions: state.actions.filter((a) => now - a.timestamp < 10000),
    }));
  },
}));
