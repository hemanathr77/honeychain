import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS } from '../i18n/translations';

const AppContext = createContext();

const LANG_KEY = 'hc_lang';

export function AppProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(LANG_KEY) || 'en'
  );
  const [notifications, setNotifications] = useState([]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem(LANG_KEY, lang);
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [{ ...notification, id, time: 'just now', read: false }, ...prev]);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider value={{
      language, setLanguage, t,
      notifications, addNotification, markAllRead,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
