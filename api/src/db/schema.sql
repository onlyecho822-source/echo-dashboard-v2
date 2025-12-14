-- Echo Dashboard v2.0 - Database Schema
-- DEVIL-PROOF DESIGN: Every table includes data_scope, evidence_type, origin
-- NO EXPLANATIONS: Drift is logged as magnitude only, never explained

-- ============================================================================
-- TABLE 1: reasoning_frames
-- Tracks reasoning framework usage for RPL (Reasoning Provenance Layer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reasoning_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework VARCHAR(255) NOT NULL,
  confidence_weight DECIMAL(3,2) NOT NULL CHECK (confidence_weight >= 0 AND confidence_weight <= 0.95), -- Devil Condition 3: Max 0.95
  first_used TIMESTAMP NOT NULL,
  last_used TIMESTAMP NOT NULL,
  decay_rate DECIMAL(5,5) NOT NULL,
  context TEXT,
  alternatives_considered TEXT[],
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  decision_point VARCHAR(255),
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL, -- Who/what created this record
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reasoning_frames_framework ON reasoning_frames(framework);
CREATE INDEX idx_reasoning_frames_user_id ON reasoning_frames(user_id);
CREATE INDEX idx_reasoning_frames_session_id ON reasoning_frames(session_id);
CREATE INDEX idx_reasoning_frames_created_at ON reasoning_frames(created_at DESC);

-- ============================================================================
-- TABLE 2: questions
-- Tracks questions asked for QEM (Question Entropy Monitor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,
  question_text TEXT NOT NULL,
  asked_by VARCHAR(255) NOT NULL,
  asked_at TIMESTAMP NOT NULL,
  answered BOOLEAN DEFAULT FALSE,
  answer_date TIMESTAMP,
  complexity INTEGER CHECK (complexity BETWEEN 1 AND 5),
  sensitivity INTEGER CHECK (sensitivity BETWEEN 1 AND 5),
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_domain ON questions(domain);
CREATE INDEX idx_questions_asked_by ON questions(asked_by);
CREATE INDEX idx_questions_asked_at ON questions(asked_at DESC);

-- ============================================================================
-- TABLE 3: lagged_outcomes
-- Tracks decisions and delayed outcomes for LOA (Lagged Outcome Attribution)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lagged_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id VARCHAR(255) NOT NULL,
  decision_date TIMESTAMP NOT NULL,
  beneficiary VARCHAR(255) NOT NULL,
  benefit_realized_date TIMESTAMP NOT NULL,
  lag_days INTEGER NOT NULL,
  risk_score DECIMAL(3,1) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 10),
  detected_at TIMESTAMP NOT NULL,
  context TEXT,
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lagged_outcomes_decision_id ON lagged_outcomes(decision_id);
CREATE INDEX idx_lagged_outcomes_beneficiary ON lagged_outcomes(beneficiary);
CREATE INDEX idx_lagged_outcomes_lag_days ON lagged_outcomes(lag_days DESC);
CREATE INDEX idx_lagged_outcomes_risk_score ON lagged_outcomes(risk_score DESC);

-- ============================================================================
-- TABLE 4: observer_metrics
-- Tracks observer workload for OLI (Observer Load Index)
-- ============================================================================

CREATE TABLE IF NOT EXISTS observer_metrics (
  observer_id VARCHAR(255) PRIMARY KEY,
  audits_reviewed INTEGER DEFAULT 0,
  correction_rate DECIMAL(3,2) DEFAULT 0 CHECK (correction_rate >= 0 AND correction_rate <= 1),
  contradiction_exposure DECIMAL(3,2) DEFAULT 0 CHECK (contradiction_exposure >= 0 AND contradiction_exposure <= 1),
  fatigue_risk VARCHAR(10) CHECK (fatigue_risk IN ('low', 'medium', 'high', 'critical')),
  last_activity TIMESTAMP,
  concurrent_audits INTEGER DEFAULT 0,
  cooldown_until TIMESTAMP,
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_observer_metrics_fatigue_risk ON observer_metrics(fatigue_risk);
CREATE INDEX idx_observer_metrics_concurrent_audits ON observer_metrics(concurrent_audits DESC);

-- ============================================================================
-- TABLE 5: system_purposes
-- Tracks system purposes for PDS (Purpose Drift Sentinel)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_intent TEXT NOT NULL,
  declared_at TIMESTAMP NOT NULL,
  last_recommitment TIMESTAMP NOT NULL,
  domain VARCHAR(255) NOT NULL,
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_purposes_domain ON system_purposes(domain);
CREATE INDEX idx_system_purposes_declared_at ON system_purposes(declared_at DESC);

-- ============================================================================
-- TABLE 6: usage_events
-- Tracks usage events for PDS drift calculation
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose_id UUID REFERENCES system_purposes(id) ON DELETE CASCADE,
  event_type VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  semantic_vector FLOAT[],
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_events_purpose_id ON usage_events(purpose_id);
CREATE INDEX idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_occurred_at ON usage_events(occurred_at DESC);

-- ============================================================================
-- TABLE 7: drift_alerts
-- Tracks drift alerts (Devil Condition 2: Logged, NOT Explained)
-- ============================================================================

CREATE TABLE IF NOT EXISTS drift_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer VARCHAR(10) NOT NULL CHECK (layer IN ('RPL', 'QEM', 'LOA', 'OLI', 'PDS')),
  drift_magnitude DECIMAL(5,2) NOT NULL, -- Percentage only (0-100)
  threshold_exceeded DECIMAL(5,2) NOT NULL,
  detected_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  
  -- Devil Condition 2: NO EXPLANATION FIELDS
  -- Deliberately omitting: reason, cause, explanation, narrative
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drift_alerts_layer ON drift_alerts(layer);
CREATE INDEX idx_drift_alerts_detected_at ON drift_alerts(detected_at DESC);
CREATE INDEX idx_drift_alerts_drift_magnitude ON drift_alerts(drift_magnitude DESC);

-- ============================================================================
-- TABLE 8: resilience_scores
-- Tracks overall system resilience over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS resilience_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  rpl_score INTEGER CHECK (rpl_score >= 0 AND rpl_score <= 100),
  qem_score INTEGER CHECK (qem_score >= 0 AND qem_score <= 100),
  loa_score INTEGER CHECK (loa_score >= 0 AND loa_score <= 100),
  oli_score INTEGER CHECK (oli_score >= 0 AND oli_score <= 100),
  pds_score INTEGER CHECK (pds_score >= 0 AND pds_score <= 100),
  calculated_at TIMESTAMP NOT NULL,
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resilience_scores_calculated_at ON resilience_scores(calculated_at DESC);
CREATE INDEX idx_resilience_scores_overall_score ON resilience_scores(overall_score DESC);

-- ============================================================================
-- TABLE 9: audit_log
-- Comprehensive audit trail for all system operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_status INTEGER,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Devil Condition 1: Data Scope Enforcement
  data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('inferred', 'observed', 'simulated')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated')),
  origin VARCHAR(255) NOT NULL
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_occurred_at ON audit_log(occurred_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reasoning_frames_updated_at
  BEFORE UPDATE ON reasoning_frames
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_observer_metrics_updated_at
  BEFORE UPDATE ON observer_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Insert default observer for testing
INSERT INTO observer_metrics (
  observer_id,
  audits_reviewed,
  correction_rate,
  contradiction_exposure,
  fatigue_risk,
  last_activity,
  concurrent_audits,
  data_scope,
  evidence_type,
  origin
) VALUES (
  'test-observer-001',
  0,
  0,
  0,
  'low',
  NOW(),
  0,
  'observed',
  'direct',
  'system-initialization'
) ON CONFLICT (observer_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE reasoning_frames IS 'Tracks reasoning framework usage for RPL layer';
COMMENT ON TABLE questions IS 'Tracks questions asked for QEM layer';
COMMENT ON TABLE lagged_outcomes IS 'Tracks decisions and delayed outcomes for LOA layer';
COMMENT ON TABLE observer_metrics IS 'Tracks observer workload for OLI layer';
COMMENT ON TABLE system_purposes IS 'Tracks system purposes for PDS layer';
COMMENT ON TABLE usage_events IS 'Tracks usage events for PDS drift calculation';
COMMENT ON TABLE drift_alerts IS 'Tracks drift alerts (magnitude only, NO explanations)';
COMMENT ON TABLE resilience_scores IS 'Tracks overall system resilience over time';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all system operations';

COMMENT ON COLUMN reasoning_frames.confidence_weight IS 'Capped at 0.95 per Devil Condition 3';
COMMENT ON COLUMN drift_alerts.drift_magnitude IS 'Percentage only - NO explanation fields per Devil Condition 2';
COMMENT ON COLUMN reasoning_frames.data_scope IS 'Devil Condition 1: inferred|observed|simulated';
COMMENT ON COLUMN reasoning_frames.evidence_type IS 'Devil Condition 1: direct|proxy|estimated';
COMMENT ON COLUMN reasoning_frames.origin IS 'Devil Condition 1: Who/what created this record';
