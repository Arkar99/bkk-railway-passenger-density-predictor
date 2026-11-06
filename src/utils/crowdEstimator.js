/**
 * Crowd Density Estimator & Forecaster
 *
 * Infers rail crowd density based on:
 *   - Day of week (Weekday commuter peak vs Weekend leisure)
 *   - Thai National Public Holidays & Festival seasons (Songkran, New Year, Long Weekends)
 *   - Operator-specific baseline volumes learned from daily_passenger.csv
 *   - Live FastAPI integration if server is active
 */

export const THAI_HOLIDAYS = {
  '01-01': { en: "New Year's Day", th: "วันขึ้นปีใหม่" },
  '01-02': { en: "New Year Holiday", th: "วันหยุดชดเชยปีใหม่" },
  '02-26': { en: "Makha Bucha Day", th: "วันมาฆบูชา" },
  '04-06': { en: "Chakri Memorial Day", th: "วันจักรี" },
  '04-13': { en: "Songkran Festival", th: "วันสงกรานต์" },
  '04-14': { en: "Songkran Festival", th: "วันสงกรานต์" },
  '04-15': { en: "Songkran Festival", th: "วันสงกรานต์" },
  '05-01': { en: "National Labor Day", th: "วันแรงงานแห่งชาติ" },
  '05-04': { en: "Coronation Day", th: "วันฉัตรมงคล" },
  '06-03': { en: "Queen Suthida's Birthday", th: "วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี" },
  '07-28': { en: "King Rama X's Birthday", th: "วันเฉลิมพระชนมพรรษา ร.10" },
  '08-12': { en: "Mother's Day", th: "วันแม่แห่งชาติ" },
  '10-13': { en: "King Rama IX Memorial Day", th: "วันนวมินทรมหาราช" },
  '10-23': { en: "Chulalongkorn Day", th: "วันปิยมหาราช" },
  '12-05': { en: "National Day / Father's Day", th: "วันชาติ / วันพ่อแห่งชาติ" },
  '12-10': { en: "Constitution Day", th: "วันรัฐธรรมนูญ" },
  '12-31': { en: "New Year's Eve", th: "วันสิ้นปี" }
};

export function getHolidayInfo(dateObj) {
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const key = `${month}-${day}`;
  return THAI_HOLIDAYS[key] || null;
}

export function estimateRouteCrowd(dateStr, linesUsed = []) {
  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const holiday = getHolidayInfo(dateObj);

  // Base density coefficient
  let baseScore = 65; // Normal base %
  let statusEn = "Moderate";
  let statusTh = "ปานกลาง";
  let badgeColor = "#eab308"; // Amber
  let notesEn = "Standard transit volume";
  let notesTh = "ความหนาแน่นระดับปกติ";

  if (holiday) {
    if (holiday.en.includes("Songkran")) {
      baseScore = 40;
      statusEn = "Light / Low";
      statusTh = "เบาบาง";
      badgeColor = "#10b981"; // Emerald
      notesEn = `Songkran Festival (${holiday.en}) — City outbound migration, light rail crowd`;
      notesTh = `เทศกาลสงกรานต์ (${holiday.th}) — ผู้โดยสารเบาบาง เดินทางสะดวก`;
    } else if (holiday.en.includes("New Year")) {
      baseScore = 50;
      statusEn = "Moderate";
      statusTh = "ปานกลาง";
      badgeColor = "#38bdf8";
      notesEn = `${holiday.en} — Festive holiday traffic`;
      notesTh = `${holiday.th} — วันหยุดเทศกาล ผู้โดยสารเดินทางท่องเที่ยว`;
    } else {
      baseScore = 45;
      statusEn = "Light";
      statusTh = "เบาบาง";
      badgeColor = "#10b981";
      notesEn = `Public Holiday (${holiday.en}) — Off-peak schedule`;
      notesTh = `วันหยุดราชการ (${holiday.th}) — การโดยสารไม่หนาแน่น`;
    }
  } else if (isWeekend) {
    if (dayOfWeek === 6) { // Saturday
      baseScore = 58;
      statusEn = "Moderate";
      statusTh = "ปานกลาง";
      badgeColor = "#38bdf8";
      notesEn = "Saturday leisure & shopping travel";
      notesTh = "วันเสาร์ — การเดินทางท่องเที่ยวและพักผ่อน";
    } else { // Sunday
      baseScore = 48;
      statusEn = "Light";
      statusTh = "เบาบาง";
      badgeColor = "#10b981";
      notesEn = "Sunday relaxed travel volume";
      notesTh = "วันอาทิตย์ — โดยสารคล่องตัว เบาบาง";
    }
  } else {
    // Weekdays
    if (dayOfWeek === 1 || dayOfWeek === 5) { // Mon / Fri (heaviest rush)
      baseScore = 84;
      statusEn = "Crowded";
      statusTh = "หนาแน่นสูง";
      badgeColor = "#ef4444"; // Red
      notesEn = dayOfWeek === 1 ? "Monday morning commuter peak rush" : "Friday evening weekend peak rush";
      notesTh = dayOfWeek === 1 ? "วันจันทร์ — การเดินทางช่วงชั่วโมงเร่งด่วนหนาแน่นสูง" : "วันศุกร์ — ชั่วโมงเร่งด่วนช่วงเย็นหนาแน่นสูง";
    } else {
      baseScore = 74;
      statusEn = "Busy";
      statusTh = "คึกคัก";
      badgeColor = "#f97316"; // Orange
      notesEn = "Standard weekday commuter flow";
      notesTh = "วันธรรมดา — ปริมาณการเดินทางทำงานตามปกติ";
    }
  }

  // Corridors weighting: BTS Green & MRT Blue carry over 75% of total Bangkok network passengers!
  const hasMajorCorridor = linesUsed.some(l => l === 'BTS_Sukhumvit' || l === 'BTS_Silom' || l === 'MRT_Blue');
  if (hasMajorCorridor && !holiday && !isWeekend) {
    baseScore = Math.min(95, baseScore + 6);
  }

  // Generate line-specific crowd density predictions
  const LINE_OFFSETS = {
    'BTS_Sukhumvit': { offset: 5, approxPsg: 820000 },
    'BTS_Silom': { offset: 4, approxPsg: 750000 },
    'BTS_Green': { offset: 5, approxPsg: 820000 },
    'MRT_Blue': { offset: 4, approxPsg: 485000 },
    'ARL': { offset: 7, approxPsg: 75000 },
    'MRT_Purple': { offset: 5, approxPsg: 81000 },
    'SRT_Red_Dark': { offset: -3, approxPsg: 37000 },
    'SRT_Red_Light': { offset: -5, approxPsg: 25000 },
    'SRT_Red_North': { offset: -3, approxPsg: 37000 },
    'SRT_Red_West': { offset: -5, approxPsg: 25000 },
    'SRT_Red': { offset: -3, approxPsg: 37000 },
    'MRT_Yellow': { offset: 2, approxPsg: 52000 },
    'MRT_Pink': { offset: -4, approxPsg: 65000 },
    'BTS_Gold': { offset: -18, approxPsg: 7000 },
  };

  const linesMap = {};
  const linesToEstimate = linesUsed.length > 0 ? linesUsed : Object.keys(LINE_OFFSETS);
  for (const lineId of linesToEstimate) {
    const info = LINE_OFFSETS[lineId] || { offset: 0, approxPsg: 50000 };
    let linePct = Math.min(100, Math.max(15, baseScore + info.offset));
    if (holiday && (holiday.en.includes("Songkran") || holiday.en.includes("New Year")) && lineId === 'BTS_Gold') {
      linePct = 95;
    }

    let lStatusEn = "Moderate";
    let lStatusTh = "ปานกลาง";
    let lColor = "#eab308";
    if (linePct >= 85) {
      lStatusEn = "Crowded";
      lStatusTh = "หนาแน่นสูง";
      lColor = "#ef4444";
    } else if (linePct >= 70) {
      lStatusEn = "Busy";
      lStatusTh = "คึกคัก";
      lColor = "#f97316";
    } else if (linePct < 50) {
      lStatusEn = "Light";
      lStatusTh = "เบาบาง";
      lColor = "#10b981";
    }

    linesMap[lineId] = {
      density_pct: linePct,
      densityPct: linePct,
      status_en: lStatusEn,
      statusEn: lStatusEn,
      status_th: lStatusTh,
      statusTh: lStatusTh,
      badge_color: lColor,
      badgeColor: lColor,
      predicted_passengers: Math.round(info.approxPsg * (linePct / 80)),
      predictedPassengers: Math.round(info.approxPsg * (linePct / 80)),
      notes_en: notesEn,
      notesEn: notesEn,
      notes_th: notesTh,
      notesTh: notesTh,
    };
  }

  return {
    date: dateStr,
    dayOfWeek,
    isWeekend,
    isHoliday: !!holiday,
    holidayName: holiday,
    score: baseScore,
    statusEn,
    statusTh,
    badgeColor,
    notesEn,
    notesTh,
    lines: linesMap
  };
}

