export interface Dependency {
  name: string;
  version: string;
  ecosystem: 'npm' | 'maven' | 'gradle' | 'pip' | 'cargo';
  isDev?: boolean;
}

export interface Vulnerability {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  description: string;
  cveId?: string;
  cvssScore?: number;
  publishedDate?: string;
  references?: string[];
  fixedVersions?: string[];
}

export interface ScanResult {
  dependency: Dependency;
  vulnerabilities: Vulnerability[];
  healthScore: number; // 0-100
}

export interface Report {
  timestamp: string;
  projectPath: string;
  totalDependencies: number;
  vulnerableDependencies: number;
  results: ScanResult[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ParserResult {
  dependencies: Dependency[];
  ecosystem: string;
  filePath: string;
}

export interface ScannerOptions {
  timeout?: number;
  apiKeys?: {
    nvd?: string;
    github?: string;
  };
}

export interface ReporterOptions {
  format: 'json' | 'html' | 'markdown' | 'console';
  outputPath?: string;
  verbose?: boolean;
}
