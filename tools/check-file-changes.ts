#!/usr/bin/env bun
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { parseArgs } from './utils/parse-args.js';

const argMap = parseArgs(process.argv.slice(2));
const files = argMap.get('files');

if (!files) {
    console.error('error: --files argument is required (comma-separated list)');
    process.exit(1);
}

const fileList = files.split(',').map((f) => f.trim());

// Filter out files that are ignored by git or do not exist
const candidateFiles = fileList.filter((filePath) => existsSync(filePath));
const filesToStage = candidateFiles.filter((filePath) => {
    try {
        // Exit code 0 => path is ignored; non-zero => not ignored
        execSync(`git check-ignore -q -- ${JSON.stringify(filePath)}`, { stdio: 'pipe' });
        return false; // ignored
    } catch {
        return true; // not ignored
    }
});

try {
    // If nothing to stage after filtering, report no changes and exit cleanly
    if (filesToStage.length === 0) {
        console.log('changed=false');
        process.exit(0);
    }

    // Stage the files (quote each to handle special chars safely)
    execSync(`git add ${filesToStage.map((f) => JSON.stringify(f)).join(' ')}`, { stdio: 'pipe' });

    // Check if there are staged changes
    try {
        execSync('git diff --cached --quiet', { stdio: 'pipe' });
        // Exit code 0 means no changes
        console.log('changed=false');
        process.exit(0);
    } catch (error) {
        // Exit code 1 means there are changes
        console.log('changed=true');
        process.exit(0);
    }
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exit(1);
}

