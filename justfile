# Copyright (c) typedef int GmbH, Germany, 2025. All rights reserved.
#
# AutobahnJS - WAMP for JavaScript (Browser & Node.js)
#

# -----------------------------------------------------------------------------
# -- just global configuration
# -----------------------------------------------------------------------------

set unstable := true
set positional-arguments := true

# Project base directory = directory of this justfile
PROJECT_DIR := justfile_directory()

# Use this common single directory for all Python venvs (for crossbar)
VENV_DIR := PROJECT_DIR / '.venvs'

# Define supported Python environments for crossbar
ENVS := 'cpy313 cpy312 cpy311'

# Packages directory
PACKAGES_DIR := PROJECT_DIR / 'packages'

# Default recipe: show project header and list all recipes
default:
    #!/usr/bin/env bash
    set -e
    VERSION=$(node -p "require('./packages/autobahn/package.json').version" 2>/dev/null || echo "unknown")
    GIT_REV=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo ""
    echo "==============================================================================="
    echo "                               AutobahnJS                                      "
    echo ""
    echo "              WAMP for JavaScript (Browser & Node.js)                          "
    echo ""
    echo "   NPM Package:            autobahn                                            "
    echo "   NPM Package Version:    ${VERSION}                                          "
    echo "   Git Version:            ${GIT_REV}                                          "
    echo "   Protocol Specification: https://wamp-proto.org/                             "
    echo "   Documentation:          https://github.com/crossbario/autobahn-js           "
    echo "   Package Releases:       https://www.npmjs.com/package/autobahn              "
    echo "   Source Code:            https://github.com/crossbario/autobahn-js           "
    echo "   Copyright:              typedef int GmbH (Germany/EU)                       "
    echo "   License:                MIT License                                         "
    echo ""
    echo "       >>>   Created by The WAMP/Autobahn/Crossbar.io OSS Project   <<<        "
    echo "==============================================================================="
    echo ""
    just --list
    echo ""

# -----------------------------------------------------------------------------
# -- Python venv helpers (for Crossbar.io test router)
# -----------------------------------------------------------------------------

# Internal helper to map Python version short name to full uv version
_get-spec short_name:
    #!/usr/bin/env bash
    set -e
    case {{short_name}} in
        cpy314)  echo "cpython-3.14";;
        cpy313)  echo "cpython-3.13";;
        cpy312)  echo "cpython-3.12";;
        cpy311)  echo "cpython-3.11";;
        pypy311) echo "pypy-3.11";;
        *)       echo "Unknown environment: {{short_name}}" >&2; exit 1;;
    esac

