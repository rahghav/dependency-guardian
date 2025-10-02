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

export interface OpenSSFScore {
  score: number; // 0-10
  checks: {
    branchProtection?: number;
    codeReview?: number;
    maintained?: number;
    ciTests?: number;
    securityPolicy?: number;
    dependencyUpdateTool?: number;
    fuzzing?: number;
    sast?: number;
    dangerousWorkflow?: number;
    tokenPermissions?: number;
  };
}

export interface HealthMetrics {
  ossf?: OpenSSFScore;
  maintenance: {
    lastUpdateDays: number;
    commitFrequency: 'high' | 'medium' | 'low' | 'abandoned';
    hasRecentRelease: boolean;
  };
  community: {
    weeklyDownloads?: number;
    contributors?: number;
    openIssues?: number;
    stars?: number;
  };
  vulnerabilityHistory: {
    totalVulnerabilities: number;
    criticalCount: number;
    averagePatchTimeDays?: number;
  };
}

export interface TrustScore {
  overall: number; // 0-100
  category: 'trusted' | 'moderate' | 'high-risk';
  breakdown: {
    security: number; // 0-100
    maintenance: number; // 0-100
    community: number; // 0-100
    vulnerabilityTrack: number; // 0-100
  };
  reasons: string[];
}

export interface AlternativePackage {
  name: string;
  version: string;
  trustScore: number;
  reason: string;
  ecosystem: string;
  compatibility: 'drop-in' | 'similar' | 'different-api';
}

export interface ScanResult {
  dependency: Dependency;
  vulnerabilities: Vulnerability[];
  healthScore: number; // 0-100 (deprecated, use trustScore instead)
  trustScore?: TrustScore;
  healthMetrics?: HealthMetrics;
  alternatives?: AlternativePackage[];
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
