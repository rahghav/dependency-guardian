import chalk from 'chalk';
import Table from 'cli-table3';
import { Report, ScanResult } from '../types';

export class ConsoleReporter {
  report(report: Report, verbose: boolean = false): void {
    console.log('\n' + chalk.bold.cyan('═'.repeat(70)));
    console.log(chalk.bold.cyan('  Dependency Guardian - Security Scan Report'));
    console.log(chalk.bold.cyan('═'.repeat(70)) + '\n');

    console.log(chalk.gray(`Scan Time: ${new Date(report.timestamp).toLocaleString()}`));
    console.log(chalk.gray(`Project: ${report.projectPath}\n`));

    // Summary section
    this.printSummary(report);

    // Vulnerable dependencies
    const vulnerableResults = report.results.filter(r => r.vulnerabilities.length > 0);

    if (vulnerableResults.length === 0) {
      console.log(chalk.green.bold('\n✓ No vulnerabilities found! Your dependencies are secure.\n'));
      return;
    }

    console.log(chalk.bold.red(`\n⚠ Found ${vulnerableResults.length} vulnerable dependencies:\n`));

    for (const result of vulnerableResults) {
      this.printScanResult(result, verbose);
    }

    // Overall health score
    const avgHealthScore = Math.round(
      report.results.reduce((sum, r) => sum + r.healthScore, 0) / report.results.length
    );

    console.log(chalk.bold('\n' + '─'.repeat(70)));
    console.log(this.getHealthScoreText(avgHealthScore));
    console.log(chalk.bold('─'.repeat(70) + '\n'));
  }

  private printSummary(report: Report): void {
    const table = new Table({
      head: ['Metric', 'Count'].map(h => chalk.bold.white(h)),
      style: { head: [], border: ['gray'] },
    });

    table.push(
      ['Total Dependencies', report.totalDependencies.toString()],
      ['Vulnerable Dependencies', chalk.red(report.vulnerableDependencies.toString())],
      ['Critical Issues', this.colorSeverity('CRITICAL', report.summary.critical)],
      ['High Issues', this.colorSeverity('HIGH', report.summary.high)],
      ['Medium Issues', this.colorSeverity('MEDIUM', report.summary.medium)],
      ['Low Issues', this.colorSeverity('LOW', report.summary.low)]
    );

    console.log(table.toString());
  }

  private printScanResult(result: ScanResult, verbose: boolean): void {
    const { dependency, vulnerabilities, healthScore } = result;

    console.log(chalk.bold(`\n📦 ${dependency.name}@${dependency.version}`));
    console.log(chalk.gray(`   Ecosystem: ${dependency.ecosystem} | Health Score: ${this.getHealthColor(healthScore)}${healthScore}/100${chalk.reset()}`));

    for (const vuln of vulnerabilities) {
      const severityBadge = this.getSeverityBadge(vuln.severity);
      console.log(`\n   ${severityBadge} ${chalk.bold(vuln.id)}`);

      if (verbose) {
        console.log(chalk.gray(`   ${vuln.description}`));
        if (vuln.cvssScore) {
          console.log(chalk.gray(`   CVSS Score: ${vuln.cvssScore}`));
        }
        if (vuln.references && vuln.references.length > 0) {
          console.log(chalk.gray(`   Reference: ${vuln.references[0]}`));
        }
      }
    }
  }

  private getSeverityBadge(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return chalk.bgRed.white.bold(' CRITICAL ');
      case 'HIGH':
        return chalk.bgRedBright.white.bold(' HIGH ');
      case 'MEDIUM':
        return chalk.bgYellow.black.bold(' MEDIUM ');
      case 'LOW':
        return chalk.bgBlue.white.bold(' LOW ');
      default:
        return chalk.bgGray.white.bold(' UNKNOWN ');
    }
  }

  private colorSeverity(severity: string, count: number): string {
    if (count === 0) return chalk.green(count.toString());

    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return chalk.red.bold(count.toString());
      case 'MEDIUM':
        return chalk.yellow(count.toString());
      case 'LOW':
        return chalk.blue(count.toString());
      default:
        return count.toString();
    }
  }

  private getHealthColor(score: number): string {
    if (score >= 80) return chalk.green.bold('');
    if (score >= 60) return chalk.yellow.bold('');
    return chalk.red.bold('');
  }

  private getHealthScoreText(score: number): string {
    const scoreText = `Overall Health Score: ${score}/100`;

    if (score >= 80) {
      return chalk.green.bold('✓ ' + scoreText + ' - Good');
    } else if (score >= 60) {
      return chalk.yellow.bold('⚠ ' + scoreText + ' - Fair');
    } else {
      return chalk.red.bold('✗ ' + scoreText + ' - Poor');
    }
  }
}
