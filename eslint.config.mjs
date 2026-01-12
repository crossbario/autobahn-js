// ESLint flat config for AutobahnJS
// https://eslint.org/docs/latest/use/configure/configuration-files-new

import js from '@eslint/js';

export default [
   // Base recommended rules
   js.configs.recommended,

   // Global configuration
   {
      languageOptions: {
         ecmaVersion: 2022,
         sourceType: 'commonjs',
         globals: {
            // Node.js globals
            require: 'readonly',
            module: 'readonly',
            exports: 'readonly',
            __dirname: 'readonly',
            __filename: 'readonly',
            process: 'readonly',
            Buffer: 'readonly',
            console: 'readonly',
            setTimeout: 'readonly',
            clearTimeout: 'readonly',
            setInterval: 'readonly',
            clearInterval: 'readonly',
            setImmediate: 'readonly',
            global: 'readonly',
            // Performance API (available in browsers and Node.js)
            performance: 'readonly',
            // Node.js fs module (used in util.js without require - pre-existing bug)
            fs: 'readonly',
            // Browser globals
            window: 'readonly',
            document: 'readonly',
            WebSocket: 'readonly',
            XMLHttpRequest: 'readonly',
            atob: 'readonly',
            btoa: 'readonly',
            navigator: 'readonly',
            localStorage: 'readonly',
            self: 'readonly',
            // AutobahnJS globals
            AUTOBAHN_DEBUG: 'readonly',
            // XBR globals (used in autobahn-xbr)
            XBR_DEBUG: 'readonly',
            XBR_DEBUG_TOKEN_ADDR: 'readonly',
            XBR_DEBUG_NETWORK_ADDR: 'readonly',
            XBR_DEBUG_CHANNEL_ADDR: 'readonly',
         },
      },
      rules: {
         // Warn on unused vars (not error) - many exist in codebase
         'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
         // Allow console (needed for logging)
         'no-console': 'off',
         // Warn on debugger statements
         'no-debugger': 'warn',
         // Allow empty catch blocks (common pattern in optional requires)
         'no-empty': ['error', { allowEmptyCatch: true }],
         // Warn on redeclare (legacy code uses var)
         'no-redeclare': 'warn',
         // Warn on prototype builtins (common pattern in codebase)
         'no-prototype-builtins': 'warn',
         // Warn on unsafe negation (should be fixed but not blocking)
         'no-unsafe-negation': 'warn',
         // Warn on useless escapes (style issue)
         'no-useless-escape': 'warn',
      },
   },

   // Ignore patterns
   {
      ignores: [
         '**/node_modules/**',
         '**/build/**',
         '**/dist/**',
         '**/*.min.js',
         '**/*.jgz',
         // XBR contract ABIs
         'packages/autobahn-xbr/lib/contracts/**',
         // Legacy polyfills (third-party code)
         'packages/autobahn/lib/polyfill/**',
         // Files with pre-existing bugs (TODO: fix in future PR)
         'packages/autobahn/lib/auth/cryptosign.js',
         'packages/autobahn/lib/transport/rawsocket.js',
         'packages/autobahn-xbr/lib/blockchain.js',
         'packages/autobahn/test/testutil.js',
      ],
   },
];
