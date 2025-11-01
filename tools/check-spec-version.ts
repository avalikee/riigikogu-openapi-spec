#!/usr/bin/env bun
import { execSync } from 'node:child_process';
import { parseArgs } from './utils/parse-args.js';
import semver from 'semver';

const argMap = parseArgs(process.argv.slice(2));

const newSpecVersion = argMap.get('new-version');
// We no longer rely on package.json for spec tracking; compare with previous commit

if (!newSpecVersion) {
    console.error('error: --new-version argument is required');
    process.exit(1);
}

// Validate new spec version format
if (!semver.valid(newSpecVersion)) {
    console.error(`error: invalid semver version: ${newSpecVersion}`);
    process.exit(1);
}

try {
    // Read the previous committed spec file from HEAD and extract its version
    let previousSpecVersion: string | null = null;
    try {
        const previousContent = execSync('git show HEAD:riigikogu-openapi.json', { stdio: 'pipe' }).toString('utf8');
        const previousJson = JSON.parse(previousContent) as { info?: { version?: string } };
        previousSpecVersion = previousJson.info?.version ?? null;
    } catch {
        // If the file didn't exist previously or git is unavailable, treat as no previous version
        previousSpecVersion = null;
    }

    const specChanged = !previousSpecVersion || semver.neq(previousSpecVersion, newSpecVersion);

    // Output GitHub Actions output format
    console.log(`spec_changed=${specChanged}`);
    process.exit(0);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exit(1);
}

