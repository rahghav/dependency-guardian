import * as fs from 'fs';
import { Report } from '../types';

export class JsonReporter {
  report(report: Report, outputPath?: string): void {
    const json = JSON.stringify(report, null, 2);

    if (outputPath) {
      fs.writeFileSync(outputPath, json, 'utf-8');
      console.log(`Report saved to: ${outputPath}`);
    } else {
      console.log(json);
    }
  }
}
