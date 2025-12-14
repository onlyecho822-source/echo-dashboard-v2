// Observer Load Index (OLI)
// Prevents analyst burnout and cognitive capture through fatigue monitoring

import React from 'react';

export interface ObserverMetrics {
  observerId: string;
  auditsReviewed: number;
  correctionRate: number; // 0-1 scale
  contradictionExposure: number; // 0-1 scale
  fatigueRisk: 'low' | 'medium' | 'high';
  lastActivity: Date;
}

export interface LoadAlert {
  id: string;
  observerId: string;
  fatigueScore: number; // 0-10 scale
  metrics: ObserverMetrics;
  triggeredAt: Date;
  action: 'WARNING' | 'MANDATORY_COOLDOWN';
}

export interface CooldownEntry {
  observerId: string;
  startTime: Date;
  duration: number; // hours
  reason: string;
}

export interface ReviewTask {
  id: string;
  observerId: string;
  taskType: string;
  completedAt: Date;
  correctionsRequired: number;
  contradictionsFound: number;
}

export interface DashboardModule {
  render(): JSX.Element;
}

export class ObserverLoadIndex implements DashboardModule {
  private observers: Map<string, ObserverMetrics> = new Map();
  private loadAlerts: LoadAlert[] = [];
  private cooldownQueue: CooldownEntry[] = [];
  private lastBreaks: Map<string, Date> = new Map();

  // Update observer metrics after each review
  public updateObserverLoad(observerId: string, task: ReviewTask): void {
    let metrics = this.observers.get(observerId);
    
    if (!metrics) {
      metrics = this.initializeObserver(observerId);
    }
    
    // Update metrics
    metrics.auditsReviewed += 1;
    metrics.correctionRate = this.calculateCorrectionRate(observerId);
    metrics.contradictionExposure = this.calculateContradictionExposure(observerId);
    metrics.lastActivity = new Date();
    
    // Calculate fatigue risk
    metrics.fatigueRisk = this.calculateFatigueRisk(metrics);
    
    this.observers.set(observerId, metrics);
    
    // Check for high fatigue
    if (metrics.fatigueRisk === 'high') {
      this.triggerFatigueAlert(observerId, metrics);
    }
  }

  // Initialize new observer
  private initializeObserver(observerId: string): ObserverMetrics {
    return {
      observerId,
      auditsReviewed: 0,
      correctionRate: 0,
      contradictionExposure: 0,
      fatigueRisk: 'low',
      lastActivity: new Date()
    };
  }

  // Calculate correction rate for observer
  private calculateCorrectionRate(observerId: string): number {
    // In production, this would query actual correction history
    // For now, return placeholder
    return Math.random() * 0.6; // 0-60% range
  }

  // Calculate contradiction exposure for observer
  private calculateContradictionExposure(observerId: string): number {
    // In production, this would query actual contradiction history
    // For now, return placeholder
    return Math.random() * 0.8; // 0-80% range
  }

