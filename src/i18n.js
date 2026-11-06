/**
 * Internationalization (i18n) & Localization Dictionary
 * Supports English (en) and Thai (th)
 */

export const UI_TEXT = {
  en: {
    appTitle: "Bangkok Rail Route Planner",
    appSubtitle: "BTS, MRT, Airport Rail Link, and SRT Red Lines Network",
    startContainerTitle: "Starting Station",
    destContainerTitle: "Destination Station",
    lineSelectLabel: "1. Train Line",
    stationSelectLabel: "2. Station",
    chooseLinePlaceholder: "-- Choose Train Line --",
    selectLineFirstPlaceholder: "-- Select train line first --",
    chooseStationPlaceholder: "-- Select Station on {line} --",
    swapTooltip: "Swap Origin & Destination",
    findRoutesBtn: "Find Routes",
    resetBtn: "Reset",
    routesTitle: "Travel Routes",
    emptyPrompt: "Please select a <strong>Starting Station</strong> and <strong>Destination Station</strong> above.",
    routeTabBest: "Route 1 (Best)",
    routeTabAlt: "Route {n} (Alternative)",
    stopsLabel: "Stops:",
    transfersLabel: "Transfers:",
    estTimeLabel: "Est. Time:",
    estTimeDirect: "~{total} min (direct)",
    estTimeWithTransfers: "~{total} min (incl. {transfers} transfer{s} ~{transferTime} min)",
    minSuffix: "min",
    rideSegmentHeader: "Riding {stops} stop{s} from <strong>{from}</strong> to <strong>{to}</strong>",
    startBadge: "START",
    destBadge: "DESTINATION",
    interchangeAt: "Interchange at {station}",
    transferBetween: "Transfer: {from} ➔ {to}",
    transferDescription: "Change train from {fromLine} to {toLine}",
    transferHeader: "Line Interchange",
    transferInstruction: "Transfer to {toLine} at {station}",
    noRouteFound: "No valid route found between the selected stations.",
    crowdDisclaimer: "Daily Aggregate Forecast: Predictions reflect total volume across the entire day. Actual density varies significantly between rush hours (07:00–09:00, 17:30–19:30) and quiet off-peak periods.",
    themeDark: "Dark",
    themeLight: "Light",
    langEn: "English",
    langTh: "ไทย",
    compactView: "Compact",
    detailedView: "All Stops",
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    intermediateStops: "Ride {n} stops (~{time} min)",
    hideStops: "Hide {n} stops",
    showStops: "Show {n} stops",
  },
  th: {
    appTitle: "ระบบค้นหาเส้นทางรถไฟฟ้ากรุงเทพฯ",
    appSubtitle: "ครอบคลุม BTS, MRT, รถไฟฟ้าสายสีแดง และ Airport Rail Link",
    startContainerTitle: "สถานีต้นทาง",
    destContainerTitle: "สถานีปลายทาง",
    lineSelectLabel: "1. สายรถไฟฟ้า",
    stationSelectLabel: "2. สถานี",
    chooseLinePlaceholder: "-- เลือกสายรถไฟฟ้า --",
    selectLineFirstPlaceholder: "-- กรุณาเลือกสายรถไฟฟ้าก่อน --",
    chooseStationPlaceholder: "-- เลือกสถานีบน{line} --",
    swapTooltip: "สลับต้นทางและปลายทาง",
    findRoutesBtn: "ค้นหาเส้นทาง",
    resetBtn: "รีเซ็ต",
    routesTitle: "เส้นทางการเดินทาง",
    emptyPrompt: "กรุณาเลือก <strong>สถานีต้นทาง</strong> และ <strong>สถานีปลายทาง</strong> ด้านบน",
    routeTabBest: "เส้นทาง 1 (แนะนำ)",
    routeTabAlt: "เส้นทาง {n} (ทางเลือก)",
    stopsLabel: "จำนวนสถานี:",
    transfersLabel: "เปลี่ยนขบวน:",
    estTimeLabel: "เวลาโดยประมาณ:",
    estTimeDirect: "~{total} นาที (สายตรง)",
    estTimeWithTransfers: "~{total} นาที (รวมเปลี่ยนสาย {transfers} ครั้ง ~{transferTime} นาที)",
    minSuffix: "นาที",
    rideSegmentHeader: "เดินทาง {stops} สถานี จาก <strong>{from}</strong> ไปยัง <strong>{to}</strong>",
    startBadge: "ต้นทาง",
    destBadge: "ปลายทาง",
    interchangeAt: "จุดเชื่อมต่อสถานี {station}",
    transferBetween: "เปลี่ยนสถานี: {from} ➔ {to}",
    transferDescription: "เปลี่ยนจาก {fromLine} ไปยัง {toLine}",
    transferHeader: "จุดเปลี่ยนสายรถไฟฟ้า",
    transferInstruction: "เปลี่ยนไปขึ้น {toLine} ที่สถานี {station}",
    noRouteFound: "ไม่พบเส้นทางที่เหมาะสมระหว่างสองสถานีนี้",
    crowdDisclaimer: "การพยากรณ์ภาพรวมตลอดทั้งวัน: ข้อมูลนี้สะท้อนปริมาณผู้โดยสารรวมทั้งวัน ความหนาแน่นจริงอาจแตกต่างกันอย่างมากระหว่างช่วงเวลาเร่งด่วน (07:00–09:00 น. และ 17:30–19:30 น.) กับช่วงเวลาปกติที่เบาบาง",
    themeDark: "มืด",
    themeLight: "สว่าง",
    langEn: "English",
    langTh: "ไทย",
    compactView: "แบบย่อ",
    detailedView: "แสดงทุกสถานี",
    expandAll: "ขยายทั้งหมด",
    collapseAll: "ย่อทั้งหมด",
    intermediateStops: "ผ่านอีก {n} สถานี (~{time} นาที)",
    hideStops: "ซ่อน {n} สถานี",
    showStops: "แสดง {n} สถานี",
  }
};