# Internal helper that calculates and prints the system-matching venv name
_get-system-venv-name:
    #!/usr/bin/env bash
    set -e
    SYSTEM_VERSION=$(/usr/bin/python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    ENV_NAME="cpy$(echo ${SYSTEM_VERSION} | tr -d '.')"
    if ! echo "{{ ENVS }}" | grep -q -w "${ENV_NAME}"; then
        echo "Error: System Python (${SYSTEM_VERSION}) maps to '${ENV_NAME}', which is not supported." >&2
        exit 1
    fi
    echo "${ENV_NAME}"

# Helper recipe to get the python executable path for a venv
_get-venv-python venv="":
    #!/usr/bin/env bash
    set -e
    VENV_NAME="{{ venv }}"
    if [ -z "${VENV_NAME}" ]; then
        VENV_NAME=$(just --quiet _get-system-venv-name)
    fi
    VENV_PATH="{{VENV_DIR}}/${VENV_NAME}"
    if [[ "$OS" == "Windows_NT" ]]; then
        echo "${VENV_PATH}/Scripts/python.exe"
    else
        echo "${VENV_PATH}/bin/python3"
    fi

# -----------------------------------------------------------------------------
# -- Python venv management (for Crossbar.io)
# -----------------------------------------------------------------------------

# Create a Python virtual environment (usage: `just create cpy313` or `just create`)
create venv="":
    #!/usr/bin/env bash
    set -e
    VENV_NAME="{{ venv }}"
    if [ -z "${VENV_NAME}" ]; then
        echo "==> No venv name specified. Auto-detecting from system Python..."
        VENV_NAME=$(just --quiet _get-system-venv-name)
        echo "==> Defaulting to venv: '${VENV_NAME}'"
    fi
    VENV_PATH="{{ VENV_DIR }}/${VENV_NAME}"
    VENV_PYTHON=$(just --quiet _get-venv-python "${VENV_NAME}")

    if [ ! -d "${VENV_PATH}" ]; then
        PYTHON_SPEC=$(just --quiet _get-spec "${VENV_NAME}")
        echo "==> Creating Python virtual environment '${VENV_NAME}' using ${PYTHON_SPEC}..."
        mkdir -p "{{ VENV_DIR }}"
        uv venv --seed --python "${PYTHON_SPEC}" "${VENV_PATH}"
        echo "==> Successfully created venv '${VENV_NAME}'."
    else
        echo "==> Python virtual environment '${VENV_NAME}' already exists."
    fi
    ${VENV_PYTHON} -V
    echo "==> Activate with: source ${VENV_PATH}/bin/activate"

# Install Crossbar.io into the Python venv
install-crossbar venv="": (create venv)
    #!/usr/bin/env bash
    set -e
    VENV_NAME="{{ venv }}"
    if [ -z "${VENV_NAME}" ]; then
        VENV_NAME=$(just --quiet _get-system-venv-name)
    fi
    VENV_PYTHON=$(just --quiet _get-venv-python "${VENV_NAME}")
    VENV_PATH="{{ VENV_DIR }}/${VENV_NAME}"
    echo "==> Installing Crossbar.io into venv '${VENV_NAME}'..."
    ${VENV_PYTHON} -m pip install --upgrade pip
    ${VENV_PYTHON} -m pip install crossbar
    ${VENV_PATH}/bin/crossbar version

# Create a separate venv for XBR tools (ABI file extraction)
create-xbr-venv:
    #!/usr/bin/env bash
    set -e
    XBR_VENV="{{ VENV_DIR }}/xbr-tools"
    if [ ! -d "${XBR_VENV}" ]; then
        echo "==> Creating XBR tools venv..."
        mkdir -p "{{ VENV_DIR }}"
        uv venv --seed --python "cpython-3.11" "${XBR_VENV}"
    fi
    echo "==> Installing xbr>=25.12.2 into xbr-tools venv..."
    ${XBR_VENV}/bin/python -m pip install --upgrade pip
    ${XBR_VENV}/bin/python -m pip install "xbr>=25.12.2"
    ${XBR_VENV}/bin/python -c "import xbr; print(f'xbr {xbr.__version__} installed')"


# -----------------------------------------------------------------------------
# -- Cleanup
# -----------------------------------------------------------------------------

# Clean build artifacts
clean:
    #!/usr/bin/env bash
    set -e
    echo "==> Cleaning build artifacts..."
    rm -rf ./build
    rm -rf ./packages/autobahn/build
    rm -rf ./packages/autobahn-xbr/build
    rm -rf ./packages/autobahn-xbr/lib/contracts
    # Note: .trace and .txt files in test/ are golden reference outputs - do NOT delete
    echo "==> Clean complete."

# Deep clean (node_modules, venvs, lockfiles)
distclean: clean
    #!/usr/bin/env bash
    set -e
    echo "==> Deep cleaning (node_modules, venvs)..."
    rm -rf ./node_modules
    rm -rf ./packages/autobahn/node_modules
    rm -rf ./packages/autobahn-xbr/node_modules
    rm -f ./package-lock.json
    rm -f ./packages/autobahn/package-lock.json
    rm -f ./packages/autobahn-xbr/package-lock.json
    rm -rf ./.venvs
    echo "==> Distclean complete."

# -----------------------------------------------------------------------------
# -- NPM dependencies
# -----------------------------------------------------------------------------

# Install npm dependencies for all packages
install-npm:
    #!/usr/bin/env bash
    set -e
    echo "==> Installing npm dependencies for autobahn..."
    cd {{ PACKAGES_DIR }}/autobahn
    rm -rf node_modules/websocket
    npm install
    echo "==> Installing npm dependencies for autobahn-xbr..."
    cd {{ PACKAGES_DIR }}/autobahn-xbr
    rm -rf node_modules/websocket
    npm install
    echo "==> npm install complete."

# Copy XBR ABI files from installed xbr package to autobahn-xbr build
abi-files: create-xbr-venv
    #!/usr/bin/env bash
    set -e
    XBR_VENV="{{ VENV_DIR }}/xbr-tools"

    # Get xbr package location
    XBR_ABI_DIR=$(${XBR_VENV}/bin/python -c "import xbr, os; print(os.path.join(os.path.dirname(xbr.__file__), 'abi'))")

    if [ ! -d "${XBR_ABI_DIR}" ]; then
        echo "ERROR: XBR ABI directory not found at ${XBR_ABI_DIR}"
        exit 1
    fi

    # Copy to lib/contracts for browserify to find during build
    CONTRACTS_DIR="{{ PACKAGES_DIR }}/autobahn-xbr/lib/contracts"
    echo "==> Copying XBR ABI files from ${XBR_ABI_DIR}..."
    rm -rf "${CONTRACTS_DIR}"
    mkdir -p "${CONTRACTS_DIR}"
    cp -r "${XBR_ABI_DIR}"/*.json "${CONTRACTS_DIR}/"

    echo "==> XBR ABI files copied:"
    ls -la "${CONTRACTS_DIR}/" | head -10
    echo "    ... ($(ls "${CONTRACTS_DIR}" | wc -l) files total)"

# -----------------------------------------------------------------------------
# -- Build (browser bundles)
# -----------------------------------------------------------------------------

# Build all browser bundles
build: build-autobahn build-xbr

# Build autobahn browser bundle (using npm tools directly, no SCons/taschenmesser)
build-autobahn: install-npm
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -rf node_modules/websocket
    mkdir -p build
    rm -f build/*

    VERSION=$(node -p "require('./package.json').version")
    echo "==> Building autobahn ${VERSION} browser bundle..."

    # Step 1: Browserify - create standalone bundle
    echo "    [1/5] Browserify..."
    ./node_modules/.bin/browserify lib/autobahn.js --ignore-missing --standalone autobahn -o build/autobahn.js

    # Step 2: Minify with Google Closure Compiler
    echo "    [2/5] Minify (Google Closure Compiler)..."
    ./node_modules/.bin/google-closure-compiler \
        --compilation_level=SIMPLE \
        --language_out=ECMASCRIPT_2018 \
        --strict_mode_input=false \
        --js=build/autobahn.js \
        --js_output_file=build/autobahn.min.js

    # Step 3: Gzip the minified file
    echo "    [3/5] Gzip..."
    gzip -9 -c build/autobahn.min.js > build/autobahn.min.jgz

    # Step 4: Generate checksums
    echo "    [4/5] Checksums..."
    cd build
    md5sum autobahn.js autobahn.min.js autobahn.min.jgz > CHECKSUM.MD5
    sha1sum autobahn.js autobahn.min.js autobahn.min.jgz > CHECKSUM.SHA1
    sha256sum autobahn.js autobahn.min.js autobahn.min.jgz > CHECKSUM.SHA256
    cd ..

    # Step 5: Copy LICENSE
    echo "    [5/5] License..."
    cp LICENSE build/

    echo "==> autobahn browser bundle built:"
    ls -la build/

# Build autobahn-xbr browser bundle (using esbuild from autobahn package)
build-xbr: install-npm abi-files
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn-xbr
    rm -rf node_modules/websocket
    mkdir -p build
    rm -f build/*

    VERSION=$(node -p "require('./package.json').version")
    echo "==> Building autobahn-xbr ${VERSION} browser bundle..."

    # Use esbuild from autobahn package (handles ES modules natively)
    AUTOBAHN_BIN="{{ PACKAGES_DIR }}/autobahn/node_modules/.bin"

    # Common esbuild options for browser bundle
    # Note: Node.js built-ins are externalized (web3 handles browser compatibility)
    ESBUILD_OPTS="--bundle --format=iife --global-name=autobahn_xbr --platform=browser"
    # Externalize all Node.js built-ins
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:assert --external:stream --external:http --external:https"
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:url --external:zlib --external:crypto --external:buffer"
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:fs --external:path --external:os --external:net --external:tls"
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:events --external:util --external:querystring --external:string_decoder"
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:process --external:child_process --external:cluster --external:dgram"
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:dns --external:domain --external:readline --external:repl"
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:vm --external:worker_threads --external:perf_hooks"
    ESBUILD_OPTS="${ESBUILD_OPTS} --external:websocket"

    # Step 1: Bundle with esbuild (unminified)
    echo "    [1/5] esbuild (bundle)..."
    ${AUTOBAHN_BIN}/esbuild lib/autobahn-xbr.js ${ESBUILD_OPTS} --outfile=build/autobahn-xbr.js

    # Step 2: Bundle with esbuild (minified)
    echo "    [2/5] esbuild (minify)..."
    ${AUTOBAHN_BIN}/esbuild lib/autobahn-xbr.js ${ESBUILD_OPTS} --minify --outfile=build/autobahn-xbr.min.js

    # Step 3: Gzip the minified file
    echo "    [3/5] Gzip..."
    gzip -9 -c build/autobahn-xbr.min.js > build/autobahn-xbr.min.jgz

    # Step 4: Generate checksums
    echo "    [4/5] Checksums..."
    cd build
    md5sum autobahn-xbr.js autobahn-xbr.min.js autobahn-xbr.min.jgz > CHECKSUM.MD5
    sha1sum autobahn-xbr.js autobahn-xbr.min.js autobahn-xbr.min.jgz > CHECKSUM.SHA1
    sha256sum autobahn-xbr.js autobahn-xbr.min.js autobahn-xbr.min.jgz > CHECKSUM.SHA256
    cd ..

    # Step 5: Copy LICENSE
    echo "    [5/5] License..."
    cp LICENSE build/

    echo "==> autobahn-xbr browser bundle built:"
    ls -la build/

# -----------------------------------------------------------------------------
# -- Crossbar.io test router
# -----------------------------------------------------------------------------

# Start Crossbar.io router from Python venv
crossbar-start venv="": (install-crossbar venv)
    #!/usr/bin/env bash
    set -e
    VENV_NAME="{{ venv }}"
    if [ -z "${VENV_NAME}" ]; then
        VENV_NAME=$(just --quiet _get-system-venv-name)
    fi
    VENV_PATH="{{ VENV_DIR }}/${VENV_NAME}"
    echo "==> Starting Crossbar.io router..."
    cd {{ PROJECT_DIR }}
    ${VENV_PATH}/bin/crossbar start --cbdir .crossbar

# -----------------------------------------------------------------------------
# -- Unit Tests (Vitest - no Crossbar.io required)
# -----------------------------------------------------------------------------

# Run unit tests with Vitest (no Crossbar.io router needed)
test-unit:
    #!/usr/bin/env bash
    set -e
    cd {{ PROJECT_DIR }}
    echo "==> Running unit tests with Vitest (no Crossbar.io required)..."
    npx vitest run test_util_is_object test_rawsocket_protocol test_basic_sync test_basic_async test_sealedbox

# -----------------------------------------------------------------------------
# -- Integration Tests (requires running Crossbar.io router on ws://localhost:8080/ws)
# -----------------------------------------------------------------------------

# Run all tests with Vitest (requires running Crossbar.io for integration tests)
test:
    #!/usr/bin/env bash
    set -e
    cd {{ PROJECT_DIR }}
    echo "==> Running all tests with Vitest..."
    npx vitest run

# Clean test output files (.trace and .txt)
test-clean:
    #!/usr/bin/env bash
    echo "==> Cleaning test output files..."
    rm -f {{ PACKAGES_DIR }}/autobahn/test/*.txt
    rm -f {{ PACKAGES_DIR }}/autobahn/test/*.trace
    echo "==> Test files cleaned."

# -----------------------------------------------------------------------------
# -- Legacy nodeunit test recipes (deprecated - use `just test` or `just test-unit`)
# -- These will be removed once nodeunit is fully removed from dependencies.
# -----------------------------------------------------------------------------

# --- Basic tests (nodeunit, deprecated) ---
test-basic-nodeunit: test-basic-async-nodeunit test-basic-sync-nodeunit

test-basic-async-nodeunit:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    ./node_modules/.bin/nodeunit test/test_basic_async.js

test-basic-sync-nodeunit:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    ./node_modules/.bin/nodeunit test/test_basic_sync.js

# -----------------------------------------------------------------------------
# -- Code Quality (ESLint + Prettier)
# -----------------------------------------------------------------------------

# Install root dev dependencies (ESLint, Prettier)
install-lint:
    #!/usr/bin/env bash
    set -e
    echo "==> Installing root dev dependencies (ESLint, Prettier)..."
    cd {{ PROJECT_DIR }}
    npm install
    echo "==> Lint tools installed."

# Run ESLint to check for code issues
lint: install-lint
    #!/usr/bin/env bash
    set -e
    echo "==> Running ESLint..."
    cd {{ PROJECT_DIR }}
    ./node_modules/.bin/eslint packages/autobahn/lib packages/autobahn/test packages/autobahn-xbr/lib
    echo "==> ESLint passed."

# Run ESLint and fix auto-fixable issues
lint-fix: install-lint
    #!/usr/bin/env bash
    set -e
    echo "==> Running ESLint with --fix..."
    cd {{ PROJECT_DIR }}
    ./node_modules/.bin/eslint --fix packages/autobahn/lib packages/autobahn/test packages/autobahn-xbr/lib
    echo "==> ESLint fix complete."

# Check code formatting with Prettier (informational - does not fail)
format: install-lint
    #!/usr/bin/env bash
    echo "==> Checking code formatting with Prettier..."
    cd {{ PROJECT_DIR }}
    # Note: Many files need formatting - this is informational only for now
    # Run format-fix to auto-fix formatting issues
    ./node_modules/.bin/prettier --check "packages/autobahn/lib/**/*.js" "packages/autobahn/test/**/*.js" "packages/autobahn-xbr/lib/**/*.js" || echo "==> Formatting issues found (see above)"
    echo "==> Formatting check complete."

# Fix code formatting with Prettier
format-fix: install-lint
    #!/usr/bin/env bash
    set -e
    echo "==> Fixing code formatting with Prettier..."
    cd {{ PROJECT_DIR }}
    ./node_modules/.bin/prettier --write "packages/autobahn/lib/**/*.js" "packages/autobahn/test/**/*.js" "packages/autobahn-xbr/lib/**/*.js"
    echo "==> Formatting complete."

# -----------------------------------------------------------------------------
# -- CalVer Versioning
# -----------------------------------------------------------------------------
#
# Version format: YY.M.PATCH[.devN]
#   YY    - 2-digit year (e.g., 26 for 2026)
#   M     - Month (1-12, no leading zero)
#   PATCH - Patch number within month
#   .devN - Development suffix (removed for releases)
#
# Examples:
#   26.1.1.dev1 - Development version
#   26.1.1      - Stable release
#
# Reference: https://github.com/crossbario/crossbar/issues/2155
# -----------------------------------------------------------------------------

# Package version files
JS_VERSION_FILE := PROJECT_DIR / "packages/autobahn/package.json"
XBR_VERSION_FILE := PROJECT_DIR / "packages/autobahn-xbr/package.json"

# Display current version from package.json files
file-version:
    #!/usr/bin/env bash
    echo "==> Package versions:"
    echo "    autobahn:     $(jq -r '.version' {{ JS_VERSION_FILE }})"
    echo "    autobahn-xbr: $(jq -r '.version' {{ XBR_VERSION_FILE }})"

# Prepare for release: Remove .devN suffix from version
prep-release:
    #!/usr/bin/env bash
    set -e
    echo "==> Preparing for stable release..."

    # Get current versions
    CURRENT_AB=$(jq -r '.version' {{ JS_VERSION_FILE }})
    CURRENT_XBR=$(jq -r '.version' {{ XBR_VERSION_FILE }})
    echo "    Current autobahn:     $CURRENT_AB"
    echo "    Current autobahn-xbr: $CURRENT_XBR"

    # Remove .devN suffix
    NEW_AB=$(echo "$CURRENT_AB" | sed 's/\.dev[0-9]*$//')
    NEW_XBR=$(echo "$CURRENT_XBR" | sed 's/\.dev[0-9]*$//')

    if [ "$CURRENT_AB" = "$NEW_AB" ] && [ "$CURRENT_XBR" = "$NEW_XBR" ]; then
        echo "==> Versions already clean (no .devN suffix)"
        exit 0
    fi

    # Update package.json files
    jq --arg v "$NEW_AB" '.version = $v' {{ JS_VERSION_FILE }} > tmp.$$.json && mv tmp.$$.json {{ JS_VERSION_FILE }}
    jq --arg v "$NEW_XBR" '.version = $v' {{ XBR_VERSION_FILE }} > tmp.$$.json && mv tmp.$$.json {{ XBR_VERSION_FILE }}

    echo "    New autobahn:     $NEW_AB"
    echo "    New autobahn-xbr: $NEW_XBR"
    echo ""
    echo "==> Version cleaned for release. Next steps:"
    echo "    1. git add packages/autobahn/package.json packages/autobahn-xbr/package.json"
    echo "    2. git commit -m \"prep v${NEW_AB} release\""
    echo "    3. git tag v${NEW_AB}"
    echo "    4. git push && git push --tags"
    echo "    5. After CI completes: just bump-next <NEXT_VERSION>.dev1"

# Bump to next development version
bump-next next_version:
    #!/usr/bin/env bash
    set -e
    echo "==> Bumping to {{ next_version }}..."

    # Validate version format (should end with .devN)
    if ! echo "{{ next_version }}" | grep -qE '\.dev[0-9]+$'; then
        echo "WARNING: Version '{{ next_version }}' doesn't end with .devN"
        echo "         Development versions should use format: YY.M.PATCH.devN"
        read -p "Continue anyway? [y/N] " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "Aborted."
            exit 1
        fi
    fi

    # Update package.json files
    jq --arg v "{{ next_version }}" '.version = $v' {{ JS_VERSION_FILE }} > tmp.$$.json && mv tmp.$$.json {{ JS_VERSION_FILE }}
    jq --arg v "{{ next_version }}" '.version = $v' {{ XBR_VERSION_FILE }} > tmp.$$.json && mv tmp.$$.json {{ XBR_VERSION_FILE }}

    echo "    autobahn:     {{ next_version }}"
    echo "    autobahn-xbr: {{ next_version }}"
    echo ""
    echo "==> Version bumped. Next steps:"
    echo "    1. git add packages/autobahn/package.json packages/autobahn-xbr/package.json"
    echo "    2. git commit -m \"chore: bump version to {{ next_version }}\""
    echo "    3. git push"

# -----------------------------------------------------------------------------
# -- Publishing (manual steps documented)
# -----------------------------------------------------------------------------

# Publish to npm (requires npm login)
publish-npm:
    #!/usr/bin/env bash
    set -e
    echo "==> Publishing to npm..."
    echo "NOTE: Ensure you have run 'npm login' first."
    cd {{ PACKAGES_DIR }}/autobahn
    npm publish
    cd {{ PACKAGES_DIR }}/autobahn-xbr
    npm publish
    echo "==> Published to npm."

# -----------------------------------------------------------------------------
# -- Documentation (Sphinx + sphinx-js + Furo)
# -----------------------------------------------------------------------------

# Documentation directory
DOCS_DIR := PROJECT_DIR / "docs"
DOCS_BUILD := DOCS_DIR / "_build"

# Install documentation dependencies
install-docs venv="":
    #!/usr/bin/env bash
    set -e
    VENV_NAME="{{ venv }}"
    if [ -z "${VENV_NAME}" ]; then
        VENV_NAME=$(just --quiet _get-system-venv-name)
    fi
    VENV_PATH="{{ VENV_DIR }}/${VENV_NAME}"
    VENV_PYTHON=$(just --quiet _get-venv-python "${VENV_NAME}")

    # Create venv if needed
    just create "${VENV_NAME}"

    echo "==> Installing documentation dependencies..."
    ${VENV_PYTHON} -m pip install -r {{ DOCS_DIR }}/requirements.txt
    echo "==> Documentation dependencies installed."

# Build documentation (HTML)
docs venv="": (install-docs venv)
    #!/usr/bin/env bash
    set -e
    VENV_NAME="{{ venv }}"
    if [ -z "${VENV_NAME}" ]; then
        VENV_NAME=$(just --quiet _get-system-venv-name)
    fi
    VENV_PATH="{{ VENV_DIR }}/${VENV_NAME}"

    echo "==> Building documentation..."
    cd {{ DOCS_DIR }}
    ${VENV_PATH}/bin/sphinx-build -b html . {{ DOCS_BUILD }}/html

    echo "==> Documentation built:"
    echo "    Open: file://{{ DOCS_BUILD }}/html/index.html"

# Build documentation and serve locally
docs-serve venv="": (docs venv)
    #!/usr/bin/env bash
    set -e
    VENV_NAME="{{ venv }}"
    if [ -z "${VENV_NAME}" ]; then
        VENV_NAME=$(just --quiet _get-system-venv-name)
    fi
    VENV_PATH="{{ VENV_DIR }}/${VENV_NAME}"

    echo "==> Serving documentation at http://localhost:8000 ..."
    cd {{ DOCS_BUILD }}/html
    ${VENV_PATH}/bin/python -m http.server 8000

# Clean documentation build
docs-clean:
    #!/usr/bin/env bash
    set -e
    echo "==> Cleaning documentation build..."
    rm -rf {{ DOCS_BUILD }}
    echo "==> Documentation clean complete."
