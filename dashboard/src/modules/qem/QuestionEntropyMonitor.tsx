// Question Entropy Monitor (QEM)
// Detects when critical questions stop being asked

import React from 'react';

export interface Question {
  id: string;
  domain: string;
  questionText: string;
  askedBy: string;
  askedAt: Date;
  answered: boolean;
  answerDate?: Date;
  complexity: number; // 1-5 scale
  sensitivity: number; // 1-5 scale
}

export interface EntropyMetrics {
  domain: string;
  historicalFrequency: number; // questions/week baseline
  currentFrequency: number; // questions/week recent
  gapScore: number; // % drop from baseline
  trend: 'RISING' | 'STABLE' | 'DROPPING';
  lastCalculated: Date;
}

export interface EntropyAlert {
  id: string;
  domain: string;
  gapScore: number;
  threshold: number;
  detectedAt: Date;
  missingQuestions: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DashboardModule {
  render(): JSX.Element;
}

export class QuestionEntropyMonitor implements DashboardModule {
  private questionRegistry: Map<string, Question[]> = new Map();
  private entropyAlerts: EntropyAlert[] = [];
  private suppressedQuestions: Map<string, string[]> = new Map();

  // Register a question asked
  public registerQuestion(question: Omit<Question, 'id'>): void {
    const id = crypto.randomUUID();
    const newQuestion: Question = {
      id,
      ...question,
      askedAt: question.askedAt || new Date(),
      answered: question.answered || false,
      complexity: question.complexity || 1,
      sensitivity: question.sensitivity || 1
    };

    const domainQuestions = this.questionRegistry.get(question.domain) || [];
    domainQuestions.push(newQuestion);
    this.questionRegistry.set(question.domain, domainQuestions);

    // Check entropy after every 10 questions
    if (domainQuestions.length % 10 === 0) {
      this.checkEntropy(question.domain);
    }
  }

  // Calculate entropy for a domain
  public calculateEntropy(domain: string): EntropyMetrics {
    const questions = this.questionRegistry.get(domain) || [];
    
    if (questions.length < 20) {
      // Not enough data for baseline
      return {
        domain,
        historicalFrequency: 0,
        currentFrequency: 0,
        gapScore: 0,
        trend: 'STABLE',
        lastCalculated: new Date()
      };
    }

    // Calculate historical baseline (first 12 weeks)
    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);

    const historicalQuestions = questions.filter(q => 
      q.askedAt < fourWeeksAgo && q.askedAt >= twelveWeeksAgo
    );
    const recentQuestions = questions.filter(q => q.askedAt >= fourWeeksAgo);

    const historicalFrequency = historicalQuestions.length / 12; // per week
    const currentFrequency = recentQuestions.length / 4; // per week

    const gapScore = historicalFrequency > 0
      ? ((historicalFrequency - currentFrequency) / historicalFrequency) * 100
      : 0;

    const trend = gapScore > 10 ? 'DROPPING' : gapScore < -10 ? 'RISING' : 'STABLE';

    return {
      domain,
      historicalFrequency,
      currentFrequency,
      gapScore,
      trend,
      lastCalculated: now
    };
  }

  // Check for entropy gaps
  private checkEntropy(domain: string): void {
    const metrics = this.calculateEntropy(domain);

    if (metrics.gapScore > 50) { // 50% drop threshold
      this.triggerEntropyAlert(domain, metrics);
    }
  }

  // Trigger alert when entropy gap detected
  private triggerEntropyAlert(domain: string, metrics: EntropyMetrics): void {
    const missingQuestions = this.generateMissingQuestions(domain);

    const alert: EntropyAlert = {
      id: crypto.randomUUID(),
      domain,
      gapScore: metrics.gapScore,
      threshold: 50,
      detectedAt: new Date(),
      missingQuestions,
      riskLevel: metrics.gapScore > 75 ? 'HIGH' : metrics.gapScore > 60 ? 'MEDIUM' : 'LOW'
    };

    this.entropyAlerts.push(alert);
    this.suppressedQuestions.set(domain, missingQuestions);
  }

  // Generate missing questions using LLM (placeholder)
  private generateMissingQuestions(domain: string): string[] {
    // In production, this would call an LLM API
    // For now, return domain-specific templates
    const templates: Record<string, string[]> = {
      'vendor-oversight': [
        'Who audits the auditors?',
        'What conflicts of interest exist in vendor selection?',
        'How are vendor performance metrics independently verified?',
        'What happens when vendors fail to meet SLAs?'
      ],
      'financial-controls': [
        'Who has override authority for financial controls?',
        'How often are override logs reviewed?',
        'What triggers an independent financial audit?',
        'Who benefits from budget reallocations?'
      ],
      'policy-compliance': [
        'Who determines when policies can be waived?',
        'How are policy exceptions documented?',
        'What percentage of operations have policy waivers?',
        'Who reviews waiver justifications?'
      ]
    };

    return templates[domain] || [
      'What questions should we be asking about this domain?',
      'Who benefits from not asking certain questions?',
      'What assumptions are we not challenging?'
    ];
  }

  // Get entropy alerts
  public getEntropyAlerts(): EntropyAlert[] {
    return this.entropyAlerts;
  }

  // Get suppressed questions for a domain
  public getSuppressedQuestions(domain: string): string[] {
    return this.suppressedQuestions.get(domain) || [];
  }

  // Calculate resilience score for this layer
  public calculateResilience(): number {
    let totalGapScore = 0;
    let domainCount = 0;

    this.questionRegistry.forEach((_, domain) => {
      const metrics = this.calculateEntropy(domain);
      totalGapScore += metrics.gapScore;
      domainCount++;
    });

    if (domainCount === 0) return 100;

    const avgGapScore = totalGapScore / domainCount;
    return Math.max(0, Math.round(100 - avgGapScore));
  }

  // UI Component
  public render(): JSX.Element {
    const domains = Array.from(this.questionRegistry.keys());

    return (
      <div className="qem-dashboard">
        <h3>🔍 Question Entropy Monitor</h3>

        <div className="entropy-metrics">
          <h4>Domain Entropy Metrics</h4>
          {domains.map(domain => {
            const metrics = this.calculateEntropy(domain);
            const isDropping = metrics.trend === 'DROPPING';

            return (
              <div key={domain} className={`domain-card ${isDropping ? 'dropping' : ''}`}>
                <div className="domain-name">{domain}</div>
                <div className="metrics">
                  <div>Historical: {metrics.historicalFrequency.toFixed(1)} q/week</div>
                  <div>Current: {metrics.currentFrequency.toFixed(1)} q/week</div>
                  <div className={`gap-score ${metrics.gapScore > 50 ? 'high' : ''}`}>
                    Gap: {metrics.gapScore.toFixed(1)}%
                  </div>
                  <div className="trend">Trend: {metrics.trend}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="entropy-alerts">
          <h4>Entropy Alerts</h4>
          {this.entropyAlerts.length === 0 ? (
            <div className="no-alerts">No entropy gaps detected</div>
          ) : (
            this.entropyAlerts.map(alert => (
              <div key={alert.id} className={`alert risk-${alert.riskLevel.toLowerCase()}`}>
                <div className="alert-header">
                  <strong>{alert.domain}</strong>
                  <span className="gap-score">{alert.gapScore.toFixed(1)}% drop</span>
                </div>
                <div className="missing-questions">
                  <strong>Generated Missing Questions:</strong>
                  <ul>
                    {alert.missingQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
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

export default QuestionEntropyMonitor;
