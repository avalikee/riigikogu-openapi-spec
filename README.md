# @avalik/riigikogu-openapi-spec

JavaScript package that provides the [Riigikogu](https://www.riigikogu.ee/) (Estonian Parliament) [OpenAPI specification](https://api.riigikogu.ee/v3/api-docs) as a typed JavaScript object with lazy loading.

Here is the [official Riigikogu API explorer](https://api.riigikogu.ee/swagger-ui/index.html) (via Swagger UI).

_Supports both ESM and CommonJS modules_

## Installation

```bash
npm install @avalik/riigikogu-openapi-spec
```

Or using other package managers:

```bash
yarn add @avalik/riigikogu-openapi-spec
pnpm add @avalik/riigikogu-openapi-spec
bun add @avalik/riigikogu-openapi-spec
```

## Usage

```javascript
import readOpenApiSpec, { OPENAPI_URL } from '@avalik/riigikogu-openapi-spec';

// Load the OpenAPI specification (lazy-loaded, cached after first call)
const { version, hash, json } = await readOpenApiSpec();

// Access the complete OpenAPI specification
console.log('API Version:', version);
console.log('Specification hash:', hash);
console.log('Available paths:', Object.keys(json.paths));
```

## API

### `readOpenApiSpec()`

Asynchronously loads the Riigikogu OpenAPI specification from the bundled JSON file. Uses lazy loading—the file is only read on the first call, and subsequent calls return the same cached promise for efficiency.

**Returns:** `Promise<OpenApiSpecResult>`

An object containing:

- **`version`** (`string`): The OpenAPI specification version (e.g., `"2.21.4"`)
- **`hash`** (`string`): SHA256 hash of the bundled JSON file for verification
- **`json`** (`Record<string, unknown>`): The complete OpenAPI 3.0 specification object

### `OPENAPI_URL`

A string constant containing the source URL where the OpenAPI specification is fetched from:

```
https://api.riigikogu.ee/v3/api-docs
```

This is primarily useful for reference or if you need to fetch the latest specification directly from the API.

## Examples

### Inspecting Available Endpoints

```javascript
import readOpenApiSpec from '@avalik/riigikogu-openapi-spec';

const { json } = await readOpenApiSpec();

// List all available API paths
const endpoints = Object.keys(json.paths);
console.log('Available endpoints:', endpoints);

// Get details for a specific endpoint
const endpointDetails = json.paths['/v3/endpoint'];
```

### Working with Schemas

```javascript
import readOpenApiSpec from '@avalik/riigikogu-openapi-spec';

const { json } = await readOpenApiSpec();

// Access reusable schema definitions
const schemas = json.components?.schemas;

// Get a specific schema
const documentSchema = schemas?.Document;
```

### Fetching the Latest Spec from the API

```javascript
import { OPENAPI_URL } from '@avalik/riigikogu-openapi-spec';

// Fetch the latest OpenAPI specification directly from the API
const response = await fetch(OPENAPI_URL);
const latestSpec = await response.json();

console.log('Latest API version:', latestSpec.info.version);
```

## Versioning

- **Package versioning (ours)**: We use SemVer starting at `1.0.0`.
  - **Internal release**: bump the package **patch** (e.g., `1.0.0` → `1.0.1`).
  - **Upstream spec changes**: bump the package **major** (e.g., `1.0.2` → `2.0.0`).
- **Spec version (upstream)**: The `version` returned by `readOpenApiSpec()` is the Riigikogu OpenAPI version (e.g., `"2.31.1"`) and is independent of our package version.

### Examples

- First publish with upstream spec `2.31.1` → package `1.0.0`.
- Internal fix without spec changes → package `1.0.1`.
- Upstream spec updates (e.g., `2.31.2`) → package `2.0.0`.

### Pinning

- Pin to our package API surface: depend on a specific package version (e.g., `^2.0.0`).
- Inspect upstream spec at runtime: read `version` from `readOpenApiSpec()`.

## License

Apache-2.0 - See [LICENSE](LICENSE) for details.
