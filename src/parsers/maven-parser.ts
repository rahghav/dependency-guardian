import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { Dependency, ParserResult } from '../types';

export class MavenParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  async parse(filePath: string): Promise<ParserResult> {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const parsed = this.xmlParser.parse(content);

    const dependencies: Dependency[] = [];
    const pomDependencies = parsed.project?.dependencies?.dependency;

    if (!pomDependencies) {
      return {
        dependencies,
        ecosystem: 'maven',
        filePath: absolutePath,
      };
    }

    const depArray = Array.isArray(pomDependencies) ? pomDependencies : [pomDependencies];

    for (const dep of depArray) {
      const scope = dep.scope || 'compile';
      dependencies.push({
        name: `${dep.groupId}:${dep.artifactId}`,
        version: dep.version || 'unknown',
        ecosystem: 'maven',
        isDev: scope === 'test',
      });
    }

    return {
      dependencies,
      ecosystem: 'maven',
      filePath: absolutePath,
    };
  }
}
