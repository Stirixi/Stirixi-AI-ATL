import type { EngineerScore } from '@/lib/types';

const BASE58_CHARS =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const HEX_CHARS = '0123456789abcdef';

function hashString(value: string): number {
  if (!value) return 1;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000000007;
  }
  return hash || 1;
}

function pseudoRandom(seed: number, offset = 0): number {
  const x = Math.sin(seed + offset * 97.13) * 10000;
  return x - Math.floor(x);
}

function generateBase58(seed: number, length: number): string {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(
      pseudoRandom(seed, i + 1) * BASE58_CHARS.length
    );
    result += BASE58_CHARS[idx];
  }
  return result;
}

function generateHex(seed: number, length: number): string {
  let hex = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(pseudoRandom(seed, i + 33) * HEX_CHARS.length);
    hex += HEX_CHARS[idx];
  }
  return hex;
}

function scale(seed: number, offset: number, min: number, max: number): number {
  return min + pseudoRandom(seed, offset) * (max - min);
}

function buildMockScore(subjectId: string, sequence = 0): EngineerScore {
  const baseSeed = hashString(subjectId) + sequence * 137;
  const issuedAt = new Date(
    Date.now() - sequence * 1000 * 60 * 60 * 24 * 21
  ).toISOString();

  return {
    _id: `${subjectId || 'subject'}-mock-sbt-${sequence + 1}`,
    engineer_id: subjectId,
    project_id: null,
    engineer_wallet: generateBase58(baseSeed + 11, 44),
    overall_score: Math.round(scale(baseSeed, 1, 72, 96)),
    reliability_score: Math.round(scale(baseSeed, 2, 68, 94)),
    ai_efficiency_score: Math.round(scale(baseSeed, 3, 65, 93)),
    bug_rate: Number(scale(baseSeed, 4, 0.04, 0.18).toFixed(3)),
    confidence: Number(scale(baseSeed, 5, 0.72, 0.97).toFixed(3)),
    last_updated: issuedAt,
    score_hash: generateHex(baseSeed + 19, 64),
    solana_signature: generateBase58(baseSeed + 23, 88),
  };
}

export function getMockSBTSeries(
  subjectId: string,
  historyCount = 4
): { latest: EngineerScore; history: EngineerScore[] } {
  const count = Math.max(1, historyCount);
  const snapshots = Array.from({ length: count }, (_, idx) =>
    buildMockScore(subjectId, idx)
  );
  return { latest: snapshots[0], history: snapshots };
}
