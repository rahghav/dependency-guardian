import * as fs from 'fs';
import { Report, ScanResult } from '../types';

export class MarkdownReporter {
  report(report: Report, outputPath?: string): void {
    const markdown = this.generateMarkdown(report);

    if (outputPath) {
      fs.writeFileSync(outputPath, markdown, 'utf-8');
      console.log(`Report saved to: ${outputPath}`);
    } else {
      console.log(markdown);
    }
  }

  private generateMarkdown(report: Report): string {
    const lines: string[] = [];

    lines.push('# Dependency Guardian - Security Scan Report');
    lines.push('');
    lines.push(`**Scan Time:** ${new Date(report.timestamp).toLocaleString()}`);
    lines.push(`**Project:** ${report.projectPath}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Count |');
    lines.push('|--------|-------|');
    lines.push(`| Total Dependencies | ${report.totalDependencies} |`);
    lines.push(`| Vulnerable Dependencies | ${report.vulnerableDependencies} |`);
    lines.push(`| Critical Issues | ${report.summary.critical} |`);
    lines.push(`| High Issues | ${report.summary.high} |`);
    lines.push(`| Medium Issues | ${report.summary.medium} |`);
    lines.push(`| Low Issues | ${report.summary.low} |`);
    lines.push('');

    // Vulnerable dependencies
    const vulnerableResults = report.results.filter(r => r.vulnerabilities.length > 0);

    if (vulnerableResults.length === 0) {
      lines.push('## Results');
      lines.push('');
      lines.push('✅ **No vulnerabilities found!** Your dependencies are secure.');
      lines.push('');
    } else {
      lines.push('## Vulnerabilities');
      lines.push('');

      for (const result of vulnerableResults) {
        lines.push(...this.generateResultMarkdown(result));
      }
    }

    return lines.join('\n');
  }

  private generateResultMarkdown(result: ScanResult): string[] {
    const lines: string[] = [];
    const { dependency, vulnerabilities, healthScore } = result;

    lines.push(`### ${dependency.name}@${dependency.version}`);
    lines.push('');
    lines.push(`- **Ecosystem:** ${dependency.ecosystem}`);
    lines.push(`- **Health Score:** ${healthScore}/100`);
    lines.push(`- **Vulnerabilities:** ${vulnerabilities.length}`);
    lines.push('');

    if (vulnerabilities.length > 0) {
      lines.push('#### Issues');
      lines.push('');

      for (const vuln of vulnerabilities) {
        lines.push(`- **[${vuln.severity}]** ${vuln.id}`);
        lines.push(`  - ${vuln.description}`);
        if (vuln.cvssScore) {
          lines.push(`  - CVSS Score: ${vuln.cvssScore}`);
        }
        if (vuln.references && vuln.references.length > 0) {
          lines.push(`  - [More info](${vuln.references[0]})`);
        }
        lines.push('');
      }
    }

    return lines;
  }
}
