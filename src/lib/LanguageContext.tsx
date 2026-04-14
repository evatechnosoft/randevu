import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  tr: {
    'nav.title': 'Işıltı & Zarafet',
    'nav.login': 'Giriş Yap',
    'nav.logout': 'Çıkış Yap',
    'hero.badge': 'Yeni Nesil Güzellik Deneyimi',
    'hero.title': 'Kendini Şımartmanın Tam Zamanı',
    'hero.subtitle': 'Lüks tırnak tasarımı, profesyonel cilt bakımı ve dinlendirici masaj hizmetlerimizle size özel bir güzellik yolculuğu sunuyoruz.',
    'tabs.services': 'Hizmetler',
    'tabs.appointments': 'Randevularım',
    'tabs.admin': 'Admin Panel',
    'tabs.staff': 'Personel Paneli',
    'view.card': 'Kart',
    'view.list': 'Liste',
    'cat.all': 'Hepsi',
    'cat.nails': 'Tırnak',
    'cat.skin': 'Cilt Bakımı',
    'cat.massage': 'Masaj',
    'book.now': 'Randevu Al',
    'common.back': 'Geri',
    'common.next': 'Devam Et',
    'common.loading': 'İşleniyor...',
    'common.close': 'Kapat'
  },
  en: {
    'nav.title': 'Glow & Grace',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'hero.badge': 'New Generation Beauty Experience',
    'hero.title': 'Time to Pamper Yourself',
    'hero.subtitle': 'We offer a special beauty journey with luxury nail design, professional skin care and relaxing massage services.',
    'tabs.services': 'Services',
    'tabs.appointments': 'My Appointments',
    'tabs.admin': 'Admin Panel',
    'tabs.staff': 'Staff Panel',
    'view.card': 'Card',
    'view.list': 'List',
    'cat.all': 'All',
    'cat.nails': 'Nails',
    'cat.skin': 'Skin Care',
    'cat.massage': 'Massage',
    'book.now': 'Book Now',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.loading': 'Processing...',
    'common.close': 'Close'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'tr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['tr']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
