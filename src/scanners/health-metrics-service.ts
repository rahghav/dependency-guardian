import axios from 'axios';
import { HealthMetrics, Dependency } from '../types';
import { OSSFScorecardClient } from './ossf-scorecard-client';

export class HealthMetricsService {
  private ossfClient: OSSFScorecardClient;

  constructor() {
    this.ossfClient = new OSSFScorecardClient();
  }

  async getHealthMetrics(dependency: Dependency, vulnerabilityCount: number, criticalCount: number): Promise<HealthMetrics | null> {
    if (dependency.ecosystem !== 'npm') {
      // Currently only npm is fully supported
      return null;
    }

    try {
      const [ossfScore, npmData] = await Promise.all([
        this.ossfClient.getScorecard(dependency.name, dependency.ecosystem),
        this.getNpmPackageData(dependency.name),
      ]);

      if (!npmData) {
        return null;
      }

      return {
        ossf: ossfScore || undefined,
        maintenance: {
          lastUpdateDays: npmData.lastUpdateDays,
          commitFrequency: npmData.commitFrequency,
          hasRecentRelease: npmData.hasRecentRelease,
        },
        community: {
          weeklyDownloads: npmData.weeklyDownloads,
          contributors: npmData.contributors,
          openIssues: npmData.openIssues,
          stars: npmData.stars,
        },
        vulnerabilityHistory: {
          totalVulnerabilities: vulnerabilityCount,
          criticalCount: criticalCount,
        },
      };
    } catch (error) {
      return null;
    }
  }

  private async getNpmPackageData(packageName: string) {
    try {
      const [registryData, downloadsData] = await Promise.all([
        axios.get(`https://registry.npmjs.org/${packageName}`, { timeout: 5000 }),
        axios.get(`https://api.npmjs.org/downloads/point/last-week/${packageName}`, { timeout: 5000 }),
      ]);

      const latestVersion = registryData.data['dist-tags']?.latest;
      const versionData = registryData.data.versions?.[latestVersion];
      const time = registryData.data.time?.[latestVersion];

      const lastUpdateDate = time ? new Date(time) : new Date(0);
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));

      // Determine commit frequency based on release patterns
      const versions = Object.keys(registryData.data.versions || {});
      const releaseFrequency = this.calculateReleaseFrequency(registryData.data.time || {});

      // Try to get GitHub data if available
      let githubData = null;
      const repository = registryData.data.repository;
      if (repository) {
        const repoUrl = typeof repository === 'string' ? repository : repository.url;
        if (repoUrl && repoUrl.includes('github.com')) {
          githubData = await this.getGitHubData(repoUrl);
        }
      }

      return {
        lastUpdateDays: daysSinceUpdate,
        commitFrequency: releaseFrequency,
        hasRecentRelease: daysSinceUpdate < 180, // Released in last 6 months
        weeklyDownloads: downloadsData.data.downloads || 0,
        contributors: githubData?.contributors,
        openIssues: githubData?.openIssues,
        stars: githubData?.stars,
      };
    } catch (error) {
      return null;
    }
  }

  private calculateReleaseFrequency(timeData: Record<string, string>): 'high' | 'medium' | 'low' | 'abandoned' {
    const versions = Object.entries(timeData)
      .filter(([key]) => key !== 'modified' && key !== 'created')
      .map(([_, time]) => new Date(time).getTime())
      .sort((a, b) => b - a);

    if (versions.length < 2) {
      return 'low';
    }

    const lastRelease = versions[0];
    const daysSinceLastRelease = (Date.now() - lastRelease) / (1000 * 60 * 60 * 24);

    if (daysSinceLastRelease > 730) { // 2 years
      return 'abandoned';
    }

    // Calculate average days between recent releases
    const recentVersions = versions.slice(0, Math.min(10, versions.length));
    let totalDaysBetween = 0;
    for (let i = 0; i < recentVersions.length - 1; i++) {
      totalDaysBetween += (recentVersions[i] - recentVersions[i + 1]) / (1000 * 60 * 60 * 24);
    }
    const avgDaysBetween = totalDaysBetween / (recentVersions.length - 1);

    if (avgDaysBetween < 60) return 'high';      // Release every ~2 months
    if (avgDaysBetween < 180) return 'medium';   // Release every ~6 months
    return 'low';
  }

  private async getGitHubData(repoUrl: string): Promise<{ contributors?: number; openIssues?: number; stars?: number } | null> {
    try {
      // Extract owner/repo from URL
      const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/\.]+)/);
      if (!match) return null;

      const [, owner, repo] = match;

      // Use GitHub API (no auth required for public repos, but rate limited)
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'vulnguard',
        },
      });

      return {
        contributors: undefined, // Would need additional API call
        openIssues: response.data.open_issues_count,
        stars: response.data.stargazers_count,
      };
    } catch (error) {
      return null;
    }
  }
}
