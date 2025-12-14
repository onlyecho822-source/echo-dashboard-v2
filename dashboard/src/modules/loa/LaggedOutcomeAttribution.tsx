// Lagged Outcome Attribution Engine (LOA)
// Identifies delayed consequences and hidden beneficiaries

import React from 'react';

export interface LaggedOutcome {
  id: string;
  decisionId: string;
  decisionDate: Date;
  beneficiary: string;
  benefitRealizedDate: Date;
  lagDays: number;
  riskScore: number; // 0-10 scale
  detectedAt: Date;
  context?: string;
}

export interface BeneficiaryPattern {
  beneficiary: string;
  occurrences: number;
  avgLagDays: number;
  totalRiskScore: number;
  firstDetected: Date;
  lastDetected: Date;
}

export interface LagAlert {
  id: string;
  pattern: string;
  riskScore: number;
  threshold: number;
  detectedAt: Date;
  affectedDecisions: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DashboardModule {
  render(): JSX.Element;
}

export class LaggedOutcomeAttribution implements DashboardModule {
  private outcomes: Map<string, LaggedOutcome> = new Map();
  private lagAlerts: LagAlert[] = [];
  private beneficiaryPatterns: Map<string, BeneficiaryPattern> = new Map();

  // Track a lagged outcome
  public trackOutcome(outcome: Omit<LaggedOutcome, 'id' | 'lagDays' | 'riskScore' | 'detectedAt'>): void {
    const id = crypto.randomUUID();
    const lagDays = Math.floor(
      (outcome.benefitRealizedDate.getTime() - outcome.decisionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const riskScore = this.calculateRiskScore(lagDays, outcome.beneficiary);

    const newOutcome: LaggedOutcome = {
      id,
      ...outcome,
      lagDays,
      riskScore,
      detectedAt: new Date()
    };

    this.outcomes.set(id, newOutcome);

    // Update beneficiary patterns
    this.updateBeneficiaryPattern(outcome.beneficiary, lagDays, riskScore);

    // Check for suspicious patterns
    this.checkLagPatterns();
  }

  // Calculate risk score based on lag and beneficiary history
  private calculateRiskScore(lagDays: number, beneficiary: string): number {
    let score = 0;

    // 1. Lag duration (max 4 points)
    if (lagDays > 180) score += 4;
    else if (lagDays > 90) score += 3;
    else if (lagDays > 30) score += 2;
    else if (lagDays > 7) score += 1;

    // 2. Beneficiary frequency (max 3 points)
    const pattern = this.beneficiaryPatterns.get(beneficiary);
    if (pattern) {
      if (pattern.occurrences > 10) score += 3;
      else if (pattern.occurrences > 5) score += 2;
      else if (pattern.occurrences > 2) score += 1;
    }

    // 3. Pattern consistency (max 3 points)
    if (pattern && pattern.avgLagDays > 60) {
      const consistency = this.calculateConsistency(beneficiary);
      if (consistency > 0.8) score += 3;
      else if (consistency > 0.6) score += 2;
      else if (consistency > 0.4) score += 1;
    }

    return Math.min(10, score);
  }

  // Calculate consistency of lag patterns for a beneficiary
  private calculateConsistency(beneficiary: string): number {
    const beneficiaryOutcomes = Array.from(this.outcomes.values())
      .filter(o => o.beneficiary === beneficiary);

    if (beneficiaryOutcomes.length < 2) return 0;

    const avgLag = beneficiaryOutcomes.reduce((sum, o) => sum + o.lagDays, 0) / beneficiaryOutcomes.length;
    const variance = beneficiaryOutcomes.reduce((sum, o) => sum + Math.pow(o.lagDays - avgLag, 2), 0) / beneficiaryOutcomes.length;
    const stdDev = Math.sqrt(variance);

    // Consistency = 1 - (stdDev / avgLag)
    return Math.max(0, 1 - (stdDev / avgLag));
  }

  // Update beneficiary pattern tracking
  private updateBeneficiaryPattern(beneficiary: string, lagDays: number, riskScore: number): void {
    let pattern = this.beneficiaryPatterns.get(beneficiary);

    if (!pattern) {
      pattern = {
        beneficiary,
        occurrences: 0,
        avgLagDays: 0,
        totalRiskScore: 0,
        firstDetected: new Date(),
        lastDetected: new Date()
      };
    }

    pattern.occurrences += 1;
    pattern.avgLagDays = ((pattern.avgLagDays * (pattern.occurrences - 1)) + lagDays) / pattern.occurrences;
    pattern.totalRiskScore += riskScore;
    pattern.lastDetected = new Date();

    this.beneficiaryPatterns.set(beneficiary, pattern);
  }

  // Check for suspicious lag patterns
  private checkLagPatterns(): void {
    // Find high-risk patterns
    const highRiskPatterns = Array.from(this.beneficiaryPatterns.values())
      .filter(p => p.totalRiskScore / p.occurrences > 7);

    highRiskPatterns.forEach(pattern => {
      const affectedDecisions = Array.from(this.outcomes.values())
        .filter(o => o.beneficiary === pattern.beneficiary)
        .map(o => o.decisionId);

      if (affectedDecisions.length >= 3) {
        this.triggerLagAlert(pattern, affectedDecisions);
      }
    });
  }

  // Trigger alert for suspicious lag patterns
  private triggerLagAlert(pattern: BeneficiaryPattern, affectedDecisions: string[]): void {
    const avgRisk = pattern.totalRiskScore / pattern.occurrences;

    const alert: LagAlert = {
      id: crypto.randomUUID(),
      pattern: `${pattern.beneficiary} - ${affectedDecisions.length} decisions with avg ${pattern.avgLagDays.toFixed(0)}-day lag`,
      riskScore: avgRisk,
      threshold: 7,
      detectedAt: new Date(),
      affectedDecisions,
      riskLevel: avgRisk > 8.5 ? 'HIGH' : avgRisk > 7.5 ? 'MEDIUM' : 'LOW'
    };

    // Only add if not already alerted
    const exists = this.lagAlerts.some(a => 
      a.pattern === alert.pattern && 
      a.detectedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!exists) {
      this.lagAlerts.push(alert);
    }
  }

  // Get lag alerts
  public getLagAlerts(): LagAlert[] {
    return this.lagAlerts;
  }

  // Get beneficiary patterns
  public getBeneficiaryPatterns(): BeneficiaryPattern[] {
    return Array.from(this.beneficiaryPatterns.values());
  }

  // Calculate resilience score for this layer
  public calculateResilience(): number {
    const highRiskOutcomes = Array.from(this.outcomes.values())
      .filter(o => o.riskScore > 7).length;

    const totalOutcomes = this.outcomes.size;

    if (totalOutcomes === 0) return 100;

    const highRiskPercentage = (highRiskOutcomes / totalOutcomes) * 100;
    return Math.max(0, Math.round(100 - highRiskPercentage));
  }

  // UI Component
  public render(): JSX.Element {
    const patterns = this.getBeneficiaryPatterns()
      .sort((a, b) => (b.totalRiskScore / b.occurrences) - (a.totalRiskScore / a.occurrences));

    return (
      <div className="loa-dashboard">
        <h3>⏳ Lagged Outcome Attribution</h3>

        <div className="beneficiary-patterns">
          <h4>Beneficiary Patterns</h4>
          {patterns.length === 0 ? (
            <div className="no-patterns">No patterns detected yet</div>
          ) : (
            patterns.map(pattern => {
              const avgRisk = pattern.totalRiskScore / pattern.occurrences;
              const isHighRisk = avgRisk > 7;

              return (
                <div key={pattern.beneficiary} className={`pattern-card ${isHighRisk ? 'high-risk' : ''}`}>
                  <div className="beneficiary-name">{pattern.beneficiary}</div>
                  <div className="metrics">
                    <div>Occurrences: {pattern.occurrences}</div>
                    <div>Avg Lag: {pattern.avgLagDays.toFixed(0)} days</div>
                    <div className={`risk-score ${isHighRisk ? 'high' : ''}`}>
                      Risk: {avgRisk.toFixed(1)}/10
                    </div>
                  </div>
                  <div className="dates">
                    First: {pattern.firstDetected.toLocaleDateString()} | 
                    Last: {pattern.lastDetected.toLocaleDateString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="lag-alerts">
          <h4>Lag Pattern Alerts</h4>
          {this.lagAlerts.length === 0 ? (
            <div className="no-alerts">No suspicious patterns detected</div>
          ) : (
            this.lagAlerts.map(alert => (
              <div key={alert.id} className={`alert risk-${alert.riskLevel.toLowerCase()}`}>
                <div className="alert-header">
                  <strong>{alert.pattern}</strong>
                  <span className="risk-score">Risk: {alert.riskScore.toFixed(1)}/10</span>
                </div>
                <div className="affected-decisions">
                  Affected Decisions: {alert.affectedDecisions.join(', ')}
                </div>
                <div className="alert-timestamp">{alert.detectedAt.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}

export default LaggedOutcomeAttribution;
