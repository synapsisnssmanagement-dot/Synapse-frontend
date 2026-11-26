// Bounded local queue for supervisor-captured attendance. Only the minimum
// needed to sync is stored (ids, status, times, display name). Cleared on
// logout by utils/auth.clearSession (prefix "synapsis.offline.").
const KEY = "synapsis.offline.attendance.v1";
export const MAX_OPS = 300;

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const listeners = new Set();
let cacheRaw = null;
let cacheVal = [];
const EMPTY = [];
const write = (ops) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(ops));
  } catch {
    // storage full or unavailable; caller keeps going with in-memory state
  }
  listeners.forEach((l) => l());
  return true;
};

// useSyncExternalStore bindings
export const subscribe = (l) => {
  listeners.add(l);
  const onStorage = (e) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
};
export const getSnapshot = () => {
  let raw;
  try {
    raw = localStorage.getItem(KEY) || "[]";
  } catch {
    raw = "[]";
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cacheVal = JSON.parse(raw);
    } catch {
      cacheVal = [];
    }
  }
  return cacheVal;
};
export const getServerSnapshot = () => EMPTY;
export const subscribeOnline = (l) => {
  window.addEventListener("online", l);
  window.addEventListener("offline", l);
  return () => {
    window.removeEventListener("online", l);
    window.removeEventListener("offline", l);
  };
};
export const getOnline = () => navigator.onLine;
export const getOnlineServer = () => true;

export const loadQueue = read;

// Rosters loaded while online, so a supervisor can keep marking after a
// reload without a connection. Ids, names and attendance state only; last 5.
const ROSTER_KEY = "synapsis.offline.rosters.v1";
const MAX_ROSTERS = 5;
export function saveRoster(r) {
  try {
    const slim = {
      event: { _id: r.event._id, title: r.event.title, date: r.event.date, type: r.event.type },
      sessionDate: r.sessionDate,
      students: r.students.map((s) => ({ _id: s._id, name: s.name })),
      records: r.records.map((x) => ({ student: x.student, status: x.status, checkInAt: x.checkInAt, checkOutAt: x.checkOutAt, rev: x.rev })),
      savedAt: new Date().toISOString(),
    };
    const all = loadRosters().filter((x) => !(x.event._id === slim.event._id && x.sessionDate === slim.sessionDate));
    localStorage.setItem(ROSTER_KEY, JSON.stringify([slim, ...all].slice(0, MAX_ROSTERS)));
  } catch {
    // storage unavailable or full: offline reload just won't have this roster
  }
}
export function loadRosters() {
  try {
    const v = JSON.parse(localStorage.getItem(ROSTER_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export const findRoster = (eventId, sessionDate) => loadRosters().find((x) => x.event._id === eventId && (!sessionDate || x.sessionDate === sessionDate)) || null;
export const newOpId = () => `op-${Date.now().toString(36)}-${(crypto.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 16)}`;

// Replace any still-queued op for the same volunteer/session (latest wins on
// this device); synced and conflict entries are kept for display.
export function enqueue(op) {
  const ops = read().filter((o) => !(o.state === "queued" && o.event === op.event && o.student === op.student && o.sessionDate === op.sessionDate));
  if (ops.filter((o) => o.state !== "synced").length >= MAX_OPS) throw new Error(`Offline queue is full (${MAX_OPS}). Connect and sync first.`);
  ops.push({ ...op, opId: newOpId(), state: "queued", capturedAt: new Date().toISOString() });
  write(ops);
  return ops;
}

export function markStates(results) {
  const by = new Map(results.map((r) => [r.opId, r]));
  const ops = read().map((o) => (by.has(o.opId) ? { ...o, state: by.get(o.opId).state === "duplicate" ? "synced" : by.get(o.opId).state, message: by.get(o.opId).message, server: by.get(o.opId).server } : o));
  write(ops);
  return ops;
}
export const setSyncing = (ids) => {
  const s = new Set(ids);
  const ops = read().map((o) => (s.has(o.opId) ? { ...o, state: "syncing" } : o));
  write(ops);
  return ops;
};
// A sync interrupted mid-flight (reload, lost connection) goes back to queued;
// the server dedupes by opId so resending is safe.
export const recoverInterrupted = () => {
  const ops = read().map((o) => (o.state === "syncing" ? { ...o, state: "queued" } : o));
  write(ops);
  return ops;
};
export const clearSynced = () => {
  const ops = read().filter((o) => o.state !== "synced");
  write(ops);
  return ops;
};
