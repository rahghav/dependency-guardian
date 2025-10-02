import { Report, ReporterOptions } from '../types';
import { ConsoleReporter } from './console-reporter';
import { JsonReporter } from './json-reporter';
import { MarkdownReporter } from './markdown-reporter';

export class Reporter {
  static generate(report: Report, options: ReporterOptions): void {
    switch (options.format) {
      case 'console':
        new ConsoleReporter().report(report, options.verbose);
        break;
      case 'json':
        new JsonReporter().report(report, options.outputPath);
        break;
      case 'markdown':
        new MarkdownReporter().report(report, options.outputPath);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }
}

export { ConsoleReporter, JsonReporter, MarkdownReporter };
