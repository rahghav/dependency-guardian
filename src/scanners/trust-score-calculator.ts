import { HealthMetrics, TrustScore } from '../types';

export class TrustScoreCalculator {
  calculate(metrics: HealthMetrics | null): TrustScore {
    if (!metrics) {
      return this.createDefaultScore();
    }

    const securityScore = this.calculateSecurityScore(metrics);
    const maintenanceScore = this.calculateMaintenanceScore(metrics);
    const communityScore = this.calculateCommunityScore(metrics);
    const vulnerabilityTrackScore = this.calculateVulnerabilityTrackScore(metrics);

    // Weighted average (security is most important)
    const overall = Math.round(
      securityScore * 0.4 +
      maintenanceScore * 0.3 +
      communityScore * 0.15 +
      vulnerabilityTrackScore * 0.15
    );

    const category = this.getCategory(overall);
    const reasons = this.generateReasons(metrics, { security: securityScore, maintenance: maintenanceScore, community: communityScore, vulnerabilityTrack: vulnerabilityTrackScore });

    return {
      overall,
      category,
      breakdown: {
        security: securityScore,
        maintenance: maintenanceScore,
        community: communityScore,
        vulnerabilityTrack: vulnerabilityTrackScore,
      },
      reasons,
    };
  }

  private calculateSecurityScore(metrics: HealthMetrics): number {
    if (!metrics.ossf) {
      // No OpenSSF data means we can't assess security practices
      return 50; // Neutral score
    }

    // OpenSSF score is 0-10, convert to 0-100
    const ossfScore = (metrics.ossf.score / 10) * 100;

    // Bonus points for having security policy and SAST
    let bonus = 0;
    if (metrics.ossf.checks.securityPolicy && metrics.ossf.checks.securityPolicy >= 9) {
      bonus += 5;
    }
    if (metrics.ossf.checks.sast && metrics.ossf.checks.sast >= 9) {
      bonus += 5;
    }
    if (metrics.ossf.checks.branchProtection && metrics.ossf.checks.branchProtection >= 9) {
      bonus += 5;
    }

    return Math.min(100, Math.round(ossfScore + bonus));
  }

  private calculateMaintenanceScore(metrics: HealthMetrics): number {
    let score = 100;

    // Penalize based on last update
    const { lastUpdateDays, commitFrequency, hasRecentRelease } = metrics.maintenance;

    if (commitFrequency === 'abandoned') {
      score -= 60;
    } else if (commitFrequency === 'low') {
      score -= 30;
    } else if (commitFrequency === 'medium') {
      score -= 10;
    }

    if (lastUpdateDays > 365) {
      score -= 30;
    } else if (lastUpdateDays > 180) {
      score -= 15;
    }

    if (!hasRecentRelease) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  private calculateCommunityScore(metrics: HealthMetrics): number {
    let score = 50; // Start neutral

    const { weeklyDownloads, stars, openIssues } = metrics.community;

    // Popular packages are more trustworthy
    if (weeklyDownloads) {
      if (weeklyDownloads > 1000000) score += 25;      // Very popular
      else if (weeklyDownloads > 100000) score += 20;  // Popular
      else if (weeklyDownloads > 10000) score += 15;   // Moderately popular
      else if (weeklyDownloads > 1000) score += 10;    // Some usage
      else score += 5;                                  // Low usage
    }

    // GitHub stars indicate community support
    if (stars) {
      if (stars > 10000) score += 15;
      else if (stars > 1000) score += 10;
      else if (stars > 100) score += 5;
    }

    // Too many open issues can be a red flag
    if (openIssues) {
      if (openIssues > 500) score -= 10;
      else if (openIssues > 200) score -= 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateVulnerabilityTrackScore(metrics: HealthMetrics): number {
    const { totalVulnerabilities, criticalCount } = metrics.vulnerabilityHistory;

    let score = 100;

    // Penalize for vulnerabilities
    score -= totalVulnerabilities * 5;
    score -= criticalCount * 15;

    return Math.max(0, score);
  }

  private getCategory(overall: number): TrustScore['category'] {
    if (overall >= 80) return 'trusted';
    if (overall >= 50) return 'moderate';
    return 'high-risk';
  }

  private generateReasons(metrics: HealthMetrics, breakdown: TrustScore['breakdown']): string[] {
    const reasons: string[] = [];

    // Security reasons
    if (breakdown.security < 50) {
      reasons.push('Poor security practices detected');
      if (metrics.ossf && metrics.ossf.checks.branchProtection !== undefined && metrics.ossf.checks.branchProtection < 5) {
        reasons.push('No branch protection configured');
      }
      if (metrics.ossf && !metrics.ossf.checks.securityPolicy) {
        reasons.push('No security policy found');
      }
    } else if (breakdown.security >= 80) {
      reasons.push('Strong security practices in place');
    }

    // Maintenance reasons
    if (metrics.maintenance.commitFrequency === 'abandoned') {
      reasons.push('Package appears abandoned (no recent updates)');
    } else if (metrics.maintenance.commitFrequency === 'low') {
      reasons.push('Infrequent maintenance updates');
    } else if (metrics.maintenance.commitFrequency === 'high') {
      reasons.push('Actively maintained with frequent updates');
    }

    if (metrics.maintenance.lastUpdateDays > 365) {
      reasons.push(`Last updated ${Math.floor(metrics.maintenance.lastUpdateDays / 365)} year(s) ago`);
    }

    // Community reasons
    if (metrics.community.weeklyDownloads && metrics.community.weeklyDownloads > 100000) {
      reasons.push(`Widely used (${this.formatNumber(metrics.community.weeklyDownloads)} weekly downloads)`);
    } else if (metrics.community.weeklyDownloads && metrics.community.weeklyDownloads < 1000) {
      reasons.push('Limited community adoption');
    }

    // Vulnerability reasons
    if (metrics.vulnerabilityHistory.criticalCount > 0) {
      reasons.push(`${metrics.vulnerabilityHistory.criticalCount} critical vulnerabilities found`);
    }
    if (metrics.vulnerabilityHistory.totalVulnerabilities > 5) {
      reasons.push('Significant vulnerability history');
    } else if (metrics.vulnerabilityHistory.totalVulnerabilities === 0) {
      reasons.push('No known vulnerabilities');
    }

    return reasons;
  }

  private createDefaultScore(): TrustScore {
    return {
      overall: 50,
      category: 'moderate',
      breakdown: {
        security: 50,
        maintenance: 50,
        community: 50,
        vulnerabilityTrack: 50,
      },
      reasons: ['Limited health data available'],
    };
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }
}
