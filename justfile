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
# -- Tests (requires running Crossbar.io router on ws://localhost:8080/ws)
# -----------------------------------------------------------------------------

# Run all tests with summary table
test:
    #!/usr/bin/env bash
    cd {{ PACKAGES_DIR }}/autobahn

    # Test files to run (in order)
    TEST_FILES=(
        "test_basic_async"
        "test_basic_sync"
        "test_connect"
        "test_error_handling"
        "test_pubsub_basic"
        "test_pubsub_complex"
        "test_pubsub_eligible"
        "test_pubsub_exclude"
        "test_pubsub_excludeme"
        "test_pubsub_options"
        "test_pubsub_prefix_sub"
        "test_pubsub_wildcard_sub"
        "test_rpc_arguments"
        "test_rpc_complex"
        "test_rpc_error"
        "test_rpc_options"
        "test_rpc_progress"
        "test_rpc_request_id_sequence"
        "test_rpc_routing"
        "test_rpc_slowsquare"
        "test_serialization_cbor"
        "test_serialization_json"
        "test_serialization_msgpack"
        "test_rawsocket_protocol"
        "test_rawsocket_transport"
    )

    # Arrays to store results
    declare -a RESULTS_NAME
    declare -a RESULTS_PASSED
    declare -a RESULTS_FAILED
    declare -a RESULTS_TIME
    declare -a RESULTS_STATUS

    TOTAL_PASSED=0
    TOTAL_FAILED=0
    TOTAL_TESTS=0

    # Output directory for test results
    RESULTS_DIR="{{ PROJECT_DIR }}/test-results"
    mkdir -p "$RESULTS_DIR"
    LOG_FILE="$RESULTS_DIR/test-results.log"
    rm -f "$LOG_FILE"

    # Helper to print to both console and log
    log() {
        echo "$@" | tee -a "$LOG_FILE"
    }

    log "================================================================================"
    log "                         AutobahnJS Test Suite"
    log "================================================================================"
    log "Node.js version: $(node --version)"
    log "Timestamp: $(date -Iseconds)"
    log ""

    for test_file in "${TEST_FILES[@]}"; do
        # Run test and capture output
        rm -f "test/${test_file}.trace"
        RAW_OUTPUT=$(AUTOBAHN_TRACE="test/${test_file}.trace" ./node_modules/.bin/nodeunit "test/${test_file}.js" 2>&1)
        EXIT_CODE=$?

        # Print detailed test output (with colors to console, stripped to log)
        echo "$RAW_OUTPUT"
        echo "$OUTPUT" >> "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"

        # Strip ANSI escape codes for parsing
        OUTPUT=$(echo "$RAW_OUTPUT" | sed 's/\x1b\[[0-9;]*m//g')

        # Parse the summary line: "OK: N assertions (Xms)" or "FAILURES: X/Y assertions failed (Xms)"
        if echo "$OUTPUT" | grep -q "^OK:"; then
            SUMMARY=$(echo "$OUTPUT" | grep "^OK:")
            PASSED=$(echo "$SUMMARY" | sed -E 's/OK: ([0-9]+) assertions.*/\1/')
            FAILED=0
            TIME_MS=$(echo "$SUMMARY" | sed -E 's/.*\(([0-9]+)ms\).*/\1/')
            STATUS="OK"
        elif echo "$OUTPUT" | grep -q "FAILURES:"; then
            SUMMARY=$(echo "$OUTPUT" | grep "FAILURES:")
            # Format: "FAILURES: X/Y assertions failed (Xms)"
            FAILED=$(echo "$SUMMARY" | sed -E 's/FAILURES: ([0-9]+)\/([0-9]+).*/\1/')
            TOTAL_ASSERTS=$(echo "$SUMMARY" | sed -E 's/FAILURES: ([0-9]+)\/([0-9]+).*/\2/')
            PASSED=$((TOTAL_ASSERTS - FAILED))
            TIME_MS=$(echo "$SUMMARY" | sed -E 's/.*\(([0-9]+)ms\).*/\1/')
            STATUS="FAIL"
        else
            # Test crashed or no output
            PASSED=0
            FAILED=1
            TIME_MS=0
            STATUS="FAIL"
        fi

        # Store results
        RESULTS_NAME+=("$test_file")
        RESULTS_PASSED+=("$PASSED")
        RESULTS_FAILED+=("$FAILED")
        RESULTS_TIME+=("$TIME_MS")
        RESULTS_STATUS+=("$STATUS")

        TOTAL_PASSED=$((TOTAL_PASSED + PASSED))
        TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    done

    log ""
    log "================================================================================"
    log "                              TEST RESULTS SUMMARY"
    log "================================================================================"
    printf "%-40s %8s %8s %10s %8s\n" "Test Name" "Passed" "Failed" "Time (ms)" "Result" | tee -a "$LOG_FILE"
    log "--------------------------------------------------------------------------------"

    for i in "${!RESULTS_NAME[@]}"; do
        if [ "${RESULTS_STATUS[$i]}" = "OK" ]; then
            RESULT_FMT="\033[32mOK\033[0m"
            RESULT_TXT="OK"
        else
            RESULT_FMT="\033[31mFAIL\033[0m"
            RESULT_TXT="FAIL"
        fi
        # Console with colors
        printf "%-40s %8s %8s %10s " "${RESULTS_NAME[$i]}" "${RESULTS_PASSED[$i]}" "${RESULTS_FAILED[$i]}" "${RESULTS_TIME[$i]}"
        echo -e "$RESULT_FMT"
        # Log without colors
        printf "%-40s %8s %8s %10s %8s\n" "${RESULTS_NAME[$i]}" "${RESULTS_PASSED[$i]}" "${RESULTS_FAILED[$i]}" "${RESULTS_TIME[$i]}" "$RESULT_TXT" >> "$LOG_FILE"
    done

    log "--------------------------------------------------------------------------------"
    printf "%-40s %8s %8s %10s\n" "TOTAL" "$TOTAL_PASSED" "$TOTAL_FAILED" "" | tee -a "$LOG_FILE"
    log "================================================================================"

    # Generate JSON summary
    JSON_FILE="$RESULTS_DIR/test-results.json"
    echo "{" > "$JSON_FILE"
    echo "  \"node_version\": \"$(node --version)\"," >> "$JSON_FILE"
    echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$JSON_FILE"
    echo "  \"total_tests\": $TOTAL_TESTS," >> "$JSON_FILE"
    echo "  \"total_passed\": $TOTAL_PASSED," >> "$JSON_FILE"
    echo "  \"total_failed\": $TOTAL_FAILED," >> "$JSON_FILE"
    echo "  \"success\": $([ $TOTAL_FAILED -eq 0 ] && echo 'true' || echo 'false')," >> "$JSON_FILE"
    echo "  \"tests\": [" >> "$JSON_FILE"
    for i in "${!RESULTS_NAME[@]}"; do
        COMMA=$([ $i -lt $((${#RESULTS_NAME[@]} - 1)) ] && echo ',' || echo '')
        echo "    {\"name\": \"${RESULTS_NAME[$i]}\", \"passed\": ${RESULTS_PASSED[$i]}, \"failed\": ${RESULTS_FAILED[$i]}, \"time_ms\": ${RESULTS_TIME[$i]}, \"status\": \"${RESULTS_STATUS[$i]}\"}$COMMA" >> "$JSON_FILE"
    done
    echo "  ]" >> "$JSON_FILE"
    echo "}" >> "$JSON_FILE"
    log ""
    log "==> Test log written to: $LOG_FILE"
    log "==> JSON summary written to: $JSON_FILE"

    if [ $TOTAL_FAILED -eq 0 ]; then
        MSG="✔ All $TOTAL_TESTS tests passed ($TOTAL_PASSED assertions)"
        echo -e "\n\033[32m$MSG\033[0m\n"
        echo "$MSG" >> "$LOG_FILE"
        exit 0
    else
        MSG="✖ $TOTAL_FAILED assertions failed across $TOTAL_TESTS tests"
        echo -e "\n\033[31m$MSG\033[0m\n"
        echo "$MSG" >> "$LOG_FILE"
        exit 1
    fi

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
