#!/usr/bin/env bun
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from './utils/parse-args.js';

const argMap = parseArgs(process.argv.slice(2));

const URL = argMap.get('url');
const OUT_JSON = argMap.get('output-json');
const OUT_SHA256 = argMap.get('output-sha256');

if (!URL) {
    console.error('error: --url argument is required');
    process.exit(1);
}

if (!OUT_JSON) {
    console.error('error: --output-json argument is required');
    process.exit(1);
}

if (!OUT_SHA256) {
    console.error('error: --output-sha256 argument is required');
    process.exit(1);
}

async function fetchSpecJson(url: string, timeout = 30000): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'avalik.ee-spec-fetcher' },
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`unexpected status ${response.status}`);
        }

        const data = (await response.json()) as Record<string, unknown>;
        clearTimeout(timeoutId);
        return data;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

function formatJson(data: Record<string, unknown>): string {
    const text = JSON.stringify(data, null, 2);
    return text.endsWith('\n') ? text : `${text}\n`;
}

function normalizeNewlines(text: string): string {
    return text.replace(/\r\n/g, '\n');
}

/**
 * Normalizes JSON by sorting object keys recursively.
 * This ensures that field order differences don't cause false positives.
 */
function normalizeJson(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(normalizeJson);
    }

    // For objects, sort keys and recursively normalize values
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = normalizeJson((obj as Record<string, unknown>)[key]);
    }
    return sorted;
}

/**
 * Compares two JSON objects semantically (ignoring field order).
 */
function jsonEquals(a: unknown, b: unknown): boolean {
    const normalizedA = normalizeJson(a);
    const normalizedB = normalizeJson(b);
    return JSON.stringify(normalizedA) === JSON.stringify(normalizedB);
}

interface ShaFileResult {
    hash: string;
    filename: string | null;
}

async function readShaFile(sha256Path: string): Promise<ShaFileResult | null> {
    try {
        const content = await readFile(sha256Path, 'utf-8');
        const line = content.split('\n')[0]?.trim();
        if (!line) return null;

        const parts = line.split(/\s+/);
        const hash = parts[0];

        if (!hash || hash.length !== 64 || !/^[0-9a-f]{64}$/i.test(hash)) {
            return null;
        }

        const filename = parts.length > 1 ? parts.slice(1).join(' ').trim() : null;
        return { hash, filename };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
    }
}

try {
    const specData = await fetchSpecJson(URL);

    let existingJson: Record<string, unknown> | null = null;
    try {
        const existingText = await readFile(OUT_JSON, 'utf-8');
        existingJson = JSON.parse(existingText) as Record<string, unknown>;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    // Compare JSON semantically (ignoring field order)
    const jsonChanged = !existingJson || !jsonEquals(existingJson, specData);
    
    // Normalize and format the JSON for writing (ensures consistent field order)
    const normalizedSpecData = normalizeJson(specData) as Record<string, unknown>;
    const newText = formatJson(normalizedSpecData);

    let shaNeedsUpdate = false;
    if (!jsonChanged && existingJson) {
        const parsed = await readShaFile(OUT_SHA256);
        if (!parsed) {
            shaNeedsUpdate = true;
        } else {
            // Calculate hash of the normalized JSON text for consistency
            const normalizedNewText = normalizeNewlines(newText);
            const currentHash = createHash('sha256').update(normalizedNewText, 'utf-8').digest('hex');
            if (parsed.hash !== currentHash) {
                shaNeedsUpdate = true;
            }
        }
    }

    if (!jsonChanged && !shaNeedsUpdate) {
        process.stdout.write('unchanged\n');
        process.exit(0);
    }

    await writeFile(OUT_JSON, newText, 'utf-8');
    const hash = createHash('sha256').update(newText, 'utf-8').digest('hex');
    await writeFile(OUT_SHA256, `${hash}  ${OUT_JSON}\n`, 'utf-8');

    process.stdout.write('changed\n');
    process.exit(0);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`error: ${message}\n`);
    process.exit(1);
}

