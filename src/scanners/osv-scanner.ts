import axios from 'axios';
import { Dependency, Vulnerability, ScannerOptions } from '../types';

interface OSVRequest {
  package: {
    name: string;
    ecosystem: string;
  };
  version?: string;
}

interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: Array<{
    type: string;
    score: string;
  }>;
  database_specific?: {
    severity?: string;
  };
  references?: Array<{
    type: string;
    url: string;
  }>;
  published?: string;
  modified?: string;
}

interface OSVResponse {
  vulns?: OSVVulnerability[];
}

export class OSVScanner {
  private readonly apiUrl = 'https://api.osv.dev/v1/query';
  private options: ScannerOptions;

  constructor(options: ScannerOptions = {}) {
    this.options = options;
  }

  async scan(dependency: Dependency): Promise<Vulnerability[]> {
    try {
      const ecosystem = this.mapEcosystem(dependency.ecosystem);

      const request: OSVRequest = {
        package: {
          name: dependency.name,
          ecosystem,
        },
        version: dependency.version,
      };

      const response = await axios.post<OSVResponse>(
        this.apiUrl,
        request,
        {
          timeout: this.options.timeout || 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.vulns || response.data.vulns.length === 0) {
        return [];
      }

      return response.data.vulns.map(vuln => this.mapVulnerability(vuln));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.warn(`OSV scan failed for ${dependency.name}: ${error.message}`);
      }
      return [];
    }
  }

  private mapEcosystem(ecosystem: string): string {
    const ecosystemMap: Record<string, string> = {
      'npm': 'npm',
      'maven': 'Maven',
      'gradle': 'Maven',
      'pip': 'PyPI',
      'cargo': 'crates.io',
    };
    return ecosystemMap[ecosystem] || ecosystem;
  }

  private mapVulnerability(vuln: OSVVulnerability): Vulnerability {
    let severity: Vulnerability['severity'] = 'UNKNOWN';
    let cvssScore: number | undefined;

    // Try to extract severity from various fields
    if (vuln.severity && vuln.severity.length > 0) {
      const cvss = vuln.severity.find((s: { type: string; score: string }) => s.type === 'CVSS_V3');
      if (cvss) {
        const score = parseFloat(cvss.score.split(' ')[0]);
        cvssScore = score;
        severity = this.scoreToSeverity(score);
      }
    } else if (vuln.database_specific?.severity) {
      severity = vuln.database_specific.severity.toUpperCase() as Vulnerability['severity'];
    }

    const references = vuln.references?.map((ref: { type: string; url: string }) => ref.url) || [];

    return {
      id: vuln.id,
      severity,
      description: vuln.summary || vuln.details || 'No description available',
      cveId: vuln.id.startsWith('CVE-') ? vuln.id : undefined,
      cvssScore,
      publishedDate: vuln.published,
      references,
    };
  }

  private scoreToSeverity(score: number): Vulnerability['severity'] {
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    if (score > 0) return 'LOW';
    return 'UNKNOWN';
  }
}
