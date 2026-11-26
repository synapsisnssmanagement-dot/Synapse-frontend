// Browser-level E2E for the main role workflows, against a fully isolated
// stack: throwaway mongod (temp dir), backend on :3101, Next production
// build in .next-e2e on :5174. Never touches the configured database.
//
//   cd client && npm run e2e
//
// Requires: mongod on PATH, Google Chrome installed (driven by playwright-core).
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

// Async on purpose: a sync child call would block draining of the other
// processes' output pipes (mongod stalls when its pipe fills).
const run = promisify(execFile);
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const client = path.resolve(here, "..");
const backend = path.resolve(client, "../backend");
const PORTS = { mongo: 27019, api: 3101, web: 5174 };
const API = `http://localhost:${PORTS.api}`;
const WEB = `http://localhost:${PORTS.web}`;
const procs = [];
const results = [];
const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "synapsis-e2e-db-"));

const free = (port) => new Promise((r) => { const s = net.createServer().once("error", () => r(false)).listen(port, () => s.close(() => r(true))); });
const waitFor = async (fn, what, ms = 60000) => {
  const t0 = Date.now();
  for (;;) {
    try {
      if (await fn()) return;
    } catch {}
    if (Date.now() - t0 > ms) throw new Error(`Timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 400));
  }
};
const start = (cmd, args, opts, name, quiet = false) => {
  const p = spawn(cmd, args, { ...opts, stdio: quiet ? "ignore" : ["ignore", "pipe", "pipe"] });
  if (quiet) {
    p.name = name;
    procs.push(p);
    return p;
  }
  let log = "";
  p.stdout.on("data", (d) => (log += d));
  p.stderr.on("data", (d) => (log += d));
  p.logTail = () => log.slice(-2000);
  p.name = name;
  procs.push(p);
  return p;
};
const step = async (name, fn) => {
  try {
    await fn();
    results.push(["PASS", name]);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push(["FAIL", name, e.message]);
    console.log(`  ✗ ${name}\n    ${e.message.split("\n")[0]}`);
    throw e;
  }
};
const api = async (method, url, token, body) => {
  const r = await fetch(API + url, { method, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
};
const loginApi = async (email) => (await api("POST", "/api/auth/login", null, { email, password: "Demo-Pass-123" })).data.token;

async function cleanup() {
  for (const p of procs.reverse()) {
    try {
      p.kill("SIGTERM");
    } catch {}
  }
  await new Promise((r) => setTimeout(r, 800));
  fs.rmSync(dbPath, { recursive: true, force: true });
}

async function main() {
  for (const [k, p] of Object.entries(PORTS)) if (!(await free(p))) throw new Error(`Port ${p} (${k}) is in use; stop whatever is using it first.`);
  console.log("Starting isolated stack…");
  start("mongod", ["--dbpath", dbPath, "--port", String(PORTS.mongo), "--bind_ip", "127.0.0.1", "--quiet"], {}, "mongod", true);
  await waitFor(() => new Promise((r) => { const s = net.connect(PORTS.mongo, "127.0.0.1", () => { s.end(); r(true); }).on("error", () => r(false)); }), "mongod");
  const uri = `mongodb://127.0.0.1:${PORTS.mongo}/synapsis_e2e`;
  // The port opens before mongod is ready: wait for a real ping, then seed (retrying).
  const ping = `import("mongoose").then(async ({default:m})=>{await m.connect(${JSON.stringify(uri)},{serverSelectionTimeoutMS:2000});await m.connection.db.admin().ping();await m.disconnect();})`;
  await waitFor(async () => { await run("node", ["-e", ping], { cwd: backend }); return true; }, "mongod ready");
  for (let i = 0; ; i++) {
    try {
      console.log((await run("node", ["scripts/seed-local-demo.js", "--uri", uri], { cwd: backend })).stdout.trim());
      break;
    } catch (e) {
      if (i >= 2) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  const env = { ...process.env, PORT: String(PORTS.api), MONGODB_URL: uri, JWT_SECRET: "e2e-only-secret", CORS_EXTRA_ORIGINS: WEB, EMAIL_USER: "", EMAIL_PASS: "", BREVO_API_KEY: "", GROQ_API_KEY: "", HUGGINGFACE_TOKEN: "", STRIPE_SECRET_KEY: "sk_test_placeholder_not_real" };
  const be = start("node", ["server.js"], { cwd: backend, env }, "backend");
  await waitFor(async () => (await fetch(`${API}/api/ops/units`)).status === 401, "backend").catch((e) => { console.log(be.logTail()); throw e; });

  // Production build, explicitly allowed to target the localhost API only
  // (see NEXT_PUBLIC_ALLOW_LOCAL_API in src/utils/config.js).
  const webEnv = { ...process.env, NEXT_PUBLIC_ALLOW_LOCAL_API: "1", NEXT_PUBLIC_API_URL: API, NEXT_PUBLIC_SOCKET_URL: API, NEXT_DIST_DIR: ".next-e2e" };
  if (!process.env.E2E_SKIP_BUILD) {
    console.log("Building client into .next-e2e (localhost API)…");
    await run("npx", ["next", "build"], { cwd: client, env: webEnv, maxBuffer: 64 * 1024 * 1024 });
  }
  const web = start("npx", ["next", "start", "-p", String(PORTS.web)], { cwd: client, env: webEnv }, "web");
  await waitFor(async () => (await fetch(`${WEB}/login`)).ok, "web", 180000).catch((e) => { console.log(web.logTail()); throw e; });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  // Guard: abort if the page ever calls a host other than the isolated stack.
  const guard = (ctx) => ctx.route(/^https?:\/\/(?!localhost:(5174|3101)\b)/, (route) => {
    console.error(`  ! blocked request to non-isolated host: ${route.request().url()}`);
    route.abort();
  });
  const login = async (ctx, email, home) => {
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.__errors = consoleErrors;
    await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(email);
    await page.locator("input[type=password]").fill("Demo-Pass-123");
    await page.getByLabel("Email").evaluate((el, v) => { if (el.value !== v) throw new Error("form not hydrated"); }, email);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    try {
      await page.waitForURL((u) => u.pathname.startsWith(home), { timeout: 90000 });
    } catch (e) {
      const alert = await page.locator("[role=alert]").allInnerTexts().catch(() => []);
      throw new Error(`login did not reach ${home} (at ${page.url()}); alerts: ${JSON.stringify(alert)}; console: ${JSON.stringify(consoleErrors.slice(0, 5))}`);
    }
    return page;
  };
  const toast = (page, re) => page.getByText(re).first().waitFor({ timeout: 15000 });

  const volCtx = await browser.newContext();
  const tCtx = await browser.newContext({ serviceWorkers: "allow" });
  for (const c of [volCtx, tCtx]) {
    await guard(c);
    c.setDefaultTimeout(60000); // dev mode compiles each route on first visit
  }
  const vTok = await loginApi("volunteer@demo.invalid");
  const pTok = await loginApi("po@demo.invalid");
  const acts = (await api("GET", "/api/ops/diary/activities", vTok)).data.events;
  const session = acts.find((e) => e.type === "regular");
  const camp = acts.find((e) => e.type === "special_camp");

  console.log("Volunteer ⇄ supervisor diary workflow");
  let vol, teacher;
  await step("volunteer logs in and opens the passbook", async () => {
    vol = await login(volCtx, "volunteer@demo.invalid", "/studentlayout");
    await vol.goto(`${WEB}/studentlayout/passbook`);
    await vol.getByRole("heading", { name: "Diary & service passbook" }).waitFor();
    await vol.getByText("Verified regular service").first().waitFor();
  });
  await step("volunteer submits a diary entry", async () => {
    await vol.getByRole("button", { name: "New diary entry" }).click();
    await vol.getByLabel("Activity").selectOption(session._id);
    await vol.getByLabel("Date served").fill(new Date(session.date).toISOString().slice(0, 10));
    await vol.getByLabel("Minutes taken part").fill("180");
    await vol.getByLabel("Work performed").fill("Ran a reading circle for 12 children");
    await vol.getByRole("button", { name: "Submit for review" }).click();
    await toast(vol, "Submitted for review");
  });
  await step("supervisor returns it with feedback", async () => {
    teacher = await login(tCtx, "teacher@demo.invalid", "/teacherLayout");
    await teacher.goto(`${WEB}/teacherLayout/diaryreview`);
    await teacher.getByRole("button", { name: "Review", exact: true }).first().click();
    await teacher.getByLabel("Return for changes").check();
    await teacher.getByLabel(/Reason/).fill("Please add what you learned");
    await teacher.getByRole("button", { name: "Return for changes" }).click();
    await toast(teacher, "Returned to the volunteer");
  });
  await step("volunteer sees the feedback, corrects and resubmits", async () => {
    await vol.reload();
    await vol.getByRole("tab", { name: /Returned/ }).click();
    await vol.getByRole("button", { name: "Correct" }).click();
    await vol.getByText("Please add what you learned").first().waitFor();
    await vol.getByLabel("What you learned").fill("How to keep young readers engaged");
    await vol.getByRole("button", { name: "Submit for review" }).click();
    await toast(vol, "Submitted for review");
  });
  await step("supervisor approves a justified shorter duration", async () => {
    await teacher.reload();
    await teacher.getByRole("button", { name: "Review", exact: true }).first().click();
    await teacher.getByLabel("Approved minutes").fill("160");
    await teacher.getByLabel(/Reason/).fill("Arrived 20 minutes late per register");
    await teacher.getByRole("button", { name: "Approve", exact: true }).click();
    await toast(teacher, "one ledger credit recorded");
  });
  await step("exactly one credit; volunteer and officer totals agree", async () => {
    const mine = (await api("GET", "/api/ops/passbook/me", vTok)).data;
    if (mine.entries.length !== 1 || mine.summary.verifiedRegularMinutes !== 160) throw new Error(`ledger ${JSON.stringify(mine.summary)}`);
    const officer = (await api("GET", `/api/ops/passbook/${mine.entries[0].student}`, pTok)).data;
    if (officer.summary.verifiedRegularMinutes !== 160) throw new Error("officer total differs");
    await vol.reload();
    await vol.getByText("Verified regular service").first().waitFor();
    if (!(await vol.getByText("2.7", { exact: false }).first().isVisible())) throw new Error("passbook UI does not show 2.7 h");
  });

  console.log("Offline field attendance (disconnect, reload, reconnect, conflict)");
  const fa = `${WEB}/teacherLayout/fieldattendance`;
  await step("service worker installed and page shell cached", async () => {
    await teacher.goto(fa);
    await teacher.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await teacher.reload(); // now controlled: shell + static assets cached
    await teacher.evaluate(() => navigator.serviceWorker.controller !== null || navigator.serviceWorker.ready);
    await teacher.getByRole("heading", { name: "Field attendance" }).waitFor();
  });
  await step("roster loaded online, then marks queued while disconnected", async () => {
    await teacher.getByLabel("Activity").selectOption(camp._id);
    await teacher.getByLabel("Session date").fill(new Date(camp.date).toISOString().slice(0, 10));
    await teacher.getByRole("button", { name: "Load roster" }).click();
    await teacher.getByText("Demo Volunteer").first().waitFor();
    await tCtx.setOffline(true);
    await teacher.getByText("Offline", { exact: true }).waitFor();
    await teacher.getByRole("group", { name: /Attendance for Demo Volunteer/ }).getByRole("button", { name: "Present" }).click();
    await teacher.getByText("Queued", { exact: true }).first().waitFor();
  });
  await step("reload while offline keeps the page, roster and queue", async () => {
    await teacher.reload().catch((e) => console.log(`    reload: ${e.message.split("\n")[0]}`));
    try {
      await teacher.getByRole("heading", { name: "Field attendance" }).waitFor({ timeout: 20000 });
    } catch (e) {
      const body = await teacher.evaluate(() => document.body?.innerText?.slice(0, 400)).catch(() => "(no body)");
      const sw = await teacher.evaluate(async () => ({ ctrl: Boolean(navigator.serviceWorker.controller), caches: await Promise.all((await caches.keys()).map(async (k) => [k, (await (await caches.open(k)).keys()).length])) })).catch(() => null);
      throw new Error(`${e.message.split("\n")[0]} | page: ${JSON.stringify(body)} | sw: ${JSON.stringify(sw)} | errors: ${JSON.stringify((teacher.__errors || []).slice(-5))}`);
    }
    await teacher.getByText("Queued", { exact: true }).first().waitFor();
    await teacher.getByLabel("Activity").selectOption(camp._id);
    await teacher.getByRole("button", { name: "Load roster" }).click();
    await teacher.getByText(/using the roster saved on this device/).waitFor();
  });
  await step("reconnecting syncs once (idempotent)", async () => {
    await tCtx.setOffline(false);
    await teacher.getByText("Synced", { exact: true }).first().waitFor({ timeout: 20000 });
    await teacher.getByRole("button", { name: "Sync now" }).click();
    const recs = (await api("GET", `/api/ops/attendance/roster?event=${camp._id}&date=${new Date(camp.date).toISOString().slice(0, 10)}`, pTok)).data.records;
    if (recs.length !== 1) throw new Error(`expected 1 record, got ${recs.length}`);
  });
  await step("conflicting offline edit is kept for review, then resolved", async () => {
    const day = new Date(camp.date).toISOString().slice(0, 10);
    const rec = (await api("GET", `/api/ops/attendance/roster?event=${camp._id}&date=${day}`, pTok)).data.records[0];
    const r = await api("POST", `/api/ops/attendance/${rec._id}/correct`, pTok, { status: "excused", reason: "Medical leave per register", rev: rec.rev });
    if (r.status !== 200) throw new Error(JSON.stringify(r.data));
    await tCtx.setOffline(true);
    await teacher.getByRole("group", { name: /Attendance for Demo Volunteer/ }).getByRole("button", { name: "Absent" }).click();
    await tCtx.setOffline(false);
    await teacher.getByText("Conflict — review", { exact: true }).first().waitFor({ timeout: 20000 });
    const after = (await api("GET", `/api/ops/attendance/roster?event=${camp._id}&date=${day}`, pTok)).data.records[0];
    if (after.status !== "excused") throw new Error("server copy was overwritten");
    await teacher.goto(`${WEB}/teacherLayout/attendancereview`);
    await teacher.getByText("Offline device:").first().waitFor();
    teacher.once("dialog", (d) => d.accept("Register is authoritative"));
    await teacher.getByRole("button", { name: "Keep server" }).click();
    await toast(teacher, "Conflict resolved");
  });
  await step("logout removes offline queue, rosters and caches", async () => {
    await teacher.goto(fa);
    const before = await teacher.evaluate(async () => ({ ls: Object.keys(localStorage).filter((k) => k.startsWith("synapsis.offline.")).length, caches: (await caches.keys()).filter((k) => k.startsWith("synapsis-field-")).length }));
    if (!before.ls || !before.caches) throw new Error(`nothing cached before logout: ${JSON.stringify(before)}`);
    // The app's own sign-out control.
    await teacher.getByRole("button", { name: "Sign out" }).first().click();
    await teacher.waitForURL((u) => u.pathname.startsWith("/login"), { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    const left = await teacher.evaluate(async () => ({ token: localStorage.getItem("token"), ls: Object.keys(localStorage).filter((k) => k.startsWith("synapsis.offline.")).length, caches: (await caches.keys()).filter((k) => k.startsWith("synapsis-field-")).length }));
    if (left.token || left.ls || left.caches) throw new Error(`left after logout: ${JSON.stringify(left)}`);
  });

  console.log("Officer workspace and isolation");
  await step("Programme Officer workspace shows real queues", async () => {
    const poCtx = await browser.newContext();
    await guard(poCtx);
    poCtx.setDefaultTimeout(60000);
    const po = await login(poCtx, "po@demo.invalid", "/coordinatorlayout");
    await po.goto(`${WEB}/coordinatorlayout/workspace`);
    await po.getByRole("heading", { name: "Programme Officer workspace" }).waitFor();
    await po.getByText("Diaries awaiting review").first().waitFor();
    await po.goto(`${WEB}/coordinatorlayout/reports`);
    await po.getByRole("button", { name: "Generate draft" }).click();
    await toast(po, "Draft report generated");
    await poCtx.close();
  });
  await step("another institution's officer sees none of it", async () => {
    const oCtx = await browser.newContext();
    await guard(oCtx);
    oCtx.setDefaultTimeout(60000);
    const o = await login(oCtx, "po@other.invalid", "/coordinatorlayout");
    await o.goto(`${WEB}/coordinatorlayout/diaryreview`);
    await o.getByRole("tab", { name: "Approved" }).click();
    await o.getByText("Nothing to review").first().waitFor();
    await oCtx.close();
  });

  await browser.close();
}

main()
  .then(async () => {
    await cleanup();
    console.log(`\nE2E: ${results.filter((r) => r[0] === "PASS").length} passed, ${results.filter((r) => r[0] === "FAIL").length} failed`);
  })
  .catch(async (e) => {
    console.error(`\nE2E stopped: ${e.message}`);
    for (const p of procs) if (p.name !== "mongod") console.error(`--- ${p.name} log tail ---\n${p.logTail?.()}`);
    await cleanup();
    process.exit(1);
  });
