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
    const newText = formatJson(specData);

    let existing: string | null = null;
    try {
        existing = await readFile(OUT_JSON, 'utf-8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    const normalizedExisting = existing ? normalizeNewlines(existing) : null;
    const normalizedNew = normalizeNewlines(newText);
    const jsonChanged = normalizedExisting !== normalizedNew;

    let shaNeedsUpdate = false;
    if (!jsonChanged && existing) {
        const parsed = await readShaFile(OUT_SHA256);
        if (!parsed) {
            shaNeedsUpdate = true;
        } else {
            const currentHash = createHash('sha256').update(normalizedExisting, 'utf-8').digest('hex');
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

