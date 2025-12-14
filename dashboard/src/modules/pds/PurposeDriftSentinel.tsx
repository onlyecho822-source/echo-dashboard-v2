// Purpose Drift Sentinel (PDS)
// Ensures the system stays true to its original purpose

import React from 'react';

export interface SystemPurpose {
  id: string;
  originalIntent: string;
  declaredAt: Date;
  lastRecommitment: Date;
  domain: string;
}

export interface UsageEvent {
  id: string;
  purposeId: string;
  eventType: string;
  description: string;
  occurredAt: Date;
  semanticVector?: number[]; // Embedding for semantic comparison
}

export interface DriftMetrics {
  purposeId: string;
  semanticDivergence: number; // 0-1 scale
  usagePatternShift: number; // 0-1 scale
  overallDrift: number; // 0-1 scale
  trend: 'STABLE' | 'DRIFTING' | 'CRITICAL';
  lastCalculated: Date;
}

export interface DriftAlert {
  id: string;
  purposeId: string;
  divergence: number;
  threshold: number;
  detectedAt: Date;
  action: 'PAUSE_SYSTEM' | 'REQUIRE_RECOMMITMENT';
  deadline?: Date;
}

export interface DashboardModule {
  render(): JSX.Element;
}

export class PurposeDriftSentinel implements DashboardModule {
  private purposes: Map<string, SystemPurpose> = new Map();
  private usageEvents: Map<string, UsageEvent[]> = new Map();
  private driftAlerts: DriftAlert[] = [];
  private systemPaused: boolean = false;

  // Register system purpose
  public registerPurpose(purpose: Omit<SystemPurpose, 'id' | 'lastRecommitment'>): string {
    const id = crypto.randomUUID();
    const newPurpose: SystemPurpose = {
      id,
      ...purpose,
      declaredAt: purpose.declaredAt || new Date(),
      lastRecommitment: new Date()
    };

    this.purposes.set(id, newPurpose);
    this.usageEvents.set(id, []);

    return id;
  }

  // Track usage event
  public trackUsage(purposeId: string, event: Omit<UsageEvent, 'id' | 'purposeId'>): void {
    const id = crypto.randomUUID();
    const newEvent: UsageEvent = {
      id,
      purposeId,
      ...event,
      occurredAt: event.occurredAt || new Date()
    };

    const events = this.usageEvents.get(purposeId) || [];
    events.push(newEvent);
    this.usageEvents.set(purposeId, events);

    // Check drift after every 10 events
    if (events.length % 10 === 0) {
      this.checkDrift(purposeId);
    }
  }

  // Calculate drift metrics
  public calculateDrift(purposeId: string): DriftMetrics {
    const purpose = this.purposes.get(purposeId);
    const events = this.usageEvents.get(purposeId) || [];

    if (!purpose || events.length < 10) {
      return {
        purposeId,
        semanticDivergence: 0,
        usagePatternShift: 0,
        overallDrift: 0,
        trend: 'STABLE',
        lastCalculated: new Date()
      };
    }

    // Calculate semantic divergence
    const semanticDivergence = this.calculateSemanticDivergence(purpose, events);

    // Calculate usage pattern shift
    const usagePatternShift = this.calculateUsagePatternShift(events);

    // Overall drift = weighted average
    const overallDrift = (semanticDivergence * 0.7) + (usagePatternShift * 0.3);

    // Determine trend
    const trend = overallDrift > 0.4 ? 'CRITICAL' : overallDrift > 0.2 ? 'DRIFTING' : 'STABLE';

    return {
      purposeId,
      semanticDivergence,
      usagePatternShift,
      overallDrift,
      trend,
      lastCalculated: new Date()
    };
  }

  // Calculate semantic divergence between intent and usage
  private calculateSemanticDivergence(purpose: SystemPurpose, events: UsageEvent[]): number {
    // In production, this would use embeddings and cosine similarity
    // For now, use simple keyword matching as proxy

    const intentKeywords = this.extractKeywords(purpose.originalIntent);
    const recentEvents = events.slice(-20); // Last 20 events

    let matchScore = 0;
    recentEvents.forEach(event => {
      const eventKeywords = this.extractKeywords(event.description);
      const overlap = intentKeywords.filter(k => eventKeywords.includes(k)).length;
      matchScore += overlap / intentKeywords.length;
    });

    const avgMatchScore = matchScore / recentEvents.length;
    return 1 - avgMatchScore; // Divergence = 1 - similarity
  }

