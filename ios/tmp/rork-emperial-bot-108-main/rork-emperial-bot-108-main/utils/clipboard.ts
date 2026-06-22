import { Platform } from 'react-native';

export const UniversalClipboard = {
  setStringAsync: async (text: string): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }

      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(text);
      return true;
    } catch (e) {
      console.log('[Clipboard] Failed to copy:', e);
      return false;
    }
  },

  getStringAsync: async (): Promise<string> => {
    try {
      if (Platform.OS === 'web') {
        if (navigator?.clipboard?.readText) {
          return await navigator.clipboard.readText();
        }
        return '';
      }

      const Clipboard = require('expo-clipboard');
      return await Clipboard.getStringAsync();
    } catch (e) {
      console.log('[Clipboard] Failed to read:', e);
      return '';
    }
  },
};
