import * as fs from 'fs';
import * as path from 'path';

export class FileFinder {
  static findDependencyFiles(rootPath: string): string[] {
    const files: string[] = [];
    const targetFiles = ['package.json', 'pom.xml', 'build.gradle', 'build.gradle.kts'];

    this.walkDirectory(rootPath, files, targetFiles);

    return files;
  }

  private static walkDirectory(dir: string, files: string[], targetFiles: string[]): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules and other common directories
        if (entry.isDirectory()) {
          if (!this.shouldSkipDirectory(entry.name)) {
            this.walkDirectory(fullPath, files, targetFiles);
          }
        } else if (entry.isFile() && targetFiles.includes(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
  }

  private static shouldSkipDirectory(name: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'target',
      '.idea',
      '.vscode',
      'coverage',
      '.next',
      '.nuxt',
    ];

    return skipDirs.includes(name) || name.startsWith('.');
  }
}
