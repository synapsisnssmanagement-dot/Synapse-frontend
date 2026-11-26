// Unit test for the offline attendance queue (node --test, localStorage shim).
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  key: (i) => [...store.keys()][i],
  get length() {
    return store.size;
  },
};
const q = await import("../src/features/ops/offlineQueue.js");
const op = (student, status = "present") => ({ event: "e1", student, sessionDate: "2025-09-14", status, label: `S ${student}` });

beforeEach(() => store.clear());

test("offline marks queue; latest mark per volunteer wins while still queued", () => {
  q.enqueue(op("a", "present"));
  q.enqueue(op("a", "partial"));
  q.enqueue(op("b"));
  const ops = q.loadQueue();
  assert.equal(ops.length, 2);
  assert.equal(ops.find((o) => o.student === "a").status, "partial");
  assert.ok(ops.every((o) => o.state === "queued" && /^op-/.test(o.opId)));
});

test("reload during sync returns ops to queued with the same opId (server dedupes)", () => {
  q.enqueue(op("a"));
  const [o] = q.loadQueue();
  q.setSyncing([o.opId]);
  assert.equal(q.loadQueue()[0].state, "syncing");
  // page reload → recoverInterrupted runs on mount
  const after = q.recoverInterrupted();
  assert.equal(after[0].state, "queued");
  assert.equal(after[0].opId, o.opId);
});

test("reconnect results: synced, duplicate→synced, conflict kept with server copy", () => {
  q.enqueue(op("a"));
  q.enqueue(op("b"));
  q.enqueue(op("c"));
  const [a, b, c] = q.loadQueue();
  const ops = q.markStates([
    { opId: a.opId, state: "synced" },
    { opId: b.opId, state: "duplicate" },
    { opId: c.opId, state: "conflict", server: { status: "absent", rev: 1 } },
  ]);
  assert.deepEqual(ops.map((o) => o.state), ["synced", "synced", "conflict"]);
  assert.equal(ops[2].server.status, "absent");
  assert.deepEqual(q.clearSynced().map((o) => o.student), ["c"], "conflicts are not discarded");
});

test("queue is bounded", () => {
  for (let i = 0; i < q.MAX_OPS; i++) q.enqueue(op(`s${i}`));
  assert.throws(() => q.enqueue(op("overflow")), /full/);
});

test("storage key uses the prefix that logout clears", () => {
  q.enqueue(op("a"));
  assert.ok([...store.keys()].every((k) => k.startsWith("synapsis.offline.")));
});
