/**
 * Pulls logs from the live Render service into your terminal, so you don't
 * have to keep the Render dashboard open to debug something.
 *
 * Usage:
 *   node scripts/tailRenderLogs.js                  # last hour, then exit
 *   node scripts/tailRenderLogs.js --since=180       # last 3 hours
 *   node scripts/tailRenderLogs.js --follow          # keep polling for new lines (Ctrl+C to stop)
 *   node scripts/tailRenderLogs.js --text=snapshot    # only lines containing "snapshot"
 *   node scripts/tailRenderLogs.js --level=error      # only error-level lines
 *
 * Requires RENDER_API_KEY and RENDER_SERVICE_ID in server/.env:
 *   - RENDER_API_KEY: Render dashboard → Account Settings → API Keys → Create API Key
 *   - RENDER_SERVICE_ID: the "srv-..." id in your service's Render dashboard URL
 *     (https://dashboard.render.com/web/srv-XXXXXXXXXXXX)
 *
 * Render's array-typed query params (resource, text, level, ...) aren't shown
 * with a concrete example in their docs — this uses the OpenAPI default
 * (repeated key: resource=a&resource=b). If Render rejects that, this script
 * will print the raw API error response rather than fail silently.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const API_BASE = 'https://api.render.com/v1';
const POLL_INTERVAL_MS = 5000;

const RESET = '\x1b[0m';
const LEVEL_COLORS = { error: '\x1b[31m', warn: '\x1b[33m', warning: '\x1b[33m' };

function parseArgs(argv) {
  const args = { since: 60, follow: false, text: null, level: null };
  for (const arg of argv) {
    if (arg === '--follow' || arg === '-f') args.follow = true;
    else if (arg.startsWith('--since=')) args.since = Number(arg.slice('--since='.length)) || 60;
    else if (arg.startsWith('--text=')) args.text = arg.slice('--text='.length);
    else if (arg.startsWith('--level=')) args.level = arg.slice('--level='.length);
  }
  return args;
}

function fail(message) {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

async function renderRequest(path, params) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
    else url.searchParams.append(key, value);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    fail(`Render API request to ${path} failed (${res.status}): ${body}`);
  }

  return res.json();
}

function labelValue(labels, name) {
  return (labels || []).find((l) => l.name === name)?.value;
}

function printLog(entry) {
  const level = labelValue(entry.labels, 'level') || 'info';
  const line = `${entry.timestamp} [${level}] ${entry.message}`;
  const color = LEVEL_COLORS[level.toLowerCase()];
  console.log(color ? `${color}${line}${RESET}` : line);
}

async function fetchLogPage({ ownerId, serviceId, startTime, endTime, direction, text, level }) {
  return renderRequest('/logs', {
    ownerId,
    resource: [serviceId],
    startTime,
    endTime,
    direction,
    limit: 100,
    text: text ? [text] : undefined,
    level: level ? [level] : undefined,
  });
}

async function main() {
  const { since, follow, text, level } = parseArgs(process.argv.slice(2));

  if (!process.env.RENDER_API_KEY) fail('RENDER_API_KEY is not set in server/.env — see this file\'s header comment.');
  if (!process.env.RENDER_SERVICE_ID) fail('RENDER_SERVICE_ID is not set in server/.env — see this file\'s header comment.');

  const serviceId = process.env.RENDER_SERVICE_ID;
  const service = await renderRequest(`/services/${serviceId}`);
  const ownerId = service.ownerId;

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - since * 60 * 1000);

  const initial = await fetchLogPage({
    ownerId,
    serviceId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    direction: 'backward',
    text,
    level,
  });

  // backward = newest-first; print chronologically, oldest at the top, like `tail`.
  const seenIds = new Set();
  let lastTimestamp = startTime.toISOString();
  for (const entry of [...initial.logs].reverse()) {
    printLog(entry);
    seenIds.add(entry.id);
    if (entry.timestamp > lastTimestamp) lastTimestamp = entry.timestamp;
  }

  if (!follow) return;

  console.log(`\n--- following new logs (Ctrl+C to stop) ---\n`);

  // Poll forward from the last timestamp seen. seenIds guards against
  // reprinting a log whose timestamp exactly matches the poll boundary.
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const page = await fetchLogPage({
      ownerId,
      serviceId,
      startTime: lastTimestamp,
      endTime: new Date().toISOString(),
      direction: 'forward',
      text,
      level,
    });

    for (const entry of page.logs) {
      if (seenIds.has(entry.id)) continue;
      printLog(entry);
      seenIds.add(entry.id);
      if (entry.timestamp > lastTimestamp) lastTimestamp = entry.timestamp;
    }

    // Keep the seen-ids set from growing forever across a long-running --follow session.
    if (seenIds.size > 1000) seenIds.clear();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
