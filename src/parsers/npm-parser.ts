import * as fs from 'fs';
import * as path from 'path';
import { Dependency, ParserResult } from '../types';

export class NpmParser {
  async parse(filePath: string): Promise<ParserResult> {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const packageJson = JSON.parse(content);

    const dependencies: Dependency[] = [];

    // Parse production dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version: this.cleanVersion(version as string),
          ecosystem: 'npm',
          isDev: false,
        });
      }
    }

    // Parse dev dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          version: this.cleanVersion(version as string),
          ecosystem: 'npm',
          isDev: true,
        });
      }
    }

    return {
      dependencies,
      ecosystem: 'npm',
      filePath: absolutePath,
    };
  }

  private cleanVersion(version: string): string {
    // Remove version prefixes like ^, ~, >=, etc.
    return version.replace(/^[\^~>=<]+/, '');
  }
}
