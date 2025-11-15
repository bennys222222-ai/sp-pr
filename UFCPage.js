import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./UFCPage.css";
import { fetchSchedule, fetchEvent, fetchFighters } from "../api/sportsdata";

const ANALYSIS_TABS = ["Matchup", "Result", "Strikes", "Grappling", "Odds"];
const MIN_LOADING_MS = 650;

const FLAG_IMAGE = {
  us: "/flags/us.svg",
  ug: "/flags/ug.svg",
  do: "/flags/do.svg",
  hr: "/flags/hr.svg",
  zw: "/flags/zw.svg",
  cu: "/flags/cu.svg",
  ro: "/flags/ro.svg",
  br: "/flags/br.svg",
  kr: "/flags/kr.svg",
  mx: "/flags/mx.svg",
  gb: "/flags/gb.svg",
  ca: "/flags/ca.svg",
  au: "/flags/au.svg",
  nz: "/flags/nz.svg",
  ru: "/flags/ru.svg",
  jp: "/flags/jp.svg",
  cn: "/flags/cn.svg",
  de: "/flags/de.svg",
  es: "/flags/es.svg",
  it: "/flags/it.svg",
  se: "/flags/se.svg",
  no: "/flags/no.svg",
  fi: "/flags/fi.svg",
  pl: "/flags/pl.svg",
  za: "/flags/za.svg",
  ng: "/flags/ng.svg",
  il: "/flags/il.svg",
  ae: "/flags/ae.svg",
  ie: "/flags/ie.svg",
  nl: "/flags/nl.svg",
  be: "/flags/be.svg",
  ch: "/flags/ch.svg",
  cz: "/flags/cz.svg",
  sk: "/flags/sk.svg",
  at: "/flags/at.svg",
  ar: "/flags/ar.svg",
  cl: "/flags/cl.svg",
  co: "/flags/co.svg",
  pe: "/flags/pe.svg",
  ph: "/flags/ph.svg",
  th: "/flags/th.svg",
  vn: "/flags/vn.svg",
  in: "/flags/in.svg",
  pk: "/flags/pk.svg",
  ma: "/flags/ma.svg",
  cm: "/flags/cm.svg",
  gh: "/flags/gh.svg",
  pr: "/flags/pr.svg",
  pt: "/flags/pt.svg",
  dk: "/flags/dk.svg",
  hu: "/flags/hu.svg",
  fr: "/flags/fr.svg",
};

const ISO3_TO_ISO2 = {
  USA: "us",
  CAN: "ca",
  MEX: "mx",
  BRA: "br",
  ARG: "ar",
  CHL: "cl",
  PER: "pe",
  COL: "co",
  FRA: "fr",
  GBR: "gb",
  ENG: "gb",
  IRL: "ie",
  ESP: "es",
  ITA: "it",
  DEU: "de",
  GER: "de",
  SWE: "se",
  NOR: "no",
  DNK: "dk",
  FIN: "fi",
  POL: "pl",
  NLD: "nl",
  BEL: "be",
  PRT: "pt",
  CHE: "ch",
  AUT: "at",
  ROU: "ro",
  HRV: "hr",
  SRB: "rs",
  SVN: "si",
  SVK: "sk",
  CZE: "cz",
  RUS: "ru",
  UKR: "ua",
  BLR: "by",
  GEO: "ge",
  ARM: "am",
  KAZ: "kz",
  UZB: "uz",
  KGZ: "kg",
  CHN: "cn",
  JPN: "jp",
  KOR: "kr",
  PRK: "kp",
  THA: "th",
  VNM: "vn",
  PHL: "ph",
  AUS: "au",
  NZL: "nz",
  ZAF: "za",
  NGA: "ng",
  GHA: "gh",
  CMR: "cm",
  MAR: "ma",
  EGY: "eg",
  TUN: "tn",
  DZA: "dz",
  UGA: "ug",
  KEN: "ke",
  TZA: "tz",
  ZWE: "zw",
  DOM: "do",
  CUB: "cu",
  PRI: "pr",
  BHS: "bs",
  JAM: "jm",
  PAN: "pa",
  CRI: "cr",
  ECU: "ec",
  BOL: "bo",
  VEN: "ve",
  LKA: "lk",
  IND: "in",
  PAK: "pk",
  ARE: "ae",
  QAT: "qa",
  SAU: "sa",
  ISR: "il",
  TUR: "tr",
  GRC: "gr",
  ALB: "al",
  BIH: "ba",
  MNE: "me",
  MKD: "mk",
  HUN: "hu",
  LTU: "lt",
  LVA: "lv",
  EST: "ee",
  MDA: "md",
  BGR: "bg",
  CYP: "cy",
  SGP: "sg",
  MYS: "my",
  IDN: "id",
};
const COUNTRY_TO_CODE = {
  "united states": "us",
  "united states of america": "us",
  usa: "us",
  america: "us",
  "united kingdom": "gb",
  england: "gb",
  scotland: "gb",
  "northern ireland": "gb",
  britain: "gb",
  brazil: "br",
  canada: "ca",
  mexico: "mx",
  france: "fr",
  spain: "es",
  italy: "it",
  germany: "de",
  ireland: "ie",
  sweden: "se",
  norway: "no",
  denmark: "dk",
  netherlands: "nl",
  belgium: "be",
  "dominican republic": "do",
  poland: "pl",
  croatia: "hr",
  serbia: "rs",
  georgia: "ge",
  russia: "ru",
  ukraine: "ua",
  belarus: "by",
  australia: "au",
  "new zealand": "nz",
  china: "cn",
  japan: "jp",
  korea: "kr",
  "south korea": "kr",
  uganda: "ug",
  nigeria: "ng",
  ghana: "gh",
  cameroon: "cm",
  morocco: "ma",
  cuba: "cu",
  romania: "ro",
  argentina: "ar",
  chile: "cl",
  peru: "pe",
  colombia: "co",
  "puerto rico": "pr",
  "czech republic": "cz",
  slovakia: "sk",
  switzerland: "ch",
  austria: "at",
  lithuania: "lt",
  latvia: "lv",
  estonia: "ee",
  philippines: "ph",
  thailand: "th",
  vietnam: "vn",
  "south africa": "za",
  zimbabwe: "zw",
  greece: "gr",
  turkey: "tr",
  israel: "il",
  india: "in",
  pakistan: "pk",
  "united arab emirates": "ae",
  kazakhstan: "kz",
  uzbekistan: "uz",
  kyrgyzstan: "kg",
  moldova: "md",
  "north korea": "kp",
  "trinidad and tobago": "tt",
  albania: "al",
  "costa rica": "cr",
  "bosnia and herzegovina": "ba",
};

const DEFAULT_FLAG = "/flags/default.svg";
const DEFAULT_AVATAR = "/assets/fighters/default-avatar.png";
const SHADOW_FALLBACK = "/assets/fighters/SHADOW_Fighter_fullLength_BLUE.avif";
const OFFLINE_EVENT_OPTION = {
  id: "offline-event",
  name: "UFC Fight Night (Offline)",
  date: null,
};

const ORIENTATION_MARKERS = new Set(["L", "R", "BLUE", "RED", "SILH", "SILHOUETTE", "CARD"]);
const IGNORED_NAME_TOKENS = new Set(["BELT", "BELTMOCK", "MOCK", "TITLE", "CHAMP", "CHAMPIONSHIP"]);

