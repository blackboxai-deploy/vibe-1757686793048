"use client";

import { Message } from "@/app/page";

// Local Storage Keys
const STORAGE_KEYS = {
  USERNAME: 'chatUsername',
  MESSAGES: 'chatMessages',
  USER_PREFERENCES: 'chatUserPreferences',
  DRAFT_MESSAGE: 'chatDraftMessage',
} as const;

// User Preferences Interface
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  notifications: true,
  soundEnabled: true,
  fontSize: 'medium',
};

// Safe localStorage operations with error handling
class SafeStorage {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get item from localStorage:', error);
      return null;
    }
  }

  setItem(key: string, value: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Failed to set item in localStorage:', error);
      return false;
    }
  }

  removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove item from localStorage:', error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }
}

const safeStorage = new SafeStorage();

// Username operations
export const getStoredUsername = (): string | null => {
  return safeStorage.getItem(STORAGE_KEYS.USERNAME);
};

export const setStoredUsername = (username: string): boolean => {
  return safeStorage.setItem(STORAGE_KEYS.USERNAME, username);
};

export const clearStoredUsername = (): boolean => {
  return safeStorage.removeItem(STORAGE_KEYS.USERNAME);
};

// Message operations
export const getStoredMessages = (): Message[] => {
  try {
    const messagesJson = safeStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!messagesJson) return [];
    
    const messages = JSON.parse(messagesJson) as Message[];
    // Convert timestamp strings back to Date objects
    return messages.map(message => ({
      ...message,
      timestamp: new Date(message.timestamp)
    }));
  } catch (error) {
    console.error('Failed to parse stored messages:', error);
    return [];
  }
};

export const setStoredMessages = (messages: Message[]): boolean => {
  try {
    const messagesJson = JSON.stringify(messages);
    return safeStorage.setItem(STORAGE_KEYS.MESSAGES, messagesJson);
  } catch (error) {
    console.error('Failed to stringify messages:', error);
    return false;
  }
};

export const addStoredMessage = (message: Message): boolean => {
  const messages = getStoredMessages();
  messages.push(message);
  
  // Keep only the last 100 messages to prevent storage overflow
  const recentMessages = messages.slice(-100);
  return setStoredMessages(recentMessages);
};

export const clearStoredMessages = (): boolean => {
  return safeStorage.removeItem(STORAGE_KEYS.MESSAGES);
};

// User preferences operations
export const getUserPreferences = (): UserPreferences => {
  try {
    const prefsJson = safeStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!prefsJson) return DEFAULT_PREFERENCES;
    
    const prefs = JSON.parse(prefsJson) as Partial<UserPreferences>;
    return { ...DEFAULT_PREFERENCES, ...prefs };
  } catch (error) {
    console.error('Failed to parse user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

export const setUserPreferences = (preferences: Partial<UserPreferences>): boolean => {
  try {
    const currentPrefs = getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    const prefsJson = JSON.stringify(updatedPrefs);
    return safeStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, prefsJson);
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    return false;
  }
};

// Draft message operations
export const getDraftMessage = (): string => {
  return safeStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGE) || '';
};

export const setDraftMessage = (message: string): boolean => {
  if (message.trim()) {
    return safeStorage.setItem(STORAGE_KEYS.DRAFT_MESSAGE, message);
  } else {
    return clearDraftMessage();
  }
};

export const clearDraftMessage = (): boolean => {
  return safeStorage.removeItem(STORAGE_KEYS.DRAFT_MESSAGE);
};

// Utility functions
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

export const getStorageSize = (): number => {
  if (!isStorageAvailable()) return 0;
  
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

export const clearChatData = (): boolean => {
  let success = true;
  success = clearStoredUsername() && success;
  success = clearStoredMessages() && success;
  success = clearDraftMessage() && success;
  return success;
};

// Export types
export type { UserPreferences };