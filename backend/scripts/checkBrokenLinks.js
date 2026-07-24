// Run with: npm run check-links
// Intended to be scheduled (cron / task scheduler) to periodically mark
// dead links (404s, redirects to error pages, unreachable hosts) as broken.
import 'dotenv/config';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import Link from '../models/Link.js';
import { connectDB } from '../config/db.js';

const BATCH_SIZE = 50;
const TIMEOUT_MS = 8000;

async function checkOne(link) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(link.url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrainVaultLinkChecker/1.0)' },
    });
    clearTimeout(timeout);
    return { isBroken: res.status >= 400, httpStatus: res.status };
  } catch {
    return { isBroken: true, httpStatus: 0 };
  }
}

async function run() {
  await connectDB();

  const links = await Link.find({ isDeleted: false })
    .sort('linkStatus.lastCheckedAt')
    .limit(BATCH_SIZE);

  console.log(`[BrokenLinkChecker] Checking ${links.length} links...`);

  for (const link of links) {
    const result = await checkOne(link);
    link.linkStatus = {
      isBroken: result.isBroken,
      httpStatus: result.httpStatus,
      lastCheckedAt: new Date(),
    };
    await link.save();
    console.log(`  ${result.isBroken ? '✗ BROKEN' : '✓ OK'} (${result.httpStatus}) ${link.url}`);
  }

  console.log('[BrokenLinkChecker] Done.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[BrokenLinkChecker] Fatal error:', err);
  process.exit(1);
});
