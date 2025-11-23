import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/UFCPage.css";
import { getFighterCountry } from "../api/fighterCountries";
import { loadUFCData, mapFighterData, mapFightData, lookupFighter } from "../api/localUFC";
import { getOddsByFighters, oddsToImpliedProbability } from "../api/hardcodedOdds";
import FighterInsightsModal from './FighterInsightsModal';
import FightModalHeader from './FightModalHeader';

function formatLocation(location) {
  if (!location) return "Location TBA";

  // 🔥 FIX: Handle string location from GIDStats
  if (typeof location === 'string') {
    const trimmed = location.trim();
    return trimmed || "Location TBA";
  }

  // Handle object format (old API)
  if (typeof location === 'object') {
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);

    return parts.length ? parts.join(", ") : "Location TBA";
  }

  return "Location TBA";
}

const ANALYSIS_TABS = ["Matchup", "Performance", "Fight History", "Career", "Result", "Strikes", "Grappling", "Odds"];
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
  am: "/flags/am.svg",
  ge: "/flags/ge.svg",
  ps: "/flags/ps.svg",
  kg: "/flags/kg.svg",
  md: "/flags/md.svg",
  bh: "/flags/bh.svg",
  kz: "/flags/kz.svg",
  tj: "/flags/tj.svg",
  mm: "/flags/mm.svg",
  uz: "/flags/uz.svg",
  tr: "/flags/tr.svg",
  az: "/flags/az.svg",
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
  BHR: "bh",
  MMR: "mm",
  TJK: "tj",
  AZE: "az",
  PSE: "ps",
};