const FIGHTER_FILE_NAMES = [
  "7c76e7f9-1248-4c83-84d4-e9afba9f5247%2FDAUKAUS_KYLE_L_06-18.avif",
  "ALENCAR_TALITA_L_12-09.avif",
  "AMIL_HYDER_L_06-28.avif",
  "ARDELEAN_ALICE_R_07-27.avif",
  "BARCELOS_RAONI_R_06-14.avif",
  "BLANCHFIELD_ERIN_L_05-31.avif",
  "BONFIM_GABRIEL_L_07-25.avif",
  "BONFIM_ISMAEL_R_11-04.avif",
  "BRADY_SEAN_L_09-07.avif",
  "BROWN_RANDY_R_06-01.avif",
  "BUENO_SILVA_MAYRA_L_06-29.avif",
  "CARNELOSSI_ARIANE_R_05-18.avif",
  "CAVALCANTI_JACQUELINE_R_02-15.avif",
  "CHRISTIAN_KEVIN_L_09-24.avif",
  "CORTES-ACOSTA_WALDO_L_03-15.avif",
  "CORTEZ_TRACY_R_06-28.avif",
  "CUAMBA_TIMOTHY_L_04-26.avif",
  "DARIUSH_BENEIL_L_06-28.avif",
  "DELIJA_ANTE_R_09-06.avif",
  "DELLA_MADDALENA_JACK_L_BELTMOCK.avif",
  "DELVALLE_YADIER_R_10-15.avif",
  "DULGARIAN_ISAAC_L_09-07.avif",
  "DUMAS_SEDRIQUES_R_06-24.avif",
  "DUMONT_NORMA_R_09-14.avif",
  "DUNCAN_CHRISTIAN_LEROY_L_03-22.avif",
  "EDWARDS_LEON_L_03-22.avif",
  "ELEKANA_BILLY_L_01-18.avif",
  "EMMERS_JAMALL_R_03-30.avif",
  "ESTEVAM_RAFAEL_R_11-18.avif",
  "FRUNZA_DANIEL_R_04-05.avif",
  "GARCIA_STEVE_L_09-07.avif",
  "GOMES_DENISE_R_05-17.avif",
  "GORIMBO_THEMBA_R_12-07.avif",
  "HADDON_CODY_R_10-12.avif",
  "HILL_ANGELA_L_02-15.avif",
  "HOKIT_JOSH_L_08-19.avif",
  "JOHNS_MILES_L_08-09.avif",
  "JOHNSON_DONTE_L_08-26.avif",
  "KLINE_FATIMA_R_07-13.avif",
  "KO_SEOKHYEON_L_06-21.avif",
  "KOPYLOV_ROMAN_L_01-11.avif",
  "LEE_CHANGHO_R_04-05.avif",
  "MAKHACHEV_ISLAM_R_10-22.avif",
  "MARCOS_DANIEL_R_05-03.avif",
  "MARISCAL_CHEPE_R_03-01.avif",
  "MCCONICO_ERIC_R_08-09.avif",
  "MCVEY_JACKSON_R_07-19.avif",
  "MEDIC_UROS_R_01-11.avif",
  "MEERSCHAERT_GERALD_R_04-05.avif",
  "MORALES_JOSEPH_R_08-16.avif",
  "MORALES_MICHAEL_R_05-17.avif",
  "NASCIMENTO_ALLAN_L_01-14.avif",
  "NICKAL_BO_L_11-16.avif",
  "ONAMA_DAVID_R_04-26.avif",
  "PADILLA_CHRIS_L_04-27.avif",
  "PENNINGTON_TECIA_L_05-17.avif",
  "PRATES_CARLOS_R_08-16.avif",
  "RADTKE_CHARLES_L_06-08.avif",
  "ROWE_PHIL_L_06-14.avif",
  "RUIZ_MONTSERRAT_CONEJO_R_11-04.avif",
  "SABATINI_PAT_L_04-05.avif",
  "SAINT_DENIS_BENOIT_R_09-28.avif",
  "SALIKHOV_MUSLIM_L_07-26.avif",
  "SCHNELL_MATT_L_04-26.avif",
  "SHADOW_Fighter_fullLength_BLUE.avif",
  "SHEVCHENKO_VALENTINA_BELT_L_05-10.avif",
  "SIMON_RICKY_L_06-14.avif",
  "SUSURKAEV_BAYSANGUR_L_08-16.avif",
  "TULIO_MARCO_R_04-12.avif",
  "VALENTIN_ROBERT_R_07-19.avif",
  "VIEIRA_KETLEN_L_05-31.avif",
  "VIEIRA_RODOLFO_R_04-29.avif",
  "WEILI_ZHANG_R_06-11.avif",
  "WELLMAN_MALCOLM_L_06-14.avif",
  "WELLS_JEREMIAH_L_08-05.avif",
];
function normalizeKey(value) {
  if (value == null) {
    return "";
  }
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeDirectoryKey(value, prefix) {
  if (value == null || value === "") {
    return "";
  }
  const base = String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
  return base ? `${prefix}:${base}` : "";
}

function collectSupplementalFighterData(fightData = {}) {
  const buckets = [
    fightData.FighterResults,
    fightData.FighterOdds,
    fightData.FighterProps,
    fightData.FighterStats,
    fightData.FighterTotals,
    fightData.FightStats,
    fightData.Stats,
    fightData.StatLines,
  ];

  const directory = new Map();

  buckets.forEach((bucket) => {
    if (!Array.isArray(bucket)) {
      return;
    }
    bucket.forEach((item) => {
      if (!item) {
        return;
      }
      const keys = [
        item.FighterId,
        item.FighterID,
        item.EventFighterId,
        item.EventFighterID,
        item.PlayerId,
        item.PlayerID,
        item.PersonId,
        item.PersonID,
      ];

      for (const key of keys) {
        const normalized = normalizeDirectoryKey(key, "id");
        if (!normalized) {
          continue;
        }
        if (!directory.has(normalized)) {
          directory.set(normalized, { ...item });
        } else {
          Object.assign(directory.get(normalized), item);
        }
        break;
      }
    });
  });

  return directory;
}

function mergeSupplementalEntry(entry = {}, supplementalDirectory) {
  if (!supplementalDirectory || supplementalDirectory.size === 0) {
    return { ...entry };
  }

  const keys = [
    entry.FighterId,
    entry.FighterID,
    entry.EventFighterId,
    entry.EventFighterID,
    entry.PlayerId,
    entry.PlayerID,
    entry.PersonId,
    entry.PersonID,
  ];

  for (const key of keys) {
    const normalized = normalizeDirectoryKey(key, "id");
    if (normalized && supplementalDirectory.has(normalized)) {
      return { ...supplementalDirectory.get(normalized), ...entry };
    }
  }

  return { ...entry };
}

function titleCaseToken(token) {
  return token
    .split("-")
    .map((segment) => (segment ? segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase() : segment))
    .join("-");
}

function decodeFighterNameFromFile(file) {
  const decoded = decodeURIComponent(file).replace(/\.[^.]+$/, "");
  const tokens = decoded.split("_");
  const filtered = [];
  for (const token of tokens) {
    if (!token) {
      continue;
    }
    const cleanedToken = token.includes("/") ? token.split("/").pop() : token;
    const upper = cleanedToken.toUpperCase();
    if (ORIENTATION_MARKERS.has(upper) || IGNORED_NAME_TOKENS.has(upper)) {
      break;
    }
    if (/^[0-9\-]+$/.test(cleanedToken)) {
      break;
    }
    filtered.push(cleanedToken);
  }

  if (!filtered.length) {
    return null;
  }

  const firstNameToken = filtered.pop();
  const firstName = titleCaseToken(firstNameToken);
  const lastName = filtered.map((token) => titleCaseToken(token.replace(/%2F/gi, "/"))).join(" ");
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (!fullName) {
    return null;
  }
  return {
    fullName,
    firstName,
    lastName,
  };
}

function buildLocalFighterAssets(files) {
  const map = new Map();
  files.forEach((file) => {
    if (!file) {
      return;
    }
    const nameParts = decodeFighterNameFromFile(file);
    if (!nameParts) {
      return;
    }
    const encodedName = file.includes("%") ? file.replace(/%/g, "%25") : encodeURIComponent(file);
    const path = `/assets/fighters/${encodedName}`;
    const variants = [
      nameParts.fullName,
      `${nameParts.firstName} ${nameParts.lastName}`,
      `${nameParts.lastName} ${nameParts.firstName}`,
      nameParts.lastName,
      nameParts.firstName,
    ];
    variants
      .map((variant) => normalizeKey(variant))
      .filter(Boolean)
      .forEach((key) => {
        if (!map.has(key)) {
          map.set(key, path);
        }
      });
  });
  return map;
}

let localFighterAssetsCache = null;

function getLocalFighterAssets() {
  if (!localFighterAssetsCache) {
    localFighterAssetsCache = buildLocalFighterAssets(FIGHTER_FILE_NAMES);
  }
  return localFighterAssetsCache;
}

function resolveLocalImage(name) {
  if (!name) {
    return null;
  }
  const assets = getLocalFighterAssets();
  const key = normalizeKey(name);
  if (assets.has(key)) {
    return assets.get(key);
  }
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length) {
    const lastKey = normalizeKey(parts[parts.length - 1]);
    if (assets.has(lastKey)) {
      return assets.get(lastKey);
    }
    const initialsKey = normalizeKey(`${parts[0]}${parts[parts.length - 1]}`);
    if (assets.has(initialsKey)) {
      return assets.get(initialsKey);
    }
  }
  return null;
}

function sanitizeImageUrl(url) {
  if (!url) {
    return null;
  }
  const trimmed = String(url).trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice(7)}`;
  }
  return trimmed;
}

function coalesce(...values) {
  for (const value of values) {
    if (value === 0 || value === false) {
      return value;
    }
    if (value != null && value !== "") {
      return value;
    }
  }
  return null;
}

function cleanText(value) {
  if (value == null) {
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function formatHeight(value) {
  if (value == null || value === "") {
    return "—";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "—";
    }
    if (/\d'\d+"/.test(trimmed) || trimmed.includes("cm")) {
      return trimmed;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return formatHeight(numeric);
    }
    return trimmed;
  }
  const inches = Number(value);
  if (!Number.isFinite(inches) || inches <= 0) {
    return "—";
  }
  const feet = Math.floor(inches / 12);
  const remainder = Math.round(inches % 12);
  return `${feet}'${remainder}"`;
}

function formatWeight(value) {
  if (value == null || value === "") {
    return "—";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "—";
    }
    if (trimmed.toLowerCase().includes("lb") || trimmed.toLowerCase().includes("kg")) {
      return trimmed;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return `${numeric} lb`;
    }
    return trimmed;
  }
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${value} lb`;
}

function formatReach(value) {
  if (value == null || value === "") {
    return "—";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "—";
    }
    if (trimmed.toLowerCase().includes("in")) {
      return trimmed;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return `${numeric} in`;
    }
    return trimmed;
  }
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${value} in`;
}

