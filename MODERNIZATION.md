# AutobahnJS Modernization

This document outlines the modernization plan for AutobahnJS, establishing a foundation for improved build tooling, type safety, and CI/CD practices while minimizing risk to existing deployments.

**Key Constraint**: Minimize code changes to protect existing customer applications.

**Current Version**: 26.1.1

---

## Current State Assessment

### Overview (Post-Modernization)

| Aspect | Status | Notes |
|--------|--------|-------|
| **Language** | Pure JavaScript (ES5/ES6 mix) | No TypeScript (by design) |
| **Build System** | justfile + npm tools | Modernized from Makefile/SCons |
| **Test Framework** | Nodeunit | Tests working, router via PyPI |
| **CI/CD** | GitHub Actions | 3 workflows: main, release, release-post-comment |
| **Code Quality** | npm audit | Security scanning in CI |
| **Type Definitions** | None (planned) | Track A pending |
| **Version** | v26.1.1 | Bumped from v22.11.1 |
| **License** | MIT (core) / Apache-2.0 (XBR) | |

### Project Structure (Post-Modernization)

```
autobahn-js/
├── packages/
│   ├── autobahn/           # Core WAMP library (MIT)
│   │   ├── lib/            # Source (~2,835 lines)
│   │   ├── test/           # 73 test files
│   │   └── package.json
│   └── autobahn-xbr/       # Ethereum/XBR integration (Apache 2.0)
│       ├── lib/            # XBR source + contracts (~4,047 lines)
│       └── package.json
├── .crossbar/              # Test router configuration
├── .github/workflows/      # CI/CD workflows (NEW)
│   ├── main.yml            # Test + Build + Security
│   ├── release.yml         # npm publish + GH Release
│   └── release-post-comment.yml
├── justfile                # Modern build system (NEW)
└── MODERNIZATION.md        # This document
```

### Removed Files

| File/Directory | Reason |
|---------------|--------|
| `Makefile` | Replaced by justfile |
| `Dockerfile` | Using PyPI crossbar instead |
| `docker/` | Old ARM/x86 Docker builds |
| `packages/autobahn/SConstruct` | Using npm tools directly |

---

## Critical Gaps for Defense Contractor Use

| Gap | Risk Level | Status |
|-----|------------|--------|
| **No TypeScript** | High | Planned (Track A) |
| **No static analysis** | High | Planned (Track A) |
| **Deprecated test framework** | Medium | Tests working, framework update planned |
| **Manual release process** | Medium | **FIXED** - Automated via GH Actions |
| **Flexible dependency versions** | Medium | Unchanged (low priority) |
| **No SBOM generation** | Medium | Planned |
| **No security scanning in CI** | High | **FIXED** - npm audit in CI |

---

## Modernization Tracks

### Track C: Build System ✅ COMPLETED

**Goal**: Replace Makefile/SCons with `justfile`, enable local testing.

**Deliverables**:
- [x] `justfile` with all build/test recipes
- [x] Python venv integration for Crossbar.io (from PyPI)
- [x] Local test execution working
- [x] Browser build modernized (browserify + esbuild)
- [x] XBR ABI files from `xbr` PyPI package

**Key Changes**:
- Removed SCons, taschenmesser, pkg_resources dependencies
- autobahn build: browserify → google-closure-compiler → gzip
- autobahn-xbr build: esbuild (handles ES modules from web3)
- XBR ABI files extracted from installed `xbr>=25.12.2` package

### Track B: CI/CD & Supply Chain ✅ COMPLETED

**Goal**: Add security scanning, automated releases, npm provenance.

**Deliverables**:
- [x] `.github/workflows/main.yml` - Test, build, security scan
- [x] `.github/workflows/release.yml` - npm publish with provenance
- [x] `.github/workflows/release-post-comment.yml` - PR notifications
- [ ] SBOM generation (planned)

**Workflow Features**:
- Tests on Node.js 18, 20, 22
- Crossbar.io test router from PyPI
- npm audit security scanning
- npm Trusted Publishing with provenance
- Automated GitHub Releases

### Track A: Type Safety 🔲 PLANNED

**Goal**: Add type definitions without migrating to TypeScript.

**Approach**:
- Generate `.d.ts` type definition files from existing code
- Add JSDoc type annotations where missing
- Configure TypeScript in `checkJs` mode for validation
- **Do NOT rewrite codebase in TypeScript** (high risk)

**Deliverables**:
- [ ] `.d.ts` files for autobahn package
- [ ] `.d.ts` files for autobahn-xbr package
- [ ] TypeScript validation in CI

---

## Implementation Details

### Build System

#### autobahn Build Pipeline
```
lib/autobahn.js
    ↓ browserify (--standalone autobahn)
build/autobahn.js (standalone bundle)
    ↓ google-closure-compiler (SIMPLE, ES2018)
build/autobahn.min.js
    ↓ gzip -9
build/autobahn.min.jgz
    ↓ checksums
CHECKSUM.MD5, CHECKSUM.SHA1, CHECKSUM.SHA256
```

#### autobahn-xbr Build Pipeline
```
lib/autobahn-xbr.js + lib/contracts/*.json
    ↓ esbuild (--bundle, externalize Node.js built-ins)
build/autobahn-xbr.js (~23MB with contracts)
    ↓ esbuild --minify
build/autobahn-xbr.min.js (~11MB)
    ↓ gzip -9
build/autobahn-xbr.min.jgz (~3MB)
```

### Test Infrastructure

- **Test runner**: `just test` runs all tests via nodeunit
- **Router**: Crossbar.io installed from PyPI into Python venv
- **Trace files**: For debugging only (non-deterministic IDs)

**Excluded test**: `test-pubsub-multiple-matching-subs` (flaky - WAMP doesn't guarantee event delivery order)

See: [crossbar#2158](https://github.com/crossbario/crossbar/issues/2158) for deterministic ID generation feature request.

### GitHub Actions Workflows

#### main.yml
- **Triggers**: push/PR to master, tags v*, manual
- **Jobs**: test (Node 18/20/22), build, security
- **Artifacts**: Browser bundles uploaded

#### release.yml
- **Triggers**: After main workflow completes (for v* tags)
- **Actions**: npm publish with provenance, GitHub Release
- **Requirements**: NPM_TOKEN secret

#### release-post-comment.yml
- **Triggers**: After release workflow completes
- **Actions**: Post summary comment to associated PR

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 26.1.1 | 2025-01 | Modernization: justfile, GH workflows, esbuild |
| 22.11.1 | 2022-11 | Last release before modernization |

---

## References

- [autobahn-python justfile](https://github.com/crossbario/autobahn-python/blob/master/justfile) — Reference for helper functions
- [just manual](https://just.systems/man/en/) — Justfile documentation
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements) — NPM supply chain security
- [esbuild](https://esbuild.github.io/) — Fast JavaScript bundler
