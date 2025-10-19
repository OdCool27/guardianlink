/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistressSettings, DistressEvent } from '../types';
import { DEFAULT_DISTRESS_SETTINGS, STORAGE_KEYS } from '../config';

/**
 * Storage utilities for persisting distress detection data
 */

/**
 * Generate a unique ID for events and other entities
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generic function to save data to localStorage
 */
export const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data to storage (${key}):`, error);
  }
};

/**
 * Generic function to load data from localStorage
 */
export const loadFromStorage = (key: string): any => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Failed to load data from storage (${key}):`, error);
  }
  return null;
};

/**
 * Save distress detection settings to localStorage
 */
export const saveDistressSettings = (settings: DistressSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DISTRESS_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save distress settings:', error);
  }
};

/**
 * Load distress detection settings from localStorage
 */
export const loadDistressSettings = (): DistressSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DISTRESS_SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return { ...DEFAULT_DISTRESS_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load distress settings:', error);
  }
  return DEFAULT_DISTRESS_SETTINGS;
};

/**
 * Save a distress event to localStorage
 */
export const saveDistressEvent = (event: DistressEvent): void => {
  try {
    const events = loadDistressEvents();
    events.push(event);
    
    // Keep only the last 100 events to prevent storage bloat
    const trimmedEvents = events.slice(-100);
    
    localStorage.setItem(STORAGE_KEYS.DISTRESS_EVENTS, JSON.stringify(trimmedEvents));
  } catch (error) {
    console.error('Failed to save distress event:', error);
  }
};

/**
 * Load all distress events from localStorage
 */
export const loadDistressEvents = (): DistressEvent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DISTRESS_EVENTS);
    if (stored) {
      const events = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
    }
  } catch (error) {
    console.error('Failed to load distress events:', error);
  }
  return [];
};

/**
 * Clear old distress events based on retention policy
 */
export const cleanupOldEvents = (retentionDays: number): void => {
  try {
    const events = loadDistressEvents();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const filteredEvents = events.filter(event => event.timestamp > cutoffDate);
    
    localStorage.setItem(STORAGE_KEYS.DISTRESS_EVENTS, JSON.stringify(filteredEvents));
  } catch (error) {
    console.error('Failed to cleanup old events:', error);
  }
};

/**
 * Save custom distress phrases
 */
export const saveCustomPhrases = (phrases: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PHRASES, JSON.stringify(phrases));
  } catch (error) {
    console.error('Failed to save custom phrases:', error);
  }
};

/**
 * Load custom distress phrases
 */
export const loadCustomPhrases = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_PHRASES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load custom phrases:', error);
  }
  return [];
};

/**
 * Save permissions status
 */
export const savePermissionsStatus = (status: { microphone: boolean }): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS_STATUS, JSON.stringify(status));
  } catch (error) {
    console.error('Failed to save permissions status:', error);
  }
};

/**
 * Load permissions status
 */
export const loadPermissionsStatus = (): { microphone: boolean } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PERMISSIONS_STATUS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load permissions status:', error);
  }
  return { microphone: false };
};

/**
 * Clear all distress detection data from storage
 */
export const clearAllDistressData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear distress data:', error);
  }
};