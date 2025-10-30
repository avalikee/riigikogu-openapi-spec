# riigikogu-openapi-spec
Weekly-updated mirror of the official Riigikogu OpenAPI specification.

- Source: https://api.riigikogu.ee/v3/api-docs
- Mirror: `riigikogu-openapi.json` (pretty‑formatted)
- Hash: `riigikogu-openapi.json.sha256` (SHA‑256 of JSON)
  
Automation uses a Python script `tools/spec-fetcher/spec-fetcher.py`.

## Schedule
Runs Sundays 20:00 UTC via GitHub Actions.

## Verify integrity
Linux/macOS:
```bash
shasum -a 256 -c riigikogu-openapi.json.sha256
# or
sha256sum -c riigikogu-openapi.json.sha256
```

## Develop locally
From repo root:
```bash
python tools/spec-fetcher/spec-fetcher.py
```

License: Apache-2.0
