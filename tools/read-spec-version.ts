#!/usr/bin/env bun
import { readFile } from 'node:fs/promises';
import { parseArgs } from './utils/parse-args.js';

const argMap = parseArgs(process.argv.slice(2));
const jsonFile = argMap.get('json-file') || 'riigikogu-openapi.json';

interface OpenApiSpec {
    info: {
        version: string;
    };
}

try {
    const json = JSON.parse(await readFile(jsonFile, 'utf8')) as OpenApiSpec;
    const version = json.info?.version;

    if (!version) {
        console.error(`error: version not found in ${jsonFile}`);
        process.exit(1);
    }

    // Output GitHub Actions output format
    console.log(`version=${version}`);
    process.exit(0);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exit(1);
}

