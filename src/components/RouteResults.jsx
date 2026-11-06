import React, { useState, useEffect } from 'react';
import {
  getLineColor,
  getLineName,
  getStationName,
  getStationNameOnly,
  t
} from '../i18n.js';
import { estimateRouteCrowd, fetchLiveRouteCrowd } from '../utils/crowdEstimator.js';

export function RouteResults({
  routes,
  activeRouteIndex,
  setActiveRouteIndex,
  travelDate,
  lang,
  hasSearched,
  error
}) {
  if (error) {
    return (
      <section className="results-card">
        <div className="results-header">
          <h2>
            <span>🗺️</span>
            <span>{t("routesTitle", lang)}</span>
          </h2>
        </div>
        <div className="empty-state" style={{ color: '#ef4444' }}>
          <div className="empty-state-icon">⚠️</div>
          <p><strong>{lang === 'th' ? 'ข้อผิดพลาด:' : 'Error:'}</strong> {error}</p>
        </div>
      </section>
    );
  }

  if (!hasSearched || !routes || routes.length === 0) {
    return (
      <section className="results-card">
        <div className="results-header">
          <h2>
            <span>🗺️</span>
            <span>{t("routesTitle", lang)}</span>
          </h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">{hasSearched ? '❌' : '🚉'}</div>
          <p
            dangerouslySetInnerHTML={{
              __html: hasSearched ? t("noRouteFound", lang) : t("emptyPrompt", lang)
            }}
          />
        </div>
      </section>
    );
  }

  const route = routes[activeRouteIndex] || routes[0];

  const totalStops = route.steps
    .filter((s) => s.type === 'ride')
    .reduce((acc, s) => acc + s.stops, 0);

  const linesUsed = [
    ...new Set(route.steps.filter((s) => s.type === 'ride').map((s) => s.line))
  ];

  // Travel time calculation: 2 min per station stop + 5 min per transfer
  const rideTimeMin = totalStops * 2;
  const transferTimeMin = route.transfers * 5;
  const estTimeMin = rideTimeMin + transferTimeMin;

  const estTimeDisplay = route.transfers > 0
    ? t("estTimeWithTransfers", lang, {
        total: estTimeMin,
        transfers: route.transfers,
        s: route.transfers !== 1 ? 's' : '',
        transferTime: transferTimeMin
      })
    : t("estTimeDirect", lang, {
        total: estTimeMin
      });

  // Calculate ML crowd density estimate for this route and date
  const [crowd, setCrowd] = useState(() => estimateRouteCrowd(travelDate, linesUsed));
  const [expandedSegments, setExpandedSegments] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Reset expansion states when active route changes
  useEffect(() => {
    setExpandedSegments({});
  }, [activeRouteIndex, travelDate]);

  const toggleSegment = (sIdx) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [sIdx]: !prev[sIdx]
    }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    if (!nextState) {
      setExpandedSegments({});
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchLiveRouteCrowd(travelDate, linesUsed).then((data) => {
      if (isMounted) setCrowd(data);
    });
    return () => { isMounted = false; };
  }, [travelDate, JSON.stringify(linesUsed)]);

  return (
    <section className="results-card">
      <div className="results-header">
        <h2>
          <span>🗺️</span>
          <span>{t("routesTitle", lang)}</span>
        </h2>
        <div className="results-header-actions">
          {routes.length > 1 && (
            <div className="route-tabs">
              {routes.map((r, idx) => {
                const label = idx === 0
                  ? t("routeTabBest", lang)
                  : t("routeTabAlt", lang, { n: idx + 1 });
                const transferText = lang === 'th'
                  ? `${r.transfers} เปลี่ยนสาย`
                  : `${r.transfers} transfer${r.transfers !== 1 ? 's' : ''}`;

                return (
                  <button
                    key={idx}
                    className={`route-tab ${idx === activeRouteIndex ? 'active' : ''}`}
                    onClick={() => setActiveRouteIndex(idx)}
                  >
                    <span>{label}</span>
                    <span className="tab-badge">{transferText}</span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            className="toggle-all-stops-btn"
            onClick={toggleAll}
            title={allExpanded ? t("collapseAll", lang) : t("expandAll", lang)}
          >
            <span>{allExpanded ? '⊟' : '⊞'}</span>
            <span>{allExpanded ? t("collapseAll", lang) : t("expandAll", lang)}</span>
          </button>
        </div>
      </div>

      <div className="routes-display-area">
        {/* Summary Metadata Bar */}
        <div className="route-meta-bar">
          <div className="meta-item">
            <span>{t("stopsLabel", lang)}</span>
            <strong>{totalStops}</strong>
          </div>
          <div className="meta-item">
            <span>{t("transfersLabel", lang)}</span>
            <strong>{route.transfers}</strong>
          </div>
          <div className="meta-item meta-item-time">
            <span>{t("estTimeLabel", lang)}</span>
            <strong>{estTimeDisplay}</strong>
          </div>
          <div className="corridor-pills">
            {linesUsed.map((lineId) => (
              <span
                key={lineId}
                className="line-pill"
                style={{ backgroundColor: getLineColor(lineId) }}
              >
                {getLineName(lineId, lang)}
              </span>
            ))}
          </div>
        </div>

        {/* Crowd Density Forecast Banner */}
        <div className="crowd-banner" style={{ borderColor: crowd.badgeColor }}>
          <div className="crowd-banner-left">
            <span className="crowd-banner-icon">👥</span>
            <div>
              <div className="crowd-banner-title">
                {lang === 'th' ? 'พยากรณ์ความหนาแน่นผู้โดยสาร (ML Prediction)' : 'Estimated Passenger Crowd Level (ML)'}
                {crowd.isLiveML && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>
                    ● LIVE API
                  </span>
                )}
              </div>
              <div className="crowd-banner-desc">
                {lang === 'th' ? crowd.notesTh : crowd.notesEn}
              </div>
            </div>
          </div>
          <div className="crowd-badge-pill" style={{ backgroundColor: crowd.badgeColor, color: '#fff' }}>
            {lang === 'th' ? crowd.statusTh : crowd.statusEn} • {crowd.score}%
          </div>
        </div>

        {/* Clear Whole-Day vs Rush Hours Disclaimer */}
        <div className="crowd-disclaimer-note">
          <span className="disclaimer-icon">ℹ️</span>
          <span>{t("crowdDisclaimer", lang)}</span>
        </div>

        {/* Node Timeline */}
        <div className="timeline-container">
          {route.steps.map((step, sIdx) => {
            if (step.type === 'ride') {
              const lineColor = getLineColor(step.line);
              const lineName = getLineName(step.line, lang);
              const fromStationName = getStationNameOnly(step.from, lang);
              const toStationName = getStationNameOnly(step.to, lang);

              const segmentHeader = t("rideSegmentHeader", lang, {
                stops: step.stops,
                s: step.stops !== 1 ? 's' : '',
                from: fromStationName,
                to: toStationName
              });

              const lineCrowd = crowd?.lines?.[step.line]
                || (step.line.startsWith('SRT_Red') ? (crowd?.lines?.['SRT_Red_Dark'] || crowd?.lines?.['SRT_Red']) : null)
                || (step.line.startsWith('BTS_') && (step.line.includes('Sukhumvit') || step.line.includes('Silom')) ? (crowd?.lines?.[step.line] || crowd?.lines?.['BTS_Green']) : null)
                || crowd?.lines?.[step.line.replace('_Dark', '').replace('_Light', '').replace('_North', '').replace('_West', '')]
                || null;

              const stations = step.stations;
              const hasIntermediate = stations.length > 2;
              const intermediateCount = stations.length - 2;
              const isExpanded = allExpanded || !!expandedSegments[sIdx];

              const renderStationRow = (canonicalName, idx, isFirst, isLast) => {
                const isOverallStart = sIdx === 0 && isFirst;
                const isOverallEnd = sIdx === route.steps.length - 1 && isLast;

                let rowClasses = "station-node-row";
                if (isFirst) rowClasses += " first-in-segment";
                if (isLast) rowClasses += " last-in-segment";

                let dotClasses = "node-dot";
                let nameClasses = "node-name";
                let tag = null;

                if (isOverallStart) {
                  dotClasses += " terminal";
                  nameClasses += " terminal";
                  tag = (
                    <span className="node-tag" style={{ backgroundColor: '#10b981', color: '#fff' }}>
                      {t("startBadge", lang)}
                    </span>
                  );
                } else if (isOverallEnd) {
                  dotClasses += " terminal";
                  nameClasses += " terminal";
                  tag = (
                    <span className="node-tag" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                      {t("destBadge", lang)}
                    </span>
                  );
                } else if (isFirst || isLast) {
                  dotClasses += " terminal";
                }

                return (
                  <div key={`${canonicalName}-${idx}`} className={rowClasses}>
                    <div className={dotClasses} />
                    <div className={nameClasses}>
                      <span>{getStationName(canonicalName, lang)}</span>
                      {tag}
                    </div>
                  </div>
                );
              };

              return (
                <div
                  key={`ride-${sIdx}`}
                  className="segment-block"
                  style={{ '--current-line-color': lineColor }}
                >
                  <div className="segment-header">
                    <div className="segment-header-main">
                      <span className="segment-header-badge" style={{ backgroundColor: lineColor }}>
                        {lineName}
                      </span>
                      <span
                        className="segment-header-text"
                        dangerouslySetInnerHTML={{ __html: segmentHeader }}
                      />
                    </div>

                    {lineCrowd && (
                      <div
                        className="segment-crowd-badge"
                        style={{ backgroundColor: lineCrowd.badgeColor, color: '#fff' }}
                        title={lang === 'th' ? lineCrowd.notesTh : lineCrowd.notesEn}
                      >
                        <span className="segment-crowd-icon">👥</span>
                        <span className="segment-crowd-status">
                          {lang === 'th' ? lineCrowd.statusTh : lineCrowd.statusEn} • {lineCrowd.densityPct}%
                        </span>
                        {lineCrowd.predictedPassengers && (
                          <span className="segment-crowd-volume">
                            (~{(lineCrowd.predictedPassengers / 1000).toFixed(0)}k {lang === 'th' ? 'คน/วัน' : '/day'})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Compact / Expandable Station Timeline */}
                  {stations.length <= 3 || isExpanded ? (
                    <>
                      {hasIntermediate && isExpanded && (
                        <div
                          className="intermediate-toggle-row is-expanded"
                          onClick={() => toggleSegment(sIdx)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="intermediate-line-notch" />
                          <button className="intermediate-toggle-btn" type="button">
                            <span className="toggle-chevron">▴</span>
                            <span>{t("hideStops", lang, { n: intermediateCount })}</span>
                          </button>
                        </div>
                      )}
                      {stations.map((canonicalName, idx) =>
                        renderStationRow(canonicalName, idx, idx === 0, idx === stations.length - 1)
                      )}
                    </>
                  ) : (
                    <>
                      {/* First Station (Boarding) */}
                      {renderStationRow(stations[0], 0, true, false)}

                      {/* Compact Intermediate Summary Notch (Click to Expand) */}
                      <div
                        className="intermediate-toggle-row"
                        onClick={() => toggleSegment(sIdx)}
                        role="button"
                        tabIndex={0}
                        title={t("showStops", lang, { n: intermediateCount })}
                      >
                        <div className="intermediate-line-notch" />
                        <button className="intermediate-toggle-btn" type="button">
                          <span className="toggle-chevron">▾</span>
                          <span>
                            {t("intermediateStops", lang, {
                              n: intermediateCount,
                              time: (stations.length - 1) * 2
                            })}
                          </span>
                          <span className="toggle-hint">
                            ({t("showStops", lang, { n: intermediateCount })})
                          </span>
                        </button>
                      </div>

                      {/* Last Station (Arrival / Transfer) */}
                      {renderStationRow(stations[stations.length - 1], stations.length - 1, false, true)}
                    </>
                  )}
                </div>
              );
            } else if (step.type === 'transfer') {
              const fromLineColor = getLineColor(step.fromLine);
              const toLineColor = getLineColor(step.toLine);
              const toLineName = getLineName(step.toLine, lang);
              const stationDisplayName = getStationNameOnly(step.to, lang);

              const transferText = t("transferInstruction", lang, {
                toLine: toLineName,
                station: stationDisplayName
              });

              return (
                <div key={`transfer-${sIdx}`} className="interchange-block">
                  <div className="interchange-icon">🔄</div>
                  <div className="interchange-details">
                    <div className="interchange-title">{t("transferHeader", lang)}</div>
                    <div className="interchange-desc">{transferText}</div>
                    <div className="corridor-pills" style={{ marginTop: '0.35rem' }}>
                      <span className="line-pill" style={{ backgroundColor: fromLineColor, fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                        {getLineName(step.fromLine, lang)}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>➔</span>
                      <span className="line-pill" style={{ backgroundColor: toLineColor, fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                        {toLineName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </section>
  );
}