/**
 * Asynchronously fetches live ML predictions from the Python FastAPI service.
 * Falls back to offline heuristic estimator if the server is offline.
 */
export async function fetchLiveRouteCrowd(dateStr, linesUsed = []) {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const linesParam = linesUsed.join(',');
    const url = `${apiBase.replace(/\/$/, '')}/api/predict?date=${dateStr}${linesParam ? `&lines=${linesParam}` : ''}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.composite || data.lines) {
        // Normalize lines dictionary for easy access in frontend
        const normalizedLines = {};
        if (data.lines) {
          for (const [k, v] of Object.entries(data.lines)) {
            normalizedLines[k] = {
              densityPct: v.density_pct ?? v.densityPct,
              density_pct: v.density_pct ?? v.densityPct,
              statusEn: v.status_en ?? v.statusEn,
              status_en: v.status_en ?? v.statusEn,
              statusTh: v.status_th ?? v.statusTh,
              status_th: v.status_th ?? v.statusTh,
              badgeColor: v.badge_color ?? v.badgeColor,
              badge_color: v.badge_color ?? v.badgeColor,
              predictedPassengers: v.predicted_passengers ?? v.predictedPassengers,
              predicted_passengers: v.predicted_passengers ?? v.predictedPassengers,
              notesEn: v.notes_en ?? v.notesEn,
              notes_en: v.notes_en ?? v.notesEn,
              notesTh: v.notes_th ?? v.notesTh,
              notes_th: v.notes_th ?? v.notesTh,
            };
          }
        }

        return {
          date: data.date,
          dayOfWeek: data.day_of_week,
          isWeekend: data.is_weekend,
          isHoliday: data.is_holiday,
          holidayName: data.holiday,
          score: data.composite ? data.composite.score : 70,
          statusEn: data.composite ? data.composite.status_en : 'Moderate',
          statusTh: data.composite ? data.composite.status_th : 'ปานกลาง',
          badgeColor: data.composite ? data.composite.badge_color : '#eab308',
          notesEn: data.composite ? data.composite.notes_en : '',
          notesTh: data.composite ? data.composite.notes_th : '',
          lines: normalizedLines,
          isLiveML: true
        };
      }
    }
  } catch (err) {
    // API unreachable, gracefully use offline estimator
  }

  return { ...estimateRouteCrowd(dateStr, linesUsed), isLiveML: false };
}


