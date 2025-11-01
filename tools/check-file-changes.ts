#!/usr/bin/env bun
import { execSync } from 'node:child_process';
import { parseArgs } from './utils/parse-args.js';

const argMap = parseArgs(process.argv.slice(2));
const files = argMap.get('files');

if (!files) {
    console.error('error: --files argument is required (comma-separated list)');
    process.exit(1);
}

const fileList = files.split(',').map((f) => f.trim());

try {
    // Stage the files
    execSync(`git add ${fileList.join(' ')}`, { stdio: 'pipe' });

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

