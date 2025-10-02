import axios from 'axios';
import { OpenSSFScore } from '../types';

interface OSSFRawResponse {
  date: string;
  repo: {
    name: string;
    commit: string;
  };
  scorecard: {
    version: string;
    commit: string;
  };
  score: number;
  checks: Array<{
    name: string;
    score: number;
    reason: string;
    details: string[];
  }>;
}

export class OSSFScorecardClient {
  private readonly apiBaseUrl = 'https://api.securityscorecards.dev';

  async getScorecard(packageName: string, ecosystem: string): Promise<OpenSSFScore | null> {
    if (ecosystem !== 'npm') {
      // Currently only npm is well-supported in OpenSSF Scorecard
      return null;
    }

    try {
      // Try to get the GitHub repo URL from npm registry
      const repoUrl = await this.getNpmRepoUrl(packageName);
      if (!repoUrl) {
        return null;
      }

      // Query OpenSSF Scorecard API
      const response = await axios.get<OSSFRawResponse>(
        `${this.apiBaseUrl}/projects/${encodeURIComponent(repoUrl)}`,
        {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      return this.mapToOpenSSFScore(response.data);
    } catch (error) {
      // Silently fail - scorecard data is optional
      return null;
    }
  }

  private async getNpmRepoUrl(packageName: string): Promise<string | null> {
    try {
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
        timeout: 5000,
      });

      const repository = response.data.repository;
      if (!repository) {
        return null;
      }

      let repoUrl = typeof repository === 'string' ? repository : repository.url;

      // Clean up the URL
      repoUrl = repoUrl
        .replace(/^git\+/, '')
        .replace(/\.git$/, '')
        .replace(/^git:\/\//, 'https://')
        .replace(/^ssh:\/\/git@/, 'https://');

      // Ensure it's a GitHub URL (OpenSSF primarily supports GitHub)
      if (repoUrl.includes('github.com')) {
        return repoUrl;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private mapToOpenSSFScore(data: OSSFRawResponse): OpenSSFScore {
    const checks: OpenSSFScore['checks'] = {};

    for (const check of data.checks) {
      const checkName = this.normalizeCheckName(check.name);
      if (checkName) {
        checks[checkName] = check.score;
      }
    }

    return {
      score: data.score,
      checks,
    };
  }

  private normalizeCheckName(name: string): keyof OpenSSFScore['checks'] | null {
    const mapping: Record<string, keyof OpenSSFScore['checks']> = {
      'Branch-Protection': 'branchProtection',
      'Code-Review': 'codeReview',
      'Maintained': 'maintained',
      'CI-Tests': 'ciTests',
      'Security-Policy': 'securityPolicy',
      'Dependency-Update-Tool': 'dependencyUpdateTool',
      'Fuzzing': 'fuzzing',
      'SAST': 'sast',
      'Dangerous-Workflow': 'dangerousWorkflow',
      'Token-Permissions': 'tokenPermissions',
    };

    return mapping[name] || null;
  }
}
