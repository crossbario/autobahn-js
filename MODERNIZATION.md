# AutobahnJS Modernization

This document outlines the modernization plan for AutobahnJS, establishing a foundation for improved build tooling, type safety, and CI/CD practices while minimizing risk to existing deployments.

**Key Constraint**: Minimize code changes to protect existing customer applications.

---

## Current State Assessment

### Overview

| Aspect | Status | Notes |
|--------|--------|-------|
| **Language** | Pure JavaScript (ES5/ES6 mix) | No TypeScript |
| **Build System** | SCons + Browserify + Closure Compiler | Python-based, unusual for JS project |
| **Test Framework** | Nodeunit | Deprecated, unmaintained |
| **CI/CD** | GitHub Actions | Basic, no security scanning |
| **Code Quality** | None | No ESLint, Prettier, or linting |
| **Type Definitions** | None | No `.d.ts` files |
| **Last Release** | v22.11.1 (Nov 2022) | |
| **License** | MIT (core) / Apache-2.0 (XBR) | |

### Project Structure

```
autobahn-js/
├── packages/
│   ├── autobahn/           # Core WAMP library (MIT)
│   │   ├── lib/            # Source (~2,835 lines)
│   │   ├── test/           # 73 test files
│   │   └── package.json
│   └── autobahn-xbr/       # Ethereum/XBR integration (Apache 2.0)
│       ├── lib/            # XBR source (~4,047 lines)
│       └── package.json
├── .crossbar/              # Test router configuration
├── doc/                    # Documentation
├── Makefile                # Current build system
├── Dockerfile              # Build toolchain image
└── SConstruct              # Browser bundle build
```

### Dependencies

**Core (autobahn v22.11.1):**
- `cbor` >= 3.0.0
- `crypto-js` >= 3.1.8
- `msgpack5` >= 3.6.0
- `tweetnacl` >= 0.14.3
- `ws` 1.1.4 - 7 (wide range)

**Dev Dependencies:**
- `browserify` >= 13.1.1
- `nodeunit` >= 0.11.3 (deprecated)
- `google-closure-compiler` >= 20170218.0.0

---

## Critical Gaps for Defense Contractor Use

| Gap | Risk Level | Impact |
|-----|------------|--------|
| **No TypeScript** | High | Type errors only caught at runtime, harder to audit |
| **No static analysis** | High | No ESLint = no automated code quality gates |
| **Deprecated test framework** | Medium | Nodeunit unmaintained, no coverage metrics |
| **Manual release process** | Medium | Human error risk, no provenance |
| **Flexible dependency versions** | Medium | Wide ranges could pull vulnerabilities |
| **No SBOM generation** | Medium | Required for EO 14028 / CRA compliance |
| **No security scanning in CI** | High | No npm audit, no SAST, no dependency review |

---

## Contrast with Python Repos (Post-Modernization)

| Feature | Python Repos (26.1.1) | AutobahnJS (Current) |
|---------|----------------------|---------------------|
| Type checking | `ty` strict mode | None |
| Linting | `ruff` | None |
| Modern syntax | Python 3.11+ | ES5/ES6 mix |
| CI workflows | Standardized | Basic |
| SLSA provenance | L2+L3 planned | None |
| Trusted Publishing | PyPI configured | NPM manual |
| Test framework | pytest | Nodeunit (deprecated) |
| Build system | justfile | Makefile + SCons |

---

## Positive Findings

1. **Comprehensive test suite** — 73 test files covering RPC, PubSub, auth, serialization
2. **Clean separation** — `autobahn` core vs `autobahn-xbr` (Ethereum integration)
3. **Good documentation** — Programming guide, API reference, release process
4. **Active maintenance** — Recent commits (2025)
5. **Stable API** — Mature codebase, 654 commits
6. **MIT License** — Permissive, suitable for defense use

---

## Modernization Tracks

### Track C: Build System (FIRST PRIORITY)

**Goal**: Replace Makefile/SCons with `justfile`, enable local testing.

**Approach**:
- Create `justfile` replicating Makefile functionality
- Reuse helper functions from autobahn-python justfile for consistency
- Install Crossbar.io via Python venv (same approach as Python repos)
- Port all 26 test targets from Makefile

**Risk**: Low — No code changes, only build tooling

**Deliverables**:
- [ ] `justfile` with all build/test recipes
- [ ] Python venv integration for Crossbar.io
- [ ] Local test execution working

### Track A: Type Safety (AFTER Track C)

**Goal**: Add type definitions without migrating to TypeScript.

**Approach**:
- Generate `.d.ts` type definition files from existing code
- Add JSDoc type annotations where missing
- Configure TypeScript in `checkJs` mode for validation
- **Do NOT rewrite codebase in TypeScript** (high risk)

**Risk**: Low — Additive changes only, no code modifications

**Deliverables**:
- [ ] `.d.ts` files for autobahn package
- [ ] `.d.ts` files for autobahn-xbr package
- [ ] TypeScript validation in CI

### Track B: CI/CD & Supply Chain (AFTER Track A)

**Goal**: Add security scanning, SLSA provenance, automated releases.

**Approach**:
- Create GitHub Actions workflows reusing `just` recipes
- Add npm audit / dependency review
- Enable npm Trusted Publishing with provenance
- Generate SBOM (CycloneDX)

**Risk**: Low — CI/CD only, no code changes

**Deliverables**:
- [ ] `.github/workflows/test.yml`
- [ ] `.github/workflows/release.yml`
- [ ] npm provenance attestations
- [ ] SBOM generation

---

## Implementation Status

### Track C Progress

| Task | Status |
|------|--------|
| Create `modernization` branch | Done |
| Create `justfile` | In Progress |
| Port test targets | Pending |
| Local test execution | Pending |

---

## References

- [autobahn-python justfile](https://github.com/crossbario/autobahn-python/blob/master/justfile) — Reference for helper functions
- [just manual](https://just.systems/man/en/) — Justfile documentation
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements) — NPM supply chain security
