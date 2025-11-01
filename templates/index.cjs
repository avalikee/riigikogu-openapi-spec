// Generated automatically
// Do not edit
//
// {{DATE}}

const { readFile } = require('node:fs/promises');
const { join } = require('node:path');

let _specPromise = null;

/**
 * Loads the Riigikogu OpenAPI specification from the bundled JSON file.
 * The function is lazy-loaded - the file is only read when first called.
 * Subsequent calls return the cached promise.
 *
 * @returns {Promise<{version: string, hash: string, json: Record<string, unknown>}>}
 *          Promise resolving to an object containing:
 *          - `version`: The OpenAPI spec version (e.g., "2.21.4")
 *          - `hash`: SHA256 hash of the JSON file
 *          - `json`: The complete OpenAPI specification object
 */
async function readOpenApiSpec() {
    if (!_specPromise) {
        _specPromise = (async () => {
            const jsonPath = join(__dirname, '..', 'riigikogu-openapi.json');
            const sha256Path = join(__dirname, '..', 'riigikogu-openapi.json.sha256');

            const [jsonResult, hashResult] = await Promise.allSettled([
                readFile(jsonPath, 'utf8'),
                readFile(sha256Path, 'utf8'),
            ]);

            if (jsonResult.status === 'rejected') {
                throw jsonResult.reason;
            }
            if (hashResult.status === 'rejected') {
                throw hashResult.reason;
            }

            const jsonContent = jsonResult.value;
            const hashContent = hashResult.value;

            const json = JSON.parse(jsonContent);
            const version = json.info?.version || '0.0.0';
            const hash = hashContent.trim().split(/\s+/)[0] || '';

            return {
                version,
                hash,
                json,
            };
        })();
    }
    return _specPromise;
}

/**
 * The source URL for the Riigikogu OpenAPI specification.
 * You can use this to fetch the spec directly from the API.
 *
 * @type {string}
 */
const OPENAPI_URL = 'https://api.riigikogu.ee/v3/api-docs';

module.exports = readOpenApiSpec;
module.exports.OPENAPI_URL = OPENAPI_URL;