  // Calculate fatigue risk based on multiple factors
  private calculateFatigueRisk(metrics: ObserverMetrics): 'low' | 'medium' | 'high' {
    const score = this.calculateFatigueScore(metrics);
    
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  // Calculate fatigue score (0-10 scale)
  private calculateFatigueScore(metrics: ObserverMetrics): number {
    let score = 0;
    
    // 1. Audit volume (max 3 points)
    if (metrics.auditsReviewed > 20) score += 3;
    else if (metrics.auditsReviewed > 10) score += 2;
    else if (metrics.auditsReviewed > 5) score += 1;
    
    // 2. Correction rate stress (max 3 points)
    if (metrics.correctionRate > 0.5) score += 3; // >50% corrections = high stress
    else if (metrics.correctionRate > 0.25) score += 2;
    else if (metrics.correctionRate > 0.1) score += 1;
    
    // 3. Contradiction exposure (max 2 points)
    if (metrics.contradictionExposure > 0.7) score += 2;
    else if (metrics.contradictionExposure > 0.4) score += 1;
    
    // 4. Time since last break (max 2 points)
    const hoursSinceBreak = this.getHoursSinceLastBreak(metrics.observerId);
    if (hoursSinceBreak > 48) score += 2;
    else if (hoursSinceBreak > 24) score += 1;
    
    return Math.min(10, score);
  }

  // Get hours since last break
  private getHoursSinceLastBreak(observerId: string): number {
    const lastBreak = this.lastBreaks.get(observerId);
    if (!lastBreak) return 72; // Default to 72 hours if no break recorded
    
    const now = new Date();
    return (now.getTime() - lastBreak.getTime()) / (1000 * 60 * 60);
  }

  // Force cooldown for high-risk observers
  private triggerFatigueAlert(observerId: string, metrics: ObserverMetrics): void {
    const fatigueScore = this.calculateFatigueScore(metrics);
    
    const alert: LoadAlert = {
      id: crypto.randomUUID(),
      observerId,
      fatigueScore,
      metrics,
      triggeredAt: new Date(),
      action: 'MANDATORY_COOLDOWN'
    };
    
    this.loadAlerts.push(alert);
    
    // Add to cooldown queue
    const duration = this.calculateCooldownDuration(metrics);
    this.cooldownQueue.push({
      observerId,
      startTime: new Date(),
      duration,
      reason: 'high_fatigue_risk'
    });
    
    // Block new assignments during cooldown
    this.blockObserverAssignments(observerId);
  }

  // Calculate cooldown duration based on fatigue
  private calculateCooldownDuration(metrics: ObserverMetrics): number {
    const score = this.calculateFatigueScore(metrics);
    
    if (score >= 9) return 72; // 3 days
    if (score >= 7) return 48; // 2 days
    return 24; // 1 day
  }

  // Block observer from new assignments
  private blockObserverAssignments(observerId: string): void {
    // In production, this would update assignment system
    console.log(`Observer ${observerId} blocked from new assignments`);
  }

  // Redistribute assignments from high-risk to low-risk observers
  public redistributeAssignments(): void {
    const highRiskObservers = Array.from(this.observers.entries())
      .filter(([id, metrics]) => metrics.fatigueRisk === 'high')
      .map(([id]) => id);
    
    const lowRiskObservers = Array.from(this.observers.entries())
      .filter(([id, metrics]) => metrics.fatigueRisk === 'low')
      .map(([id]) => id);
    
    // Redistribute pending tasks
    highRiskObservers.forEach(observerId => {
      const pendingTasks = this.getPendingTasks(observerId);
      
      // Move up to 50% of tasks to low-risk observers
      const tasksToMove = Math.floor(pendingTasks.length * 0.5);
      
      for (let i = 0; i < tasksToMove && lowRiskObservers.length > 0; i++) {
        const targetObserver = lowRiskObservers[i % lowRiskObservers.length];
        this.reassignTask(pendingTasks[i], observerId, targetObserver);
      }
    });
  }

  // Get pending tasks for observer (placeholder)
  private getPendingTasks(observerId: string): string[] {
    // In production, this would query task system
    return [];
  }

  // Reassign task to different observer (placeholder)
  private reassignTask(taskId: string, fromObserver: string, toObserver: string): void {
    // In production, this would update task system
    console.log(`Task ${taskId} reassigned from ${fromObserver} to ${toObserver}`);
  }

  // Get load alerts
  public getLoadAlerts(): LoadAlert[] {
    return this.loadAlerts;
  }

  // Get cooldown queue
  public getCooldownQueue(): CooldownEntry[] {
    return this.cooldownQueue;
  }

  // Calculate resilience score for this layer
  public calculateResilience(): number {
    const highRiskCount = Array.from(this.observers.values())
      .filter(m => m.fatigueRisk === 'high').length;

    const totalObservers = this.observers.size;

    if (totalObservers === 0) return 100;

    const highRiskPercentage = (highRiskCount / totalObservers) * 100;
    return Math.max(0, Math.round(100 - highRiskPercentage * 2)); // Double penalty for high risk
  }

  // UI Component
  public render(): JSX.Element {
    return (
      <div className="oli-dashboard">
        <h3>👁️ Observer Load Index</h3>
        
        <div className="observer-grid">
          <h4>Observer Fatigue Status</h4>
          {Array.from(this.observers.entries()).map(([id, metrics]) => (
            <div key={id} className={`observer-card fatigue-${metrics.fatigueRisk}`}>
              <div className="observer-id">{id}</div>
              <div className="metrics">
                <div>Audits: {metrics.auditsReviewed}</div>
                <div>Correction Rate: {(metrics.correctionRate * 100).toFixed(1)}%</div>
                <div>Contradiction: {(metrics.contradictionExposure * 100).toFixed(1)}%</div>
              </div>
              <div className="risk">Risk: {metrics.fatigueRisk.toUpperCase()}</div>
            </div>
          ))}
        </div>
        
        <div className="cooldown-queue">
          <h4>Active Cooldowns</h4>
          {this.cooldownQueue.length === 0 ? (
            <div className="no-cooldowns">No active cooldowns</div>
          ) : (
            this.cooldownQueue.map((entry, index) => (
              <div key={index} className="cooldown-entry">
                <strong>{entry.observerId}</strong>: Cooling down for {entry.duration} hours
                <div className="reason">{entry.reason}</div>
              </div>
            ))
          )}
        </div>
        
        <div className="load-balancing">
          <h4>Automatic Load Balancing</h4>
          <button onClick={() => this.redistributeAssignments()}>
            Redistribute High-Risk Assignments
          </button>
        </div>
      </div>
    );
  }
}

export default ObserverLoadIndex;
