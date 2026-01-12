=========
Changelog
=========

This document contains the release history for Autobahn|JS.

For the full changelog, see `GitHub Releases <https://github.com/crossbario/autobahn-js/releases>`_.

Version 26.1.1 (2026-01)
------------------------

**Build System Modernization**

- Replaced Makefile with ``justfile`` for cross-platform build automation
- Added ESLint 9 + Prettier for code quality
- Updated to Node.js 22+ (uses native WebSocket, no external dependencies)
- Added comprehensive test suite with nodeunit
- Added GitHub Actions workflows for CI/CD
- Added CalVer versioning support (``just prep-release``, ``just bump-next``)
- Created Sphinx documentation infrastructure

**Dependencies**

- Pinned ``when.js@3.7.8`` (final stable release)
- Removed obsolete ``ws`` wrapper (Node.js 22+ has native WebSocket)

Version 24.5.1 (2024-05)
------------------------

- Previous release before modernization

.. note::

   Autobahn|JS uses `CalVer <https://calver.org/>`_ versioning: ``YY.M.PATCH``

   - ``YY``: Two-digit year
   - ``M``: Month (1-12, no leading zero)
   - ``PATCH``: Patch number within the month
