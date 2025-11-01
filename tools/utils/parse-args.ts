/**
 * Parse command-line arguments into a Map
 * Expects arguments in format: --key value --key2 value2
 */
export function parseArgs(args: string[]): Map<string, string> {
    const argMap = new Map<string, string>();

    for (let i = 0; i < args.length; i += 2) {
        const key = args[i]?.replace(/^--/, '');
        const value = args[i + 1];
        if (key && value) {
            argMap.set(key, value);
        }
    }

    return argMap;
}

