import chalk from 'chalk';
import Table from 'cli-table3';
import { Report, ScanResult } from '../types';

export class ConsoleReporter {
  report(report: Report, verbose: boolean = false): void {
    console.log('\n' + chalk.bold.cyan('═'.repeat(70)));
    console.log(chalk.bold.cyan('  Vulnguard - Security Scan Report'));
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
    const { dependency, vulnerabilities, healthScore, trustScore, healthMetrics } = result;

    console.log(chalk.bold(`\n📦 ${dependency.name}@${dependency.version}`));

    // Display trust score if available
    if (trustScore) {
      const trustBadge = this.getTrustBadge(trustScore.category);
      const trustColor = this.getTrustColor(trustScore.overall);
      console.log(chalk.gray(`   Ecosystem: ${dependency.ecosystem} | Trust Score: ${trustColor}${trustScore.overall}/100${chalk.reset()} ${trustBadge}`));

      // Show breakdown in verbose mode
      if (verbose && trustScore) {
        console.log(chalk.gray(`   ├─ Security: ${trustScore.breakdown.security}/100`));
        console.log(chalk.gray(`   ├─ Maintenance: ${trustScore.breakdown.maintenance}/100`));
        console.log(chalk.gray(`   ├─ Community: ${trustScore.breakdown.community}/100`));
        console.log(chalk.gray(`   └─ Vulnerability Track: ${trustScore.breakdown.vulnerabilityTrack}/100`));

        // Show key reasons
        if (trustScore.reasons.length > 0) {
          console.log(chalk.yellow(`   📊 Key Insights:`));
          trustScore.reasons.slice(0, 3).forEach(reason => {
            console.log(chalk.gray(`      • ${reason}`));
          });
        }
      }
    } else {
      console.log(chalk.gray(`   Ecosystem: ${dependency.ecosystem} | Health Score: ${this.getHealthColor(healthScore)}${healthScore}/100${chalk.reset()}`));
    }

    // Display vulnerabilities
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

    // Show alternatives if available
    if (result.alternatives && result.alternatives.length > 0 && verbose) {
      console.log(chalk.cyan(`\n   🔄 Safer Alternatives:`));
      result.alternatives.forEach(alt => {
        console.log(chalk.gray(`      • ${alt.name} (Trust Score: ${alt.trustScore}/100) - ${alt.reason}`));
      });
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

  private getTrustBadge(category: 'trusted' | 'moderate' | 'high-risk'): string {
    switch (category) {
      case 'trusted':
        return chalk.green.bold('✓ TRUSTED');
      case 'moderate':
        return chalk.yellow.bold('⚠ MODERATE');
      case 'high-risk':
        return chalk.red.bold('✗ HIGH RISK');
    }
  }

  private getTrustColor(score: number): string {
    if (score >= 80) return chalk.green.bold('');
    if (score >= 50) return chalk.yellow.bold('');
    return chalk.red.bold('');
  }
}