  // Extract keywords from text (simple implementation)
  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);
  }

  // Calculate usage pattern shift
  private calculateUsagePatternShift(events: UsageEvent[]): number {
    if (events.length < 20) return 0;

    // Compare first 10 vs last 10 event types
    const earlyEvents = events.slice(0, 10);
    const recentEvents = events.slice(-10);

    const earlyTypes = new Set(earlyEvents.map(e => e.eventType));
    const recentTypes = new Set(recentEvents.map(e => e.eventType));

    // Calculate Jaccard distance
    const intersection = new Set([...earlyTypes].filter(t => recentTypes.has(t)));
    const union = new Set([...earlyTypes, ...recentTypes]);

    const jaccardSimilarity = intersection.size / union.size;
    return 1 - jaccardSimilarity; // Shift = 1 - similarity
  }

  // Check for drift
  private checkDrift(purposeId: string): void {
    const metrics = this.calculateDrift(purposeId);

    if (metrics.overallDrift > 0.3) { // 30% threshold
      this.triggerDriftAlert(purposeId, metrics);
    }
  }

  // Trigger drift alert
  private triggerDriftAlert(purposeId: string, metrics: DriftMetrics): void {
    const alert: DriftAlert = {
      id: crypto.randomUUID(),
      purposeId,
      divergence: metrics.overallDrift,
      threshold: 0.3,
      detectedAt: new Date(),
      action: metrics.overallDrift > 0.5 ? 'PAUSE_SYSTEM' : 'REQUIRE_RECOMMITMENT',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.driftAlerts.push(alert);

    // Pause system if critical
    if (alert.action === 'PAUSE_SYSTEM') {
      this.pauseSystem();
    }
  }

  // Pause system due to critical drift
  private pauseSystem(): void {
    this.systemPaused = true;
    console.log('SYSTEM PAUSED: Critical purpose drift detected. Recommitment required.');
  }

  // Recommit to purpose
  public recommit(purposeId: string, recommitmentStatement: string): boolean {
    const purpose = this.purposes.get(purposeId);
    if (!purpose) return false;

    // Verify recommitment aligns with original intent
    const alignment = this.verifyRecommitmentAlignment(purpose.originalIntent, recommitmentStatement);

    if (alignment < 0.7) {
      console.log('Recommitment rejected: Insufficient alignment with original intent');
      return false;
    }

    // Accept recommitment
    purpose.lastRecommitment = new Date();
    this.purposes.set(purposeId, purpose);

    // Clear alerts for this purpose
    this.driftAlerts = this.driftAlerts.filter(a => a.purposeId !== purposeId);

    // Resume system if paused
    if (this.systemPaused) {
      this.systemPaused = false;
      console.log('SYSTEM RESUMED: Recommitment accepted');
    }

    return true;
  }

  // Verify recommitment aligns with original intent
  private verifyRecommitmentAlignment(originalIntent: string, recommitment: string): number {
    // In production, use embeddings and cosine similarity
    // For now, use simple keyword overlap
    const originalKeywords = this.extractKeywords(originalIntent);
    const recommitmentKeywords = this.extractKeywords(recommitment);

    const overlap = originalKeywords.filter(k => recommitmentKeywords.includes(k)).length;
    return overlap / originalKeywords.length;
  }

  // Get drift alerts
  public getDriftAlerts(): DriftAlert[] {
    return this.driftAlerts;
  }

  // Check if system is paused
  public isSystemPaused(): boolean {
    return this.systemPaused;
  }

  // Calculate resilience score for this layer
  public calculateResilience(): number {
    let totalDrift = 0;
    let purposeCount = 0;

    this.purposes.forEach((_, purposeId) => {
      const metrics = this.calculateDrift(purposeId);
      totalDrift += metrics.overallDrift;
      purposeCount++;
    });

    if (purposeCount === 0) return 100;

    const avgDrift = totalDrift / purposeCount;
    return Math.max(0, Math.round((1 - avgDrift) * 100));
  }

  // UI Component
  public render(): JSX.Element {
    return (
      <div className="pds-dashboard">
        <h3>🎯 Purpose Drift Sentinel</h3>

        {this.systemPaused && (
          <div className="system-paused-banner">
            ⚠️ SYSTEM PAUSED: Critical purpose drift detected. Recommitment required.
          </div>
        )}

        <div className="purpose-list">
          <h4>Registered Purposes</h4>
          {Array.from(this.purposes.entries()).map(([id, purpose]) => {
            const metrics = this.calculateDrift(id);
            const isDrifting = metrics.trend !== 'STABLE';

            return (
              <div key={id} className={`purpose-card trend-${metrics.trend.toLowerCase()}`}>
                <div className="purpose-domain">{purpose.domain}</div>
                <div className="purpose-intent">{purpose.originalIntent}</div>
                <div className="metrics">
                  <div>Semantic Divergence: {(metrics.semanticDivergence * 100).toFixed(1)}%</div>
                  <div>Usage Shift: {(metrics.usagePatternShift * 100).toFixed(1)}%</div>
                  <div className={`overall-drift ${isDrifting ? 'drifting' : ''}`}>
                    Overall Drift: {(metrics.overallDrift * 100).toFixed(1)}%
                  </div>
                  <div className="trend">Trend: {metrics.trend}</div>
                </div>
                <div className="dates">
                  Declared: {purpose.declaredAt.toLocaleDateString()} | 
                  Last Recommitment: {purpose.lastRecommitment.toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="drift-alerts">
          <h4>Drift Alerts</h4>
          {this.driftAlerts.length === 0 ? (
            <div className="no-alerts">No drift detected</div>
          ) : (
            this.driftAlerts.map(alert => (
              <div key={alert.id} className={`alert action-${alert.action.toLowerCase()}`}>
                <div className="alert-header">
                  <strong>Purpose Drift Detected</strong>
                  <span className="divergence">{(alert.divergence * 100).toFixed(1)}% divergence</span>
                </div>
                <div className="action">Action: {alert.action.replace(/_/g, ' ')}</div>
                {alert.deadline && (
                  <div className="deadline">Deadline: {alert.deadline.toLocaleString()}</div>
                )}
                <div className="alert-timestamp">{alert.detectedAt.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}

export default PurposeDriftSentinel;
