#!/usr/bin/env bun
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
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

try {
    const specData = await fetchSpecJson(URL);

    // Format and write the spec (we don't compare contents, only version)
    const newText = formatJson(specData);
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

