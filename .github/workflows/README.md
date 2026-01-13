# GitHub Actions Workflows

This document describes the CI/CD workflow architecture for autobahn-js,
including artifact production and consumption flow.

## Workflow Overview

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `main.yml` | Lint, format, test, build, security scan | Push, PR |
| `docs.yml` | Build Sphinx docs, deploy to GitHub Pages | Push (docs/lib changes) |
| `release.yml` | Create GitHub releases, publish to npm | workflow_run (after main) |
| `release-post-comment.yml` | Post PR comments & discussions | workflow_run (after release) |

## Artifact Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARTIFACT PRODUCERS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  main.yml                                                                   │
│  ├── autobahn-browser-bundle        (autobahn.js, autobahn.min.js, etc.)   │
│  ├── autobahn-xbr-browser-bundle    (autobahn-xbr.js, autobahn-xbr.min.js) │
│  └── test-results-node-{22,24,25}   (test logs & JSON summaries)           │
│                                                                             │
│  docs.yml                                                                   │
│  └── github-pages                   (Sphinx HTML docs)                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARTIFACT CONSUMER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  release.yml                                                                │
│  ├── Downloads browser bundles from main.yml                               │
│  ├── Creates GitHub Release (development/nightly or stable)                │
│  └── Publishes to npm (stable releases only)                               │
│                                                                             │
│  release-post-comment.yml                                                   │
│  ├── Posts comment to associated PR                                        │
│  └── Creates GitHub Discussion for stable releases                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Workflow Details

### main.yml

Runs on every push/PR to master. Contains parallel jobs for fast feedback:

| Job | Purpose | Node Versions |
|-----|---------|---------------|
| `lint` | ESLint code quality check | 24 |
| `format` | Prettier formatting check | 24 |
| `test` | Run nodeunit tests against Crossbar.io | 22, 24, 25 |
| `build` | Build browser bundles | 24 |
| `security` | npm audit for vulnerabilities | 24 |

**Test Infrastructure:**
- Crossbar.io router installed from PyPI into Python venv
- Tests run with nodeunit, results in JSON format
- 25 test suites covering RPC, PubSub, serialization, RawSocket

### docs.yml

Builds Sphinx documentation with MyST markdown support:

- **Theme**: Furo with Noto fonts
- **Extensions**: sphinx-design, sphinx-copybutton, sphinxext-opengraph
- **Deployment**: GitHub Pages at https://crossbario.github.io/autobahn-js/
- **Triggers**: Only on changes to `docs/` or `packages/autobahn/lib/`

### release.yml

Creates GitHub releases after main.yml succeeds:

| Release Type | Trigger | npm Publish | GitHub Release |
|--------------|---------|-------------|----------------|
| Development/Nightly | Push to master | ❌ No | ✅ Prerelease |
| Stable | Push v* tag | ✅ Yes (with provenance) | ✅ Full release |

**Development releases** include:
- Browser bundles (autobahn.js, autobahn.min.js, etc.)
- Tagged with build name (e.g., `master-202601121831`)
- Marked as prerelease

**Stable releases** include:
- npm publish with SLSA provenance
- Browser bundles attached to GitHub Release
- Auto-generated release notes

### release-post-comment.yml

Post-release notifications:

| Action | Condition |
|--------|-----------|
| PR Comment | Release has associated PR |
| GitHub Discussion | Stable release (v* tag) |

## Artifact Details

### Browser Bundles (main.yml → release.yml)

| Artifact | Contents |
|----------|----------|
| `autobahn-browser-bundle` | `autobahn.js`, `autobahn.min.js`, `autobahn.min.jgz`, checksums, LICENSE |
| `autobahn-xbr-browser-bundle` | `autobahn-xbr.js`, `autobahn-xbr.min.js`, `autobahn-xbr.min.jgz`, checksums, LICENSE |

### Test Results (main.yml)

| Artifact | Contents |
|----------|----------|
| `test-results-node-22` | `test-results.log`, `test-results.json` |
| `test-results-node-24` | `test-results.log`, `test-results.json` |
| `test-results-node-25` | `test-results.log`, `test-results.json` |

## Platform Coverage

### Node.js Versions Tested

| Version | Status | Notes |
|---------|--------|-------|
| 22.x | Maintenance LTS | Native WebSocket |
| 24.x | **Active LTS** (Krypton) | Recommended for production |
| 25.x | Current | Latest features |

### Browser Bundle Compatibility

- All modern browsers with ES2018+ support
- Chrome, Firefox, Edge, Safari (current versions)

## Dependencies

### Build Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| Just | Task runner | `curl -sSf https://just.systems/install.sh \| bash` |
| uv | Python package manager | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Node.js 24 | JavaScript runtime | GitHub Actions `setup-node` |
| Python 3.11 | For Crossbar.io router | GitHub Actions `setup-python` |

### Shared Infrastructure

Uses reusable workflows and actions from `wamp-proto/wamp-cicd`:

| Component | Purpose |
|-----------|---------|
| `identifiers.yml` | Determine release type, sanitize branch names |
| `upload-artifact-verified` | Upload with integrity verification |
| `download-artifact-verified` | Download with integrity verification |

## Release Process

1. **Development**: Push to master → main.yml → release.yml (nightly release)
2. **Stable**: Tag with `vX.Y.Z` → main.yml → release.yml (npm + GitHub release)
3. **Post-release**: release.yml → release-post-comment.yml (PR comment + discussion)

### CalVer Versioning

Autobahn|JS uses CalVer: `YY.M.PATCH[.devN]`

| Command | Purpose |
|---------|---------|
| `just file-version` | Display current version |
| `just prep-release` | Remove `.devN` suffix for release |
| `just bump-next 26.2.1.dev1` | Bump to next development version |

## Maintenance Notes

When updating workflows:

1. Test changes on a feature branch first
2. Update this README to reflect changes
3. Check that `wamp-cicd` submodule is up to date
4. Verify all workflow jobs pass before merging

---

*This documentation is maintained alongside the workflow files.*