const COUNTRY_TO_CODE = {
  "united states": "us",
  "united states of america": "us",
  "vereinigte staaten": "us",
  usa: "us",
  america: "us",
  "united kingdom": "gb",
  england: "gb",
  scotland: "gb",
  "northern ireland": "gb",
  britain: "gb",
  brazil: "br",
  brasilien: "br",
  canada: "ca",
  kanada: "ca",
  mexico: "mx",
  mexiko: "mx",
  france: "fr",
  frankreich: "fr",
  spain: "es",
  spanien: "es",
  italy: "it",
  italien: "it",
  germany: "de",
  deutschland: "de",
  ireland: "ie",
  irland: "ie",
  sweden: "se",
  schweden: "se",
  norway: "no",
  norwegen: "no",
  denmark: "dk",
  dänemark: "dk",
  netherlands: "nl",
  niederlande: "nl",
  belgium: "be",
  belgien: "be",
  "dominican republic": "do",
  "dominikanische republik": "do",
  poland: "pl",
  polen: "pl",
  croatia: "hr",
  kroatien: "hr",
  serbia: "rs",
  serbien: "rs",
  georgia: "ge",
  georgien: "ge",
  russia: "ru",
  russland: "ru",
  ukraine: "ua",
  belarus: "by",
  weißrussland: "by",
  australia: "au",
  australien: "au",
  "new zealand": "nz",
  neuseeland: "nz",
  china: "cn",
  japan: "jp",
  korea: "kr",
  "south korea": "kr",
  südkorea: "kr",
  uganda: "ug",
  nigeria: "ng",
  ghana: "gh",
  cameroon: "cm",
  kamerun: "cm",
  morocco: "ma",
  marokko: "ma",
  cuba: "cu",
  kuba: "cu",
  romania: "ro",
  rumänien: "ro",
  argentina: "ar",
  argentinien: "ar",
  chile: "cl",
  peru: "pe",
  colombia: "co",
  kolumbien: "co",
  "puerto rico": "pr",
  "czech republic": "cz",
  tschechien: "cz",
  slovakia: "sk",
  slowakei: "sk",
  switzerland: "ch",
  schweiz: "ch",
  austria: "at",
  österreich: "at",
  lithuania: "lt",
  litauen: "lt",
  latvia: "lv",
  lettland: "lv",
  estonia: "ee",
  estland: "ee",
  philippines: "ph",
  philippinen: "ph",
  thailand: "th",
  vietnam: "vn",
  "south africa": "za",
  südafrika: "za",
  zimbabwe: "zw",
  simbabwe: "zw",
  greece: "gr",
  griechenland: "gr",
  turkey: "tr",
  türkei: "tr",
  israel: "il",
  india: "in",
  indien: "in",
  pakistan: "pk",
  "united arab emirates": "ae",
  "vereinigte arabische emirate": "ae",
  kazakhstan: "kz",
  kasachstan: "kz",
  uzbekistan: "uz",
  usbekistan: "uz",
  kyrgyzstan: "kg",
  kirgisistan: "kg",
  moldova: "md",
  "republik moldau": "md",
  "north korea": "kp",
  "trinidad and tobago": "tt",
  albania: "al",
  albanien: "al",
  "costa rica": "cr",
  "bosnia and herzegovina": "ba",
  bosnien: "ba",
  armenia: "am",
  armenien: "am",
  palestine: "ps",
  bahrain: "bh",
  tajikistan: "tj",
  tadschikistan: "tj",
  myanmar: "mm",
  portugal: "pt",
  azerbaijan: "az",
  aserbaidschan: "az",
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
  "ABDUL-MALIK_MANSUR_L_06-14.avif",
  "ALIEV_NURULLO_L_01-11.avif",
  "ALMABAYEV_ASU_R_03-01.avif",
  "ALMAKHAN_BEZKAT_L_03-02.avif",
  "ALMEIDA_CESAR_L_01-11.avif",
  "ASLAN_IBO_R_02-22.avif",
  "BAGHDASARYAN_MELSIK_R_02-22.avif",
  "BARANIEWSKI_IWO_R_09-16.avif",
  "BARBER_MAYCEE_L_03-09.avif",
  "BARBOZA_EDSON_L_08-16.avif",
  "BLACHOWICZ_JAN_L_03-22.avif",
  "BRITO_JOANDERSON_L_07-01.avif",
  "BUCHECHA_MARCUS_R_07-26.avif",
  "CEJUDO_HENRY_L_02-22.avif",
  "CERQUEIRA_RAFAEL_R_08-09.avif",
  "CHARRIERE_MORGAN_R_07-12.avif",
  "CHIKADZE_GIGA_L_04-26.avif",
  "COSTA_MELQUIZAEL_L_06-15.avif",
  "CRODEN_MELISSA_L_10-18.avif",
  "DALBY_NICOLAS_L_06-17.avif",
  "DAWSON_GRANT_L_01-18.avif",
  "DUNCAN_CHRIS_R_08-02.avif",
  "DVALISHVILI_MERAB_L_BELT_10-04.avif",
  "FERREIRA_BRUNNO_R_10-26.avif",
  "GAZIEV_SHAMIL_R_03-02.avif",
  "GRAD_BOGDAN_L_02-01.avif",
  "GUSKOV_BOGDAN_R_07-26.avif",
  "HERMANSSON_JACK_L_06-28.avif",
  "HOOKER_DAN_R_08-17.avif",
  "HORTH_JAMEY_LYN_L_06-14.avif",
  "KAPE_MANEL_R_07-27.avif",
  "LEMOS_AMANDA_L_03-08.avif",
  "LODER_RYAN_R_08-24.avif",
  "MACHADO_GARRY_IAN_R_12-07.avif",
  "MCKINNEY_TERRANCE_L_06-28.avif",
  "MENIFIELD_ALONZO_R_08-03.avif",
  "MORENO_BRANDON_L_03-29.avif",
  "MUHAMMAD_BELAL_L_05-06.avif",
  "NAIMOV_MUHAMMAD_L_06-21.avif",
  "NAURDIEV_ISMAIL_L_06-21.avif",
  "NZECHUKWU_KENNEDY_L_07-12.avif",
  "OEZDEMIR_VOLKAN_L_11-23.avif",
  "OLEKSIEJZCUK_CEZARY_R_09-02.avif",
  "OROLBAI_MYKTYBEK_R_06-21.avif",
  "PANTOJA_ALEXANDRE_L_BELT_06-28.avif",
  "PEREZ_ALEX_L_06-15.avif",
  "ROBERTSON_GILLIAN_R_05-03.avif",
  "ROYVAL_BRANDON_L_06-28.avif",
  "SADYKHOV_NAZIM_L_06-21.avif",
  "SANTOS_LUANA_R_08-17.avif",
  "SANTOS_MAIRON_R_05-17.avif",
  "SILVA_KARINE_R_11-16.avif",
  "SPIVAC_SERGHEI_L_06-07.avif",
  "TAIRA_TATSURO_R_10-12.avif",
  "TALBOTT_PAYTON_R_01-18.avif",
  "TOPURIA_ALEKSANDRE_R_02-08.avif",
  "TORRES_MANUEL_R_06-17.avif",
  "TROCOLI_ANTONIO_R_11-09.avif",
  "TSARUKYAN_ARMAN_L_01-18.avif",
  "TURNER_JALIN_R_12-02.avif",
  "ULANBEKOV_TAGIR_L_06-21.avif",
  "VALLEJOS_KEVIN_R_08-02.avif",
  "VAN_JOSHUA_R_06-28.avif",
  "VETTORI_MARVIN_L_07-19.avif",
  "YAKHYAEV_ABDUL-RAKHMAN_L_08-26.avif",
  "YAN_PETR_R_03-09.avif",
  "ZIAM_FARES_R_02-24.avif",
  "BLEDA_TEREZA_R_06-17.avif",
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

const calculatePerFightAverage = (total, fights) => {
  if (!total || !fights || fights === 0) return null;
  const result = (total / fights).toFixed(2);
  return parseFloat(result);
};

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

// ============================================
// CONVERSION HELPERS - FOR DUAL UNITS
// ============================================

function inchesToCm(inches) {
  if (!inches || isNaN(inches)) return null;
  return (inches * 2.54).toFixed(1);
}

function lbsToKg(lbs) {
  if (!lbs || isNaN(lbs)) return null;
  return (lbs * 0.453592).toFixed(1);
}

function parseHeight(heightStr) {
  if (!heightStr || heightStr === '—') return null;
  
  // Handle format like "5'11""
  const match = heightStr.match(/(\d+)'(\d+)/);
  if (match) {
    const feet = parseInt(match[1]);
    const inches = parseInt(match[2]);
    return (feet * 12) + inches;
  }
  
  return null;
}

function parseWeight(weightStr) {
  if (!weightStr || weightStr === '—') return null;
  
  // Extract number from "135 lb" or "135.5 lb"
  const match = weightStr.match(/([\d.]+)/);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return null;
}

function parseReach(reachStr) {
  if (!reachStr || reachStr === '—') return null;
  
  // Extract number from "68 in"
  const match = reachStr.match(/([\d.]+)/);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return null;
}

// Format stat with conversion
function formatStatWithConversion(value, unit, convertFn) {
  if (!value || value === '—') return { primary: '—', secondary: null };
  
  const converted = convertFn ? convertFn(value) : null;
  
  return {
    primary: `${value} ${unit}`,
    secondary: converted ? `${converted} ${unit === 'lb' ? 'kg' : 'cm'}` : null
  };
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

  // 🔥 PRIORITÄT: Lokale Assets ZUERST
  const localAsset = resolveLocalImage(name);
  if (localAsset) {
    push(localAsset);
  }

  // Dann API-Daten
  push(profileData.PhotoUrl || profileData.photoUrl);
  push(fighterData.PhotoUrl || fighterData.photoUrl);

  // Fallback zu Schatten-Bildern
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

async function buildFighterSide(entry = {}, profile = {}, supplemental = {}) {
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
    buildRecord(supplemental) ||
    buildRecord({
      Wins: coalesce(entry.PreFightWins, profile.PreFightWins, supplemental.Wins),
      Losses: coalesce(entry.PreFightLosses, profile.PreFightLosses, supplemental.Losses),
      Draws: coalesce(entry.PreFightDraws, profile.PreFightDraws, supplemental.Draws),
      NoContests: coalesce(entry.PreFightNoContests, profile.PreFightNoContests, supplemental.NoContests),
    }) ||
    "—";

  const flagCode = (() => {
    const apiCode = resolveFlagCode(
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
      profile.BirthPlace,
      supplemental.CountryCode,
      supplemental.Nationality
    );

    if (apiCode && apiCode !== "us") {
      return apiCode;
    }

    return getFighterCountry(name);
  })();

  // 🔥 DIRECT ACCESS TO SCRAPED DATA
  const allSources = { ...supplemental, ...profile, ...entry };

  // 🔥 DEBUG: Check where GID Stats are
  console.log('🔥 DATA STRUCTURE CHECK:', {
    name,
    supplementalKeys: Object.keys(supplemental || {}),
    profileKeys: Object.keys(profile || {}),
    entryKeys: Object.keys(entry || {}),

    // Check if GID stats are nested somewhere
    supplemental_sample: supplemental ? {
      takedownsPerBout: supplemental.takedownsPerBout,
      submissions: supplemental.submissions,
      gidStats: supplemental.gidStats,
    } : null,

    profile_sample: profile ? {
      takedownsPerBout: profile.takedownsPerBout,
      submissions: profile.submissions,
      gidStats: profile.gidStats,
    } : null,

    entry_sample: entry ? {
      takedownsPerBout: entry.takedownsPerBout,
      submissions: entry.submissions,
      gidStats: entry.gidStats,
    } : null,
  });

  const matchupStats = {
    // 🔥 FIX: Read style from GIDStats
    style: cleanText(
      coalesce(
        allSources.style,          // 🔥 MAIN SOURCE from GIDStats
        allSources.Style,
        allSources.FightingStyle,
        allSources.fightingStyle,
        allSources.Discipline
      )
    ) || "—",

    age: formatAge(
      coalesce(
        allSources.Age,
        allSources.age,
        computeAgeFromDate(allSources.BirthDate),
        computeAgeFromDate(allSources.DOB),
        computeAgeFromDate(allSources.dob)
      )
    ),

    height: formatHeight(
      coalesce(
        allSources.Height,
        allSources.HeightInches,
        allSources.heightInches
      )
    ),

    weight: formatWeight(
      coalesce(
        allSources.Weight,
        allSources.WeightLbs,
        allSources.weightLbs
      )
    ),

    reach: formatReach(
      coalesce(
        allSources.Reach,
        allSources.ReachInches,
        allSources.reachInches
      )
    ),

    legReach: formatReach(
      coalesce(
        allSources.LegReach,
        allSources.LegReachInches,
        allSources.legReachInches
      )
    ),

    stance: cleanText(
      coalesce(
        allSources.Stance,
        allSources.stance
      )
    ) || "—",

    rounds: coalesce(
      allSources.Rounds,
      allSources.ScheduledRounds
    ),
  };

  // 🔥 EXTRACT TOTAL FIGHTS from record
  const recordParts = record?.split('-').map(num => parseInt(num) || 0);
  const totalFights = recordParts && recordParts.length >= 2
    ? recordParts.reduce((sum, num) => sum + num, 0)
    : null;

  console.log('🔥 Total Fights Calculated:', {
    name,
    record,
    recordParts,
    totalFights
  });

  console.log('🔥 ALL SOURCES CHECK:', {
    name,
    hasGIDStats: !!allSources,
    totalKeys: Object.keys(allSources).length,

    // 🔥 CHECK BOTH CASES
    submissions_lower: allSources?.submissions,
    SubmissionAttempts_pascal: allSources?.SubmissionAttempts,

    takedownsPerBout_lower: allSources?.takedownsPerBout,
    TakedownsPerFight_pascal: allSources?.TakedownsPerFight,

    takedownsLanded_lower: allSources?.takedownsLanded,
    TakedownsLanded_pascal: allSources?.TakedownsLanded,

    // 🔥 FIND ALL SUBMISSION/TAKEDOWN KEYS
    relevantKeys: Object.keys(allSources).filter(key =>
      key.toLowerCase().includes('submission') ||
      key.toLowerCase().includes('takedown')
    ),
  });

  // 🔥 STRIKES - USE SCRAPED DATA DIRECTLY
  const strikesStats = {
    sigLanded: coalesce(
      allSources.SignificantStrikesLanded,
      allSources.SigStrikesLanded,
      allSources.sigStrikesLanded
    ),
    sigAttempted: coalesce(
      allSources.SignificantStrikesAttempted,
      allSources.SigStrikesAttempted,
      allSources.sigStrikesAttempted
    ),
    sigPerMinute: coalesce(
      allSources.SignificantStrikesLandedPerMinute,
      allSources.SLpM,
      allSources.slpm,
      allSources.sigStrikesLandedPerMin // 🔥 ADD THIS - from GIDStats
    ),
    totalLanded: coalesce(
      allSources.TotalStrikesLanded,
      allSources.totalStrikesLanded
    ),
    totalAttempted: coalesce(
      allSources.TotalStrikesAttempted,
      allSources.totalStrikesAttempted
    ),
    accuracy: coalesce(
      allSources.SignificantStrikesAccuracy,
      allSources.SignificantStrikingAccuracy,
      allSources.StrAcc,
      allSources.strAcc,
      allSources.strikingAccuracy // 🔥 ADD THIS - from GIDStats
    ),
    absorbed: coalesce(
      allSources.SignificantStrikesAbsorbedPerMinute,
      allSources.StrikesAbsorbedPerMinute,
      allSources.SApM,
      allSources.sapm,
      allSources.sigStrikesAbsorbedPerMin // 🔥 ADD THIS - from GIDStats
    ),
    defense: coalesce(
      allSources.SignificantStrikeDefense,
      allSources.StrikingDefense,
      allSources.StrDef,
      allSources.strDef,
      allSources.sigStrikeDefense // 🔥 ADD THIS - from GIDStats
    ),
    knockdowns: coalesce(
      allSources.Knockdowns,
      allSources.KnockdownsLanded,
      allSources.knockdowns
    ),
    knockdownAverage: coalesce(
      allSources.KnockdownAverage,
      allSources.knockdownAvg // 🔥 ADD THIS - from GIDStats
    ),
  };

  // 🔥 GRAPPLING - USE SCRAPED DATA + CALCULATE AVERAGES
  const grapplingStats = {
    takedownsLanded: coalesce(
      allSources.TakedownsLanded,
      allSources.takedownsLanded
    ),
    takedownsAttempted: coalesce(
      allSources.TakedownsAttempted,
      allSources.takedownsAttempted
    ),
    takedownAccuracy: coalesce(
      allSources.TakedownAccuracy,
      allSources.TdAcc,
      allSources.tdAcc,
      allSources.takedownAccuracy
    ),
    takedownAverage: coalesce(
      allSources.TakedownsPer15Minutes,
      allSources.TakedownAveragePer15Minutes,
      allSources.TakedownAverage,
      allSources.TakedownsPerFight,  // 🔥 ADD THIS
      allSources.TdAvg,
      allSources.tdAvg,
      allSources.takedownsPerBout,
      // 🔥 FALLBACK: Calculate from TakedownsLanded + totalFights
      totalFights ? calculatePerFightAverage(
        coalesce(allSources.TakedownsLanded, allSources.takedownsLanded),
        totalFights
      ) : null
    ),
    takedownDefense: coalesce(
      allSources.TakedownDefense,
      allSources.TdDef,
      allSources.tdDef,
      allSources.takedownDefense
    ),
    submissions: coalesce(
      allSources.SubmissionAttempts,
      allSources.submissions,
      allSources.submissionAttempts,
      allSources.WinsSubmission,  // 🔥 FALLBACK: Use submission wins
      allSources.WinsBySubmission
    ),
    submissionAverage: coalesce(
      allSources.SubmissionsPer15Minutes,
      allSources.SubmissionAverage,
      allSources.SubAvg,
      allSources.subAvg,
      allSources.submissionsAvg,
      allSources.SubmissionsPerFight,  // 🔥 ADD THIS
      // 🔥 FALLBACK 1: Calculate from SubmissionAttempts + totalFights
      totalFights ? calculatePerFightAverage(
        coalesce(
          allSources.SubmissionAttempts,
          allSources.submissions,
          allSources.submissionAttempts
        ),
        totalFights
      ) : null,
      // 🔥 FALLBACK 2: Calculate from WinsSubmission (minimum estimate)
      totalFights ? calculatePerFightAverage(
        coalesce(allSources.WinsSubmission, allSources.WinsBySubmission),
        totalFights
      ) : null
    ),
    reversals: coalesce(
      allSources.Reversals,
      allSources.reversals
    ),
    controlSeconds: coalesce(
      allSources.ControlTimeSeconds,
      allSources.ControlTime,
      allSources.controlTimeSeconds,
      allSources.controlTime
    ),
  };

  // 🔥 WIN METHODS - DIRECT FROM SCRAPED DATA
  const winMethodsStats = {
    ko: coalesce(
      allSources.WinsKO,
      allSources.WinsKnockout,
      allSources.WinsByKO,
      allSources.winsKO
    ) || 0,

    sub: coalesce(
      allSources.WinsSub,
      allSources.WinsSubmission,
      allSources.WinsBySubmission,
      allSources.winsSub
    ) || 0,

    dec: coalesce(
      allSources.WinsDec,
      allSources.WinsDecision,
      allSources.WinsByDecision,
      allSources.winsDec
    ) || 0,

    koPercent: parseFloat(coalesce(
      allSources.WinMethodKOPercent,
      allSources.WinMethodKOPercentage,
      allSources.winMethodKOPercent
    )) || 0,

    subPercent: parseFloat(coalesce(
      allSources.WinMethodSubPercent,
      allSources.WinMethodSubPercentage,
      allSources.winMethodSubPercent
    )) || 0,

    decPercent: parseFloat(coalesce(
      allSources.WinMethodDecPercent,
      allSources.WinMethodDecPercentage,
      allSources.winMethodDecPercent
    )) || 0,
  };

  const resultLabel = cleanText(
    coalesce(
      entry.Result,
      entry.Outcome,
      entry.ResultType,
      entry.Decision
    )
  ) || "—";

  const resultDetailRaw = cleanText(
    coalesce(
      entry.ResultDetail,
      entry.ResultDescription,
      entry.Method
    )
  ) || "";

  const resultDetail = (resultDetailRaw && (/scrambled/i.test(resultDetailRaw) || /\d+\s*rounds?/i.test(resultDetailRaw))) ? "" : resultDetailRaw;

  const resultStats = {
    label: resultLabel,
    detail: resultDetail,
    knockdowns: strikesStats.knockdowns,
    controlSeconds: grapplingStats.controlSeconds,
  };

  const moneyline = coalesce(
    entry.Moneyline,
    entry.Odds,
    entry.Line,
    profile.Moneyline,
    supplemental.Moneyline
  );

  const openingMoneyline = coalesce(
    entry.OpeningMoneyline,
    entry.OpeningLine,
    profile.OpeningMoneyline,
    supplemental.OpeningLine
  );

  const oddsStats = {
    moneyline,
    implied: moneylineToProbability(moneyline),
    opening: openingMoneyline,
    openingImplied: moneylineToProbability(openingMoneyline),
  };

  const totals = {
    wins: coalesce(
      entry.Wins,
      profile.Wins,
      entry.PreFightWins,
      profile.PreFightWins,
      supplemental.Wins
    ),
    losses: coalesce(
      entry.Losses,
      profile.Losses,
      entry.PreFightLosses,
      profile.PreFightLosses,
      supplemental.Losses
    ),
    draws: coalesce(
      entry.Draws,
      profile.Draws,
      entry.PreFightDraws,
      profile.PreFightDraws,
      supplemental.Draws
    ),
    noContests: coalesce(
      entry.NoContests,
      profile.NoContests,
      entry.PreFightNoContests,
      profile.PreFightNoContests,
      supplemental.NoContests
    ),
  };

  console.log('🔥 Fighter Stats Built:');
  console.log('  Name:', name);
  console.log('  Record:', record);
  console.log('  Total Fights:', totalFights);
  console.log('  ---');
  console.log('  SubAvg:', grapplingStats.submissionAverage);
  console.log('  Submissions:', grapplingStats.submissions);
  console.log('  SubCalculated:', totalFights ? calculatePerFightAverage(
    coalesce(allSources.submissions, allSources.SubmissionAttempts),
    totalFights
  ) : null);
  console.log('  ---');
  console.log('  TdAvg:', grapplingStats.takedownAverage);
  console.log('  TdLanded:', grapplingStats.takedownsLanded);
  console.log('  ---');
  console.log('  RAW submissions:', allSources.submissions);
  console.log('  RAW submissionsAvg:', allSources.submissionsAvg);
  console.log('  RAW takedownsPerBout:', allSources.takedownsPerBout);

  // 🔥 CALCULATE FIGHTER BADGES
  const badges = {
    // 1. Finish Rate
    finishRate: (() => {
      const totalWins = totals.wins || 0;
      if (totalWins === 0) return null;

      const finishes = (winMethodsStats.ko || 0) + (winMethodsStats.sub || 0);
      const rate = Math.round((finishes / totalWins) * 100);

      return rate >= 60 ? { icon: '⚡', rate, label: `${rate}% Finisher` } : null;
    })(),

    // 2. Age Status
    ageStatus: (() => {
      const numAge = parseFloat(matchupStats.age);
      if (isNaN(numAge)) return null;

      if (numAge < 25) return { icon: '🌟', label: 'Prospect', color: 'blue' };
      if (numAge <= 32) return { icon: '💪', label: 'Prime', color: 'green' };
      if (numAge <= 36) return { icon: '🎓', label: 'Veteran', color: 'orange' };
      return { icon: '⚠️', label: 'Aging', color: 'red' };
    })(),

    // 3. Fighter Type (Striker/Grappler)
    fighterType: (() => {
      const slpm = parseFloat(strikesStats.sigPerMinute) || 0;
      const tdAvg = parseFloat(grapplingStats.takedownAverage) || 0;

      const strikingScore = slpm * 10;
      const grapplingScore = tdAvg * 15;

      if (strikingScore > grapplingScore * 1.5) {
        return { icon: '👊', label: 'Striker', type: 'striker' };
      }

      if (grapplingScore > strikingScore * 1.5) {
        return { icon: '🤼', label: 'Grappler', type: 'grappler' };
      }

      return { icon: '⚖️', label: 'Balanced', type: 'balanced' };
    })(),

    // 4. Fighting Style (Pressure/Counter)
    fightingStyle: (() => {
      const slpm = parseFloat(strikesStats.sigPerMinute) || 0;
      const sapm = parseFloat(strikesStats.absorbed) || 0;

      if (slpm > 4.5 && sapm > 3.5) {
        return { icon: '⚡', label: 'Pressure', type: 'pressure' };
      }

      if (slpm > 4.0 && sapm < 3.0) {
        return { icon: '🎯', label: 'Technical', type: 'technical' };
      }

      if (slpm < 3.5 && sapm < 3.0) {
        return { icon: '🛡️', label: 'Counter', type: 'counter' };
      }

      return null;
    })(),
  };

  console.log('🔥 Fighter Badges:', name, badges);

  // 🔥 ADVANCED METRICS - NEW
  const advancedMetrics = {
    // 1. Fight Pace Score
    pace: (() => {
      const slpm = parseFloat(strikesStats.sigPerMinute) || 0;
      const tdAvg = parseFloat(grapplingStats.takedownAverage) || 0;
      return Math.round((slpm * 10) + (tdAvg * 5));
    })(),

    // 2. Finish Probability
    finishProb: (() => {
      const totalWins = totals.wins || 0;
      if (totalWins === 0) return null;

      const ko = winMethodsStats.ko || 0;
      const sub = winMethodsStats.sub || 0;
      const dec = winMethodsStats.dec || 0;

      const koProb = Math.round((ko / totalWins) * 100);
      const subProb = Math.round((sub / totalWins) * 100);
      const decProb = 100 - koProb - subProb;

      return { ko: koProb, sub: subProb, dec: decProb };
    })(),

    // 3. Danger Zones (0-100 scale)
    dangerZones: (() => {
      const slpm = parseFloat(strikesStats.sigPerMinute) || 0;
      const kdAvg = parseFloat(strikesStats.knockdownAverage) || 0;
      const tdAvg = parseFloat(grapplingStats.takedownAverage) || 0;
      const tdAcc = parseFloat(grapplingStats.takedownAccuracy) || 0;
      const subAvg = parseFloat(grapplingStats.submissionAverage) || 0;
      const submissions = parseFloat(grapplingStats.submissions) || 0;
      const controlSeconds = parseFloat(grapplingStats.controlSeconds) || 0;

      // Standing danger (striking output + KD power)
      const standing = Math.min(100, Math.round((slpm / 6 * 60) + (kdAvg / 2 * 40)));

      // Clinch danger (TD output + accuracy)
      const clinch = Math.min(100, Math.round((tdAvg / 5 * 60) + (tdAcc / 100 * 40)));

      // 🔥 IMPROVED Ground danger formula
      let ground = 0;

      // Base score from submission average (0-50 points)
      const subAvgScore = Math.min(50, Math.round((subAvg / 1.5) * 50));
      ground += subAvgScore;

      console.log('🔥 SubAvg Score:', { subAvg, calculation: `(${subAvg} / 1.5) * 50`, score: subAvgScore, ground });

      // Bonus from total submission attempts (0-30 points)
      const subsScore = Math.min(30, Math.round((submissions / 5) * 30));
      ground += subsScore;

      console.log('🔥 Subs Score:', { submissions, calculation: `(${submissions} / 5) * 30`, score: subsScore, ground });

      // Bonus from control time (0-20 points)
      const controlMinutes = controlSeconds / 60;
      const controlScore = Math.min(20, Math.round((controlMinutes / 3) * 20));
      ground += controlScore;

      console.log('🔥 Control Score:', { controlSeconds, controlMinutes, calculation: `(${controlMinutes} / 3) * 20`, score: controlScore, ground });

      // Cap at 100
      ground = Math.min(100, ground);

      console.log('🔥 Ground Before Minimum:', ground);

      // 🔥 Minimum score: If fighter has ANY submission threat, give at least 15
      if (subAvg > 0 || submissions > 0 || controlSeconds > 60) {
        ground = Math.max(15, ground);
        console.log('🔥 Applied minimum 15:', ground);
      }

      console.log('🔥 FINAL Ground Score:', { name, ground });

      return { standing, clinch, ground };
    })(),

    // 4. Fight IQ Score
    fightIQ: (() => {
      let iq = 50; // Base

      const strAcc = parseFloat(strikesStats.accuracy) || 0;
      const strDef = parseFloat(strikesStats.defense) || 0;
      const sapm = parseFloat(strikesStats.absorbed) || 0;
      const subAvg = parseFloat(grapplingStats.submissionAverage) || 0;
      const tdDef = parseFloat(grapplingStats.takedownDefense) || 0;
      const totalWins = totals.wins || 0;
      const decWins = winMethodsStats.dec || 0;

      // Technical striking
      if (strAcc > 50 && sapm < 3.0) iq += 20;

      // Submission threat
      if (subAvg > 0.5) iq += 15;

      // Takedown defense
      if (tdDef > 70) iq += 10;

      // Decision wins (game planning)
      if (totalWins > 0 && (decWins / totalWins) > 0.5) iq += 5;

      return Math.min(100, iq);
    })(),

    // 5. Durability Score
    durability: (() => {
      let score = 100;

      const totalLosses = totals.losses || 0;
      const lossesKO = totals.lossesKO || 0;
      const sapm = parseFloat(strikesStats.absorbed) || 0;
      const totalWins = totals.wins || 0;
      const decWins = winMethodsStats.dec || 0;

      // Penalize KO losses
      if (totalLosses > 0) {
        const koLossRate = lossesKO / totalLosses;
        score -= koLossRate * 30;
      }

      // Reward decision wins (going distance)
      if (totalWins > 0) {
        const decRate = decWins / totalWins;
        score += decRate * 10;
      }

      // Penalize strikes absorbed
      score -= (sapm / 10) * 15;

      return Math.max(0, Math.min(100, Math.round(score)));
    })(),

    // 6. X-Factors
    xFactors: (() => {
      const factors = [];

      const totalWins = totals.wins || 0;
      const koWins = winMethodsStats.ko || 0;
      const subAvg = parseFloat(grapplingStats.submissionAverage) || 0;
      const strDef = parseFloat(strikesStats.defense) || 0;
      const tdDef = parseFloat(grapplingStats.takedownDefense) || 0;
      const slpm = parseFloat(strikesStats.sigPerMinute) || 0;

      // One-shot power
      if (totalWins > 0 && (koWins / totalWins) > 0.4) {
        factors.push('One-Shot Power');
      }

      // Submission specialist
      if (subAvg > 1) {
        factors.push('Sub Specialist');
      }

      // Elite defense
      if (strDef > 70 && tdDef > 80) {
        factors.push('Elite Defense');
      }

      // High pace
      if (slpm > 5) {
        factors.push('Relentless Pace');
      }

      // Elite wrestler
      const tdAvg = parseFloat(grapplingStats.takedownAverage) || 0;
      const tdAcc = parseFloat(grapplingStats.takedownAccuracy) || 0;
      if (tdAvg > 3 && tdAcc > 50) {
        factors.push('Elite Wrestler');
      }

      return factors;
    })(),
  };

  console.log('🔥 Advanced Metrics:', name, advancedMetrics);

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
      winMethods: winMethodsStats,
    },
    result: resultStats,
    odds: oddsStats,
    totals,
    badges,
    advancedMetrics,

    // 🔥 ADD FIGHT HISTORY
    fightHistory: allSources.fightHistory || profile.fightHistory || entry.fightHistory || []
  };
}

async function buildFight(fightData, fighterDirectory) {
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

  // Get supplemental data for each fighter
  const getSupplemental = (entry) => {
    const key = normalizeDirectoryKey(entry.FighterId || entry.FighterID, "id");
    return key && supplementalDirectory.has(key) ? supplementalDirectory.get(key) : {};
  };

  const supplemental1 = getSupplemental(entry1);
  const supplemental2 = getSupplemental(entry2);

  const fighter1 = await buildFighterSide(entry1, profile1, supplemental1);
  const fighter2 = await buildFighterSide(entry2, profile2, supplemental2);

  // 🔥 Weight Class
  const convertWeightToClass = (weightStr) => {
    if (!weightStr) return '';
    if (!weightStr.toLowerCase().includes('lb')) {
      return weightStr;
    }
    const match = weightStr.match(/(\d+)/);
    if (!match) return weightStr;
    const weight = parseFloat(match[1]);
    if (weight <= 115) return 'Strawweight';
    if (weight <= 125) return 'Flyweight';
    if (weight <= 135) return 'Bantamweight';
    if (weight <= 145) return 'Featherweight';
    if (weight <= 155) return 'Lightweight';
    if (weight <= 170) return 'Welterweight';
    if (weight <= 185) return 'Middleweight';
    if (weight <= 205) return 'Light Heavyweight';
    if (weight <= 265) return 'Heavyweight';
    return 'Heavyweight';
  };

  const rawWeightClass = cleanText(
    coalesce(
      fightData.WeightClass,
      fightData.weightClass,
      fightData.WeightClassDescription,
      fightData.Division
    )
  );

  const weightClass = (() => {
    if (!rawWeightClass || /scrambled/i.test(rawWeightClass)) {
      return "";
    }
    if (!rawWeightClass.toLowerCase().includes('lb')) {
      return rawWeightClass;
    }
    return convertWeightToClass(rawWeightClass);
  })();

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

  // 🔥 IMPROVED ROUNDS PARSING
  let rounds = (() => {
    // PRIORITY 1: Direct rounds field
    const roundsField = coalesce(
      fightData.rounds,
      fightData.Rounds,
      fightData.NumberOfRounds,
      fightData.ScheduledRounds
    );

    if (roundsField != null && roundsField !== "") {
      const numeric = Number(roundsField);
      if (Number.isFinite(numeric) && numeric > 0 && numeric <= 5) {
        console.log('✅ Rounds from rounds field:', roundsField, '→', numeric);
        return Math.round(numeric);
      }
    }

    // PRIORITY 2: Try boutFormat (if exists)
    const boutFormat = coalesce(
      fightData.boutFormat,
      fightData.BoutFormat
    );

    if (boutFormat) {
      const match = String(boutFormat).match(/^(\d+)/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (Number.isFinite(parsed) && parsed > 0 && parsed <= 5) {
          console.log('✅ Rounds from boutFormat:', boutFormat, '→', parsed);
          return parsed;
        }
      }
    }

    // PRIORITY 3: Check fighter stats
    const fighter1Rounds = fighter1?.stats?.matchup?.rounds;
    const fighter2Rounds = fighter2?.stats?.matchup?.rounds;

    if (fighter1Rounds || fighter2Rounds) {
      const fromFighter = fighter1Rounds || fighter2Rounds;
      const numeric = Number(fromFighter);
      if (Number.isFinite(numeric) && numeric > 0 && numeric <= 5) {
        console.log('✅ Rounds from fighter stats:', fromFighter, '→', numeric);
        return Math.round(numeric);
      }
    }

    // FALLBACK: Based on fight type
    if (titleFight) {
      console.log('✅ Rounds fallback: Title Fight → 5');
      return 5;
    }

    if (mainEvent) {
      console.log('✅ Rounds fallback: Main Event → 5');
      return 5;
    }

    console.log('✅ Rounds fallback: Regular Fight → 3');
    return 3;
  })();

  // Validate
  if (!Number.isFinite(rounds) || rounds < 1 || rounds > 5) {
    console.warn('⚠️  Invalid rounds:', rounds, '→ using 3');
    rounds = 3;
  }

  console.log('✅ FINAL ROUNDS:', rounds);

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

  if (method && (/scrambled/i.test(method) || /\d+\s*rounds?/i.test(method))) {
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

  const resultSummary = (() => {
    let summary = "";

    if (winnerName && method) {
      summary = `${winnerName} • ${method}`;
    } else if (method) {
      summary = method;
    } else {
      summary = fightStatus || "Scheduled";
    }

    summary = summary.replace(/\bscrambled\b/gi, "").trim();
    summary = summary.replace(/\b\d+\s*rounds?\b/gi, "").trim();
    summary = summary.replace(/\s+•\s+$/g, "").trim();
    summary = summary.replace(/^\s*•\s+/g, "").trim();
    summary = summary.replace(/\s+/g, " ").trim();

    return summary || "Scheduled";
  })();

  const detailParts = [];
  if (titleFight) {
    detailParts.push("Championship Bout");
  }
  if (weightClass) {
    detailParts.push(weightClass);
  }

  const broadcast = cleanText(
    coalesce(fightData.Broadcast, fightData.TvStation, fightData.Network, fightData.Stream)
  );
  if (broadcast) {
    detailParts.push(broadcast);
  }
  let detailLine = detailParts.join(" • ");

  detailLine = detailLine.replace(/\bscrambled\b/gi, "").trim();
  detailLine = detailLine.replace(/\b\d+\s*rounds?\b/gi, "").trim();
  detailLine = detailLine.replace(/\s+•\s+$/g, "").trim();
  detailLine = detailLine.replace(/^\s*•\s+/g, "").trim();
  detailLine = detailLine.replace(/\s+/g, " ").trim();

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
    rounds,
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

// ============================================================
// WIN PROBABILITY DISPLAY COMPONENT - SIMPLIFIED
// ============================================================
function WinProbabilityBar({ leftWinProb, rightWinProb }) {
  const formatProb = (prob) => {
    if (prob === null || prob === undefined || isNaN(prob)) return '--';
    return `${Math.round(prob)}%`;
  };

  return (
    <div className="win-probability-container">
      <div className="probability-bar-wrapper">
        <div className="probability-bar">
          <div
            className="probability-fill left"
            style={{ width: `${leftWinProb || 50}%` }}
          >
            <span className="probability-value">{formatProb(leftWinProb)}</span>
          </div>
          <div
            className="probability-fill right"
            style={{ width: `${rightWinProb || 50}%` }}
          >
            <span className="probability-value">{formatProb(rightWinProb)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateAdvantages(leftStats, rightStats) {
  const getStatValue = (stats, ...paths) => {
    for (const path of paths) {
      const keys = path.split('.');
      let value = stats;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) break;
      }
      if (value !== undefined && value !== null) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      }
    }
    return null;
  };

  const compareStats = (leftVal, rightVal) => {
    if (leftVal === null || rightVal === null) return [null, null];
    const total = leftVal + rightVal;
    if (total === 0) return [50, 50];
    return [
      Math.round((leftVal / total) * 100),
      Math.round((rightVal / total) * 100)
    ];
  };

  // 🔥 FIX: Better path resolution
  const leftStriking = getStatValue(leftStats, 'stats.strikes.sigPerMinute', 'stats.SLpM', 'SLpM') || 0;
  const rightStriking = getStatValue(rightStats, 'stats.strikes.sigPerMinute', 'stats.SLpM', 'SLpM') || 0;
  const [leftStrikingPct, rightStrikingPct] = compareStats(leftStriking, rightStriking);

  const leftGrappling = getStatValue(leftStats, 'stats.grappling.takedownAverage', 'stats.TdAvg', 'TdAvg') || 0;
  const rightGrappling = getStatValue(rightStats, 'stats.grappling.takedownAverage', 'stats.TdAvg', 'TdAvg') || 0;
  const [leftGrapplingPct, rightGrapplingPct] = compareStats(leftGrappling, rightGrappling);

  const leftDefense = getStatValue(leftStats, 'stats.strikes.defense', 'stats.StrDef', 'StrDef') || 0;
  const rightDefense = getStatValue(rightStats, 'stats.strikes.defense', 'stats.StrDef', 'StrDef') || 0;
  const [leftDefensePct, rightDefensePct] = compareStats(leftDefense, rightDefense);

  const leftWins = getStatValue(leftStats, 'totals.wins', 'stats.Wins', 'Wins') || 0;
  const rightWins = getStatValue(rightStats, 'totals.wins', 'stats.Wins', 'Wins') || 0;
  const [leftExpPct, rightExpPct] = compareStats(leftWins, rightWins);

  console.log('📊 Advantages calculated:', {
    leftStriking, rightStriking,
    leftGrappling, rightGrappling,
    leftDefense, rightDefense,
    leftWins, rightWins
  });

  return {
    left: {
      striking: leftStrikingPct !== null ? `${leftStrikingPct}%` : '--',
      grappling: leftGrapplingPct !== null ? `${leftGrapplingPct}%` : '--',
      defense: leftDefensePct !== null ? `${leftDefensePct}%` : '--',
      experience: leftExpPct !== null ? `${leftExpPct}%` : '--'
    },
    right: {
      striking: rightStrikingPct !== null ? `${rightStrikingPct}%` : '--',
      grappling: rightGrapplingPct !== null ? `${rightGrapplingPct}%` : '--',
      defense: rightDefensePct !== null ? `${rightDefensePct}%` : '--',
      experience: rightExpPct !== null ? `${rightExpPct}%` : '--'
    }
  };
}

function splitFightCards(fights = []) {
  const ordered = [...fights].filter(Boolean);

  // 🔥 Don't reverse - keep original order from API
  // UFC.com already lists from Main Event to first prelim
  // ordered.reverse(); // ❌ REMOVE THIS

  const getSegmentPriority = (fight) => {
    if (fight.mainEvent) return 6;
    if (fight.coMainEvent) return 5;
    if (fight.titleFight) return 4;

    const segment = (fight.cardSegment || "").toLowerCase();
    if (segment.includes("main")) return 3;
    if (segment.includes("feature")) return 2;
    if (segment.includes("prelim")) return 1;
    return 0;
  };

  const parseNumber = (value) => {
    if (value == null || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const compareFights = (a, b) => {
    // Priority 1: Segment priority (Main Event = highest)
    const priorityDiff = getSegmentPriority(b) - getSegmentPriority(a);
    if (priorityDiff) return priorityDiff;

    // Priority 2: Number of rounds (5 > 3)
    const roundsA = parseNumber(a.rounds) ?? 0;
    const roundsB = parseNumber(b.rounds) ?? 0;
    const roundsDiff = roundsB - roundsA;
    if (roundsDiff) return roundsDiff;

    // Priority 3: Keep original order
    const indexA = fights.indexOf(a);
    const indexB = fights.indexOf(b);
    return indexA - indexB; // 🔥 CHANGED: Don't reverse
  };

  ordered.sort(compareFights);

  const main = [];
  const prelims = [];

  // 🔥 SPLIT LOGIC: Top fights = Main Card
  const totalFights = ordered.length;

  // Count 5-round fights
  const fiveRoundFights = ordered.filter(f => parseNumber(f.rounds) === 5).length;

  // Determine main card size
  let mainCardSize;
  if (fiveRoundFights >= 2) {
    // Big PPV event with multiple 5-round fights
    mainCardSize = Math.min(6, totalFights);
  } else if (fiveRoundFights === 1) {
    // Normal Fight Night
    mainCardSize = Math.min(5, totalFights);
  } else {
    // Fallback: Top half
    mainCardSize = Math.min(5, Math.ceil(totalFights / 2));
  }

  // Split into main and prelims
  ordered.forEach((fight, index) => {
    if (index < mainCardSize) {
      main.push(fight);
    } else {
      prelims.push(fight);
    }
  });

  console.log('🔥 Fight Card Split:', {
    total: totalFights,
    mainCardSize,
    main: main.map(f => `${f.fighter1.name} vs ${f.fighter2.name}`),
    prelims: prelims.map(f => `${f.fighter1.name} vs ${f.fighter2.name}`)
  });

  // 🔥 ENSURE FIRST FIGHT IS MARKED AS MAIN EVENT
  if (main.length > 0 && !main[0].mainEvent) {
    main[0].mainEvent = true;
    if (!main[0].rounds || main[0].rounds < 5) {
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
  return cleanText
}

function analyzeFighterStreak(fightHistory) {
  if (!fightHistory || fightHistory.length === 0) return null;

  let currentStreak = 0;
  let finishTypes = [];

  for (let i = 0; i < fightHistory.length; i++) {
    const fight = fightHistory[i];
    if (fight.result === 'Win') {
      currentStreak++;
      finishTypes.push(fight.method);
    } else {
      break;
    }
  }

  if (currentStreak >= 3) {
    const allKO = finishTypes.every(method =>
      method === 'KO/TKO' || method === 'N/A'
    );
    const allSub = finishTypes.every(method =>
      method === 'Submission'
    );
    const allFinishes = finishTypes.every(method =>
      method === 'KO/TKO' || method === 'Submission' || method === 'N/A'
    );

    return {
      count: currentStreak,
      isHotStreak: currentStreak >= 3,
      isOnFire: currentStreak >= 5,
      allByKO: allKO && currentStreak >= 3,
      allBySub: allSub && currentStreak >= 3,
      allFinishes: allFinishes && currentStreak >= 3,
      finishTypes
    };
  }

  return null;
}

function getLastFiveResults(fightHistory) {
  if (!fightHistory || fightHistory.length === 0) {
    return { results: [], isHotStreak: false };
  }

  const last5 = fightHistory.slice(0, 5);
  const results = last5.map(fight => {
    if (fight.result === 'Win') return 'W';
    if (fight.result === 'Loss') return 'L';
    return 'D'; // Draw
  });

  // Check if all 5 are wins
  const isHotStreak = results.length === 5 && results.every(r => r === 'W');

  return { results, isHotStreak };
}

// ============================================
// MATCHUP TAB V3 - HELPER FUNCTIONS
// ============================================

function parseStatValue(value, type) {
  if (!value || value === '—') return null;

  switch (type) {
    case 'height':
      return parseHeight(value);
    case 'weight':
      return parseWeight(value);
    case 'reach':
      return parseReach(value);
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    default:
      return value;
  }
}

function formatStatDisplay(rawValue, parsedValue, type) {
  if (!rawValue || rawValue === '—') {
    return { primary: '—', secondary: null };
  }

  switch (type) {
    case 'height':
      return {
        primary: rawValue,
        secondary: parsedValue ? `${inchesToCm(parsedValue)} cm` : null
      };
    case 'weight':
      return {
        primary: rawValue,
        secondary: parsedValue ? `${lbsToKg(parsedValue)} kg` : null
      };
    case 'reach':
      return {
        primary: rawValue,
        secondary: parsedValue ? `${inchesToCm(parsedValue)} cm` : null
      };
    default:
      return { primary: rawValue, secondary: null };
  }
}

function renderStatRowV3(stat) {
  const { label, left, right, lowerIsBetter, type } = stat;

  // Parse values
  let leftVal = parseStatValue(left, type);
  let rightVal = parseStatValue(right, type);

  // Determine advantage
  let leftAdv = false;
  let rightAdv = false;

  if (leftVal !== null && rightVal !== null && leftVal !== rightVal) {
    if (lowerIsBetter) {
      leftAdv = leftVal < rightVal;
      rightAdv = rightVal < leftVal;
    } else {
      leftAdv = leftVal > rightVal;
      rightAdv = rightVal > leftVal;
    }
  }

  // Format display
  const leftDisplay = formatStatDisplay(left, leftVal, type);
  const rightDisplay = formatStatDisplay(right, rightVal, type);

  return (
    <div className="stat-row-v3" key={label}>
      {/* LEFT - Value THEN Arrow (nach rechts) */}
      <div className="stat-value-left">
        <div className="value-with-arrow value-with-arrow--left">
          <span className={`stat-primary ${leftAdv ? 'advantage' : rightAdv ? 'disadvantage' : ''}`}>
            {leftDisplay.primary}
          </span>
          {leftAdv && <span className="arrow-indicator advantage">↑</span>}
          {!leftAdv && rightAdv && <span className="arrow-indicator disadvantage">↓</span>}
        </div>
        {leftDisplay.secondary && (
          <span className={`stat-secondary ${leftAdv ? 'advantage' : rightAdv ? 'disadvantage' : ''}`}>
            {leftDisplay.secondary}
          </span>
        )}
      </div>

      {/* CENTER */}
      <div className="stat-vs-divider">
        <div className="vs-line"></div>
        <span className="vs-text">{label}</span>
        <div className="vs-line"></div>
      </div>

      {/* 🔥 RIGHT - Arrow THEN Value (Pfeil nach links/innen) */}
      <div className="stat-value-right">
        <div className="value-with-arrow value-with-arrow--right">
          {rightAdv && <span className="arrow-indicator advantage">↑</span>}
          {!rightAdv && leftAdv && <span className="arrow-indicator disadvantage">↓</span>}
          <span className={`stat-primary ${rightAdv ? 'advantage' : leftAdv ? 'disadvantage' : ''}`}>
            {rightDisplay.primary}
          </span>
        </div>
        {rightDisplay.secondary && (
          <span className={`stat-secondary ${rightAdv ? 'advantage' : leftAdv ? 'disadvantage' : ''}`}>
            {rightDisplay.secondary}
          </span>
        )}
      </div>
    </div>
  );
}

function renderMatchupTabV3(fight) {
  const left = fight.fighter1;
  const right = fight.fighter2;

  // Physical Stats
  const physicalStats = [
    {
      label: 'Age',
      left: left.stats.matchup.age,
      right: right.stats.matchup.age,
      lowerIsBetter: true,
      type: 'number'
    },
    {
      label: 'Height',
      left: left.stats.matchup.height,
      right: right.stats.matchup.height,
      type: 'height'
    },
    {
      label: 'Weight',
      left: left.stats.matchup.weight,
      right: right.stats.matchup.weight,
      type: 'weight'
    },
    {
      label: 'Reach',
      left: left.stats.matchup.reach,
      right: right.stats.matchup.reach,
      type: 'reach'
    }
  ];

  // Style Stats
  const styleStats = [
    {
      label: 'Fighting Style',
      left: left.stats.matchup.style,
      right: right.stats.matchup.style,
      type: 'text'
    },
    {
      label: 'Stance',
      left: left.stats.matchup.stance,
      right: right.stats.matchup.stance,
      type: 'text'
    }
  ];

  return (
    <div className="analysis-matchup">
      {/* Physical Attributes */}
      <div className="matchup-stat-module">
        <div className="module-header">
          <span className="module-title">Physical Attributes</span>
        </div>
        {physicalStats.map(stat => renderStatRowV3(stat))}
      </div>

      <div className="section-separator"></div>

      {/* Fighting Style */}
      <div className="matchup-stat-module">
        <div className="module-header">
          <span className="module-title">Fighting Style</span>
        </div>
        {styleStats.map(stat => renderStatRowV3(stat))}
      </div>
    </div>
  );
}

/**
 * Get streak badge configuration
 */
function getStreakBadge(streak) {
  if (!streak) return null;

  if (streak.isOnFire) {
    return {
      text: `🔥 ${streak.count} WIN STREAK - ON FIRE!`,
      class: 'streak-on-fire',
      color: '#ff4500'
    };
  } else if (streak.allByKO) {
    return {
      text: `💥 ${streak.count} WINS - ALL BY KO/TKO`,
      class: 'streak-ko',
      color: '#ff6b6b'
    };
  } else if (streak.allBySub) {
    return {
      text: `🎯 ${streak.count} WINS - ALL BY SUBMISSION`,
      class: 'streak-sub',
      color: '#4ecdc4'
    };
  } else if (streak.allFinishes) {
    return {
      text: `⚡ ${streak.count} WIN STREAK - ALL FINISHES`,
      class: 'streak-finish',
      color: '#f5b544'
    };
  } else {
    return {
      text: `🔥 ${streak.count} WIN STREAK`,
      class: 'streak-hot',
      color: '#f5b544'
    };
  }
}

function formatStreakText(badge) {
  // 🔥 BETTER NULL CHECK
  if (!badge || !badge.text) return 'None';

  // Extract just the number from the badge text
  const match = badge.text.match(/(\d+)/);
  if (!match) return badge.text;

  const count = match[1];

  // Return clean format: "5 Win Streak"
  return `${count} Win Streak`;
}

// ============================================================
// INSIGHTS POPUP - GLOBAL COMPONENT
// ============================================================
function InsightsPopup({ fight, onClose }) {
  const insightsRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!fight) return null;

  const left = fight.fighter1;
  const right = fight.fighter2;

  return createPortal(
    <div className="insights-overlay" onClick={onClose}>
      <div className="insights-popup" ref={insightsRef} onClick={(e) => e.stopPropagation()}>
        <div className="insights-header">
          <span className="insights-title">Fighter Insights</span>
          <button className="insights-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="insights-body">
          {/* LEFT COLUMN - Fighter Info */}
          <div className="insights-column insights-column--fighters">
            <div className="insights-grid">

              {/* Sniper Index */}
              <div className="metric-row metric-row--prominent">
                <div className="metric-cell metric-cell--left">
                  <span className="metric-label">Efficiency Rating</span>
                  <span className="metric-value metric-value--large">
                    {left.badges?.fighterType?.type === 'striker' ? '⚡' : '🤼'} Sniper Index
                  </span>
                  <span className="metric-subtext">
                    {(parseFloat(left.stats?.strikes?.sigPerMinute || 0) /
                      parseFloat(left.stats?.strikes?.absorbed || 1)).toFixed(2)}
                  </span>
                </div>
                <div className="metric-divider">VS</div>
                <div className="metric-cell metric-cell--right">
                  <span className="metric-label">Efficiency Rating</span>
                  <span className="metric-value metric-value--large">
                    {right.badges?.fighterType?.type === 'striker' ? '⚡' : '🤼'} Sniper Index
                  </span>
                  <span className="metric-subtext">
                    {(parseFloat(right.stats?.strikes?.sigPerMinute || 0) /
                      parseFloat(right.stats?.strikes?.absorbed || 1)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Fighter Names */}
              <div className="fighter-names-row">
                <h4 className="insights-fighter-name insights-fighter-name--left">
                  {left.name.split(' ')[0]}
                </h4>
                <div className="insights-divider-center">
                  <span>VS</span>
                </div>
                <h4 className="insights-fighter-name insights-fighter-name--right">
                  {right.name.split(' ')[0]}
                </h4>
              </div>

              {/* Status */}
              <div className="badge-row">
                <div className="badge-cell badge-cell--left">
                  {left.badges?.ageStatus && (
                    <div className={`insight-badge age-${left.badges.ageStatus.color}`}>
                      <span className="badge-label">Status</span>
                      <span className="badge-value">{left.badges.ageStatus.label}</span>
                    </div>
                  )}
                </div>
                <div className="badge-cell badge-cell--right">
                  {right.badges?.ageStatus && (
                    <div className={`insight-badge age-${right.badges.ageStatus.color}`}>
                      <span className="badge-label">Status</span>
                      <span className="badge-value">{right.badges.ageStatus.label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chin Rating */}
              <div className="badge-row">
                <div className="badge-cell badge-cell--left">
                  <div className="insight-badge chin-rating">
                    <span className="badge-label">Chin</span>
                    <span className="badge-value">
                      {(() => {
                        let score = 100;
                        const koLosses = left.totals?.lossesKO || 0;
                        const age = parseInt(left.stats?.matchup?.age) || 0;
                        score -= koLosses * 15;
                        if (age > 35) score -= (age - 35) * 5;
                        score = Math.max(0, Math.round(score));
                        if (score > 75) return '🛡️ Iron';
                        if (score > 60) return '✅ Solid';
                        if (score > 40) return '⚠️ Suspect';
                        return '🔴 Weak';
                      })()}
                    </span>
                  </div>
                </div>
                <div className="badge-cell badge-cell--right">
                  <div className="insight-badge chin-rating">
                    <span className="badge-label">Chin</span>
                    <span className="badge-value">
                      {(() => {
                        let score = 100;
                        const koLosses = right.totals?.lossesKO || 0;
                        const age = parseInt(right.stats?.matchup?.age) || 0;
                        score -= koLosses * 15;
                        if (age > 35) score -= (age - 35) * 5;
                        score = Math.max(0, Math.round(score));
                        if (score > 75) return '🛡️ Iron';
                        if (score > 60) return '✅ Solid';
                        if (score > 40) return '⚠️ Suspect';
                        return '🔴 Weak';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="badge-row">
                <div className="badge-cell badge-cell--left">
                  {left.badges?.fighterType && (
                    <div className="insight-badge type">
                      <span className="badge-label">Type</span>
                      <span className="badge-value">{left.badges.fighterType.label}</span>
                    </div>
                  )}
                </div>
                <div className="badge-cell badge-cell--right">
                  {right.badges?.fighterType && (
                    <div className="insight-badge type">
                      <span className="badge-label">Type</span>
                      <span className="badge-value">{right.badges.fighterType.label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Style */}
              <div className="badge-row">
                <div className="badge-cell badge-cell--left">
                  {left.badges?.fightingStyle && (
                    <div className="insight-badge style">
                      <span className="badge-label">Style</span>
                      <span className="badge-value">{left.badges.fightingStyle.label}</span>
                    </div>
                  )}
                </div>
                <div className="badge-cell badge-cell--right">
                  {right.badges?.fightingStyle && (
                    <div className="insight-badge style">
                      <span className="badge-label">Style</span>
                      <span className="badge-value">{right.badges.fightingStyle.label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Last 5 Results */}
              <div className="streak-badges-row">
                <div className="streak-badge-cell streak-badge-cell--left">
                  {(() => {
                    const { results, isHotStreak } = getLastFiveResults(left?.fightHistory);
                    return (
                      <div className={`win-loss-badge ${isHotStreak ? 'hot-streak' : ''}`}>
                        <span className="win-loss-badge-label">Last 5</span>
                        <div className="win-loss-history">
                          {results.length > 0 ? (
                            <>
                              {results.map((result, i) => (
                                <div
                                  key={i}
                                  className={`result-indicator ${result === 'W' ? 'win' : result === 'L' ? 'loss' : 'draw'}`}
                                >
                                  {result}
                                </div>
                              ))}
                              {isHotStreak && <span className="hot-streak-icon">🔥</span>}
                            </>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>No data</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="streak-badge-cell streak-badge-cell--right">
                  {(() => {
                    const { results, isHotStreak } = getLastFiveResults(right?.fightHistory);
                    return (
                      <div className={`win-loss-badge ${isHotStreak ? 'hot-streak' : ''}`}>
                        <span className="win-loss-badge-label">Last 5</span>
                        <div className="win-loss-history">
                          {results.length > 0 ? (
                            <>
                              {results.map((result, i) => (
                                <div
                                  key={i}
                                  className={`result-indicator ${result === 'W' ? 'win' : result === 'L' ? 'loss' : 'draw'}`}
                                >
                                  {result}
                                </div>
                              ))}
                              {isHotStreak && <span className="hot-streak-icon">🔥</span>}
                            </>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>No data</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Gas Tank */}
              <div className="gas-tank-row">
                <div className="gas-tank-cell">
                  <div className="gas-tank-bar">
                    <span className="gas-tank-label">Gas Tank</span>
                    <div className="gas-tank-fill" style={{
                      width: `${(() => {
                        const totalWins = left.totals?.wins || 0;
                        const decWins = left.stats?.winMethods?.dec || 0;
                        if (totalWins === 0) return 50;
                        const decRate = (decWins / totalWins) * 100;
                        return decRate > 60 ? 85 : decRate > 40 ? 65 : 40;
                      })()}%`,
                      background: 'linear-gradient(90deg, #4caf50, #81c784)'
                    }}>
                      <span className="gas-tank-value">
                        {(() => {
                          const totalWins = left.totals?.wins || 0;
                          const decWins = left.stats?.winMethods?.dec || 0;
                          if (totalWins === 0) return 'Unknown';
                          const decRate = (decWins / totalWins) * 100;
                          return decRate > 60 ? 'Marathon' : decRate > 40 ? 'Solid' : 'Front Runner';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="gas-tank-cell">
                  <div className="gas-tank-bar">
                    <span className="gas-tank-label">Gas Tank</span>
                    <div className="gas-tank-fill" style={{
                      width: `${(() => {
                        const totalWins = right.totals?.wins || 0;
                        const decWins = right.stats?.winMethods?.dec || 0;
                        if (totalWins === 0) return 50;
                        const decRate = (decWins / totalWins) * 100;
                        return decRate > 60 ? 85 : decRate > 40 ? 65 : 40;
                      })()}%`,
                      background: 'linear-gradient(90deg, #4caf50, #81c784)'
                    }}>
                      <span className="gas-tank-value">
                        {(() => {
                          const totalWins = right.totals?.wins || 0;
                          const decWins = right.stats?.winMethods?.dec || 0;
                          if (totalWins === 0) return 'Unknown';
                          const decRate = (decWins / totalWins) * 100;
                          return decRate > 60 ? 'Marathon' : decRate > 40 ? 'Solid' : 'Front Runner';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN - Stats */}
          <div className="insights-column insights-column--stats">
            {/* TSI */}
            <div className="insights-section insights-section--tsi">
              <div className="section-title">Wrestling Control Projection</div>
              <div className="tsi-display">
                {(() => {
                  const tdAvgA = parseFloat(left.stats?.grappling?.takedownAverage) || 0;
                  const tdAccA = parseFloat(left.stats?.grappling?.takedownAccuracy) || 0;
                  const tdDefB = parseFloat(right.stats?.grappling?.takedownDefense) || 0;
                  const effectiveTDs = tdAvgA * (tdAccA / 100);
                  const resistanceFactor = tdDefB / 100;
                  const tsi = effectiveTDs - (resistanceFactor * tdAvgA);
                  let description;
                  if (tsi > 2.0) description = '🔴 Dominant Control Expected';
                  else if (tsi > 1.0) description = '🟡 Clear Grappling Edge';
                  else if (tsi > 0) description = '🟢 Slight Advantage';
                  else if (tsi > -1.0) description = '⚪ Even Matchup';
                  else description = '🔵 Defensive Edge (Fighter B)';
                  return (
                    <>
                      <div className="tsi-value">{tsi > 0 ? '+' : ''}{tsi.toFixed(1)} TDs</div>
                      <div className="tsi-description">{description}</div>
                      <div className="tsi-bar">
                        <div className="tsi-bar-fill" style={{
                          width: `${Math.min(Math.abs(tsi) * 20, 100)}%`,
                          background: tsi > 0 ? 'linear-gradient(90deg, #f5b544, #ff7a45)' : 'linear-gradient(90deg, #2196f3, #4caf50)'
                        }} />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Finish Probability */}
            {left.advancedMetrics?.finishProb && right.advancedMetrics?.finishProb ? (
              <div className="insights-section">
                <div className="section-title">Finish Probability</div>
                <div className="stats-grid">
                  <div className="stat-item-label">KO/TKO</div>
                  <div className="stat-row">
                    <span className="stat-value stat-value--left">{left.advancedMetrics.finishProb.ko}%</span>
                    <span className="stat-vs">vs</span>
                    <span className="stat-value stat-value--right">{right.advancedMetrics.finishProb.ko}%</span>
                  </div>
                  <div className="stat-item-label">Submission</div>
                  <div className="stat-row">
                    <span className="stat-value stat-value--left">{left.advancedMetrics.finishProb.sub}%</span>
                    <span className="stat-vs">vs</span>
                    <span className="stat-value stat-value--right">{right.advancedMetrics.finishProb.sub}%</span>
                  </div>
                  <div className="stat-item-label">Decision</div>
                  <div className="stat-row">
                    <span className="stat-value stat-value--left">{left.advancedMetrics.finishProb.dec}%</span>
                    <span className="stat-vs">vs</span>
                    <span className="stat-value stat-value--right">{right.advancedMetrics.finishProb.dec}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="insights-section">
                <div className="section-title">Finish Probability</div>
                <div className="stats-grid">
                  <div className="stat-row">
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', width: '100%' }}>
                      No data available
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zones */}
            {left.advancedMetrics?.dangerZones && right.advancedMetrics?.dangerZones && (
              <div className="insights-section">
                <div className="section-title">Danger Rating</div>
                <div className="stats-grid">
                  <div className="stat-item-label">Standing</div>
                  <div className="stat-row">
                    <span className="stat-value stat-value--left">{left.advancedMetrics.dangerZones.standing}</span>
                    <span className="stat-vs">vs</span>
                    <span className="stat-value stat-value--right">{right.advancedMetrics.dangerZones.standing}</span>
                  </div>
                  <div className="stat-item-label">Clinch</div>
                  <div className="stat-row">
                    <span className="stat-value stat-value--left">{left.advancedMetrics.dangerZones.clinch}</span>
                    <span className="stat-vs">vs</span>
                    <span className="stat-value stat-value--right">{right.advancedMetrics.dangerZones.clinch}</span>
                  </div>
                  <div className="stat-item-label">Submission Threat</div>
                  <div className="stat-row">
                    <span className="stat-value stat-value--left">
                      {left.advancedMetrics.dangerZones.ground > 0 ? left.advancedMetrics.dangerZones.ground : <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>Low</span>}
                    </span>
                    <span className="stat-vs">vs</span>
                    <span className="stat-value stat-value--right">
                      {right.advancedMetrics.dangerZones.ground > 0 ? right.advancedMetrics.dangerZones.ground : <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>Low</span>}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* X-Factors */}
            {(left.advancedMetrics?.xFactors?.length > 0 || right.advancedMetrics?.xFactors?.length > 0) && (
              <div className="insights-section">
                <div className="section-title">X-Factors</div>
                <div className="xfactors-grid">
                  <div className="xfactors-column">
                    {left.advancedMetrics.xFactors.map((factor, i) => (
                      <span key={i} className="xfactor-tag">{factor}</span>
                    ))}
                    {left.advancedMetrics.xFactors.length === 0 && <span className="xfactor-tag xfactor-tag--empty">None</span>}
                  </div>
                  <div className="xfactors-divider">VS</div>
                  <div className="xfactors-column">
                    {right.advancedMetrics.xFactors.map((factor, i) => (
                      <span key={i} className="xfactor-tag">{factor}</span>
                    ))}
                    {right.advancedMetrics.xFactors.length === 0 && <span className="xfactor-tag xfactor-tag--empty">None</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stylistic Advantage */}
        {(() => {
          const leftType = left.badges?.fighterType?.type;
          const rightType = right.badges?.fighterType?.type;
          if (leftType === 'grappler' && rightType === 'striker') {
            return (
              <div className="insights-advantage">
                <span className="advantage-text">{left.name.split(' ')[0]} has stylistic advantage (+15%)</span>
              </div>
            );
          }
          if (rightType === 'grappler' && leftType === 'striker') {
            return (
              <div className="insights-advantage">
                <span className="advantage-text">{right.name.split(' ')[0]} has stylistic advantage (+15%)</span>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>,
    document.body
  );
}

function FightCard({ fight, accent, onOpenAnalysis, onOpenInsights }) {
  const left = fight.fighter1;
  const right = fight.fighter2;

  const [showInsights, setShowInsights] = useState(false);
  const insightsRef = useRef(null);
  const cardRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (insightsRef.current && !insightsRef.current.contains(event.target)) {
        setShowInsights(false);
      }
    };

    if (showInsights) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInsights]);


  // Dynamic font size based on name length + abbreviate middle names
  const formatFighterName = (name) => {
    if (!name) return '';

    // If name is too long, abbreviate middle names
    if (name.length > 17) {
      const parts = name.split(' ');
      if (parts.length === 3) {
        // "Ian Machado Garry" -> "Ian M. Garry"
        return `${parts[0]} ${parts[1][0]}. ${parts[2]}`;
      }
    }

    return name;
  };

  const getNameClass = (name) => {
    if (!name) return '';
    const length = name.length;
    if (length > 17) return 'fight-card__name--long';    // Ian Machado Garry
    if (length > 13) return 'fight-card__name--medium';  // Belal Muhammad
    return '';
  };

  // 🔥 FIX: Get weight class display name
  const getWeightClassDisplay = () => {
    // Check if fight has weight class directly
    if (fight.weightClass && !fight.weightClass.toLowerCase().includes('scrambled')) {
      return fight.weightClass;
    }

    // Try to get from fighters
    const leftWeight = left.stats?.matchup?.weight;
    const rightWeight = right.stats?.matchup?.weight;

    // If both have same weight class, use it
    if (leftWeight && rightWeight && leftWeight === rightWeight) {
      // Check if it's already a weight class name (not lbs)
      if (!leftWeight.toLowerCase().includes('lb')) {
        return leftWeight;
      }
    }

    // Fallback to fight weight class
    return fight.weightClass || '';
  };

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

  // 🔥 GET WEIGHT CLASS DISPLAY
  const weightClassDisplay = getWeightClassDisplay();

  return (
    <article className={cardClassNames} ref={cardRef}>
      <header className="fight-card__header">
        <div className="fight-card__side fight-card__side--left">
          <span className={`fight-card__name ${getNameClass(left.name)}`}>
            {formatFighterName(left.name)}
          </span>
          <span className="fight-card__record">{left.record}</span>
        </div>
        <div className="fight-card__versus">
          <div className="fight-card__flags">
            <img src={flagSrc1} alt={`${left.name} flag`} loading="lazy" onError={handleFlagError1} />
            <span className="fight-card__vs">VS</span>
            <img src={flagSrc2} alt={`${right.name} flag`} loading="lazy" onError={handleFlagError2} />
          </div>
          {/* 🔥 Weight Class */}
          {weightClassDisplay && (
            <span className="fight-card__meta">{weightClassDisplay}</span>
          )}
        </div>
        <div className="fight-card__side fight-card__side--right">
          <span className={`fight-card__name ${getNameClass(right.name)}`}>
            {formatFighterName(right.name)}
          </span>
          <span className="fight-card__record">{right.record}</span>
        </div>
      </header>

      {/* 🔥 FIGHTER IMAGES */}
      <div className="fight-card__images">
        <img src={cardSrc1} alt={left.name} onError={handleCardError1} loading="lazy" />
        <img src={cardSrc2} alt={right.name} onError={handleCardError2} loading="lazy" />
      </div>

      {/* WIN PROBABILITY BAR WITH INSIGHTS BUTTON */}
      {(() => {
        // Get odds (existing logic)
        let leftOddsImplied = left.odds?.implied;
        let rightOddsImplied = right.odds?.implied;
        let leftOddsMoneyline = left.odds?.moneyline;
        let rightOddsMoneyline = right.odds?.moneyline;

        if (!leftOddsImplied || !rightOddsImplied) {
          const hardcodedOdds = getOddsByFighters(left.name, right.name);
          if (hardcodedOdds) {
            leftOddsMoneyline = hardcodedOdds.fighter1Odds;
            rightOddsMoneyline = hardcodedOdds.fighter2Odds;
            leftOddsImplied = oddsToImpliedProbability(leftOddsMoneyline);
            rightOddsImplied = oddsToImpliedProbability(rightOddsMoneyline);
          }
        }

        let leftProb = null;
        let rightProb = null;

        if (leftOddsImplied && rightOddsImplied && leftOddsImplied > 0 && rightOddsImplied > 0) {
          const total = leftOddsImplied + rightOddsImplied;
          leftProb = Math.round((leftOddsImplied / total) * 100);
          rightProb = Math.round((rightOddsImplied / total) * 100);
          if (leftProb + rightProb !== 100) {
            rightProb = 100 - leftProb;
          }
        }

        if (leftProb === null || rightProb === null) {
          return (
            <div className="win-probability-container">
              <div className="probability-bar-wrapper probability-bar-no-data">
                <span className="no-data-text">NO DATA YET — SOON</span>
              </div>
            </div>
          );
        }

        return (
          <div className="win-probability-container">
            {/* 🔥 BUTTON + BAR BLEIBEN IM WRAPPER */}
            <div className="probability-bar-wrapper">
              <div className="probability-bar">
                <div className="probability-fill left" style={{ width: `${leftProb}%` }}>
                  <span className="probability-value">{leftProb}%</span>
                </div>

                <div className="probability-fill right" style={{ width: `${rightProb}%` }}>
                  <span className="probability-value">{rightProb}%</span>
                </div>
              </div>

              {/* 🔥 INSIGHTS BUTTON - TOP LEFT CORNER */}
              <button
                className="insights-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInsights(fight);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <circle cx="12" cy="8" r="0.5" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
        );
      })()}

      {/* 🔥 BADGES */}
      {(fight.mainEvent || fight.coMainEvent || fight.titleFight) && (
        <div className="fight-card__badges">
          {fight.mainEvent && <span className="fight-card__badge fight-card__badge--main">Main Event</span>}
          {fight.coMainEvent && !fight.mainEvent && (
            <span className="fight-card__badge fight-card__badge--co">Co-Main Event</span>
          )}
          {fight.titleFight && <span className="fight-card__badge fight-card__badge--title">Title Fight</span>}
        </div>
      )}

      {/* 🔥 FOOTER */}
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

  // 🔥 FIGHT HISTORY TAB RENDER - INSIDE COMPONENT
  const renderFightHistoryTab = (fight) => {
    const fighter1 = fight.fighter1;
    const fighter2 = fight.fighter2;

    const history1 = fighter1?.fightHistory?.slice(0, 5) || [];
    const history2 = fighter2?.fightHistory?.slice(0, 5) || [];

    if (!history1.length && !history2.length) {
      return (
        <div className="history-empty">
          <p>No fight history available</p>
        </div>
      );
    }

    return (
      <div className="fight-history-tab">
        <div className="history-section-title">
          <h3>Last 5 Fights</h3>
          <span className="history-subtitle">Most recent performances</span>
        </div>

        <div className="history-grid">
          {/* Fighter 1 History */}
          <div className="history-column">
            <div className="history-fighter-header">
              <span className="fighter-name">{fighter1.name}</span>
            </div>

            <div className="history-fights">
              {history1.map((fightItem, index) => (
                <div key={index} className={`history-fight-card ${fightItem.result?.toLowerCase()}`}>
                  <div className="fight-result-badge">
                    <span className={`result-indicator ${fightItem.result?.toLowerCase()}`}>
                      {fightItem.result === 'Win' ? '✓' : fightItem.result === 'Loss' ? '✕' : '−'}
                    </span>
                    <span className="result-text">{fightItem.result}</span>
                  </div>

                  <div className="fight-details">
                    <div className="opponent-name">vs {fightItem.opponent}</div>
                    <div className="fight-info-row">
                      <span className="method-badge">{fightItem.method}</span>
                      {fightItem.round && fightItem.round !== 'N/A' && (
                        <span className="round-info">R{fightItem.round}</span>
                      )}
                      {fightItem.time && fightItem.time !== 'N/A' && (
                        <span className="time-info">{fightItem.time}</span>
                      )}
                    </div>
                    <div className="event-info">
                      <span className="event-name">{fightItem.event}</span>
                      <span className="event-date">{fightItem.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {history1.length === 0 && <div className="no-history">No fight history available</div>}
            </div>
          </div>

          {/* Divider */}
          <div className="history-divider">
            <div className="divider-line"></div>
            <span className="divider-text">VS</span>
            <div className="divider-line"></div>
          </div>

          {/* Fighter 2 History */}
          <div className="history-column">
            <div className="history-fighter-header">
              <span className="fighter-name">{fighter2.name}</span>
            </div>

            <div className="history-fights">
              {history2.map((fightItem, index) => (
                <div key={index} className={`history-fight-card ${fightItem.result?.toLowerCase()}`}>
                  <div className="fight-result-badge">
                    <span className={`result-indicator ${fightItem.result?.toLowerCase()}`}>
                      {fightItem.result === 'Win' ? '✓' : fightItem.result === 'Loss' ? '✕' : '−'}
                    </span>
                    <span className="result-text">{fightItem.result}</span>
                  </div>

                  <div className="fight-details">
                    <div className="opponent-name">vs {fightItem.opponent}</div>
                    <div className="fight-info-row">
                      <span className="method-badge">{fightItem.method}</span>
                      {fightItem.round && fightItem.round !== 'N/A' && (
                        <span className="round-info">R{fightItem.round}</span>
                      )}
                      {fightItem.time && fightItem.time !== 'N/A' && (
                        <span className="time-info">{fightItem.time}</span>
                      )}
                    </div>
                    <div className="event-info">
                      <span className="event-name">{fightItem.event}</span>
                      <span className="event-date">{fightItem.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {history2.length === 0 && <div className="no-history">No fight history available</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
    { label: "Age", left: left.stats.matchup.age, right: right.stats.matchup.age },
    { label: "Fighting Style", left: left.stats.matchup.style, right: right.stats.matchup.style },
    { label: "Height", left: left.stats.matchup.height, right: right.stats.matchup.height },
    { label: "Weight", left: left.stats.matchup.weight, right: right.stats.matchup.weight },
    { label: "Reach", left: left.stats.matchup.reach, right: right.stats.matchup.reach },
    { label: "Leg Reach", left: left.stats.matchup.legReach, right: right.stats.matchup.legReach },
    { label: "Stance", left: left.stats.matchup.stance, right: right.stats.matchup.stance },
  ];

  const strikeRows = [
    {
      label: "Sig. Strikes Landed / Min",
      left: formatNumber(left.stats.strikes.sigPerMinute),
      right: formatNumber(right.stats.strikes.sigPerMinute),
    },
    {
      label: "Striking Accuracy",
      left: formatPercentage(left.stats.strikes.accuracy) || "—",
      right: formatPercentage(right.stats.strikes.accuracy) || "—",
    },
    {
      label: "Sig. Strikes Absorbed / Min",
      left: formatNumber(left.stats.strikes.absorbed),
      right: formatNumber(right.stats.strikes.absorbed),
    },
    {
      label: "Striking Defense",
      left: formatPercentage(left.stats.strikes.defense) || "—",
      right: formatPercentage(right.stats.strikes.defense) || "—",
    },
    {
      label: "Total Strikes",
      left: formatAttempt(left.stats.strikes.totalLanded, left.stats.strikes.totalAttempted),
      right: formatAttempt(right.stats.strikes.totalLanded, right.stats.strikes.totalAttempted),
    },
    {
      label: "Knockdowns",
      left: formatNumber(left.stats.strikes.knockdowns, 0),
      right: formatNumber(right.stats.strikes.knockdowns, 0),
    },
  ];

  const grapplingRows = [
    {
      label: "Takedown Avg / 15 Min",
      left: formatNumber(left.stats.grappling.takedownAverage),
      right: formatNumber(right.stats.grappling.takedownAverage),
    },
    {
      label: "Takedown Accuracy",
      left: formatPercentage(left.stats.grappling.takedownAccuracy) || "—",
      right: formatPercentage(right.stats.grappling.takedownAccuracy) || "—",
    },
    {
      label: "Takedown Defense",
      left: formatPercentage(left.stats.grappling.takedownDefense) || "—",
      right: formatPercentage(right.stats.grappling.takedownDefense) || "—",
    },
    {
      label: "Takedowns",
      left: formatAttempt(left.stats.grappling.takedownsLanded, left.stats.grappling.takedownsAttempted),
      right: formatAttempt(right.stats.grappling.takedownsLanded, right.stats.grappling.takedownsAttempted),
    },
    {
      label: "Submission Avg / 15 Min",
      left: formatNumber(left.stats.grappling.submissionAverage),
      right: formatNumber(right.stats.grappling.submissionAverage),
    },
    {
      label: "Submission Attempts",
      left: formatNumber(left.stats.grappling.submissions, 0),
      right: formatNumber(right.stats.grappling.submissions, 0),
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
        <FightModalHeader fight={fight} />
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
          {activeTab === "Matchup" && renderMatchupTabV3(fight)}
          {activeTab === "Fight History" && renderFightHistoryTab(fight)}
          {activeTab === "Career" && (
            <div className="analysis-career">
              <div className="career-grid">
                {/* Win Methods */}
                <div className="career-card">
                  <h4 className="career-card__title">Win Methods</h4>
                  <div className="career-stats">
                    <div className="career-stat">
                      <span className="career-stat__label">By KO/TKO</span>
                      <div className="career-stat__bars">
                        <div className="stat-bar">
                          <span className="bar-value">{left.stats.winMethods?.ko || 0}</span>
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(() => {
                                const total = (left.stats.winMethods?.ko || 0) + (right.stats.winMethods?.ko || 0);
                                return total > 0 ? ((left.stats.winMethods?.ko || 0) / total * 100) : 50;
                              })()}%`
                            }}
                          ></div>
                        </div>
                        <div className="stat-bar">
                          <div
                            className="bar-fill bar-fill--right"
                            style={{
                              width: `${(() => {
                                const total = (left.stats.winMethods?.ko || 0) + (right.stats.winMethods?.ko || 0);
                                return total > 0 ? ((right.stats.winMethods?.ko || 0) / total * 100) : 50;
                              })()}%`
                            }}
                          ></div>
                          <span className="bar-value">{right.stats.winMethods?.ko || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="career-stat">
                      <span className="career-stat__label">By Submission</span>
                      <div className="career-stat__bars">
                        <div className="stat-bar">
                          <span className="bar-value">{left.stats.winMethods?.sub || 0}</span>
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(() => {
                                const total = (left.stats.winMethods?.sub || 0) + (right.stats.winMethods?.sub || 0);
                                return total > 0 ? ((left.stats.winMethods?.sub || 0) / total * 100) : 50;
                              })()}%`
                            }}
                          ></div>
                        </div>
                        <div className="stat-bar">
                          <div
                            className="bar-fill bar-fill--right"
                            style={{
                              width: `${(() => {
                                const total = (left.stats.winMethods?.sub || 0) + (right.stats.winMethods?.sub || 0);
                                return total > 0 ? ((right.stats.winMethods?.sub || 0) / total * 100) : 50;
                              })()}%`
                            }}
                          ></div>
                          <span className="bar-value">{right.stats.winMethods?.sub || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="career-stat">
                      <span className="career-stat__label">By Decision</span>
                      <div className="career-stat__bars">
                        <div className="stat-bar">
                          <span className="bar-value">{left.stats.winMethods?.dec || 0}</span>
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(() => {
                                const total = (left.stats.winMethods?.dec || 0) + (right.stats.winMethods?.dec || 0);
                                return total > 0 ? ((left.stats.winMethods?.dec || 0) / total * 100) : 50;
                              })()}%`
                            }}
                          ></div>
                        </div>
                        <div className="stat-bar">
                          <div
                            className="bar-fill bar-fill--right"
                            style={{
                              width: `${(() => {
                                const total = (left.stats.winMethods?.dec || 0) + (right.stats.winMethods?.dec || 0);
                                return total > 0 ? ((right.stats.winMethods?.dec || 0) / total * 100) : 50;
                              })()}%`
                            }}
                          ></div>
                          <span className="bar-value">{right.stats.winMethods?.dec || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Win Method Percentages */}
                <div className="career-card">
                  <h4 className="career-card__title">Win Method Distribution</h4>
                  <div className="career-stats">
                    <div className="career-row">
                      <span className="career-row__label">KO/TKO Rate</span>
                      <span className="career-row__value career-row__value--left">
                        {left.stats.winMethods?.koPercent ? `${left.stats.winMethods.koPercent}%` : '0%'}
                      </span>
                      <span className="career-row__value career-row__value--right">
                        {right.stats.winMethods?.koPercent ? `${right.stats.winMethods.koPercent}%` : '0%'}
                      </span>
                    </div>

                    <div className="career-row">
                      <span className="career-row__label">Submission Rate</span>
                      <span className="career-row__value career-row__value--left">
                        {left.stats.winMethods?.subPercent ? `${left.stats.winMethods.subPercent}%` : '0%'}
                      </span>
                      <span className="career-row__value career-row__value--right">
                        {right.stats.winMethods?.subPercent ? `${right.stats.winMethods.subPercent}%` : '0%'}
                      </span>
                    </div>

                    <div className="career-row">
                      <span className="career-row__label">Decision Rate</span>
                      <span className="career-row__value career-row__value--left">
                        {left.stats.winMethods?.decPercent ? `${left.stats.winMethods.decPercent}%` : '0%'}
                      </span>
                      <span className="career-row__value career-row__value--right">
                        {right.stats.winMethods?.decPercent ? `${right.stats.winMethods.decPercent}%` : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fight Time Stats */}
                <div className="career-card">
                  <h4 className="career-card__title">Fight Duration</h4>
                  <div className="career-comparison">
                    <div className="comparison-side">
                      <span className="comparison-value">{formatNumber(left.stats.strikes.sigPerMinute)} / min</span>
                      <span className="comparison-label">Sig Strikes Rate</span>
                    </div>
                    <div className="comparison-divider">VS</div>
                    <div className="comparison-side">
                      <span className="comparison-value">{formatNumber(right.stats.strikes.sigPerMinute)} / min</span>
                      <span className="comparison-label">Sig Strikes Rate</span>
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div className="career-card">
                  <h4 className="career-card__title">Experience</h4>
                  <div className="career-stats">
                    <div className="career-row">
                      <span className="career-row__label">Total Fights</span>
                      <span className="career-row__value career-row__value--left">
                        {(left.totals.wins || 0) + (left.totals.losses || 0) + (left.totals.draws || 0)}
                      </span>
                      <span className="career-row__value career-row__value--right">
                        {(right.totals.wins || 0) + (right.totals.losses || 0) + (right.totals.draws || 0)}
                      </span>
                    </div>

                    <div className="career-row">
                      <span className="career-row__label">Wins</span>
                      <span className="career-row__value career-row__value--left career-row__value--highlight">
                        {left.totals.wins || 0}
                      </span>
                      <span className="career-row__value career-row__value--right career-row__value--highlight">
                        {right.totals.wins || 0}
                      </span>
                    </div>

                    <div className="career-row">
                      <span className="career-row__label">Losses</span>
                      <span className="career-row__value career-row__value--left">
                        {left.totals.losses || 0}
                      </span>
                      <span className="career-row__value career-row__value--right">
                        {right.totals.losses || 0}
                      </span>
                    </div>

                    <div className="career-row">
                      <span className="career-row__label">No Contests</span>
                      <span className="career-row__value career-row__value--left">
                        {left.totals.noContests || 0}
                      </span>
                      <span className="career-row__value career-row__value--right">
                        {right.totals.noContests || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Finish Rate */}
                <div className="career-card">
                  <h4 className="career-card__title">Finish Rate</h4>
                  <div className="career-comparison">
                    <div className="comparison-side">
                      <span className="comparison-value">
                        {(() => {
                          const totalWins = left.totals.wins || 0;
                          const finishes = (left.stats.winMethods?.ko || 0) + (left.stats.winMethods?.sub || 0);
                          return totalWins > 0 ? `${Math.round((finishes / totalWins) * 100)}%` : '0%';
                        })()}
                      </span>
                      <span className="comparison-label">
                        {(left.stats.winMethods?.ko || 0) + (left.stats.winMethods?.sub || 0)} / {left.totals.wins || 0} wins
                      </span>
                    </div>
                    <div className="comparison-divider">VS</div>
                    <div className="comparison-side">
                      <span className="comparison-value">
                        {(() => {
                          const totalWins = right.totals.wins || 0;
                          const finishes = (right.stats.winMethods?.ko || 0) + (right.stats.winMethods?.sub || 0);
                          return totalWins > 0 ? `${Math.round((finishes / totalWins) * 100)}%` : '0%';
                        })()}
                      </span>
                      <span className="comparison-label">
                        {(right.stats.winMethods?.ko || 0) + (right.stats.winMethods?.sub || 0)} / {right.totals.wins || 0} wins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Performance" && (
            <div className="analysis-performance">
              {/* Physical Attributes */}
              <div className="performance-section">
                <h4 className="performance-section__title">Physical Attributes</h4>
                <div className="performance-grid">
                  <div className="performance-stat">
                    <span className="stat-label">Height</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.stats.matchup.height}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.stats.matchup.height}</span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Weight</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.stats.matchup.weight}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.stats.matchup.weight}</span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Reach</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.stats.matchup.reach}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.stats.matchup.reach}</span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Leg Reach</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.stats.matchup.legReach}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.stats.matchup.legReach}</span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Stance</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.stats.matchup.stance}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.stats.matchup.stance}</span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Age</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.stats.matchup.age}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.stats.matchup.age}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Striking Performance */}
              <div className="performance-section">
                <h4 className="performance-section__title">Striking Performance</h4>
                <div className="performance-grid">
                  <div className="performance-stat">
                    <span className="stat-label">Sig Strikes / Min</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.strikes.sigPerMinute || 0) > parseFloat(right.stats.strikes.sigPerMinute || 0) ? 'advantage' : ''}`}>
                        {formatNumber(left.stats.strikes.sigPerMinute)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.strikes.sigPerMinute || 0) > parseFloat(left.stats.strikes.sigPerMinute || 0) ? 'advantage' : ''}`}>
                        {formatNumber(right.stats.strikes.sigPerMinute)}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Striking Accuracy</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.strikes.accuracy || 0) > parseFloat(right.stats.strikes.accuracy || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(left.stats.strikes.accuracy) || "—"}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.strikes.accuracy || 0) > parseFloat(left.stats.strikes.accuracy || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(right.stats.strikes.accuracy) || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Striking Defense</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.strikes.defense || 0) > parseFloat(right.stats.strikes.defense || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(left.stats.strikes.defense) || "—"}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.strikes.defense || 0) > parseFloat(left.stats.strikes.defense || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(right.stats.strikes.defense) || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Absorbed / Min</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.strikes.absorbed || 999) < parseFloat(right.stats.strikes.absorbed || 999) ? 'advantage' : ''}`}>
                        {formatNumber(left.stats.strikes.absorbed)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.strikes.absorbed || 999) < parseFloat(left.stats.strikes.absorbed || 999) ? 'advantage' : ''}`}>
                        {formatNumber(right.stats.strikes.absorbed)}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Knockdowns</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.strikes.knockdowns || 0) > parseFloat(right.stats.strikes.knockdowns || 0) ? 'advantage' : ''}`}>
                        {formatNumber(left.stats.strikes.knockdowns, 0)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.strikes.knockdowns || 0) > parseFloat(left.stats.strikes.knockdowns || 0) ? 'advantage' : ''}`}>
                        {formatNumber(right.stats.strikes.knockdowns, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Total Strikes</span>
                    <div className="stat-comparison">
                      <span className="stat-value">
                        {formatAttempt(left.stats.strikes.totalLanded, left.stats.strikes.totalAttempted)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">
                        {formatAttempt(right.stats.strikes.totalLanded, right.stats.strikes.totalAttempted)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grappling Performance */}
              <div className="performance-section">
                <h4 className="performance-section__title">Grappling Performance</h4>
                <div className="performance-grid">
                  <div className="performance-stat">
                    <span className="stat-label">TD Average</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.grappling.takedownAverage || 0) > parseFloat(right.stats.grappling.takedownAverage || 0) ? 'advantage' : ''}`}>
                        {formatNumber(left.stats.grappling.takedownAverage)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.grappling.takedownAverage || 0) > parseFloat(left.stats.grappling.takedownAverage || 0) ? 'advantage' : ''}`}>
                        {formatNumber(right.stats.grappling.takedownAverage)}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">TD Accuracy</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.grappling.takedownAccuracy || 0) > parseFloat(right.stats.grappling.takedownAccuracy || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(left.stats.grappling.takedownAccuracy) || "—"}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.grappling.takedownAccuracy || 0) > parseFloat(left.stats.grappling.takedownAccuracy || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(right.stats.grappling.takedownAccuracy) || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">TD Defense</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.grappling.takedownDefense || 0) > parseFloat(right.stats.grappling.takedownDefense || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(left.stats.grappling.takedownDefense) || "—"}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.grappling.takedownDefense || 0) > parseFloat(left.stats.grappling.takedownDefense || 0) ? 'advantage' : ''}`}>
                        {formatPercentage(right.stats.grappling.takedownDefense) || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Takedowns</span>
                    <div className="stat-comparison">
                      <span className="stat-value">
                        {formatAttempt(left.stats.grappling.takedownsLanded, left.stats.grappling.takedownsAttempted)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">
                        {formatAttempt(right.stats.grappling.takedownsLanded, right.stats.grappling.takedownsAttempted)}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Sub Average</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.grappling.submissionAverage || 0) > parseFloat(right.stats.grappling.submissionAverage || 0) ? 'advantage' : ''}`}>
                        {formatNumber(left.stats.grappling.submissionAverage)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.grappling.submissionAverage || 0) > parseFloat(left.stats.grappling.submissionAverage || 0) ? 'advantage' : ''}`}>
                        {formatNumber(right.stats.grappling.submissionAverage)}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Submissions</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.grappling.submissions || 0) > parseFloat(right.stats.grappling.submissions || 0) ? 'advantage' : ''}`}>
                        {formatNumber(left.stats.grappling.submissions, 0)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.grappling.submissions || 0) > parseFloat(left.stats.grappling.submissions || 0) ? 'advantage' : ''}`}>
                        {formatNumber(right.stats.grappling.submissions, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Control Time</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${parseFloat(left.stats.grappling.controlSeconds || 0) > parseFloat(right.stats.grappling.controlSeconds || 0) ? 'advantage' : ''}`}>
                        {formatSeconds(left.stats.grappling.controlSeconds)}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${parseFloat(right.stats.grappling.controlSeconds || 0) > parseFloat(left.stats.grappling.controlSeconds || 0) ? 'advantage' : ''}`}>
                        {formatSeconds(right.stats.grappling.controlSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Record */}
              <div className="performance-section">
                <h4 className="performance-section__title">Fight Record</h4>
                <div className="performance-grid">
                  <div className="performance-stat">
                    <span className="stat-label">Wins</span>
                    <div className="stat-comparison">
                      <span className={`stat-value ${(left.totals.wins || 0) > (right.totals.wins || 0) ? 'advantage' : ''}`}>
                        {left.totals.wins || 0}
                      </span>
                      <span className="stat-vs">VS</span>
                      <span className={`stat-value ${(right.totals.wins || 0) > (left.totals.wins || 0) ? 'advantage' : ''}`}>
                        {right.totals.wins || 0}
                      </span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Losses</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.totals.losses || 0}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.totals.losses || 0}</span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">Draws</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.totals.draws || 0}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.totals.draws || 0}</span>
                    </div>
                  </div>

                  <div className="performance-stat">
                    <span className="stat-label">No Contests</span>
                    <div className="stat-comparison">
                      <span className="stat-value">{left.totals.noContests || 0}</span>
                      <span className="stat-vs">VS</span>
                      <span className="stat-value">{right.totals.noContests || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="analysis-strikes">
              {/* Key Metrics */}
              <div className="strikes-overview">
                <div className="strikes-overview__card">
                  <span className="metric-label">Sig. Strikes / Min</span>
                  <div className="metric-comparison">
                    <span className={`metric-value ${parseFloat(left.stats.strikes.sigPerMinute) > parseFloat(right.stats.strikes.sigPerMinute) ? 'advantage' : 'disadvantage'}`}>
                      {formatNumber(left.stats.strikes.sigPerMinute)}
                    </span>
                    <span className="metric-vs">VS</span>
                    <span className={`metric-value ${parseFloat(right.stats.strikes.sigPerMinute) > parseFloat(left.stats.strikes.sigPerMinute) ? 'advantage' : 'disadvantage'}`}>
                      {formatNumber(right.stats.strikes.sigPerMinute)}
                    </span>
                  </div>
                </div>

                <div className="strikes-overview__card">
                  <span className="metric-label">Striking Accuracy</span>
                  <div className="metric-comparison">
                    <span className={`metric-value ${parseFloat(left.stats.strikes.accuracy || 0) > parseFloat(right.stats.strikes.accuracy || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatPercentage(left.stats.strikes.accuracy) || "—"}
                    </span>
                    <span className="metric-vs">VS</span>
                    <span className={`metric-value ${parseFloat(right.stats.strikes.accuracy || 0) > parseFloat(left.stats.strikes.accuracy || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatPercentage(right.stats.strikes.accuracy) || "—"}
                    </span>
                  </div>
                </div>

                <div className="strikes-overview__card">
                  <span className="metric-label">Strikes Absorbed / Min</span>
                  <div className="metric-comparison">
                    <span className={`metric-value ${parseFloat(left.stats.strikes.absorbed || 999) < parseFloat(right.stats.strikes.absorbed || 999) ? 'advantage' : 'disadvantage'}`}>
                      {formatNumber(left.stats.strikes.absorbed)}
                    </span>
                    <span className="metric-vs">VS</span>
                    <span className={`metric-value ${parseFloat(right.stats.strikes.absorbed || 999) < parseFloat(left.stats.strikes.absorbed || 999) ? 'advantage' : 'disadvantage'}`}>
                      {formatNumber(right.stats.strikes.absorbed)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Stats Grid */}
              <div className="analysis-grid">
                {strikeRows.map((row) => (
                  <div className="analysis-row" key={row.label}>
                    <span className="analysis-value analysis-value--left">{row.left}</span>
                    <span className="analysis-label">{row.label}</span>
                    <span className="analysis-value analysis-value--right">{row.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "Grappling" && (
            <div className="analysis-grappling">
              {/* Key Metrics */}
              <div className="grappling-overview">
                <div className="grappling-overview__card">
                  <span className="metric-label">Takedown Average</span>
                  <div className="metric-comparison">
                    <span className={`metric-value ${parseFloat(left.stats.grappling.takedownAverage || 0) > parseFloat(right.stats.grappling.takedownAverage || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatNumber(left.stats.grappling.takedownAverage)}
                    </span>
                    <span className="metric-vs">VS</span>
                    <span className={`metric-value ${parseFloat(right.stats.grappling.takedownAverage || 0) > parseFloat(left.stats.grappling.takedownAverage || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatNumber(right.stats.grappling.takedownAverage)}
                    </span>
                  </div>
                </div>

                <div className="grappling-overview__card">
                  <span className="metric-label">Takedown Accuracy</span>
                  <div className="metric-comparison">
                    <span className={`metric-value ${parseFloat(left.stats.grappling.takedownAccuracy || 0) > parseFloat(right.stats.grappling.takedownAccuracy || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatPercentage(left.stats.grappling.takedownAccuracy) || "—"}
                    </span>
                    <span className="metric-vs">VS</span>
                    <span className={`metric-value ${parseFloat(right.stats.grappling.takedownAccuracy || 0) > parseFloat(left.stats.grappling.takedownAccuracy || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatPercentage(right.stats.grappling.takedownAccuracy) || "—"}
                    </span>
                  </div>
                </div>

                <div className="grappling-overview__card">
                  <span className="metric-label">Takedown Defense</span>
                  <div className="metric-comparison">
                    <span className={`metric-value ${parseFloat(left.stats.grappling.takedownDefense || 0) > parseFloat(right.stats.grappling.takedownDefense || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatPercentage(left.stats.grappling.takedownDefense) || "—"}
                    </span>
                    <span className="metric-vs">VS</span>
                    <span className={`metric-value ${parseFloat(right.stats.grappling.takedownDefense || 0) > parseFloat(left.stats.grappling.takedownDefense || 0) ? 'advantage' : 'disadvantage'}`}>
                      {formatPercentage(right.stats.grappling.takedownDefense) || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Stats Grid */}
              <div className="analysis-grid">
                {grapplingRows.map((row) => (
                  <div className="analysis-row" key={row.label}>
                    <span className="analysis-value analysis-value--left">{row.left}</span>
                    <span className="analysis-label">{row.label}</span>
                    <span className="analysis-value analysis-value--right">{row.right}</span>
                  </div>
                ))}
              </div>
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

  // 🔥 FIGHTER INSIGHTS MODAL (für "Detailed Comparison")
  const [showFighterInsights, setShowFighterInsights] = useState(false);

  // 🔥 INSIGHTS POPUP (für "ℹ️ Button")
  const [showInsightsPopup, setShowInsightsPopup] = useState(false);
  const [insightsFight, setInsightsFight] = useState(null);

  const fightersRef = useRef({ list: [], directory: new Map() });
  const loadingStartRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadSchedule = async () => {
      try {
        const ufcData = await loadUFCData();

        if (!mounted) return;

        // 🔥 FIX: Handle different event property names
        const events = (ufcData.events || []).map(event => ({
          id: event.id || event.eventId || event.url || `event-${Date.now()}`,
          name: event.name || event.eventName || event.title || 'UFC Event',
          date: event.date || event.eventDate || null
        }));

        console.log('✅ Loaded events:', events.length);
        console.log('📋 First event:', events[0]); // 🔥 DEBUG

        const nextEvents = events.length ? [...events, OFFLINE_EVENT_OPTION] : [OFFLINE_EVENT_OPTION];
        setEvents(nextEvents);

      } catch (error) {
        console.error('❌ Schedule Error:', error);
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
        // 🔥 LOAD DATA FROM API
        const ufcData = await loadUFCData();

        if (!mounted) return;

        console.log('✅ API Data:', ufcData);

        // 🔥 BUILD FIGHTER DIRECTORY
        const fighterDirectory = new Map();

        // Handle both array and object format
        const fightersData = Array.isArray(ufcData.fighters)
          ? ufcData.fighters
          : Object.values(ufcData.fighters || {});

        fightersData.forEach(fighter => {
          if (!fighter) return;

          const mapped = mapFighterData(fighter);
          if (!mapped) return;

          // Index by ID
          const fighterId = mapped.FighterId;
          if (fighterId) {
            fighterDirectory.set(`id:${fighterId}`, mapped);
          }

          // Index by name
          const name = mapped.Name;
          if (name) {
            const nameKey = `name:${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            fighterDirectory.set(nameKey, mapped);
          }
        });

        fightersRef.current = {
          list: fightersData,
          directory: fighterDirectory
        };

        console.log('✅ Fighter directory built:', fighterDirectory.size);

        // 🔥 OFFLINE MODE
        if (selectedEventId === "offline-event") {
          const offlineFights = [];
          const offlinePrelims = [];

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

          const fallbackFight = await buildFight(
            {
              Fighters: fallbackEntries,
              WeightClass: "Featherweight",
              CardSegment: "Main",
              Rounds: 3,
              TitleFight: false,
            },
            fighterDirectory
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

        // 🔥 FIND SELECTED EVENT
        const selectedEvent = ufcData.events?.find(e => {
          // Try multiple ID formats
          const eventId = e.id || e.eventId || e.url || e.name;
          return eventId === selectedEventId;
        });

        if (!selectedEvent) {
          console.warn('⚠️  Event not found:', selectedEventId);
          console.log('📋 Available events:', ufcData.events?.map(e => ({
            id: e.id || e.eventId || e.url,
            name: e.name || e.eventName
          })));

          setCurrentEvent({ mainCard: [], prelims: [] });
          setEventMeta({ name: 'Event Not Found', date: null, location: 'TBA' });
          setEventInsights([]);
          finishLoading();
          return;
        }

        console.log('📅 Loading event:', selectedEvent.name || selectedEvent.eventName);
        console.log('📍 Location:', selectedEvent.location);
        console.log('🥊 Fights:', selectedEvent.fights?.length || 0);

        // 🔥 BUILD FIGHTS
        const fights = [];

        for (const scrapedFight of selectedEvent.fights || []) {
          console.log('🔄 Processing fight:', scrapedFight.fighter1?.name, 'vs', scrapedFight.fighter2?.name);

          const mappedFight = mapFightData(scrapedFight);

          if (!mappedFight || !mappedFight.Fighters || mappedFight.Fighters.length < 2) {
            console.warn('⚠️  Missing fighter data for fight');
            continue;
          }

          // 🔥 ENRICH FIGHTERS WITH FULL STATS FROM DIRECTORY
          mappedFight.Fighters = mappedFight.Fighters.map(fighter => {
            // Try to find full fighter data
            const fullData = lookupFighter(fighterDirectory, {
              url: `/${fighter.FighterId}.html`,
              name: fighter.Name
            });

            if (fullData) {
              console.log(`✅ Enriched fighter: ${fighter.Name}`);
              return {
                ...fullData, // 🔥 Full stats from directory
                ...fighter,  // Override with fight-specific data (ranking, etc.)
              };
            }

            console.warn(`⚠️  No full stats for: ${fighter.Name}`);
            return fighter;
          });

          const fight = await buildFight(mappedFight, fighterDirectory);

          if (fight) {
            console.log('✅ Built fight:', fight.fighter1?.name, 'vs', fight.fighter2?.name);
            fights.push(fight);
          }
        }

        console.log('✅ Total built fights:', fights.length);

        const { main, prelims } = splitFightCards(fights);

        setCurrentEvent({ mainCard: main, prelims });

        // 🔥 SET EVENT META
        setEventMeta({
          name: selectedEvent.name || selectedEvent.eventName || 'UFC Event',
          date: selectedEvent.date || selectedEvent.eventDate || null,
          location: selectedEvent.location || selectedEvent.venue || 'Location TBA'
        });

        // 🔥 EVENT INSIGHTS
        const headline = main[0] || null;
        const insights = [];

        if (headline) {
          insights.push({
            label: 'Main Event',
            value: `${headline.fighter1.name} vs ${headline.fighter2.name}`,
            hint: headline.weightClass || 'Headline bout'
          });
        }

        insights.push({
          label: 'Total Fights',
          value: fights.length || '—',
          hint: `${main.length} main • ${prelims.length} prelim`
        });

        const titleCount = main.filter((fight) => fight.titleFight).length;
        if (titleCount > 0) {
          insights.push({
            label: 'Title Fights',
            value: String(titleCount),
            hint: titleCount === 1 ? 'Championship bout' : 'Multiple belts'
          });
        }

        setEventInsights(insights);

      } catch (error) {
        console.error('❌ Event Error:', error);
        console.error('Stack:', error.stack);
        if (mounted) {
          setCurrentEvent({ mainCard: [], prelims: [] });
          setEventMeta({ name: 'UFC Event', date: null, location: 'TBA' });
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

  // 🔥 FIGHT HISTORY TAB RENDER
  const renderFightHistoryTab = (fight) => {
    const fighter1 = fight.fighter1;
    const fighter2 = fight.fighter2;

    const history1 = fighter1?.fightHistory?.slice(0, 5) || [];
    const history2 = fighter2?.fightHistory?.slice(0, 5) || [];

    if (!history1.length && !history2.length) {
      return (
        <div className="history-empty">
          <p>No fight history available</p>
        </div>
      );
    }

    return (
      <div className="fight-history-tab">
        <div className="history-section-title">
          <h3>Last 5 Fights</h3>
          <span className="history-subtitle">Most recent performances</span>
        </div>

        <div className="history-grid">
          {/* Fighter 1 History */}
          <div className="history-column">
            <div className="history-fighter-header">
              <span className="fighter-name">{fighter1.name}</span>
            </div>

            <div className="history-fights">
              {history1.map((fightItem, index) => (
                <div key={index} className={`history-fight-card ${fightItem.result?.toLowerCase()}`}>
                  <div className="fight-result-badge">
                    <span className={`result-indicator ${fightItem.result?.toLowerCase()}`}>
                      {fightItem.result === 'Win' ? '✓' : fightItem.result === 'Loss' ? '✕' : '−'}
                    </span>
                    <span className="result-text">{fightItem.result}</span>
                  </div>

                  <div className="fight-details">
                    <div className="opponent-name">vs {fightItem.opponent}</div>
                    <div className="fight-info-row">
                      <span className="method-badge">{fightItem.method}</span>
                      {fightItem.round && fightItem.round !== 'N/A' && (
                        <span className="round-info">R{fightItem.round}</span>
                      )}
                      {fightItem.time && fightItem.time !== 'N/A' && (
                        <span className="time-info">{fightItem.time}</span>
                      )}
                    </div>
                    <div className="event-info">
                      <span className="event-name">{fightItem.event}</span>
                      <span className="event-date">{fightItem.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {history1.length === 0 && <div className="no-history">No fight history available</div>}
            </div>
          </div>

          {/* Divider */}
          <div className="history-divider">
            <div className="divider-line"></div>
            <span className="divider-text">VS</span>
            <div className="divider-line"></div>
          </div>

          {/* Fighter 2 History */}
          <div className="history-column">
            <div className="history-fighter-header">
              <span className="fighter-name">{fighter2.name}</span>
            </div>

            <div className="history-fights">
              {history2.map((fightItem, index) => (
                <div key={index} className={`history-fight-card ${fightItem.result?.toLowerCase()}`}>
                  <div className="fight-result-badge">
                    <span className={`result-indicator ${fightItem.result?.toLowerCase()}`}>
                      {fightItem.result === 'Win' ? '✓' : fightItem.result === 'Loss' ? '✕' : '−'}
                    </span>
                    <span className="result-text">{fightItem.result}</span>
                  </div>

                  <div className="fight-details">
                    <div className="opponent-name">vs {fightItem.opponent}</div>
                    <div className="fight-info-row">
                      <span className="method-badge">{fightItem.method}</span>
                      {fightItem.round && fightItem.round !== 'N/A' && (
                        <span className="round-info">R{fightItem.round}</span>
                      )}
                      {fightItem.time && fightItem.time !== 'N/A' && (
                        <span className="time-info">{fightItem.time}</span>
                      )}
                    </div>
                    <div className="event-info">
                      <span className="event-name">{fightItem.event}</span>
                      <span className="event-date">{fightItem.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {history2.length === 0 && <div className="no-history">No fight history available</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              Generate Analysis (PRO)
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
                <strong>{formatLocation(eventMeta.location)}</strong>
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
                  <FightCard
                    key={fight.fightKey}
                    fight={fight}
                    accent="main"
                    onOpenAnalysis={setActiveFight}
                    onOpenInsights={(fight) => {
                      setInsightsFight(fight);
                      setShowFighterInsights(true);
                    }}
                  />
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
                  <FightCard 
                    key={fight.fightKey} 
                    fight={fight} 
                    accent="prelim" 
                    onOpenAnalysis={setActiveFight}
                    onOpenInsights={(fight) => {
                      setInsightsFight(fight);
                      setShowFighterInsights(true);
                    }}
                  />
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
      
      {showFighterInsights && insightsFight && (
        <InsightsPopup
          fight={insightsFight}
          onClose={() => {
            setShowFighterInsights(false);
            setInsightsFight(null);
          }}
        />
      )}

      {/* 🔥 NEW: FighterInsightsModal */}
      {showFighterInsights && insightsFight && (
        <FighterInsightsModal 
          fighter1={insightsFight.fighter1}
          fighter2={insightsFight.fighter2}
          onClose={() => setShowFighterInsights(false)}
        />
      )}
    </div>
  );
}

export default UFCPage;