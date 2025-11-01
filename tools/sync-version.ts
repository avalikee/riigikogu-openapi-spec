#!/usr/bin/env bun

import { readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { parseArgs } from './utils/parse-args.js';
import semver from 'semver';

const argMap = parseArgs(process.argv.slice(2));

const specVersion = argMap.get('set-version');
const incrementRevision = argMap.has('increment-revision');

if (!specVersion) {
    console.error('error: --set-version argument is required');
    process.exit(1);
}

if (!semver.valid(specVersion)) {
    console.error(`error: invalid semver version: ${specVersion}`);
    process.exit(1);
}

interface PackageJson {
    version: string;
    [key: string]: unknown;
}

try {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as PackageJson;
    const currentVersion = pkg.version;
    let newVersion: string = currentVersion;
    let updated = false;

    if (incrementRevision) {
        const baseline = semver.valid(currentVersion) ? currentVersion : '1.0.0';
        const bumped = semver.inc(baseline, 'patch');
        if (!bumped) {
            throw new Error(`unable to bump patch for version: ${currentVersion}`);
        }
        newVersion = bumped;
        updated = currentVersion !== newVersion;
    } else {
        const baseline = semver.valid(currentVersion) ? currentVersion : '1.0.0';
        const bumped = semver.inc(baseline, 'major') ?? '1.0.0';
        newVersion = bumped;
        updated = currentVersion !== newVersion;
    }

    if (updated) {
        pkg.version = newVersion;
        await writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n');

        try {
            execSync('prettier --write package.json', { stdio: 'pipe' });
        } catch (error) {
            throw new Error(`unable to format package.json: ${error}`);
        }

        console.error(`Version updated: ${currentVersion} → ${newVersion}`);
    } else {
        console.error(`Version unchanged: ${currentVersion}`);
        newVersion = currentVersion;
    }

    console.log(`updated=${updated}`);
    console.log(`version=${newVersion}`);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exit(1);
}
