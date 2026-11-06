import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { StationSelectors } from './components/StationSelectors.jsx';
import { RouteResults } from './components/RouteResults.jsx';
import { findRoutes } from './router.js';

export function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('bkk_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('bkk_lang') || 'en');

  const [startLine, setStartLine] = useState('');
  const [startStation, setStartStation] = useState('');
  const [endLine, setEndLine] = useState('');
  const [endStation, setEndStation] = useState('');

  // Default to today in YYYY-MM-DD
  const [travelDate, setTravelDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [routes, setRoutes] = useState([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  // Sync theme to body class and localStorage
  useEffect(() => {
    localStorage.setItem('bkk_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Sync language to localStorage
  useEffect(() => {
    localStorage.setItem('bkk_lang', lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'th' : 'en'));
  };

  const handleSwap = () => {
    const tempLine = startLine;
    const tempStation = startStation;
    setStartLine(endLine);
    setStartStation(endStation);
    setEndLine(tempLine);
    setEndStation(tempStation);

    if (hasSearched && endStation && tempStation) {
      try {
        const results = findRoutes(endStation, tempStation, 3);
        setRoutes(results);
        setActiveRouteIndex(0);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFindRoute = () => {
    if (!startStation || !endStation) return;
    try {
      const results = findRoutes(startStation, endStation, 3);
      setRoutes(results);
      setActiveRouteIndex(0);
      setHasSearched(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setHasSearched(true);
    }
  };

  const handleReset = () => {
    setStartLine('');
    setStartStation('');
    setEndLine('');
    setEndStation('');
    setRoutes([]);
    setActiveRouteIndex(0);
    setHasSearched(false);
    setError(null);
  };

  return (
    <div className="app-wrapper">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        toggleLang={toggleLang}
      />

      <StationSelectors
        lang={lang}
        startLine={startLine}
        setStartLine={setStartLine}
        startStation={startStation}
        setStartStation={setStartStation}
        endLine={endLine}
        setEndLine={setEndLine}
        endStation={endStation}
        setEndStation={setEndStation}
        travelDate={travelDate}
        setTravelDate={setTravelDate}
        onSwap={handleSwap}
        onFindRoute={handleFindRoute}
        onReset={handleReset}
      />

      <RouteResults
        routes={routes}
        activeRouteIndex={activeRouteIndex}
        setActiveRouteIndex={setActiveRouteIndex}
        travelDate={travelDate}
        lang={lang}
        hasSearched={hasSearched}
        error={error}
      />
    </div>
  );
}

export default App;

