import React from 'react';
import { t } from '../i18n.js';

export function Header({ theme, toggleTheme, lang, toggleLang }) {
  return (
    <header className="top-nav">
      <div className="header-brand">
        <h1>{t("appTitle", lang)}</h1>
        <p>{t("appSubtitle", lang)}</p>
      </div>

      <div className="header-controls">
        {/* Language Switcher */}
        <button
          className="control-pill-btn"
          onClick={toggleLang}
          aria-label="Switch Language"
          title="Switch Language / เปลี่ยนภาษา"
        >
          <span className="control-icon">{lang === 'en' ? '🇹🇭' : '🇬🇧'}</span>
          <span className="control-label">{lang === 'en' ? 'ไทย' : 'EN'}</span>
        </button>

        {/* Light/Dark Theme Switcher */}
        <button
          className="control-pill-btn"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title="Toggle Light/Dark Theme"
        >
          <span className="control-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="control-label">{theme === 'light' ? t("themeDark", lang) : t("themeLight", lang)}</span>
        </button>
      </div>
    </header>
  );
}

