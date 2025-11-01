// Generated automatically
// Do not edit
//
// {{DATE}}

/**
 * Result object returned by {@link readOpenApiSpec}
 */
interface OpenApiSpecResult {
    /** The OpenAPI spec version (e.g., "2.21.4") */
    version: string;
    /** SHA256 hash of the JSON file */
    hash: string;
    /** The complete OpenAPI specification object */
    json: Record<string, unknown>;
}

/**
 * Loads the Riigikogu OpenAPI specification from the bundled JSON file.
 * The function is lazy-loaded - the file is only read when first called.
 * Subsequent calls return the cached promise.
 *
 * @returns Promise resolving to an object containing the spec version, hash, and JSON
 */
declare function readOpenApiSpec(): Promise<OpenApiSpecResult>;

export default readOpenApiSpec;

/**
 * The source URL for the Riigikogu OpenAPI specification.
 * You can use this to fetch the spec directly from the API.
 */
export const OPENAPI_URL: string;
