import { NpmParser } from './npm-parser';
import { MavenParser } from './maven-parser';
import { ParserResult } from '../types';

export class ParserFactory {
  static async parse(filePath: string): Promise<ParserResult> {
    const fileName = filePath.toLowerCase();

    if (fileName.endsWith('package.json')) {
      const parser = new NpmParser();
      return parser.parse(filePath);
    } else if (fileName.endsWith('pom.xml')) {
      const parser = new MavenParser();
      return parser.parse(filePath);
    } else if (fileName.endsWith('build.gradle') || fileName.endsWith('build.gradle.kts')) {
      throw new Error('Gradle parser not yet implemented');
    } else {
      throw new Error(`Unsupported file type: ${filePath}`);
    }
  }
}

export { NpmParser, MavenParser };
