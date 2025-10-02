#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { ParserFactory } from './parsers';
import { VulnerabilityScanner } from './scanners';
import { Reporter } from './reporters';
import { Report, Dependency, ScanResult } from './types';
import { FileFinder } from './utils/file-finder';

const program = new Command();

program
  .name('dependency-guardian')
  .description('Multi-language dependency security scanner and health monitor')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan dependencies for vulnerabilities')
  .argument('[path]', 'Path to dependency file or project directory', '.')
  .option('-f, --format <type>', 'Output format (console, json, markdown)', 'console')
  .option('-o, --output <path>', 'Output file path (for json/markdown formats)')
  .option('-v, --verbose', 'Show detailed vulnerability information', false)
  .option('--dev', 'Include dev dependencies in scan', false)
  .action(async (targetPath: string, options) => {
    try {
      const absolutePath = path.resolve(targetPath);

      if (!fs.existsSync(absolutePath)) {
        console.error(chalk.red(`Error: Path not found: ${absolutePath}`));
        process.exit(1);
      }

      const spinner = ora('Scanning dependencies...').start();

      // Determine if path is a file or directory
      const stats = fs.statSync(absolutePath);
      let filesToScan: string[] = [];

      if (stats.isDirectory()) {
        filesToScan = FileFinder.findDependencyFiles(absolutePath);
        if (filesToScan.length === 0) {
          spinner.fail('No dependency files found in directory');
          process.exit(1);
        }
        spinner.text = `Found ${filesToScan.length} dependency file(s)`;
      } else {
        filesToScan = [absolutePath];
      }

      // Parse all dependency files
      const allDependencies: Dependency[] = [];
      for (const file of filesToScan) {
        try {
          spinner.text = `Parsing ${path.basename(file)}...`;
          const parseResult = await ParserFactory.parse(file);
          allDependencies.push(...parseResult.dependencies);
        } catch (error) {
          spinner.warn(`Failed to parse ${file}: ${(error as Error).message}`);
        }
      }

      if (allDependencies.length === 0) {
        spinner.fail('No dependencies found');
        process.exit(1);
      }

      // Filter dev dependencies if needed
      const dependenciesToScan = options.dev
        ? allDependencies
        : allDependencies.filter(d => !d.isDev);

      spinner.text = `Scanning ${dependenciesToScan.length} dependencies for vulnerabilities...`;

      // Scan for vulnerabilities
      const scanner = new VulnerabilityScanner();
      const results: ScanResult[] = await scanner.scanAll(dependenciesToScan);

      spinner.succeed(`Scanned ${results.length} dependencies`);

      // Generate report
      const report: Report = {
        timestamp: new Date().toISOString(),
        projectPath: absolutePath,
        totalDependencies: results.length,
        vulnerableDependencies: results.filter(r => r.vulnerabilities.length > 0).length,
        results,
        summary: {
          critical: results.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'CRITICAL').length, 0),
          high: results.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'HIGH').length, 0),
          medium: results.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'MEDIUM').length, 0),
          low: results.reduce((sum, r) =>
            sum + r.vulnerabilities.filter(v => v.severity === 'LOW').length, 0),
        },
      };

      // Output report
      Reporter.generate(report, {
        format: options.format,
        outputPath: options.output,
        verbose: options.verbose,
      });

      // Exit with error code if vulnerabilities found
      if (report.vulnerableDependencies > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('dependency-guardian v0.1.0');
  });

program.parse();
