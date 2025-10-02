# Dependency Guardian

> Multi-language dependency security scanner and health monitor. Catch vulnerabilities before they catch you.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)

## Overview

Dependency Guardian is a powerful CLI tool that scans your project dependencies across multiple package managers (npm, Maven, Gradle) and checks them against vulnerability databases to identify security issues before they reach production.

## Features

- **Multi-Language Support**: Scan npm (package.json), Maven (pom.xml), and Gradle (build.gradle) projects
- **CVE Detection**: Integration with OSV (Open Source Vulnerabilities) database for real-time vulnerability checking
- **Beautiful CLI Output**: Color-coded security scores and severity indicators
- **Multiple Report Formats**: Generate reports in JSON, Markdown, or interactive console format
- **Health Scoring**: Each dependency gets a health score (0-100) based on vulnerabilities
- **Batch Scanning**: Scan entire project directories automatically
- **Fast & Lightweight**: Written in TypeScript with minimal dependencies

## Installation

### Global Installation
```bash
npm install -g dependency-guardian
```

### Using npx (No Installation Required)
```bash
npx dependency-guardian scan
```

### Local Development
```bash
git clone https://github.com/yourusername/dependency-guardian.git
cd dependency-guardian
npm install
npm run build
```

## Usage

### Basic Scan
Scan the current directory:
```bash
dependency-guardian scan
```

### Scan Specific File
```bash
dependency-guardian scan /path/to/package.json
dependency-guardian scan /path/to/pom.xml
```

### Scan Entire Project
```bash
dependency-guardian scan /path/to/project
```

### Options

```bash
dependency-guardian scan [options] [path]

Options:
  -f, --format <type>    Output format: console, json, markdown (default: "console")
  -o, --output <path>    Output file path (for json/markdown formats)
  -v, --verbose          Show detailed vulnerability information
  --dev                  Include dev dependencies in scan
  -h, --help             Display help
```

### Examples

**Verbose console output:**
```bash
dependency-guardian scan . --verbose
```

**Generate JSON report:**
```bash
dependency-guardian scan . --format json --output report.json
```

**Generate Markdown report:**
```bash
dependency-guardian scan . --format markdown --output SECURITY.md
```

**Include dev dependencies:**
```bash
dependency-guardian scan . --dev --verbose
```

## Output Example

```
══════════════════════════════════════════════════════════════════════
  Dependency Guardian - Security Scan Report
══════════════════════════════════════════════════════════════════════

Scan Time: 10/2/2025, 2:25:02 PM
Project: /Users/user/my-project

┌─────────────────────────┬───────┐
│ Metric                  │ Count │
├─────────────────────────┼───────┤
│ Total Dependencies      │ 25    │
│ Vulnerable Dependencies │ 3     │
│ Critical Issues         │ 1     │
│ High Issues             │ 2     │
│ Medium Issues           │ 4     │
│ Low Issues              │ 1     │
└─────────────────────────┴───────┘

⚠ Found 3 vulnerable dependencies:

📦 axios@1.6.2
   Ecosystem: npm | Health Score: 80/100

    HIGH  GHSA-8hc4-vh64-cxmj
   Server-Side Request Forgery in axios

──────────────────────────────────────────────────────────────────────
✓ Overall Health Score: 92/100 - Good
──────────────────────────────────────────────────────────────────────
```

## Supported Package Managers

| Package Manager | File | Status |
|----------------|------|--------|
| npm | `package.json` | ✅ Supported |
| Maven | `pom.xml` | ✅ Supported |
| Gradle | `build.gradle`, `build.gradle.kts` | 🚧 Coming Soon |
| Python pip | `requirements.txt`, `Pipfile` | 🚧 Coming Soon |
| Rust Cargo | `Cargo.toml` | 🚧 Coming Soon |

## Vulnerability Data Sources

- **OSV (Open Source Vulnerabilities)**: Primary vulnerability database
- Supports CVE, GHSA, and other advisory IDs
- Real-time API queries for up-to-date information

## Architecture

```
src/
├── cli.ts              # Main CLI entry point
├── parsers/            # Package file parsers
│   ├── npm-parser.ts
│   ├── maven-parser.ts
│   └── index.ts
├── scanners/           # Vulnerability scanners
│   ├── osv-scanner.ts
│   ├── vulnerability-scanner.ts
│   └── index.ts
├── reporters/          # Output formatters
│   ├── console-reporter.ts
│   ├── json-reporter.ts
│   ├── markdown-reporter.ts
│   └── index.ts
├── types/              # TypeScript interfaces
│   └── index.ts
└── utils/              # Helper functions
    └── file-finder.ts
```

## Development

### Setup
```bash
npm install
```

### Build
```bash
npm run build
```

### Run in Development
```bash
npm run dev  # Watch mode
npm start    # Run CLI
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Add Gradle parser support
- [ ] Add Python pip support
- [ ] Add Rust Cargo support
- [ ] Add GitHub Advisory database integration
- [ ] Add NVD API integration
- [ ] Implement caching for faster scans
- [ ] Add CI/CD integration (GitHub Actions, GitLab CI)
- [ ] Support for lock files (package-lock.json, yarn.lock)
- [ ] Add fix suggestions and auto-update capabilities
- [ ] Web dashboard for visualization

## License

Apache 2.0 - see [LICENSE](LICENSE) file for details.

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/dependency-guardian/issues)
- Documentation: [Wiki](https://github.com/yourusername/dependency-guardian/wiki)

## Acknowledgments

- OSV (Open Source Vulnerabilities) for vulnerability data
- The open-source security community

---

**Stay secure!** 🛡️
