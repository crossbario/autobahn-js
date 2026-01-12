# Contributing

We welcome contributions to **Autobahn|JS**! This guide explains how to
get involved.

## Getting in Touch

- **GitHub Issues**: Report bugs or request features at
  https://github.com/crossbario/autobahn-js/issues
- **GitHub Discussions**: Ask questions and discuss at
  https://github.com/crossbario/autobahn-js/discussions
- **Mailing List**: Join the Autobahn mailing list at
  https://groups.google.com/forum/#!forum/autobahnws

## Reporting Issues

When reporting issues, please include:

1. Node.js version (`node --version`) or browser name and version
2. Autobahn|JS version (from `package.json`)
3. Operating system and version
4. Transport being used (WebSocket, RawSocket)
5. Serializer being used (JSON, CBOR, MsgPack)
6. Minimal code example reproducing the issue
7. Full error message and stack trace if applicable
8. Network configuration if relevant (proxy, firewall, etc.)

## Contributing Code

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `master`
3. **Make your changes** following the code style
4. **Add tests** for new functionality
5. **Run the test suite** to ensure nothing is broken
6. **Submit a pull request** referencing any related issues

## Development Setup

```bash
# Clone the repository
git clone --recurse-submodules https://github.com/crossbario/autobahn-js.git
cd autobahn-js

# Install Just (task runner)
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/bin

# Install npm dependencies
just install-npm

# Install Crossbar.io (test router)
just install-crossbar
```

## Running Tests

```bash
# Start the test router (in background)
just crossbar-start &

# Run all tests
just test

# Run specific test categories
just test-connect
just test-rpc
just test-pubsub
just test-serialization
```

## Code Style

This project uses **ESLint** and **Prettier** for code formatting:

```bash
# Check for lint errors
just lint

# Check formatting
just format
```

Style guidelines:

- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep lines under 100 characters
- Use ES6+ features where appropriate

## Project Structure

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

## Testing Both Environments

Autobahn|JS supports both Node.js and browsers. When contributing:

- Test changes on Node.js 22+ (uses native WebSocket)
- Consider browser compatibility for frontend features
- Don't break compatibility with either environment

## Browser Bundles

To build browser bundles:

```bash
# Build autobahn browser bundle
just build-autobahn

# Build autobahn-xbr browser bundle
just build-xbr

# Build both
just build
```

## WebSocket Conformance

For WebSocket-related changes, ensure compatibility with the
[Autobahn|Testsuite](https://github.com/crossbario/autobahn-testsuite).

## License

The `autobahn` package is licensed under the **MIT License**.

The `autobahn-xbr` package is licensed under the **Apache License 2.0**.

By contributing, you agree that your contributions will be licensed under
the respective package's license.
