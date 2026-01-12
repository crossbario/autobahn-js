---
name: Bug Report
about: Report a bug or unexpected behavior
title: ''
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## To Reproduce

Steps to reproduce the behavior:

1. ...
2. ...
3. ...

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

What actually happened instead.

## Environment

- **AutobahnJS version**: (e.g., 26.1.1)
- **Runtime**: (Node.js version / Browser name + version)
- **OS**: (e.g., Ubuntu 24.04, Windows 11, macOS 15)
- **Transport**: (WebSocket / RawSocket)
- **Serializer**: (JSON / CBOR / MsgPack)
- **WAMP Router**: (e.g., Crossbar.io 25.1.1)

## Code Example

Minimal code to reproduce the issue:

```javascript
const autobahn = require('autobahn');

const connection = new autobahn.Connection({
    url: 'ws://localhost:8080/ws',
    realm: 'realm1'
});

connection.onopen = function (session) {
    // Your code here
};

connection.open();
```

## Error Output

```
Paste any error messages or stack traces here
```

## Additional Context

Add any other context about the problem here (screenshots, logs, etc.).
