#!/usr/bin/env python3
import hashlib
import json
import re
import sys
import urllib.request

URL = "https://api.riigikogu.ee/v3/api-docs"
OUT_JSON = "riigikogu-openapi.json"
OUT_SHA256 = "riigikogu-openapi.json.sha256"


def fetch_spec_bytes(timeout=30):
    req = urllib.request.Request(URL, headers={"User-Agent": "avalik.ee-spec-fetcher"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        if resp.status != 200:
            raise RuntimeError(f"unexpected status {resp.status}")
        return resp.read()



def pretty_json_bytes(raw_bytes):
    data = json.loads(raw_bytes.decode("utf-8"))
    text = json.dumps(data, indent=2, ensure_ascii=False)
    if not text.endswith("\n"):
        text += "\n"
    return text.encode("utf-8")


def normalize_newlines(b):
    return b.replace(b"\r\n", b"\n")



def read_sha_file():
    try:
        with open(OUT_SHA256, "r", encoding="utf-8") as f:
            line = f.readline().strip()
    except FileNotFoundError:
        return None
    # Expect format: "<hash>  <filename>"
    parts = re.split(r"\s+", line, maxsplit=1)
    if not parts or len(parts[0]) != 64 or not re.fullmatch(r"[0-9a-f]{64}", parts[0]):
        return None
    filename = None
    if len(parts) > 1:
        filename = parts[1].strip()
    return (parts[0], filename)



def main():
    # Fetch and prepare pretty JSON
    new_bytes = pretty_json_bytes(fetch_spec_bytes())

    # Read existing JSON if present
    try:
        with open(OUT_JSON, "rb") as f:
            existing = f.read()
    except FileNotFoundError:
        existing = None

    # Determine change based on JSON content
    json_changed = not (existing is not None and normalize_newlines(existing) == normalize_newlines(new_bytes))

    sha_needs_update = False
    if not json_changed:
        # JSON content unchanged; check SHA file validity against current JSON
        parsed = read_sha_file()
        if parsed is None:
            sha_needs_update = True
        else:
            hash_hex, _filename = parsed
            current_hash = hashlib.sha256(normalize_newlines(existing)).hexdigest()
            if hash_hex != current_hash:
                sha_needs_update = True

    changed = json_changed or sha_needs_update

    if not changed:
        sys.stdout.write("unchanged\n")
        return 0

    # Write JSON (even if content same but SHA invalid, rewrite for consistency)
    with open(OUT_JSON, "wb") as f:
        f.write(new_bytes)

    # Write hash file in "<hash>  <filename>\n" format
    h = hashlib.sha256(new_bytes).hexdigest()
    sha_line = f"{h}  {OUT_JSON}\n"
    with open(OUT_SHA256, "w", encoding="utf-8") as f:
        f.write(sha_line)

    sys.stdout.write("changed\n")
    return 0



if __name__ == "__main__":
    try:
        code = main()
    except Exception as e:
        # Non-fatal for CI? Still return non-zero to surface failure.
        sys.stderr.write(f"error: {e}\n")
        sys.exit(1)
    sys.exit(code)


