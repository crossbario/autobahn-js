# Development

Notes specific to **Autobahn|JS**: development setup, running the tests, supported environments, and
the browser bundles. The contribution workflow shared by all WAMP projects — GitHub issue first,
red → green tests, and the AI-assistance disclosure — is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Reporting bugs

In addition to what CONTRIBUTING.md asks for, please include the environment: the **Node.js** version,
or the **browser** and its version.

## Development setup

Development is driven by [`just`](https://github.com/casey/just); run `just` to list all recipes.

```bash
git clone --recurse-submodules https://github.com/crossbario/autobahn-js.git
cd autobahn-js
just install-npm            # npm dependencies for all packages
just install-crossbar       # Crossbar.io, the router the integration tests run against
```

## Running the tests

```bash
just test-unit              # unit tests (no router needed)
just crossbar-start &       # start the test router in the background
just test                   # all tests with Vitest (needs the running router)
```

**Supported environments:** Node.js 22+ (which provides a native WebSocket) and browsers. Test
changes on Node.js, consider browser compatibility for frontend features, and don't break either
environment.

## Code style

ESLint and Prettier: `just lint` (`just lint-fix`) and `just format` (`just format-fix`). The print
width is 100. Use meaningful names, JSDoc comments for public APIs, and ES6+ features where appropriate.

## Project structure

```
autobahn-js/
├── packages/
│   ├── autobahn/          # Core WAMP library (MIT)
│   │   ├── lib/           # Source code
│   │   └── test/          # Tests
│   └── autobahn-xbr/      # XBR extension (Apache 2.0)
│       ├── lib/           # Source code
│       └── test/          # Tests
├── .crossbar/             # Test router configuration
└── justfile               # Build and test recipes
```

Note the two licenses: `autobahn` is MIT, `autobahn-xbr` is Apache 2.0.

## Browser bundles

```bash
just build-autobahn         # autobahn browser bundle
just build-xbr              # autobahn-xbr browser bundle
just build                  # both
```

## WebSocket conformance

WebSocket-related changes must stay compatible with
[Autobahn|Testsuite](https://github.com/crossbario/autobahn-testsuite).