export const LINE_DATA = {
  "BTS_Sukhumvit": {
    en: "BTS Green (Sukhumvit)",
    th: "BTS สายสุขุมวิท (สีเขียวอ่อน)",
    color: "#10b981",
    badgeColor: "#059669",
    icon: "🟢"
  },
  "BTS_Silom": {
    en: "BTS Green (Silom)",
    th: "BTS สายสีลม (สีเขียวเข้ม)",
    color: "#047857",
    badgeColor: "#065f46",
    icon: "🟢"
  },
  "BTS_Gold": {
    en: "BTS Gold Line",
    th: "รถไฟฟ้าสายสีทอง",
    color: "#eab308",
    badgeColor: "#ca8a04",
    icon: "🟡"
  },
  "MRT_Blue": {
    en: "MRT Blue Line",
    th: "MRT สายสีน้ำเงิน (เฉลิมรัชมงคล)",
    color: "#2563eb",
    badgeColor: "#1d4ed8",
    icon: "🔵"
  },
  "MRT_Purple": {
    en: "MRT Purple Line",
    th: "MRT สายสีม่วง (ฉลองรัชธรรม)",
    color: "#9333ea",
    badgeColor: "#7e22ce",
    icon: "🟣"
  },
  "MRT_Yellow": {
    en: "MRT Yellow Line",
    th: "MRT สายสีเหลือง (ลาดพร้าว-สำโรง)",
    color: "#f59e0b",
    badgeColor: "#d97706",
    icon: "🟡"
  },
  "MRT_Pink": {
    en: "MRT Pink Line",
    th: "MRT สายสีชมพู (แคราย-มีนบุรี)",
    color: "#f43f5e",
    badgeColor: "#e11d48",
    icon: "🌸"
  },
  "ARL": {
    en: "Airport Rail Link (ARL)",
    th: "รถไฟฟ้าแอร์พอร์ต เรล ลิงก์",
    color: "#dc2626",
    badgeColor: "#b91c1c",
    icon: "✈️"
  },
  "SRT_Red_Dark": {
    en: "SRT Dark Red Line",
    th: "รถไฟฟ้าชานเมือง สายสีแดงเข้ม",
    color: "#991b1b",
    badgeColor: "#7f1d1d",
    icon: "🔴"
  },
  "SRT_Red_Light": {
    en: "SRT Light Red Line",
    th: "รถไฟฟ้าชานเมือง สายสีแดงอ่อน",
    color: "#fb7185",
    badgeColor: "#f43f5e",
    icon: "🔴"
  }
};

