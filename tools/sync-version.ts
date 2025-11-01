#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from './utils/parse-args.js';
import semver from 'semver';

const argMap = parseArgs(process.argv.slice(2));

const specVersion = argMap.get('set-version');
const incrementRevision = argMap.has('increment-revision');

if (!specVersion) {
    console.error('error: --set-version argument is required');
    process.exit(1);
}

// Validate spec version format
if (!semver.valid(specVersion)) {
    console.error(`error: invalid semver version: ${specVersion}`);
    process.exit(1);
}

interface PackageJson {
    version: string;
    [key: string]: unknown;
}

// No longer using build metadata; we track upstream spec explicitly and bump patch for revisions

try {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as PackageJson;
    const currentVersion = pkg.version;
    let newVersion: string = currentVersion;
    let updated = false;

    if (incrementRevision) {
        // Internal release → bump our PATCH version
        const baseline = semver.valid(currentVersion) ? currentVersion : '1.0.0';
        const bumped = semver.inc(baseline, 'patch');
        if (!bumped) {
            throw new Error(`unable to bump patch for version: ${currentVersion}`);
        }
        newVersion = bumped;
        updated = currentVersion !== newVersion;
    } else {
        // Upstream spec changed → bump our MAJOR version
        const baseline = semver.valid(currentVersion) ? currentVersion : '1.0.0';
        const bumped = semver.inc(baseline, 'major') ?? '1.0.0';
        newVersion = bumped;
        updated = currentVersion !== newVersion;
        // No changes requested
        // (handled via the workflow flag; if no bump needed, this step won't run)
    }

    if (updated) {
        pkg.version = newVersion;
        await writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.error(`Version updated: ${currentVersion} → ${newVersion}`);
    } else {
        console.error(`Version unchanged: ${currentVersion}`);
        newVersion = currentVersion;
    }

    // Output GitHub Actions output format
    console.log(`updated=${updated}`);
    console.log(`version=${newVersion}`);
    process.exit(0);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exit(1);
}

