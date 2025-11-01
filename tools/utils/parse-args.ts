/**
 * Parse command-line arguments into a Map
 * Expects arguments in format: --key value --key2 value2
 */
export function parseArgs(args: string[]): Map<string, string> {
    const argMap = new Map<string, string>();

    for (let i = 0; i < args.length; i++) {
        const token = args[i];
        if (!token) continue;

        // Key token (with or without -- prefix)
        if (token.startsWith('--')) {
            const key = token.replace(/^--/, '');
            const next = args[i + 1];

            // If next token is missing or is another key, treat as boolean true flag
            if (next === undefined || next.startsWith('--')) {
                argMap.set(key, 'true');
                continue;
            }

            // Otherwise, consume the value
            argMap.set(key, next);
            i += 1; // skip value
            continue;
        }

        // Token without -- prefix; treat as key if it has a following value
        const key = token;
        const next = args[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
            argMap.set(key, next);
            i += 1; // skip value
        }
    }

    return argMap;
}

