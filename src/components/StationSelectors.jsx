import React from 'react';
import { LINES } from '../railway_lines.js';
import { LINE_DATA, getLineColor, getLineName, getStationName, t } from '../i18n.js';
import { THAI_HOLIDAYS, getHolidayInfo } from '../utils/crowdEstimator.js';

export function StationSelectors({
  lang,
  startLine,
  setStartLine,
  startStation,
  setStartStation,
  endLine,
  setEndLine,
  endStation,
  setEndStation,
  travelDate,
  setTravelDate,
  onSwap,
  onFindRoute,
  onReset,
}) {
  const isReadyToFind = startStation && endStation && startStation !== endStation;

  // Compute date information
  const dateObj = travelDate ? new Date(`${travelDate}T00:00:00`) : new Date();
  const monthDay = travelDate ? travelDate.slice(5) : '';
  const holiday = THAI_HOLIDAYS[monthDay] || null;
  const dayOfWeekIdx = dateObj.getDay();
  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesTh = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
  const dayName = lang === 'th' ? dayNamesTh[dayOfWeekIdx] : dayNamesEn[dayOfWeekIdx];

  const startStationsList = startLine && LINES[startLine] ? LINES[startLine].stations : [];
  const endStationsList = endLine && LINES[endLine] ? LINES[endLine].stations : [];

  const startColor = startLine ? getLineColor(startLine) : null;
  const endColor = endLine ? getLineColor(endLine) : null;

  return (
    <div className="search-section-wrapper">
      {/* 1 & 2: TWO CONTAINERS SIDE BY SIDE */}
      <section className="selectors-section">
        {/* Container 1: Origin */}
        <div
          className={`station-card ${startLine ? 'has-line-active' : ''}`}
          id="origin-card"
          style={{ '--line-color': startColor }}
        >
          <div className="card-header">
            <span
              className="icon-badge start-badge"
              style={{ backgroundColor: startColor || undefined }}
            >
              A
            </span>
            <span className="card-title-text">{t("startContainerTitle", lang)}</span>
            {startLine && (
              <span
                className="selected-line-pill"
                style={{
                  backgroundColor: `${startColor}15`,
                  color: startColor,
                }}
              >
                {getLineName(startLine, lang)}
              </span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="start-line-select">
              1. {t("lineSelectLabel", lang)}
            </label>
            <div className="custom-select-wrapper">
              <span
                className="line-color-indicator"
                style={{
                  backgroundColor: startColor || 'transparent',
                  boxShadow: startColor ? `0 0 10px ${startColor}80` : 'none',
                }}
              />
              <select
                id="start-line-select"
                className={`color-coded-select ${startLine ? 'has-line-selected' : ''}`}
                value={startLine}
                onChange={(e) => {
                  setStartLine(e.target.value);
                  setStartStation('');
                }}
              >
                <option value="">{t("chooseLinePlaceholder", lang)}</option>
                {Object.entries(LINE_DATA).map(([lineId, line]) => (
                  <option key={lineId} value={lineId}>
                    {line.icon ? `${line.icon} ` : ''}{lang === 'th' ? line.th : line.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="start-station-select">
              2. {t("stationSelectLabel", lang)}
            </label>
            <div className="custom-select-wrapper">
              <span
                className="station-color-indicator"
                style={{
                  backgroundColor: startStation && startColor ? startColor : (startColor ? `${startColor}30` : 'transparent'),
                  boxShadow: startStation && startColor ? `0 0 8px ${startColor}70` : 'none',
                  color: startStation ? '#fff' : (startColor || 'var(--text-muted)'),
                }}
              >
                {startStation ? "✓" : (startColor ? "●" : "○")}
              </span>
              <select
                id="start-station-select"
                disabled={!startLine}
                className={`color-coded-select ${startStation ? 'has-station-selected' : ''}`}
                value={startStation}
                onChange={(e) => setStartStation(e.target.value)}
              >
                <option value="">
                  {startLine ? t("chooseStationPlaceholder", lang, { line: getLineName(startLine, lang) }) : t("selectLineFirstPlaceholder", lang)}
                </option>
                {startStationsList.map((stn, idx) => (
                  <option key={`${stn}-${idx}`} value={stn}>
                    ● {getStationName(stn, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Swap Button in between */}
        <div className="swap-btn-container">
          <button
            className="swap-btn"
            onClick={onSwap}
            title={t("swapTooltip", lang)}
            aria-label="Swap Stations"
          >
            ⇄
          </button>
        </div>

        {/* Container 2: Destination */}
        <div
          className={`station-card ${endLine ? 'has-line-active' : ''}`}
          id="dest-card"
          style={{ '--line-color': endColor }}
        >
          <div className="card-header">
            <span
              className="icon-badge dest-badge"
              style={{ backgroundColor: endColor || undefined }}
            >
              B
            </span>
            <span className="card-title-text">{t("destContainerTitle", lang)}</span>
            {endLine && (
              <span
                className="selected-line-pill"
                style={{
                  backgroundColor: `${endColor}15`,
                  color: endColor,
                }}
              >
                {getLineName(endLine, lang)}
              </span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="end-line-select">
              1. {t("lineSelectLabel", lang)}
            </label>
            <div className="custom-select-wrapper">
              <span
                className="line-color-indicator"
                style={{
                  backgroundColor: endColor || 'transparent',
                  boxShadow: endColor ? `0 0 10px ${endColor}80` : 'none',
                }}
              />
              <select
                id="end-line-select"
                className={`color-coded-select ${endLine ? 'has-line-selected' : ''}`}
                value={endLine}
                onChange={(e) => {
                  setEndLine(e.target.value);
                  setEndStation('');
                }}
              >
                <option value="">{t("chooseLinePlaceholder", lang)}</option>
                {Object.entries(LINE_DATA).map(([lineId, line]) => (
                  <option key={lineId} value={lineId}>
                    {line.icon ? `${line.icon} ` : ''}{lang === 'th' ? line.th : line.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="end-station-select">
              2. {t("stationSelectLabel", lang)}
            </label>
            <div className="custom-select-wrapper">
              <span
                className="station-color-indicator"
                style={{
                  backgroundColor: endStation && endColor ? endColor : (endColor ? `${endColor}30` : 'transparent'),
                  boxShadow: endStation && endColor ? `0 0 8px ${endColor}70` : 'none',
                  color: endStation ? '#fff' : (endColor || 'var(--text-muted)'),
                }}
              >
                {endStation ? "✓" : (endColor ? "●" : "○")}
              </span>
              <select
                id="end-station-select"
                disabled={!endLine}
                className={`color-coded-select ${endStation ? 'has-station-selected' : ''}`}
                value={endStation}
                onChange={(e) => setEndStation(e.target.value)}
              >
                <option value="">
                  {endLine ? t("chooseStationPlaceholder", lang, { line: getLineName(endLine, lang) }) : t("selectLineFirstPlaceholder", lang)}
                </option>
                {endStationsList.map((stn, idx) => (
                  <option key={`${stn}-${idx}`} value={stn}>
                    ● {getStationName(stn, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Date & ML Crowd Prediction Date Bar */}
      <div className="date-picker-card">
        <div className="date-picker-left">
          <span className="date-icon">📅</span>
          <div className="date-labels">
            <label htmlFor="travel-date-input" className="date-title">
              {lang === 'th' ? 'วันที่เดินทาง (พยากรณ์ความหนาแน่นผู้โดยสาร ML)' : 'Journey Date (ML Crowd Forecast)'}
            </label>
            <span className="date-subtitle">
              {dayName} {holiday ? `• 🌟 ${lang === 'th' ? holiday.th : holiday.en}` : (dayOfWeekIdx === 0 || dayOfWeekIdx === 6 ? `• 🏖️ ${lang === 'th' ? 'วันหยุดสุดสัปดาห์' : 'Weekend'}` : `• 💼 ${lang === 'th' ? 'วันธรรมดา' : 'Weekday'}`)}
            </span>
          </div>
        </div>
        <div className="date-picker-right">
          <input
            id="travel-date-input"
            type="date"
            className="date-input"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="actions-row">
        <button
          className="find-route-btn"
          disabled={!isReadyToFind}
          onClick={onFindRoute}
        >
          <span>🔍</span>
          <span>{t("findRoutesBtn", lang)}</span>
        </button>
        <button className="reset-btn" onClick={onReset}>
          {t("resetBtn", lang)}
        </button>
      </div>
    </div>
  );
}