/**
 * Thai Translations for Bangkok Rail Stations
 */
export const STATION_THAI = {
  // BTS Sukhumvit
  "Khu Khot": "คูคต",
  "Yaek Kor Por Aor": "แยก คปอ.",
  "Royal Thai Air Force Museum": "พิพิธภัณฑ์กองทัพอากาศ",
  "Bhumibol Adulyadej Hospital": "โรงพยาบาลภูมิพลอดุลยเดช",
  "Saphan Mai": "สะพานใหม่",
  "Sai Yud": "สายหยุด",
  "Phahon Yothin 59": "พหลโยธิน 59",
  "Wat Phra Sri Mahathat": "วัดพระศรีมหาธาตุ",
  "11th Infantry Regiment": "กรมทหารราบที่ 11",
  "Bang Bua": "บางบัว",
  "Royal Forest Department": "กรมป่าไม้",
  "Kasetsart University": "มหาวิทยาลัยเกษตรศาสตร์",
  "Sena Nikhom": "เสนานิคม",
  "Ratchayothin": "รัชโยธิน",
  "Phahon Yothin 24": "พหลโยธิน 24",
  "Ha Yaek Lat Phrao": "ห้าแยกลาดพร้าว",
  "Mo Chit": "หมอชิต",
  "Saphan Khwai": "สะพานควาย",
  "Ari": "อารีย์",
  "Sanam Pao": "สนามเป้า",
  "Victory Monument": "อนุสาวรีย์ชัยสมรภูมิ",
  "Phaya Thai": "พญาไท",
  "Ratchathewi": "ราชเทวี",
  "Siam": "สยาม",
  "Chit Lom": "ชิดลม",
  "Phloen Chit": "เพลินจิต",
  "Nana": "นานา",
  "Asok": "อโศก",
  "Phrom Phong": "พร้อมพงษ์",
  "Thong Lo": "ทองหล่อ",
  "Ekkamai": "เอกมัย",
  "Phra Khanong": "พระโขนง",
  "On Nut": "อ่อนนุช",
  "Bang Chak": "บางจาก",
  "Punnawithi": "ปุณณวิถี",
  "Udom Suk": "อุดมสุข",
  "Bang Na": "บางนา",
  "Bearing": "แบริ่ง",
  "Samrong": "สำโรง",
  "Pu Chao": "ปู่เจ้า",
  "Chang Erawan": "ช้างเอราวัณ",
  "Royal Thai Naval Academy": "โรงเรียนนายเรือ",
  "Pak Nam": "ปากน้ำ",
  "Srinagarindra": "ศรีนครินทร์",
  "Phraek Sa": "แพรกษา",
  "Sai Luat": "สายลวด",
  "Kheha": "เคหะฯ",

  // BTS Silom
  "National Stadium": "สนามกีฬาแห่งชาติ",
  "Ratchadamri": "ราชดำริ",
  "Sala Daeng": "ศาลาแดง",
  "Chong Nonsi": "ช่องนนทรี",
  "Saint Louis": "เซนต์หลุยส์",
  "Surasak": "สุรศักดิ์",
  "Saphan Taksin": "สะพานตากสิน",
  "Krung Thon Buri": "กรุงธนบุรี",
  "Wongwian Yai": "วงเวียนใหญ่",
  "Pho Nimit": "โพธิ์นิมิตร",
  "Talat Phlu": "ตลาดพลู",
  "Wutthakat": "วุฒากาศ",
  "Bang Wa": "บางหว้า",

  // BTS Gold
  "Charoen Nakhon": "เจริญนคร (ไอคอนสยาม)",
  "Khlong San": "คลองสาน",

  // MRT Blue
  "Tha Phra": "ท่าพระ",
  "Charan 13": "จรัญฯ 13",
  "Fai Chai": "ไฟฉาย",
  "Bang Khun Non": "บางขุนนนท์",
  "Bang Yi Khan": "บางยี่ขัน",
  "Sirindhorn": "สิรินธร",
  "Bang Phlat": "บางพลัด",
  "Bang O": "บางอ้อ",
  "Bang Pho": "บางโพ",
  "Tao Poon": "เตาปูน",
  "Bang Sue": "บางซื่อ",
  "Kamphaeng Phet": "กำแพงเพชร",
  "Chatuchak Park": "สวนจตุจักร",
  "Phahon Yothin": "พหลโยธิน",
  "Lat Phrao": "ลาดพร้าว",
  "Ratchadaphisek": "รัชดาภิเษก",
  "Sutthisan": "สุทธิสาร",
  "Huai Khwang": "ห้วยขวาง",
  "Thailand Cultural Centre": "ศูนย์วัฒนธรรมแห่งประเทศไทย",
  "Phra Ram 9": "พระราม 9",
  "Phetchaburi": "เพชรบุรี",
  "Sukhumvit": "สุขุมวิท",
  "Queen Sirikit National Convention Centre": "ศูนย์การประชุมแห่งชาติสิริกิติ์",
  "Khlong Toei": "คลองเตย",
  "Lumphini": "ลุมพินี",
  "Si Lom": "สีลม",
  "Sam Yan": "สามย่าน",
  "Hua Lamphong": "หัวลำโพง",
  "Wat Mangkon": "วัดมังกร",
  "Sam Yot": "สามยอด",
  "Sanam Chai": "สนามไชย",
  "Itsaraphap": "อิสรภาพ",
  "Bang Phai": "บางไผ่",
  "Phetkasem 48": "เพชรเกษม 48",
  "Phasi Charoen": "ภาษีเจริญ",
  "Bang Khae": "บางแค",
  "Lak Song": "หลักสอง",

  // MRT Purple
  "Khlong Bang Phai": "คลองบางไผ่",
  "Talad Bang Yai": "ตลาดบางใหญ่",
  "Sam Yaek Bang Yai": "สามแยกบางใหญ่",
  "Bang Phlu": "บางพลู",
  "Bang Rak Yai": "บางรักใหญ่",
  "Bang Rak Noi Tha It": "บางรักน้อยท่าอิฐ",
  "Sai Ma": "ไทรม้า",
  "Phra Nang Klao Bridge": "สะพานพระนั่งเกล้า",
  "Yaek Nonthaburi 1": "แยกนนทบุรี 1",
  "Bang Krasor": "บางกระสอ",
  "Nonthaburi Civic Center": "ศูนย์ราชการนนทบุรี",
  "Ministry of Public Health": "กระทรวงสาธารณสุข",
  "Yaek Tiwanon": "แยกติวานนท์",
  "Wong Sawang": "วงศ์สว่าง",
  "Bang Son": "บางซ่อน",

  // MRT Yellow
  "Phawana": "ภาวนา",
  "Chok Chai 4": "โชคชัย 4",
  "Lat Phrao 71": "ลาดพร้าว 71",
  "Lat Phrao 83": "ลาดพร้าว 83",
  "Mahat Thai": "มหาดไทย",
  "Lat Phrao 101": "ลาดพร้าว 101",
  "Bang Kapi": "บางกะปิ",
  "Yaek Lam Sali": "แยกลำสาลี",
  "Si Kritha": "ศรีกรีฑา",
  "Hua Mak": "หัวหมาก",
  "Kalantan": "กลันตัน",
  "Si Nut": "ศรีนุช",
  "Srinagarindra 38": "ศรีนครินทร์ 38",
  "Suan Luang Rama IX": "สวนหลวง ร.9",
  "Si Udom": "ศรีอุดม",
  "Si Iam": "ศรีเอี่ยม",
  "Si La Salle": "ศรีลาซาล",
  "Si Bearing": "ศรีแบริ่ง",
  "Si Dan": "ศรีด่าน",
  "Si Thepha": "ศรีเทพา",
  "Thipphawan": "ทิพพวัล",

  // MRT Pink
  "Khae Rai": "แคราย",
  "Sanambin Nam": "สนามบินน้ำ",
  "Samakkhi": "สามัคคี",
  "Royal Irrigation Department": "กรมชลประทาน",
  "Yaek Pak Kret": "แยกปากเกร็ด",
  "Pak Kret Bypass": "เลี่ยงเมืองปากเกร็ด",
  "Chaeng Watthana - Pak Kret 28": "แจ้งวัฒนะ-ปากเกร็ด 28",
  "Si Rat": "ศรีรัช",
  "Muang Thong Thani": "เมืองทองธานี",
  "Chaeng Watthana 14": "แจ้งวัฒนะ 14",
  "Government Complex": "ศูนย์ราชการเฉลิมพระเกียรติ",
  "National Telecom": "โทรคมนาคมแห่งชาติ",
  "Lak Si": "หลักสี่",
  "Rajabhat Phranakhon": "ราชภัฏพระนคร",
  "Ram Inthra 3": "รามอินทรา 3",
  "Lat Pla Khao": "ลาดปลาเค้า",
  "Ram Inthra Kor Mor 4": "รามอินทรา กม.4",
  "Maiyalap": "มัยลาภ",
  "Vacharaphol": "วัชรพล",
  "Ram Inthra Kor Mor 6": "รามอินทรา กม.6",
  "Khu Bon": "คู้บอน",
  "Ram Inthra Kor Mor 9": "รามอินทรา กม.9",
  "Outer Ring Road - Ram Inthra": "วงแหวนรามอินทรา",
  "Nopparat": "นพรัตน์",
  "Bang Chan": "บางชัน",
  "Setthabutbamphen": "เศรษฐบุตรบำเพ็ญ",
  "Min Buri Market": "ตลาดมีนบุรี",
  "Min Buri": "มีนบุรี",

  // ARL
  "Suvarnabhumi (Airport)": "สุวรรณภูมิ (สนามบิน)",
  "Lat Krabang": "ลาดกระบัง",
  "Ban Thap Chang": "บ้านทับช้าง",
  "Ramkhamhaeng": "รามคำแหง",
  "Makkasan": "มักกะสัน",
  "Ratchaprarop": "ราชปรารภ",

  // SRT Red
  "Krung Thep Aphiwat": "กรุงเทพอภิวัฒน์ (กลางบางซื่อ)",
  "Chatuchak": "จตุจักร",
  "Wat Samian Nari": "วัดเสมียนนารี",
  "Bang Khen": "บางเขน",
  "Thung Song Hong": "ทุ่งสองห้อง",
  "Kan Kheha": "การเคหะ",
  "Don Mueang": "ดอนเมือง",
  "Lak Hok": "หลักหก (ม.รังสิต)",
  "Rangsit": "รังสิต",
  "Bang Bumru": "บางบำหรุ",
  "Taling Chan": "ตลิ่งชัน"
};

export function getStationName(stationName, lang = 'en') {
  if (lang === 'th') {
    const thai = STATION_THAI[stationName];
    return thai ? `${thai} (${stationName})` : stationName;
  }
  return stationName;
}

export function getStationNameOnly(stationName, lang = 'en') {
  if (lang === 'th') {
    return STATION_THAI[stationName] || stationName;
  }
  return stationName;
}

export function getLineName(lineId, lang = 'en') {
  const line = LINE_DATA[lineId];
  if (!line) return lineId.replace(/_/g, " ");
  return line[lang] || line.en;
}

export function getLineColor(lineId) {
  return LINE_DATA[lineId]?.color || "#38bdf8";
}

export function getLineIcon(lineId) {
  return LINE_DATA[lineId]?.icon || "";
}

export function t(key, lang = 'en', params = {}) {
  const dict = UI_TEXT[lang] || UI_TEXT.en;
  let text = dict[key] || UI_TEXT.en[key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });
  return text;
}

