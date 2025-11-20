const PROXY_BASE = "http://136.244.84.227:4000"; // oder localhost:4000 wenn lokal

// 🗓 Hole alle kommenden Events
export async function fetchSchedule() {
  const res = await fetch(`${PROXY_BASE}/api/ufc/schedule`);
  if (!res.ok) throw new Error(`Schedule-Fehler (${res.status})`);
  return await res.json();
}

// 🥊 Hole Fights eines bestimmten Events
export async function fetchEvent(eventId) {
  const res = await fetch(`${PROXY_BASE}/api/ufc/event/${eventId}`);
  if (!res.ok) throw new Error(`Event-Fehler (${res.status})`);
  return await res.json();
}

// 👊 Lade Fighterdaten (Reach, Height, Record, etc.)
export async function fetchFighters() {
  const res = await fetch(`${PROXY_BASE}/api/ufc/fighters`);
  if (!res.ok) throw new Error(`Fighter-Fehler (${res.status})`);
  return await res.json();
}
