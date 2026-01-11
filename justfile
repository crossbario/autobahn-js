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

# Download latest XBR ABI files (optional - skipped if unreachable or already present)
abi-files:
    #!/usr/bin/env bash
    set -e
    CONTRACTS_DIR="{{ PACKAGES_DIR }}/autobahn-xbr/lib/contracts"
    if [ -d "${CONTRACTS_DIR}" ] && [ "$(ls -A ${CONTRACTS_DIR} 2>/dev/null)" ]; then
        echo "==> XBR ABI files already present, skipping download."
        exit 0
    fi
    echo "==> Downloading XBR ABI files..."
    if curl -sf --connect-timeout 5 https://xbr.network/lib/abi/xbr-protocol-latest.zip -o /tmp/xbr-protocol-latest.zip; then
        unzip -t /tmp/xbr-protocol-latest.zip
        rm -rf "${CONTRACTS_DIR}"
        unzip /tmp/xbr-protocol-latest.zip -d "${CONTRACTS_DIR}"
        echo "==> XBR ABI files downloaded."
    else
        echo "WARNING: Could not download XBR ABI files (xbr.network unreachable)."
        echo "         autobahn-xbr build will fail if contracts/ directory is empty."
    fi

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

# Build autobahn-xbr browser bundle (using npm tools from autobahn package)
build-xbr: install-npm abi-files
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn-xbr
    rm -rf node_modules/websocket
    mkdir -p build
    rm -f build/*

    VERSION=$(node -p "require('./package.json').version")
    echo "==> Building autobahn-xbr ${VERSION} browser bundle..."

    # Use build tools from autobahn package (browserify, google-closure-compiler)
    AUTOBAHN_BIN="{{ PACKAGES_DIR }}/autobahn/node_modules/.bin"

    # Step 1: Browserify - create standalone bundle
    echo "    [1/5] Browserify..."
    ${AUTOBAHN_BIN}/browserify lib/index.js --ignore-missing --standalone autobahn_xbr -o build/autobahn-xbr.js

    # Step 2: Minify with Google Closure Compiler
    echo "    [2/5] Minify (Google Closure Compiler)..."
    ${AUTOBAHN_BIN}/google-closure-compiler \
        --compilation_level=SIMPLE \
        --language_out=ECMASCRIPT_2018 \
        --strict_mode_input=false \
        --js=build/autobahn-xbr.js \
        --js_output_file=build/autobahn-xbr.min.js

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
# -- Tests (requires running Crossbar.io router on ws://localhost:8080/ws)
# -----------------------------------------------------------------------------

# Run all tests
test: test-basic test-connect test-pubsub test-rpc test-serialization test-rawsocket test-error-handling

# Clean test output files (.trace and .txt)
test-clean:
    #!/usr/bin/env bash
    echo "==> Cleaning test output files..."
    rm -f {{ PACKAGES_DIR }}/autobahn/test/*.txt
    rm -f {{ PACKAGES_DIR }}/autobahn/test/*.trace
    echo "==> Test files cleaned."

# -----------------------------------------------------------------------------
# NOTE ON TRACE FILES (.trace)
#
# The .trace files generated by AUTOBAHN_TRACE are for DEBUGGING only.
# They contain non-deterministic values that differ between runs:
#   - Session IDs (randomly generated)
#   - Request/Registration/Subscription IDs (randomly generated)
#   - Anonymous auth IDs (randomly generated)
#   - Machine metadata (x_cb_node, x_cb_pid, x_cb_peer)
#
# Therefore, trace-based regression testing is NOT reliable.
# Regression testing is done via nodeunit test assertions.
#
# See: https://github.com/crossbario/crossbar/issues/2158
#      (Feature request for deterministic ID generation mode)
# -----------------------------------------------------------------------------

# --- Basic tests ---

# Run basic tests (async and sync connection patterns)
test-basic: test-basic-async test-basic-sync

# Test asynchronous connection handling
test-basic-async:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_basic_async.trace && AUTOBAHN_TRACE=test/test_basic_async.trace ./node_modules/.bin/nodeunit test/test_basic_async.js

# Test synchronous connection handling
test-basic-sync:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_basic_sync.trace && AUTOBAHN_TRACE=test/test_basic_sync.trace ./node_modules/.bin/nodeunit test/test_basic_sync.js

# --- Connection tests ---

# Test WAMP connection establishment and session lifecycle
test-connect:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_connect.trace && AUTOBAHN_TRACE=test/test_connect.trace ./node_modules/.bin/nodeunit test/test_connect.js

# --- Error handling tests ---

# Test WAMP error handling (application errors, protocol errors)
test-error-handling:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_error_handling.trace && AUTOBAHN_TRACE=test/test_error_handling.trace ./node_modules/.bin/nodeunit test/test_error_handling.js

# --- PubSub tests ---

# Run all PubSub tests
# Note: test-pubsub-multiple-matching-subs excluded - order-dependent, WAMP doesn't guarantee
#       event delivery order across subscribers (flaky depending on system timing)
test-pubsub: test-pubsub-basic test-pubsub-complex test-pubsub-eligible test-pubsub-exclude test-pubsub-excludeme test-pubsub-options test-pubsub-prefix-sub test-pubsub-wildcard-sub

# Test basic publish/subscribe functionality
test-pubsub-basic:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_basic.trace && AUTOBAHN_TRACE=test/test_pubsub_basic.trace ./node_modules/.bin/nodeunit test/test_pubsub_basic.js

# Test complex publish/subscribe scenarios (multiple topics, payloads)
test-pubsub-complex:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_complex.trace && AUTOBAHN_TRACE=test/test_pubsub_complex.trace ./node_modules/.bin/nodeunit test/test_pubsub_complex.js

# Test publisher eligible list (whitelist specific subscribers)
test-pubsub-eligible:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_eligible.trace && AUTOBAHN_TRACE=test/test_pubsub_eligible.trace ./node_modules/.bin/nodeunit test/test_pubsub_eligible.js

# Test publisher exclude list (blacklist specific subscribers)
test-pubsub-exclude:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_exclude.trace && AUTOBAHN_TRACE=test/test_pubsub_exclude.trace ./node_modules/.bin/nodeunit test/test_pubsub_exclude.js

# Test exclude_me option (publisher doesn't receive own events)
test-pubsub-excludeme:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_excludeme.trace && AUTOBAHN_TRACE=test/test_pubsub_excludeme.trace ./node_modules/.bin/nodeunit test/test_pubsub_excludeme.js

# Test multiple matching subscriptions (EXCLUDED from test-pubsub - flaky)
test-pubsub-multiple-matching-subs:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_multiple_matching_subs.trace && AUTOBAHN_TRACE=test/test_pubsub_multiple_matching_subs.trace ./node_modules/.bin/nodeunit test/test_pubsub_multiple_matching_subs.js

# Test subscription options (retain, acknowledge, etc.)
test-pubsub-options:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_options.trace && AUTOBAHN_TRACE=test/test_pubsub_options.trace ./node_modules/.bin/nodeunit test/test_pubsub_options.js

# Test prefix-based subscription matching
test-pubsub-prefix-sub:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_prefix_sub.trace && AUTOBAHN_TRACE=test/test_pubsub_prefix_sub.trace ./node_modules/.bin/nodeunit test/test_pubsub_prefix_sub.js

# Test wildcard-based subscription matching
test-pubsub-wildcard-sub:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_pubsub_wildcard_sub.trace && AUTOBAHN_TRACE=test/test_pubsub_wildcard_sub.trace ./node_modules/.bin/nodeunit test/test_pubsub_wildcard_sub.js

# --- RPC tests ---

# Run all RPC tests
test-rpc: test-rpc-arguments test-rpc-complex test-rpc-error test-rpc-options test-rpc-progress test-rpc-request-id-sequence test-rpc-routing test-rpc-slowsquare

# Test RPC argument passing (args, kwargs)
test-rpc-arguments:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_arguments.trace && AUTOBAHN_TRACE=test/test_rpc_arguments.trace ./node_modules/.bin/nodeunit test/test_rpc_arguments.js

# Test complex RPC scenarios (nested calls, multiple procedures)
test-rpc-complex:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_complex.trace && AUTOBAHN_TRACE=test/test_rpc_complex.trace ./node_modules/.bin/nodeunit test/test_rpc_complex.js

# Test RPC error handling (application errors, cancellation)
test-rpc-error:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_error.trace && AUTOBAHN_TRACE=test/test_rpc_error.trace ./node_modules/.bin/nodeunit test/test_rpc_error.js

# Test RPC call options (timeout, disclose_me, etc.)
test-rpc-options:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_options.trace && AUTOBAHN_TRACE=test/test_rpc_options.trace ./node_modules/.bin/nodeunit test/test_rpc_options.js

# Test progressive RPC results (streaming responses)
test-rpc-progress:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_progress.trace && AUTOBAHN_TRACE=test/test_rpc_progress.trace ./node_modules/.bin/nodeunit test/test_rpc_progress.js

# Test request ID sequencing and correlation
test-rpc-request-id-sequence:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_request_id_sequence.trace && AUTOBAHN_TRACE=test/test_rpc_request_id_sequence.trace ./node_modules/.bin/nodeunit test/test_rpc_request_id_sequence.js

# Test RPC routing (shared registrations, pattern-based)
test-rpc-routing:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_routing.trace && AUTOBAHN_TRACE=test/test_rpc_routing.trace ./node_modules/.bin/nodeunit test/test_rpc_routing.js

# Test slow RPC calls (long-running procedures)
test-rpc-slowsquare:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rpc_slowsquare.trace && AUTOBAHN_TRACE=test/test_rpc_slowsquare.trace ./node_modules/.bin/nodeunit test/test_rpc_slowsquare.js

# --- Serialization tests ---

# Run all serialization tests
test-serialization: test-serialization-cbor test-serialization-json test-serialization-msgpack

# Test CBOR serialization (RFC 8949)
test-serialization-cbor:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_serialization_cbor.trace && AUTOBAHN_TRACE=test/test_serialization_cbor.trace ./node_modules/.bin/nodeunit test/test_serialization_cbor.js

# Test JSON serialization (default WAMP serializer)
test-serialization-json:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_serialization_json.trace && AUTOBAHN_TRACE=test/test_serialization_json.trace ./node_modules/.bin/nodeunit test/test_serialization_json.js

# Test MessagePack serialization (binary, compact)
test-serialization-msgpack:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_serialization_msgpack.trace && AUTOBAHN_TRACE=test/test_serialization_msgpack.trace ./node_modules/.bin/nodeunit test/test_serialization_msgpack.js

# --- RawSocket tests ---

# Run all RawSocket tests
test-rawsocket: test-rawsocket-protocol test-rawsocket-transport

# Test RawSocket protocol framing (handshake, message length)
test-rawsocket-protocol:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rawsocket_protocol.trace && AUTOBAHN_TRACE=test/test_rawsocket_protocol.trace ./node_modules/.bin/nodeunit test/test_rawsocket_protocol.js

# Test RawSocket transport (TCP connection, reconnection)
test-rawsocket-transport:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_rawsocket_transport.trace && AUTOBAHN_TRACE=test/test_rawsocket_transport.trace ./node_modules/.bin/nodeunit test/test_rawsocket_transport.js

# --- Binary/crypto tests (may require additional setup) ---

# Test binary payload handling
test-binary:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_binary.trace && AUTOBAHN_TRACE=test/test_binary.trace ./node_modules/.bin/nodeunit test/test_binary.js

# Test NaCl sealed box encryption (cryptographic operations)
test-sealedbox:
    #!/usr/bin/env bash
    set -e
    cd {{ PACKAGES_DIR }}/autobahn
    rm -f test/test_sealedbox.trace && AUTOBAHN_TRACE=test/test_sealedbox.trace ./node_modules/.bin/nodeunit test/test_sealedbox.js

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
