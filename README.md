# DisneyOS Setup

Permanent public URL:

`https://disneyos.github.io/disneyos-setup/`

## Versioned structure

```text
disneyos-setup/
├── index.html
├── latest.json
└── v1/
    ├── index.html
    ├── app.js
    ├── config.js
    ├── styles.css
    ├── theme.css
    └── assets/
```

The root `index.html` reads `latest.json` and forwards visitors to the active major version.

## Publishing a future major version

1. Copy `v1/` to a new folder such as `v2/`.
2. Develop and test the new version at:
   `https://disneyos.github.io/disneyos-setup/v2/`
3. When ready, update `latest.json`:

```json
{
  "current": "v2",
  "version": "2.0"
}
```

The permanent public URL and NFC card link never change.

## Minor updates

Changes within the same major release can be made directly inside `v1/`, while preserving the stable rollback boundary between major versions.