function computeAgeFromDate(dateValue) {
  if (!dateValue) {
    return null;
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const diff = Date.now() - date.getTime();
  const age = diff / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(age);
}

function formatAge(value) {
  if (value == null || value === "") {
    return "—";
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return `${numeric}`;
    }
    return value.trim();
  }
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${Math.round(value)}`;
}

function formatNumber(value, digits = 1) {
  if (value == null || value === "") {
    return "—";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return cleanText(value);
  }
  return numeric.toFixed(digits).replace(/\.0+$/, "").replace(/\.([1-9])0$/, ".$1");
}

function formatPercentage(value, digits = 0) {
  if (value == null || value === "") {
    return "—";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return cleanText(value);
  }
  const percent = numeric > 1 ? numeric : numeric * 100;
  return `${percent.toFixed(digits)}%`;
}

function formatAttempt(landed, attempted) {
  if (landed == null && attempted == null) {
    return "—";
  }
  const landedText = landed == null ? "—" : formatNumber(landed, 0);
  const attemptedText = attempted == null ? "—" : formatNumber(attempted, 0);
  if (landedText === "—" && attemptedText === "—") {
    return "—";
  }
  return `${landedText} / ${attemptedText}`;
}

function formatSeconds(value) {
  if (value == null || value === "") {
    return "—";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    const text = cleanText(value);
    return text || "—";
  }
  const totalSeconds = Math.max(0, Math.round(numeric));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatClock(value) {
  if (!value) {
    return "—";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "—";
    }
    if (/^\d+:\d+$/.test(trimmed)) {
      const [minutes, seconds] = trimmed.split(":");
      return `${Number(minutes)}:${seconds.padStart(2, "0")}`;
    }
    if (/^\d+:\d+:\d+$/.test(trimmed)) {
      return trimmed;
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return formatSeconds(numeric);
    }
    return trimmed;
  }
  if (Number.isFinite(value)) {
    return formatSeconds(value);
  }
  return "—";
}

function moneylineToProbability(odds) {
  if (odds == null || odds === "") {
    return null;
  }
  const numeric = Number(odds);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return null;
  }
  if (numeric > 0) {
    return 100 / (numeric + 100);
  }
  return -numeric / (-numeric + 100);
}

function formatOdds(value) {
  if (value == null || value === "") {
    return "—";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return cleanText(value);
  }
  return numeric > 0 ? `+${numeric}` : `${numeric}`;
}

function formatRecordFromTotals(wins, losses, draws, noContests) {
  if (wins == null && losses == null && draws == null) {
    return null;
  }
  const parts = [
    Number.isFinite(Number(wins)) ? Number(wins) : 0,
    Number.isFinite(Number(losses)) ? Number(losses) : 0,
    Number.isFinite(Number(draws)) ? Number(draws) : 0,
  ];
  let record = parts.join("-");
  if (noContests != null && Number.isFinite(Number(noContests)) && Number(noContests) > 0) {
    record += ` (${Number(noContests)} NC)`;
  }
  return record;
}

function resolveFlagCode(...values) {
  for (const value of values) {
    if (!value) {
      continue;
    }
    const raw = String(value).trim();
    if (!raw) {
      continue;
    }
    if (/^[a-z]{2}$/i.test(raw)) {
      return raw.toLowerCase();
    }
    const upper = raw.toUpperCase();
    if (ISO3_TO_ISO2[upper]) {
      return ISO3_TO_ISO2[upper];
    }
    const normalized = raw.toLowerCase();
    if (COUNTRY_TO_CODE[normalized]) {
      return COUNTRY_TO_CODE[normalized];
    }
    const cleaned = normalized.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
    if (COUNTRY_TO_CODE[cleaned]) {
      return COUNTRY_TO_CODE[cleaned];
    }
  }
  return "us";
}

function buildFlagAssets(code, name, ...sources) {
  const assets = [];
  const push = (value) => {
    const sanitized = sanitizeImageUrl(value);
    if (sanitized) {
      assets.push(sanitized);
    }
  };

  const normalized = (code || "").toLowerCase();
  if (normalized && FLAG_IMAGE[normalized]) {
    push(FLAG_IMAGE[normalized]);
  }
  if (normalized) {
    push(`/flags/${normalized}.svg`);
    push(`/flags/${normalized}.png`);
  }
  const localKey = normalizeKey(name);
  if (localKey && FLAG_IMAGE[localKey]) {
    push(FLAG_IMAGE[localKey]);
  }
  sources.forEach(push);
  push(DEFAULT_FLAG);
  return Array.from(new Set(assets.filter(Boolean)));
}

function parseOrderValue(...values) {
  for (const value of values) {
    if (value == null || value === "") {
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const numeric = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }
  return null;
}

function buildRecord(source = {}) {
  const recordText = coalesce(
    source.Record,
    source.record,
    source.PreFightRecord,
    source.FighterRecord
  );
  if (recordText) {
    return cleanText(recordText);
  }
  const wins = coalesce(
    source.Wins,
    source.wins,
    source.RecordWins,
    source.PreFightWins,
    source.FighterWins
  );
  const losses = coalesce(
    source.Losses,
    source.losses,
    source.RecordLosses,
    source.PreFightLosses,
    source.FighterLosses
  );
  const draws = coalesce(
    source.Draws,
    source.draws,
    source.RecordDraws,
    source.PreFightDraws,
    source.FighterDraws
  );
  const noContests = coalesce(
    source.NoContests,
    source.noContests,
    source.RecordNoContests,
    source.PreFightNoContests,
    source.FighterNoContests
  );
  return formatRecordFromTotals(wins, losses, draws, noContests);
}

function buildImageCandidates(name, fighterData = {}, profileData = {}, variant = "card") {
  const candidates = [];
  const seen = new Set();

  const push = (value) => {
    const sanitized = sanitizeImageUrl(value);
    if (sanitized && !seen.has(sanitized)) {
      candidates.push(sanitized);
      seen.add(sanitized);
    }
  };

  const localAsset = resolveLocalImage(name);
  if (localAsset) {
    push(localAsset);
  }

  const curated = variant === "card" ? profileData.CardImage || profileData.cardImage : profileData.FullImage || profileData.fullImage;
  push(curated);

  const fighterCandidates = [
    fighterData.PhotoUrl,
    fighterData.PhotoURL,
    fighterData.Photo,
    fighterData.PhotoUri,
    fighterData.PhotoURI,
    fighterData.HeadshotUrl,
    fighterData.HeadshotURL,
    fighterData.Headshot,
    fighterData.ImageUrl,
    fighterData.ImageURL,
    fighterData.Image,
    fighterData.ImageLink,
    fighterData.CardImage,
    fighterData.cardImage,
    fighterData.PromoCard,
    fighterData.FullImage,
    fighterData.fullImage,
    fighterData.ProfileImage,
    fighterData.ProfileImageUrl,
    fighterData.ProfileImageURL,
    profileData.PhotoUrl,
    profileData.PhotoURL,
    profileData.Photo,
    profileData.HeadshotUrl,
    profileData.HeadshotURL,
    profileData.Headshot,
    profileData.ImageUrl,
    profileData.ImageURL,
    profileData.Image,
    profileData.ProfileImage,
    profileData.ProfileImageUrl,
    profileData.ProfileImageURL,
  ];

  fighterCandidates.forEach(push);

  if (variant === "full" && localAsset) {
    push(localAsset);
  }

  push(SHADOW_FALLBACK);
  push(DEFAULT_AVATAR);

  return candidates;
}

function buildFighterDirectory(fighters = []) {
  const map = new Map();
  fighters.forEach((fighter) => {
    if (!fighter) {
      return;
    }
    const idKeys = [
      fighter.FighterId,
      fighter.FighterID,
      fighter.GlobalId,
      fighter.GlobalID,
      fighter.SportsDataId,
      fighter.SportsDataID,
      fighter.StatsId,
      fighter.StatsID,
      fighter.PersonId,
      fighter.PersonID,
    ];
    idKeys
      .map((key) => normalizeDirectoryKey(key, "id"))
      .filter(Boolean)
      .forEach((key) => {
        if (!map.has(key)) {
          map.set(key, fighter);
        }
      });

    const nameKeys = [
      fighter.Name,
      fighter.FullName,
      fighter.DisplayName,
      fighter.ShortName,
      fighter.PreferredName,
      fighter.Nickname,
      fighter.NickName,
      [fighter.FirstName, fighter.LastName].filter(Boolean).join(" "),
      [fighter.LastName, fighter.FirstName].filter(Boolean).join(" "),
    ];

    nameKeys
      .map((name) => normalizeKey(name))
      .filter(Boolean)
      .forEach((key) => {
        const normalized = `name:${key}`;
        if (!map.has(normalized)) {
          map.set(normalized, fighter);
        }
      });

    const lastKey = normalizeKey(fighter.LastName || fighter.Surname);
    if (lastKey) {
      const normalized = `lastname:${lastKey}`;
      if (!map.has(normalized)) {
        map.set(normalized, fighter);
      }
    }
  });
  return map;
}

function lookupFighterProfile(directory, entry = {}) {
  if (!directory || directory.size === 0) {
    return null;
  }
  const idKeys = [
    entry.FighterId,
    entry.FighterID,
    entry.EventFighterId,
    entry.EventFighterID,
    entry.PlayerId,
    entry.PlayerID,
    entry.PersonId,
    entry.PersonID,
    entry.SourceId,
    entry.SourceID,
  ];

  for (const key of idKeys) {
    const normalized = normalizeDirectoryKey(key, "id");
    if (normalized && directory.has(normalized)) {
      return directory.get(normalized);
    }
  }

  const nameKeys = [
    entry.Name,
    entry.FullName,
    entry.DisplayName,
    entry.ShortName,
    entry.PreferredName,
    entry.Nickname,
    entry.NickName,
    [entry.FirstName, entry.LastName].filter(Boolean).join(" "),
    [entry.LastName, entry.FirstName].filter(Boolean).join(" "),
  ];

  const lastNormalized = normalizeKey(entry.LastName || entry.Surname);
  for (const name of nameKeys) {
    const normalized = normalizeKey(name);
    if (normalized) {
      const lookup = `name:${normalized}`;
      if (directory.has(lookup)) {
        return directory.get(lookup);
      }
    }
    if (lastNormalized) {
      const lastLookup = `lastname:${lastNormalized}`;
      if (directory.has(lastLookup)) {
        return directory.get(lastLookup);
      }
    }
  }
  return null;
}
function buildFighterSide(entry = {}, profile = {}) {
  const primaryName = cleanText(
    coalesce(
      entry.Name,
      entry.FighterName,
      entry.FighterFullName,
      entry.FullName,
      entry.DisplayName,
      entry.KnownAs,
      entry.Nickname,
      entry.NickName,
      entry.PreferredName,
      profile.Name,
      profile.FullName,
      profile.DisplayName,
      profile.KnownAs,
      profile.Nickname
    )
  );

  const derivedName = (() => {
    if (primaryName) {
      return primaryName;
    }
    const first = cleanText(
      coalesce(
        entry.FighterFirstName,
        entry.FirstName,
        entry.PreferredFirstName,
        entry.PersonFirstName,
        profile.FirstName,
        profile.PreferredFirstName
      )
    );
    const last = cleanText(
      coalesce(
        entry.FighterLastName,
        entry.LastName,
        entry.PreferredLastName,
        entry.PersonLastName,
        profile.LastName,
        profile.PreferredLastName
      )
    );
    const combined = [first, last].filter(Boolean).join(" ");
    if (combined) {
      return combined;
    }
    const single = first || last || cleanText(entry.FighterAlias || profile.FighterAlias);
    return single || null;
  })();

  const name = derivedName || "TBA";

  const record =
    buildRecord(entry) ||
    buildRecord(profile) ||
    buildRecord({
      Wins: coalesce(entry.PreFightWins, profile.PreFightWins),
      Losses: coalesce(entry.PreFightLosses, profile.PreFightLosses),
      Draws: coalesce(entry.PreFightDraws, profile.PreFightDraws),
      NoContests: coalesce(entry.PreFightNoContests, profile.PreFightNoContests),
    }) ||
    "—";
  const flagCode = resolveFlagCode(
    entry.Flag,
    entry.FlagCode,
    entry.CountryCode,
    entry.Nationality,
    entry.Country,
    entry.BirthCountry,
    entry.Birthplace,
    entry.BirthPlace,
    profile.Flag,
    profile.FlagCode,
    profile.CountryCode,
    profile.Nationality,
    profile.Country,
    profile.BirthCountry,
    profile.BirthPlace
  );

  const matchupStats = {
    height: formatHeight(
      coalesce(entry.Height, entry.HeightInches, profile.Height, profile.HeightInches)
    ),
    weight: formatWeight(coalesce(entry.Weight, profile.Weight)),
    reach: formatReach(coalesce(entry.Reach, profile.Reach)),
    legReach: formatReach(
      coalesce(entry.LegReach, profile.LegReach, entry.LegReachInches, profile.LegReachInches)
    ),
    stance: cleanText(coalesce(entry.Stance, profile.Stance)) || "—",
    age: formatAge(
      coalesce(
        entry.Age,
        profile.Age,
        computeAgeFromDate(entry.BirthDate),
        computeAgeFromDate(profile.BirthDate)
      )
    ),
    rounds: coalesce(
      entry.Rounds,
      profile.Rounds,
      entry.ScheduledRounds,
      profile.ScheduledRounds
    ),
  };

  const strikesStats = {
    sigLanded: coalesce(entry.SignificantStrikesLanded, entry.SigStrikesLanded, profile.SignificantStrikesLanded),
    sigAttempted: coalesce(entry.SignificantStrikesAttempted, entry.SigStrikesAttempted, profile.SignificantStrikesAttempted),
    sigPerMinute: coalesce(entry.SignificantStrikesLandedPerMinute, profile.SignificantStrikesLandedPerMinute),
    totalLanded: coalesce(entry.TotalStrikesLanded, profile.TotalStrikesLanded),
    totalAttempted: coalesce(entry.TotalStrikesAttempted, profile.TotalStrikesAttempted),
    accuracy: coalesce(entry.SignificantStrikesAccuracy, entry.SignificantStrikesPercentage, profile.SignificantStrikesAccuracy),
    absorbed: coalesce(entry.StrikesAbsorbedPerMinute, profile.StrikesAbsorbedPerMinute),
    knockdowns: coalesce(entry.Knockdowns, entry.KnockdownsLanded, profile.Knockdowns),
  };

  const grapplingStats = {
    takedownsLanded: coalesce(entry.TakedownsLanded, profile.TakedownsLanded),
    takedownsAttempted: coalesce(entry.TakedownsAttempted, profile.TakedownsAttempted),
    takedownAccuracy: coalesce(entry.TakedownAccuracy, profile.TakedownAccuracy),
    takedownAverage: coalesce(entry.TakedownsPer15Minutes, entry.TakedownAveragePer15Minutes, profile.TakedownsPer15Minutes),
    submissions: coalesce(entry.SubmissionAttempts, profile.SubmissionAttempts),
    reversals: coalesce(entry.Reversals, profile.Reversals),
    controlSeconds: coalesce(entry.ControlTimeSeconds, profile.ControlTimeSeconds, entry.ControlTime, profile.ControlTime),
  };

  const resultLabel = cleanText(coalesce(entry.Result, entry.Outcome, entry.ResultType, entry.Decision)) || "—";
  const resultDetailRaw = cleanText(coalesce(entry.ResultDetail, entry.ResultDescription, entry.Method)) || "";
  const resultDetail = resultDetailRaw && /scrambled/i.test(resultDetailRaw) ? "" : resultDetailRaw;

  const resultStats = {
    label: resultLabel,
    detail: resultDetail,
    knockdowns: strikesStats.knockdowns,
    controlSeconds: grapplingStats.controlSeconds,
  };

  const moneyline = coalesce(entry.Moneyline, entry.Odds, entry.Line, profile.Moneyline);
  const openingMoneyline = coalesce(entry.OpeningMoneyline, entry.OpeningLine, profile.OpeningMoneyline);

  const oddsStats = {
    moneyline,
    implied: moneylineToProbability(moneyline),
    opening: openingMoneyline,
    openingImplied: moneylineToProbability(openingMoneyline),
  };

  const totals = {
    wins: coalesce(entry.Wins, profile.Wins, entry.PreFightWins, profile.PreFightWins),
    losses: coalesce(entry.Losses, profile.Losses, entry.PreFightLosses, profile.PreFightLosses),
    draws: coalesce(entry.Draws, profile.Draws, entry.PreFightDraws, profile.PreFightDraws),
    noContests: coalesce(
      entry.NoContests,
      profile.NoContests,
      entry.PreFightNoContests,
      profile.PreFightNoContests
    ),
  };

  return {
    id: entry.FighterId || entry.FighterID || profile.FighterId || profile.FighterID || name,
    name,
    record,
    flagCode,
    flagAssets: buildFlagAssets(
      flagCode,
      name,
      entry.FlagImageUrl,
      entry.FlagImageURL,
      entry.FlagIcon,
      profile.FlagImageUrl,
      profile.FlagImageURL,
      profile.FlagIcon
    ),
    cardImages: buildImageCandidates(name, entry, profile, "card"),
    fullImages: buildImageCandidates(name, entry, profile, "full"),
    stats: {
      matchup: matchupStats,
      strikes: strikesStats,
      grappling: grapplingStats,
    },
    result: resultStats,
    odds: oddsStats,
    totals,
  };
}

function buildFight(fightData, fighterDirectory) {
  const supplementalDirectory = collectSupplementalFighterData(fightData);

  const fighters = Array.isArray(fightData?.Fighters) ? [...fightData.Fighters] : [];
  fighters.sort((a, b) => {
    const orderA = parseOrderValue(a.Order, a.SortOrder, a.Sequence, a.Number);
    const orderB = parseOrderValue(b.Order, b.SortOrder, b.Sequence, b.Number);
    if (orderA != null && orderB != null) {
      return orderA - orderB;
    }
    return 0;
  });

  if (fighters.length < 2) {
    return null;
  }

  const enrichedFighters = fighters.map((entry) => mergeSupplementalEntry(entry, supplementalDirectory));

  const entry1 = enrichedFighters[0];
  const entry2 = enrichedFighters[1];
  const profile1 = lookupFighterProfile(fighterDirectory, entry1) || {};
  const profile2 = lookupFighterProfile(fighterDirectory, entry2) || {};

  const fighter1 = buildFighterSide(entry1, profile1);
  const fighter2 = buildFighterSide(entry2, profile2);

  const weightClass = cleanText(
    coalesce(
      fightData.WeightClass,
      fightData.WeightClassDescription,
      fightData.Division,
      fightData.Class,
      fightData.Description
    )
  );
  const titleFight = Boolean(
    fightData.TitleFight ||
      fightData.IsTitleFight ||
      (weightClass && weightClass.toLowerCase().includes("title")) ||
      (fightData.Description && fightData.Description.toLowerCase().includes("title"))
  );

  const mainEvent = Boolean(
    fightData.MainEvent ||
      fightData.IsMainEvent ||
      (fightData.CardSegment && fightData.CardSegment.toLowerCase().includes("main")) ||
      (fightData.Sequence && String(fightData.Sequence).toLowerCase().includes("main"))
  );

  const coMainEvent = Boolean(
    fightData.CoMainEvent ||
      fightData.IsCoMainEvent ||
      (fightData.Description && fightData.Description.toLowerCase().includes("co-main")) ||
      (fightData.Name && fightData.Name.toLowerCase().includes("co-main"))
  );

  let rounds = coalesce(
    fightData.NumberOfRounds,
    fightData.ScheduledRounds,
    fightData.Rounds,
    fightData.TotalRounds,
    fightData.RoundLimit,
    fighter1.stats.matchup.rounds,
    fighter2.stats.matchup.rounds,
    weightClass && weightClass.toLowerCase().includes("title") ? 5 : null,
    mainEvent ? 5 : null,
    titleFight ? 5 : null,
    3
  );

  if (rounds != null && rounds !== "") {
    const numeric = Number(rounds);
    if (Number.isFinite(numeric) && numeric > 0) {
      rounds = Math.round(numeric);
    } else if (typeof rounds === "string") {
      const digits = rounds.match(/\d+/);
      if (digits) {
        const parsed = Number(digits[0]);
        if (Number.isFinite(parsed) && parsed > 0) {
          rounds = parsed;
        }
      }
    }
    if (Number.isFinite(rounds) && rounds <= 0) {
      rounds = null;
    }
  }

  if (Number.isFinite(rounds)) {
    const maxRounds = titleFight || mainEvent ? 5 : 3;
    if (rounds > maxRounds) {
      rounds = maxRounds;
    }
    if (rounds < 1) {
      rounds = null;
    }
  } else {
    rounds = null;
  }

  const fightStatus = cleanText(coalesce(fightData.Status, fightData.FightStatus, fightData.Result, "Scheduled"));
  let method = cleanText(
    coalesce(
      fightData.Method,
      fightData.MethodOfVictory,
      fightData.Outcome,
      fightData.ResultDescription,
      fightData.Decision
    )
  );

  if (method && /scrambled/i.test(method)) {
    method = "";
  }

  const finishRound = coalesce(fightData.EndingRound, fightData.ResultRound, fightData.RoundEnded, fightData.Round);
  const finishTime = coalesce(fightData.EndingTime, fightData.ResultTime, fightData.Time, fightData.TimeElapsed);
  const referee = cleanText(coalesce(fightData.Referee, fightData.Official, fightData.RefereeName));
  const judges = cleanText(
    coalesce(fightData.Judges, fightData.Scorecard, fightData.Scorecards, fightData.DecisionDetails)
  );

  const winnerId = coalesce(
    fightData.WinnerId,
    fightData.WinnerID,
    fightData.WinningFighterId,
    fightData.WinningFighterID
  );

  const winnerName = cleanText(
    coalesce(
      enrichedFighters.find((entry) => entry.FighterId === winnerId || entry.FighterID === winnerId)?.Name,
      fightData.Winner,
      fightData.WinningFighter
    )
  );

  const resultSummary = winnerName && method ? `${winnerName} • ${method}` : method || fightStatus || "Scheduled";

  const detailParts = [];
  if (titleFight) {
    detailParts.push("Championship Bout");
  }
  if (weightClass) {
    detailParts.push(weightClass);
  }
  if (Number.isFinite(rounds)) {
    detailParts.push(`${rounds} Rounds`);
  }
  const broadcast = cleanText(
    coalesce(fightData.Broadcast, fightData.TvStation, fightData.Network, fightData.Stream)
  );
  if (broadcast) {
    detailParts.push(broadcast);
  }
  const detailLine = detailParts.join(" • ");

  const overUnder = coalesce(fightData.OverUnder, fightData.TotalRounds, fightData.Total);
  const overOdds = coalesce(fightData.OverOdds, fightData.OverPayout, fightData.OverLine);
  const underOdds = coalesce(fightData.UnderOdds, fightData.UnderPayout, fightData.UnderLine);

  const favoriteName = (() => {
    const implied1 = fighter1.odds.implied;
    const implied2 = fighter2.odds.implied;
    if (implied1 != null && implied2 != null) {
      if (implied1 > implied2) {
        return fighter1.name;
      }
      if (implied2 > implied1) {
        return fighter2.name;
      }
    }
    return winnerName || null;
  })();

  const orderRank = parseOrderValue(
    fightData.Order,
    fightData.SortOrder,
    fightData.CardOrder,
    fightData.CardSequence,
    fightData.EventOrder,
    fightData.EventSequence,
    fightData.MatchNumber,
    fightData.FightNumber,
    fightData.SequenceNumber,
    fightData.Sequence
  );

  let cardSegment = cleanText(fightData.CardSegment).toLowerCase();
  if (!cardSegment && fightData.CardSegmentDescription) {
    cardSegment = cleanText(fightData.CardSegmentDescription).toLowerCase();
  }
  if (!cardSegment) {
    if (mainEvent || coMainEvent || titleFight) {
      cardSegment = "main";
    }
  }

  const fallbackRank = mainEvent ? -10 : coMainEvent ? -5 : 100;

  const resultLabel1 = fighter1.result.label !== "—" ? fighter1.result.label : winnerName ? (winnerName === fighter1.name ? "Win" : "Loss") : fightStatus;
  const resultLabel2 = fighter2.result.label !== "—" ? fighter2.result.label : winnerName ? (winnerName === fighter2.name ? "Win" : "Loss") : fightStatus;
  fighter1.result.label = resultLabel1;
  fighter2.result.label = resultLabel2;
  fighter1.result.winner = winnerName === fighter1.name;
  fighter2.result.winner = winnerName === fighter2.name;

  return {
    id: fightData.FightId || fightData.FightID || fightData.EventFightId || `${fighter1.id}-${fighter2.id}`,
    fightKey: `${fighter1.id}-${fighter2.id}`,
    fighter1,
    fighter2,
    weightClass,
    detailLine,
    rounds: Number.isFinite(rounds) ? rounds : titleFight || mainEvent ? 5 : 3,
    titleFight,
    mainEvent,
    coMainEvent,
    cardSegment,
    fightStatus,
    method,
    finishRound,
    finishTime,
    referee,
    judges,
    winnerName,
    resultSummary,
    overUnder,
    overOdds,
    underOdds,
    favoriteName,
    orderRank,
    fallbackRank,
  };
}

function splitFightCards(fights = []) {
  const ordered = [...fights].filter(Boolean);

  const getSegmentPriority = (fight) => {
    if (fight.mainEvent) {
      return 6;
    }
    if (fight.coMainEvent) {
      return 5;
    }
    if (fight.titleFight) {
      return 4;
    }
    const segment = (fight.cardSegment || "").toLowerCase();
    if (segment.includes("main")) {
      return 3;
    }
    if (segment.includes("feature")) {
      return 2;
    }
    if (segment.includes("prelim")) {
      return 1;
    }
    return 0;
  };

  const parseNumber = (value) => {
    if (value == null || value === "") {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const compareFights = (a, b) => {
    const priorityDiff = getSegmentPriority(b) - getSegmentPriority(a);
    if (priorityDiff) {
      return priorityDiff;
    }

    const roundsA = parseNumber(a.rounds) ?? 0;
    const roundsB = parseNumber(b.rounds) ?? 0;
    const roundsDiff = roundsB - roundsA;
    if (roundsDiff) {
      return roundsDiff;
    }

    const orderA = parseNumber(a.orderRank);
    const orderB = parseNumber(b.orderRank);
    if (orderA != null || orderB != null) {
      if (orderA == null) {
        return 1;
      }
      if (orderB == null) {
        return -1;
      }
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    }

    const fallbackA = parseNumber(a.fallbackRank);
    const fallbackB = parseNumber(b.fallbackRank);
    if (fallbackA != null || fallbackB != null) {
      if (fallbackA == null) {
        return 1;
      }
      if (fallbackB == null) {
        return -1;
      }
      if (fallbackA !== fallbackB) {
        return fallbackA - fallbackB;
      }
    }

    return (a.fightKey || "").localeCompare(b.fightKey || "");
  };

  ordered.sort(compareFights);

  const main = [];
  const prelims = [];
  const undecided = [];

  ordered.forEach((fight) => {
    const segment = fight.cardSegment || "";
    if (fight.mainEvent || fight.coMainEvent || segment.includes("main")) {
      main.push(fight);
    } else if (segment.includes("prelim") || segment.includes("early")) {
      prelims.push(fight);
    } else {
      undecided.push(fight);
    }
  });

  if (main.length === 0 && undecided.length) {
    const mainCount = Math.min(5, Math.ceil((ordered.length || 1) / 2));
    main.push(...undecided.splice(0, mainCount));
  }

  if (undecided.length) {
    prelims.push(...undecided);
  }

  if (main.length === 0 && prelims.length) {
    main.push(prelims.shift());
  }

  const used = new Set(main.map((fight) => fight.fightKey));
  if (!prelims.length && ordered.length > main.length) {
    ordered.forEach((fight) => {
      if (!used.has(fight.fightKey)) {
        prelims.push(fight);
      }
    });
  }

  const finalize = (list) => list.sort(compareFights);

  finalize(main);
  finalize(prelims);

  if (main.length) {
    main[0].mainEvent = true;
    if (!main[0].rounds) {
      main[0].rounds = 5;
    }
  }

  return { main, prelims };
}

function formatEventDate(value) {
  if (!value) {
    return "Date TBA";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date TBA";
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventOptionDate(value) {
  if (!value) {
    return "TBA";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "TBA";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
function formatList(value) {
  if (!value) {
    return "—";
  }
  if (Array.isArray(value)) {
    if (!value.length) {
      return "—";
    }
    return value.map((item) => cleanText(item)).filter(Boolean).join(", ") || "—";
  }
  return cleanText(value) || "—";
}

function FightCard({ fight, accent, onOpenAnalysis }) {
  const left = fight.fighter1;
  const right = fight.fighter2;

  const flagCandidates1 = useMemo(
    () => left.flagAssets?.length ? left.flagAssets : buildFlagAssets(left.flagCode, left.name),
    [left.flagAssets, left.flagCode, left.name]
  );
  const flagCandidates2 = useMemo(
    () => right.flagAssets?.length ? right.flagAssets : buildFlagAssets(right.flagCode, right.name),
    [right.flagAssets, right.flagCode, right.name]
  );

  const cardCandidates1 = useMemo(
    () => left.cardImages?.length ? left.cardImages : buildImageCandidates(left.name, {}, {}, "card"),
    [left.cardImages, left.name]
  );
  const cardCandidates2 = useMemo(
    () => right.cardImages?.length ? right.cardImages : buildImageCandidates(right.name, {}, {}, "card"),
    [right.cardImages, right.name]
  );

  const [flagIndex1, setFlagIndex1] = useState(0);
  const [flagIndex2, setFlagIndex2] = useState(0);
  const [cardIndex1, setCardIndex1] = useState(0);
  const [cardIndex2, setCardIndex2] = useState(0);

  useEffect(() => {
    setFlagIndex1(0);
  }, [flagCandidates1.join("|")]);

  useEffect(() => {
    setFlagIndex2(0);
  }, [flagCandidates2.join("|")]);

  useEffect(() => {
    setCardIndex1(0);
  }, [cardCandidates1.join("|")]);

  useEffect(() => {
    setCardIndex2(0);
  }, [cardCandidates2.join("|")]);

  const flagSrc1 = flagCandidates1[flagIndex1] || DEFAULT_FLAG;
  const flagSrc2 = flagCandidates2[flagIndex2] || DEFAULT_FLAG;
  const cardSrc1 = cardCandidates1[cardIndex1] || DEFAULT_AVATAR;
  const cardSrc2 = cardCandidates2[cardIndex2] || DEFAULT_AVATAR;

  const handleFlagError1 = () => {
    setFlagIndex1((prev) => (prev + 1 < flagCandidates1.length ? prev + 1 : prev));
  };
  const handleFlagError2 = () => {
    setFlagIndex2((prev) => (prev + 1 < flagCandidates2.length ? prev + 1 : prev));
  };
  const handleCardError1 = () => {
    setCardIndex1((prev) => (prev + 1 < cardCandidates1.length ? prev + 1 : prev));
  };
  const handleCardError2 = () => {
    setCardIndex2((prev) => (prev + 1 < cardCandidates2.length ? prev + 1 : prev));
  };

  const cardClassNames = [
    "fight-card",
    accent ? `accent-${accent}` : "",
    fight.titleFight ? "title" : "",
    fight.mainEvent ? "fight-card--main-event" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClassNames}>
      <header className="fight-card__header">
        <div className="fight-card__side fight-card__side--left">
          <span className="fight-card__name">{left.name}</span>
          <span className="fight-card__record">{left.record}</span>
        </div>
        <div className="fight-card__versus">
          <div className="fight-card__flags">
            <img src={flagSrc1} alt={`${left.name} flag`} loading="lazy" onError={handleFlagError1} />
            <span className="fight-card__vs">VS</span>
            <img src={flagSrc2} alt={`${right.name} flag`} loading="lazy" onError={handleFlagError2} />
          </div>
          {fight.weightClass && <span className="fight-card__meta">{fight.weightClass}</span>}
          {fight.rounds && <span className="fight-card__meta">{fight.rounds} Rounds</span>}
        </div>
        <div className="fight-card__side fight-card__side--right">
          <span className="fight-card__name">{right.name}</span>
          <span className="fight-card__record">{right.record}</span>
        </div>
      </header>
      <div className="fight-card__images">
        <img src={cardSrc1} alt={left.name} onError={handleCardError1} loading="lazy" />
        <img src={cardSrc2} alt={right.name} onError={handleCardError2} loading="lazy" />
      </div>
      <div className="fight-card__summary">
        {(fight.mainEvent || fight.coMainEvent || fight.titleFight) && (
          <div className="fight-card__badges">
            {fight.mainEvent && <span className="fight-card__badge fight-card__badge--main">Main Event</span>}
            {fight.coMainEvent && !fight.mainEvent && (
              <span className="fight-card__badge fight-card__badge--co">Co-Main Event</span>
            )}
            {fight.titleFight && <span className="fight-card__badge fight-card__badge--title">Title Fight</span>}
          </div>
        )}
        {fight.detailLine && <p className="fight-card__detail">{fight.detailLine}</p>}
      </div>
      <div className="fight-card__footer">
        <button type="button" className="analysis-btn" onClick={() => onOpenAnalysis(fight)}>
          Detailed Comparison
        </button>
        <p className="fight-card__prediction">— No Prediction —</p>
      </div>
    </article>
  );
}

function AnalysisModal({ fight, onClose }) {
  const [activeTab, setActiveTab] = useState(ANALYSIS_TABS[0]);

  useEffect(() => {
    setActiveTab(ANALYSIS_TABS[0]);
  }, [fight?.fightKey]);

  useEffect(() => {
    if (fight) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [fight]);

  if (!fight) {
    return null;
  }

  const left = fight.fighter1;
  const right = fight.fighter2;
  const flagCandidates1 = left.flagAssets || buildFlagAssets(left.flagCode, left.name);
  const flagCandidates2 = right.flagAssets || buildFlagAssets(right.flagCode, right.name);
  const fullCandidates1 = left.fullImages || buildImageCandidates(left.name, {}, {}, "full");
  const fullCandidates2 = right.fullImages || buildImageCandidates(right.name, {}, {}, "full");

  const [flagIndex1, setFlagIndex1] = useState(0);
  const [flagIndex2, setFlagIndex2] = useState(0);
  const [imageIndex1, setImageIndex1] = useState(0);
  const [imageIndex2, setImageIndex2] = useState(0);

  useEffect(() => {
    setFlagIndex1(0);
    setImageIndex1(0);
  }, [flagCandidates1.join("|"), fullCandidates1.join("|")]);

  useEffect(() => {
    setFlagIndex2(0);
    setImageIndex2(0);
  }, [flagCandidates2.join("|"), fullCandidates2.join("|")]);

  const flagSrc1 = flagCandidates1[flagIndex1] || DEFAULT_FLAG;
  const flagSrc2 = flagCandidates2[flagIndex2] || DEFAULT_FLAG;
  const fullSrc1 = fullCandidates1[imageIndex1] || DEFAULT_AVATAR;
  const fullSrc2 = fullCandidates2[imageIndex2] || DEFAULT_AVATAR;

  const handleFlagError1 = () => {
    setFlagIndex1((prev) => (prev + 1 < flagCandidates1.length ? prev + 1 : prev));
  };
  const handleFlagError2 = () => {
    setFlagIndex2((prev) => (prev + 1 < flagCandidates2.length ? prev + 1 : prev));
  };
  const handleImageError1 = () => {
    setImageIndex1((prev) => (prev + 1 < fullCandidates1.length ? prev + 1 : prev));
  };
  const handleImageError2 = () => {
    setImageIndex2((prev) => (prev + 1 < fullCandidates2.length ? prev + 1 : prev));
  };

  const matchupRows = [
    { label: "Height", left: left.stats.matchup.height, right: right.stats.matchup.height },
    { label: "Weight", left: left.stats.matchup.weight, right: right.stats.matchup.weight },
    { label: "Reach", left: left.stats.matchup.reach, right: right.stats.matchup.reach },
    { label: "Leg Reach", left: left.stats.matchup.legReach, right: right.stats.matchup.legReach },
    { label: "Stance", left: left.stats.matchup.stance, right: right.stats.matchup.stance },
    { label: "Age", left: left.stats.matchup.age, right: right.stats.matchup.age },
  ];

  const strikeRows = [
    {
      label: "Significant Strikes",
      left: formatAttempt(left.stats.strikes.sigLanded, left.stats.strikes.sigAttempted),
      right: formatAttempt(right.stats.strikes.sigLanded, right.stats.strikes.sigAttempted),
    },
    {
      label: "Sig. Strikes / Min",
      left: formatNumber(left.stats.strikes.sigPerMinute),
      right: formatNumber(right.stats.strikes.sigPerMinute),
    },
    {
      label: "Total Strikes",
      left: formatAttempt(left.stats.strikes.totalLanded, left.stats.strikes.totalAttempted),
      right: formatAttempt(right.stats.strikes.totalLanded, right.stats.strikes.totalAttempted),
    },
    {
      label: "Striking Accuracy",
      left: formatPercentage(left.stats.strikes.accuracy),
      right: formatPercentage(right.stats.strikes.accuracy),
    },
    {
      label: "Strikes Absorbed / Min",
      left: formatNumber(left.stats.strikes.absorbed),
      right: formatNumber(right.stats.strikes.absorbed),
    },
    {
      label: "Knockdowns",
      left: formatNumber(left.stats.strikes.knockdowns, 0),
      right: formatNumber(right.stats.strikes.knockdowns, 0),
    },
  ];

  const grapplingRows = [
    {
      label: "Takedowns",
      left: formatAttempt(left.stats.grappling.takedownsLanded, left.stats.grappling.takedownsAttempted),
      right: formatAttempt(right.stats.grappling.takedownsLanded, right.stats.grappling.takedownsAttempted),
    },
    {
      label: "Takedown Accuracy",
      left: formatPercentage(left.stats.grappling.takedownAccuracy),
      right: formatPercentage(right.stats.grappling.takedownAccuracy),
    },
    {
      label: "Takedowns / 15 Min",
      left: formatNumber(left.stats.grappling.takedownAverage),
      right: formatNumber(right.stats.grappling.takedownAverage),
    },
    {
      label: "Submission Attempts",
      left: formatNumber(left.stats.grappling.submissions, 0),
      right: formatNumber(right.stats.grappling.submissions, 0),
    },
    {
      label: "Reversals",
      left: formatNumber(left.stats.grappling.reversals, 0),
      right: formatNumber(right.stats.grappling.reversals, 0),
    },
    {
      label: "Control Time",
      left: formatSeconds(left.stats.grappling.controlSeconds),
      right: formatSeconds(right.stats.grappling.controlSeconds),
    },
  ];

  const oddsRows = [
    {
      label: "Moneyline",
      left: formatOdds(left.odds.moneyline),
      right: formatOdds(right.odds.moneyline),
    },
    {
      label: "Implied Probability",
      left: left.odds.implied != null ? formatPercentage(left.odds.implied * 100, 1) : "—",
      right: right.odds.implied != null ? formatPercentage(right.odds.implied * 100, 1) : "—",
    },
    {
      label: "Opening Line",
      left: formatOdds(left.odds.opening),
      right: formatOdds(right.odds.opening),
    },
    {
      label: "Opening Probability",
      left:
        left.odds.openingImplied != null ? formatPercentage(left.odds.openingImplied * 100, 1) : "—",
      right:
        right.odds.openingImplied != null ? formatPercentage(right.odds.openingImplied * 100, 1) : "—",
    },
  ];

  return createPortal(
    <div className="analysis-overlay" onClick={onClose}>
      <div className="analysis-window" onClick={(event) => event.stopPropagation()}>
        <header className="analysis-top">
          <div className="analysis-fighter">
            <img src={fullSrc1} alt={left.name} loading="lazy" onError={handleImageError1} />
            <div className="analysis-fighter__meta">
              <strong>{left.name}</strong>
              <span>{left.record}</span>
              <div className="analysis-fighter__flag">
                <span>{left.flagCode?.toUpperCase()}</span>
                <img src={flagSrc1} alt={`${left.name} flag`} loading="lazy" onError={handleFlagError1} />
              </div>
            </div>
          </div>
          <div className="analysis-summary">
            <span className="analysis-summary__label">VS</span>
            <p className="analysis-summary__headline">{fight.resultSummary}</p>
            {fight.detailLine && <p className="analysis-summary__detail">{fight.detailLine}</p>}
          </div>
          <div className="analysis-fighter analysis-fighter--right">
            <img src={fullSrc2} alt={right.name} loading="lazy" onError={handleImageError2} />
            <div className="analysis-fighter__meta">
              <strong>{right.name}</strong>
              <span>{right.record}</span>
              <div className="analysis-fighter__flag">
                <span>{right.flagCode?.toUpperCase()}</span>
                <img src={flagSrc2} alt={`${right.name} flag`} loading="lazy" onError={handleFlagError2} />
              </div>
            </div>
          </div>
        </header>

        <nav className="analysis-tabs">
          {ANALYSIS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`analysis-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <section className="analysis-content">
          {activeTab === "Matchup" && (
            <div className="analysis-grid">
              {matchupRows.map((row) => (
                <div className="analysis-row" key={row.label}>
                  <span className="analysis-label">{row.label}</span>
                  <span className="analysis-value analysis-value--left">{row.left || "—"}</span>
                  <span className="analysis-value analysis-value--right">{row.right || "—"}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Result" && (
            <div className="analysis-result">
              <div className="analysis-result__column">
                <div className="analysis-row">
                  <span className="analysis-label">Result</span>
                  <span className="analysis-value">{left.result.label || "—"}</span>
                </div>
                <div className="analysis-row">
                  <span className="analysis-label">Knockdowns</span>
                  <span className="analysis-value">{formatNumber(left.result.knockdowns, 0)}</span>
                </div>
                <div className="analysis-row">
                  <span className="analysis-label">Control Time</span>
                  <span className="analysis-value">{formatSeconds(left.result.controlSeconds)}</span>
                </div>
              </div>
              <div className="analysis-result__summary">
                <span>Winner</span>
                <strong>{fight.winnerName || "—"}</strong>
                {fight.resultSummary && <small>{fight.resultSummary}</small>}
                {fight.fightStatus && <small>{fight.fightStatus}</small>}
              </div>
              <div className="analysis-result__column analysis-result__column--right">
                <div className="analysis-row">
                  <span className="analysis-label">Result</span>
                  <span className="analysis-value">{right.result.label || "—"}</span>
                </div>
                <div className="analysis-row">
                  <span className="analysis-label">Knockdowns</span>
                  <span className="analysis-value">{formatNumber(right.result.knockdowns, 0)}</span>
                </div>
                <div className="analysis-row">
                  <span className="analysis-label">Control Time</span>
                  <span className="analysis-value">{formatSeconds(right.result.controlSeconds)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Strikes" && (
            <div className="analysis-grid">
              {strikeRows.map((row) => (
                <div className="analysis-row" key={row.label}>
                  <span className="analysis-label">{row.label}</span>
                  <span className="analysis-value analysis-value--left">{row.left}</span>
                  <span className="analysis-value analysis-value--right">{row.right}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Grappling" && (
            <div className="analysis-grid">
              {grapplingRows.map((row) => (
                <div className="analysis-row" key={row.label}>
                  <span className="analysis-label">{row.label}</span>
                  <span className="analysis-value analysis-value--left">{row.left}</span>
                  <span className="analysis-value analysis-value--right">{row.right}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Odds" && (
            <div className="analysis-odds">
              <div className="analysis-odds__column">
                {oddsRows.map((row) => (
                  <div className="analysis-row" key={`left-${row.label}`}>
                    <span className="analysis-label">{row.label}</span>
                    <span className="analysis-value">{row.left}</span>
                  </div>
                ))}
              </div>
              <div className="analysis-odds__center">
                <div>
                  <span>Over / Under</span>
                  <strong>
                    {fight.overUnder != null ? fight.overUnder : "—"}
                    {fight.overOdds != null || fight.underOdds != null ? (
                      <>
                        <small>
                          {fight.overOdds != null ? ` Over ${formatOdds(fight.overOdds)}` : ""}
                          {fight.underOdds != null ? ` • Under ${formatOdds(fight.underOdds)}` : ""}
                        </small>
                      </>
                    ) : null}
                  </strong>
                </div>
                <div>
                  <span>Favored Fighter</span>
                  <strong>{fight.favoriteName || "—"}</strong>
                </div>
              </div>
              <div className="analysis-odds__column analysis-odds__column--right">
                {oddsRows.map((row) => (
                  <div className="analysis-row" key={`right-${row.label}`}>
                    <span className="analysis-label">{row.label}</span>
                    <span className="analysis-value">{row.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <footer className="analysis-footer">
          <button type="button" className="close-analysis-btn" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
function UFCPage({ onOpenStreams, onOpenBookmakers }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [currentEvent, setCurrentEvent] = useState({ mainCard: [], prelims: [] });
  const [eventMeta, setEventMeta] = useState(null);
  const [eventInsights, setEventInsights] = useState([]);
  const [activeFight, setActiveFight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fightersRef = useRef({ list: [], directory: new Map() });
  const loadingStartRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const loadSchedule = async () => {
      try {
        const schedule = await fetchSchedule();
        if (!mounted) {
          return;
        }
        const source = Array.isArray(schedule?.Events)
          ? schedule.Events
          : Array.isArray(schedule)
          ? schedule
          : [];

        if (!source.length) {
          setEvents([OFFLINE_EVENT_OPTION]);
          return;
        }

        const map = new Map();
        source.forEach((item) => {
          if (!item?.EventId && !item?.EventID) {
            return;
          }
          if (item.Status && !["Scheduled", "Pre-Event", "InProgress"].includes(item.Status)) {
            return;
          }
          const id = String(item.EventId ?? item.EventID);
          const candidateDate = item.Date || item.Day || item.DateTime || item.Updated || item.StartTime || null;
          const existing = map.get(id);
          if (!existing || new Date(candidateDate || 0) < new Date(existing.date || 0)) {
            map.set(id, {
              id,
              name: item.Name || item.ShortName || "UFC Event",
              date: candidateDate,
            });
          }
        });

        const now = Date.now();
        const upcoming = Array.from(map.values())
          .filter((event) => {
            if (!event.date) {
              return true;
            }
            const eventTime = new Date(event.date).getTime();
            if (!Number.isFinite(eventTime)) {
              return true;
            }
            const cutoff = now - 1000 * 60 * 60 * 24 * 2;
            return eventTime >= cutoff;
          })
          .sort((a, b) => {
            const timeA = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
            const timeB = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
            return timeA - timeB;
          });

        const nextEvents = upcoming.length ? [...upcoming, OFFLINE_EVENT_OPTION] : [OFFLINE_EVENT_OPTION];
        setEvents(nextEvents);
      } catch (error) {
        console.error("Schedule Error:", error);
        if (mounted) {
          setEvents([OFFLINE_EVENT_OPTION]);
        }
      }
    };

    loadSchedule();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId && events.length) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    let mounted = true;
    const finishLoading = () => {
      const start = loadingStartRef.current;
      if (!start) {
        setIsLoading(false);
        return;
      }
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_MS) {
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, MIN_LOADING_MS - elapsed);
      } else {
        setIsLoading(false);
      }
    };

    const loadEvent = async () => {
      if (!selectedEventId) {
        setCurrentEvent({ mainCard: [], prelims: [] });
        setEventMeta(null);
        setEventInsights([]);
        return;
      }

      loadingStartRef.current = Date.now();
      setIsLoading(true);
      setActiveFight(null);

      try {
        if (!fightersRef.current.list.length) {
          const fighters = await fetchFighters();
          if (!mounted) {
            return;
          }
          fightersRef.current = {
            list: fighters,
            directory: buildFighterDirectory(fighters),
          };
        }

        if (selectedEventId === "offline-event") {
          const offlineFights = [];
          const offlinePrelims = [];
          const fallbackFighters = fightersRef.current.directory;

          const fallbackEntries = [
            {
              Name: "Steve Garcia",
              FighterId: "garcia-steve",
              Record: "14-5-0",
              CountryCode: "us",
            },
            {
              Name: "David Onama",
              FighterId: "onama-david",
              Record: "13-2-0",
              CountryCode: "ug",
            },
          ];

          const fallbackFight = buildFight(
            {
              Fighters: fallbackEntries,
              WeightClass: "Featherweight",
              CardSegment: "Main",
              Rounds: 3,
              TitleFight: false,
            },
            fallbackFighters
          );

          if (fallbackFight) {
            offlineFights.push(fallbackFight);
          }

          setCurrentEvent({ mainCard: offlineFights, prelims: offlinePrelims });
          setEventMeta({
            name: "UFC Fight Night (Offline Mode)",
            date: null,
            location: "UFC APEX — Las Vegas, NV",
          });
          setEventInsights([
            { label: "Main Event", value: offlineFights[0]?.resultSummary || "TBA", hint: offlineFights[0]?.weightClass },
            { label: "Total Fights", value: offlineFights.length + offlinePrelims.length || "—", hint: "Offline preview" },
          ]);
          finishLoading();
          return;
        }

        const details = await fetchEvent(selectedEventId);
        if (!mounted) {
          return;
        }

        if (!details || !Array.isArray(details.Fights)) {
          setCurrentEvent({ mainCard: [], prelims: [] });
          setEventMeta({
            name: details?.Name || details?.ShortName || "UFC Event",
            date: details?.DateTime || details?.StartTime || details?.Date || null,
            location: formatList(
              [details?.Venue, details?.Arena, details?.City, details?.State, details?.Country].filter(Boolean)
            ),
          });
          setEventInsights([]);
          finishLoading();
          return;
        }

        const fights = details.Fights.map((fight) => buildFight(fight, fightersRef.current.directory)).filter(Boolean);
        const { main, prelims } = splitFightCards(fights);

        const headline = main[0] || null;
        const insights = [];
        if (headline) {
          insights.push({
            label: "Main Event",
            value: `${headline.fighter1.name} vs ${headline.fighter2.name}`,
            hint: headline.weightClass || "Headline bout",
          });
        }
        insights.push({
          label: "Total Fights",
          value: fights.length || "—",
          hint: `${main.length} main • ${prelims.length} prelim`,
        });
        const titleCount = main.filter((fight) => fight.titleFight).length;
        if (titleCount > 0) {
          insights.push({
            label: "Title Fights",
            value: String(titleCount),
            hint: titleCount === 1 ? "Championship bout" : "Multiple belts", 
          });
        }

        setCurrentEvent({ mainCard: main, prelims });
        setEventMeta({
          name: details?.Name || details?.ShortName || "UFC Event",
          date: details?.DateTime || details?.StartTime || details?.Date || null,
          location: formatList(
            [details?.Venue, details?.Arena, details?.Site, details?.City, details?.State, details?.Country].filter(Boolean)
          ),
        });
        setEventInsights(insights);
      } catch (error) {
        console.error("Event Error:", error);
        if (mounted) {
          setCurrentEvent({ mainCard: [], prelims: [] });
          setEventMeta({ name: "UFC Event", date: null, location: "Location TBA" });
          setEventInsights([]);
        }
      } finally {
        if (mounted) {
          finishLoading();
        }
      }
    };

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [selectedEventId]);

  const mainFights = currentEvent.mainCard;
  const prelimFights = currentEvent.prelims;

  return (
    <div className="ufc-page">
      <section className="ufc-hero" id="hero">
        <div className="hero-copy">
          <span className="hero-kicker">Next level fight analytics</span>
          <h1>UFC Predictor</h1>
          <p>
            Track every matchup, study stylistic edges, and prepare wagers with a premium breakdown of upcoming UFC
            events.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={onOpenStreams}>
              Live Streams
            </button>
            <button type="button" onClick={onOpenBookmakers}>
              Top Bookmakers
            </button>
          </div>
        </div>
        <div className="hero-summary">
          <div className="summary-card">
            <span className="summary-title">Platform Vision</span>
            <p>One hub for combat, traditional, and esports intelligence. Football, basketball, boxing, and more soon.</p>
          </div>
          <div className="summary-card">
            <span className="summary-title">AI Roadmap</span>
            <p>Automated tape study, AI pick generation, and pattern detection are currently in private testing.</p>
          </div>
        </div>
      </section>

      <section className="event-shell" id="event-shell">
        <header className="event-toolbar">
          <div className="select-group">
            <label htmlFor="event-select">Upcoming Event</label>
            <div className="custom-dropdown">
              <select
                id="event-select"
                value={selectedEventId || ""}
                onChange={(event) => setSelectedEventId(event.target.value || null)}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} — {formatEventOptionDate(event.date)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="event-actions">
            <button type="button" onClick={() => document.getElementById("main-card")?.scrollIntoView({ behavior: "smooth" })}>
              Main Card
            </button>
            <button type="button" onClick={() => document.getElementById("prelims")?.scrollIntoView({ behavior: "smooth" })}>
              Prelims
            </button>
            <button
              type="button"
              className="event-generate"
              onClick={() => {
                const target = currentEvent.mainCard[0];
                if (target) {
                  setActiveFight(target);
                }
              }}
            >
              Generate Analysis
            </button>
          </div>
        </header>

        {eventMeta && (
          <div className="event-meta" id="analytics">
            <div className="event-meta__core">
              <div>
                <span className="meta-label">Event</span>
                <strong>{eventMeta.name}</strong>
              </div>
              <div>
                <span className="meta-label">Date</span>
                <strong>{formatEventDate(eventMeta.date)}</strong>
              </div>
              <div>
                <span className="meta-label">Location</span>
                <strong>{eventMeta.location || "Location TBA"}</strong>
              </div>
            </div>
            {eventInsights.length > 0 && (
              <div className="event-meta__insights">
                {eventInsights.map((insight) => (
                  <div className="event-meta__card" key={insight.label}>
                    <span className="meta-label">{insight.label}</span>
                    <strong>{insight.value}</strong>
                    {insight.hint && <small>{insight.hint}</small>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="loading-banner">
            <span className="loading-pulse" />
            <span>Updating fight card…</span>
          </div>
        )}

        {currentEvent.mainCard.length ? (
          <>
            <section className="card-section" id="main-card">
              <header className="section-header">
                <h2>Main Card</h2>
                <p>Headline matchups with complete analytics and media.</p>
              </header>
              <div className="fight-pyramid">
                {mainFights.map((fight) => (
                  <FightCard key={fight.fightKey} fight={fight} accent="main" onOpenAnalysis={setActiveFight} />
                ))}
              </div>
            </section>

            {currentEvent.prelims.length > 0 && (
              <section className="card-section" id="prelims">
                <header className="section-header">
                  <h2>Prelims</h2>
                  <p>Prospects and stylistic tests ahead of the marquee attractions.</p>
                </header>
                <div className="fight-pyramid">
                  {prelimFights.map((fight) => (
                    <FightCard key={fight.fightKey} fight={fight} accent="prelim" onOpenAnalysis={setActiveFight} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="no-event-selected">
            <h3>Select an event</h3>
            <p>The fight grid will populate automatically with the next card.</p>
          </div>
        )}
      </section>

      {activeFight && <AnalysisModal fight={activeFight} onClose={() => setActiveFight(null)} />}
    </div>
  );
}

export default UFCPage;