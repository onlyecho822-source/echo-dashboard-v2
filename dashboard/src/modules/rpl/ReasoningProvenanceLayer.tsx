// Reasoning Provenance Layer (RPL)
// Prevents single-framework analytical capture by tracking lens usage and forcing rotation

import React from 'react';

export interface ReasoningFrame {
  id: string;
  framework: string;
  confidenceWeight: number; // 0-1 scale
  firstUsed: Date;
  lastUsed: Date;
  decayRate: number;
  context?: string;
  alternativesConsidered?: string[];
  userId?: string;
  sessionId?: string;
  decisionPoint?: string;
}

export interface DominanceAlert {
  id: string;
  framework: string;
  dominance: number; // 0-1 scale
  threshold: number;
  detectedAt: Date;
  recommendation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DashboardModule {
  render(): JSX.Element;
}

export class ReasoningProvenanceLayer implements DashboardModule {
  private frames: Map<string, ReasoningFrame> = new Map();
  private dominanceAlerts: DominanceAlert[] = [];
  private frameworkRotationQueue: string[] = [];

  // Track reasoning frame usage
  public trackReasoning(frame: Omit<ReasoningFrame, 'id'>): void {
    const id = crypto.randomUUID();
    const newFrame: ReasoningFrame = {
      id,
      ...frame,
      firstUsed: frame.firstUsed || new Date(),
      lastUsed: new Date(),
      decayRate: frame.decayRate || 0.0001
    };

    this.frames.set(id, newFrame);

    // Check for framework dominance after each addition
    this.checkFrameworkDominance();
  }

  // Calculate framework dominance (% of total reasoning weight)
  private checkFrameworkDominance(): void {
    const frameworkWeights = new Map<string, number>();
    let totalWeight = 0;

    // Calculate total weight per framework
    this.frames.forEach(frame => {
      const currentWeight = frameworkWeights.get(frame.framework) || 0;
      frameworkWeights.set(frame.framework, currentWeight + frame.confidenceWeight);
      totalWeight += frame.confidenceWeight;
    });

    // Check each framework for dominance
    frameworkWeights.forEach((weight, framework) => {
      const dominance = weight / totalWeight;

      if (dominance > 0.7) { // 70% threshold
        this.triggerDominanceAlert(framework, dominance);
      }
    });
  }

  // Trigger alert when framework dominance detected
  private triggerDominanceAlert(framework: string, dominance: number): void {
    const alert: DominanceAlert = {
      id: crypto.randomUUID(),
      framework,
      dominance,
      threshold: 0.7,
      detectedAt: new Date(),
      recommendation: this.generateRotationRecommendation(framework),
      riskLevel: dominance > 0.85 ? 'HIGH' : dominance > 0.75 ? 'MEDIUM' : 'LOW'
    };

    this.dominanceAlerts.push(alert);

    // Add alternative frameworks to rotation queue
    this.queueFrameworkRotation(framework);
  }

  // Generate recommendation for framework rotation
  private generateRotationRecommendation(dominantFramework: string): string {
    const alternatives = this.getAlternativeFrameworks(dominantFramework);
    return `Force ${alternatives[0]} analysis for next 3 audits to restore analytical diversity`;
  }

  // Get alternative frameworks to rotate to
  private getAlternativeFrameworks(current: string): string[] {
    const allFrameworks = [
      'Devil_Lens_Critique',
      'RSGD_360_Spiral',
      'Institutional_Decay_Detector',
      'Beneficiary_Tracing',
      'Question_Entropy_Analysis'
    ];

    return allFrameworks.filter(f => f !== current);
  }

  // Queue framework rotation
  private queueFrameworkRotation(dominantFramework: string): void {
    const alternatives = this.getAlternativeFrameworks(dominantFramework);
    this.frameworkRotationQueue.push(...alternatives.slice(0, 2));
  }

  // Get current dominance alerts
  public getDominanceAlerts(): DominanceAlert[] {
    return this.dominanceAlerts;
  }

  // Get rotation recommendations
  public getRotationRecommendations(): string[] {
    return this.frameworkRotationQueue;
  }

  // Calculate resilience score for this layer
  public calculateResilience(): number {
    const frameworkWeights = new Map<string, number>();
    let totalWeight = 0;

    this.frames.forEach(frame => {
      const currentWeight = frameworkWeights.get(frame.framework) || 0;
      frameworkWeights.set(frame.framework, currentWeight + frame.confidenceWeight);
      totalWeight += frame.confidenceWeight;
    });

    // Calculate diversity (inverse of max dominance)
    let maxDominance = 0;
    frameworkWeights.forEach(weight => {
      const dominance = weight / totalWeight;
      if (dominance > maxDominance) maxDominance = dominance;
    });

    // Resilience = 100 - (dominance * 100)
    return Math.round((1 - maxDominance) * 100);
  }

  // UI Component
  public render(): JSX.Element {
    const frameworkWeights = new Map<string, number>();
    let totalWeight = 0;

    this.frames.forEach(frame => {
      const currentWeight = frameworkWeights.get(frame.framework) || 0;
      frameworkWeights.set(frame.framework, currentWeight + frame.confidenceWeight);
      totalWeight += frame.confidenceWeight;
    });

    return (
      <div className="rpl-dashboard">
        <h3>🧠 Reasoning Provenance Layer</h3>
        
        <div className="framework-distribution">
          <h4>Framework Usage Distribution</h4>
          {Array.from(frameworkWeights.entries()).map(([framework, weight]) => {
            const percentage = (weight / totalWeight) * 100;
            const isDominant = percentage > 70;
            
            return (
              <div key={framework} className={`framework-bar ${isDominant ? 'dominant' : ''}`}>
                <div className="framework-name">{framework}</div>
                <div className="framework-percentage">{percentage.toFixed(1)}%</div>
                <div className="framework-visual" style={{ width: `${percentage}%` }} />
              </div>
            );
          })}
        </div>

        <div className="dominance-alerts">
          <h4>Dominance Alerts</h4>
          {this.dominanceAlerts.length === 0 ? (
            <div className="no-alerts">No framework dominance detected</div>
          ) : (
            this.dominanceAlerts.map(alert => (
              <div key={alert.id} className={`alert risk-${alert.riskLevel.toLowerCase()}`}>
                <div className="alert-header">
                  <strong>{alert.framework}</strong>
                  <span className="dominance">{(alert.dominance * 100).toFixed(1)}% dominance</span>
                </div>
                <div className="alert-recommendation">{alert.recommendation}</div>
                <div className="alert-timestamp">{alert.detectedAt.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        <div className="rotation-queue">
          <h4>Framework Rotation Queue</h4>
          {this.frameworkRotationQueue.length === 0 ? (
            <div className="no-rotation">No rotation needed</div>
          ) : (
            <ul>
              {this.frameworkRotationQueue.map((framework, index) => (
                <li key={index}>{framework}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
}

export default ReasoningProvenanceLayer;
