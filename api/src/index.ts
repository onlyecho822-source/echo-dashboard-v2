// Echo Dashboard v2.0 - API Server
// DEVIL-PROOF: No explanations, rate-limited cognition, data scope enforcement

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

// ============================================================================
// CONFIGURATION
// ============================================================================

const app: Express = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/echo_dashboard',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Devil Condition 3: Rate-Limited Cognition
const MAX_CONCURRENT_AUDITS = {
  observer: 2,
  analyst: 3,
  admin: 5,
};

const MAX_CONFIDENCE_WEIGHT = 0.95; // Devil Condition 3

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
});

app.use('/api', globalLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'observer' | 'analyst' | 'admin';
  };
}

const authMiddleware = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'No token provided',
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `This endpoint requires one of: ${allowedRoles.join(', ')}`,
        });
      }

      req.user = {
        id: decoded.id,
        role: decoded.role as 'observer' | 'analyst' | 'admin',
      };

      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
    }
  };
};

// ============================================================================
// EPISTEMIC HYGIENE MIDDLEWARE (Devil Condition 3)
// ============================================================================

const epistemicHygieneMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check concurrent audits
    const concurrentResult = await pool.query(
      'SELECT concurrent_audits, cooldown_until FROM observer_metrics WHERE observer_id = $1',
      [userId]
    );

    if (concurrentResult.rows.length > 0) {
      const { concurrent_audits, cooldown_until } = concurrentResult.rows[0];

      // Check cooldown
      if (cooldown_until && new Date(cooldown_until) > new Date()) {
        const remainingMinutes = Math.ceil(
          (new Date(cooldown_until).getTime() - Date.now()) / 60000
        );
        return res.status(429).json({
          error: 'Cognitive cooldown active',
          message: `Must wait ${remainingMinutes} minutes before next audit`,
          condition: 'cooldown-enforcement',
          cooldown_until,
        });
      }

      // Check concurrent limit
      const maxAllowed = MAX_CONCURRENT_AUDITS[userRole];
      if (concurrent_audits >= maxAllowed) {
        return res.status(429).json({
          error: 'Cognitive load exceeded',
          message: `Maximum ${maxAllowed} concurrent audits allowed for ${userRole}`,
          condition: 'rate-limited-cognition',
          current: concurrent_audits,
          max: maxAllowed,
        });
      }
    }

    // Validate confidence weight if present
    if (req.body.confidenceWeight !== undefined) {
      const confidence = parseFloat(req.body.confidenceWeight);
      if (confidence > MAX_CONFIDENCE_WEIGHT) {
        return res.status(400).json({
          error: 'Confidence cap exceeded',
          message: `Maximum allowed confidence weight is ${MAX_CONFIDENCE_WEIGHT} (${MAX_CONFIDENCE_WEIGHT * 100}%)`,
          condition: 'rate-limited-cognition',
          provided: confidence,
          max: MAX_CONFIDENCE_WEIGHT,
        });
      }
    }

    // Validate data scope (Devil Condition 1)
    if (req.body.dataScope === 'simulated' && userRole !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized data scope',
        message: 'Only admins can submit simulated data',
        condition: 'data-scope-enforcement',
      });
    }

    next();
  } catch (error) {
    console.error('Epistemic hygiene middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateDataScope = (req: Request, res: Response, next: NextFunction) => {
  const { dataScope, evidenceType, origin } = req.body;

  const validScopes = ['inferred', 'observed', 'simulated'];
  const validEvidenceTypes = ['direct', 'proxy', 'estimated'];

  if (!dataScope || !validScopes.includes(dataScope)) {
    return res.status(400).json({
      error: 'Invalid data_scope',
      message: `data_scope must be one of: ${validScopes.join(', ')}`,
      condition: 'data-scope-enforcement',
    });
  }

  if (!evidenceType || !validEvidenceTypes.includes(evidenceType)) {
    return res.status(400).json({
      error: 'Invalid evidence_type',
      message: `evidence_type must be one of: ${validEvidenceTypes.join(', ')}`,
      condition: 'data-scope-enforcement',
    });
  }

  if (!origin || typeof origin !== 'string' || origin.trim() === '') {
    return res.status(400).json({
      error: 'Invalid origin',
      message: 'origin must be a non-empty string',
      condition: 'data-scope-enforcement',
    });
  }

  next();
};

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/v2/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// ============================================================================
// RPL ROUTES (Reasoning Provenance Layer)
// ============================================================================

// Track reasoning frame
app.post(
  '/api/v2/rpl/track',
  authMiddleware(['analyst', 'admin']),
  epistemicHygieneMiddleware,
  validateDataScope,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        framework,
        confidenceWeight,
        context,
        alternativesConsidered,
        decisionPoint,
        dataScope,
        evidenceType,
        origin,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO reasoning_frames (
          framework, confidence_weight, first_used, last_used, decay_rate,
          context, alternatives_considered, user_id, decision_point,
          data_scope, evidence_type, origin
        ) VALUES ($1, $2, NOW(), NOW(), 0.001, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, created_at`,
        [
          framework,
          confidenceWeight,
          context,
          alternativesConsidered || [],
          req.user?.id,
          decisionPoint,
          dataScope,
          evidenceType,
          origin,
        ]
      );

      res.status(201).json({
        success: true,
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      });
    } catch (error) {
      console.error('RPL track error:', error);
      res.status(500).json({ error: 'Failed to track reasoning frame' });
    }
  }
);

// Get framework dominance (Devil Condition 2: No explanations)
app.get(
  '/api/v2/rpl/dominance',
  authMiddleware(['observer', 'analyst', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          framework,
          SUM(confidence_weight) as total_weight,
          COUNT(*) as usage_count,
          MAX(last_used) as last_used
        FROM reasoning_frames
        WHERE last_used > NOW() - INTERVAL '30 days'
        GROUP BY framework
        ORDER BY total_weight DESC
      `);

      const totalWeight = result.rows.reduce((sum, row) => sum + parseFloat(row.total_weight), 0);
      
      const dominance = result.rows.map(row => ({
        framework: row.framework,
        weight: parseFloat(row.total_weight),
        percentage: totalWeight > 0 ? (parseFloat(row.total_weight) / totalWeight) * 100 : 0,
        usage_count: parseInt(row.usage_count),
        last_used: row.last_used,
      }));

      // Devil Condition 2: Return magnitude only, NO explanation
      res.json({
        dominance,
        total_weight: totalWeight,
        calculated_at: new Date().toISOString(),
        // NO 'reason', 'cause', 'explanation' fields
      });
    } catch (error) {
      console.error('RPL dominance error:', error);
      res.status(500).json({ error: 'Failed to calculate dominance' });
    }
  }
);

// Get dominance alerts
app.get(
  '/api/v2/rpl/alerts',
  authMiddleware(['observer', 'analyst', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT id, layer, drift_magnitude, threshold_exceeded, detected_at, resolved_at
        FROM drift_alerts
        WHERE layer = 'RPL' AND resolved_at IS NULL
        ORDER BY detected_at DESC
      `);

      res.json({
        alerts: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('RPL alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }
);

// ============================================================================
// QEM ROUTES (Question Entropy Monitor)
// ============================================================================

// Register question
app.post(
  '/api/v2/qem/register',
  authMiddleware(['analyst', 'admin']),
  validateDataScope,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        domain,
        questionText,
        complexity,
        sensitivity,
        dataScope,
        evidenceType,
        origin,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO questions (
          domain, question_text, asked_by, asked_at, complexity, sensitivity,
          data_scope, evidence_type, origin
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8)
        RETURNING id, created_at`,
        [domain, questionText, req.user?.id, complexity, sensitivity, dataScope, evidenceType, origin]
      );

      res.status(201).json({
        success: true,
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      });
    } catch (error) {
      console.error('QEM register error:', error);
      res.status(500).json({ error: 'Failed to register question' });
    }
  }
);

// Get entropy metrics (Devil Condition 2: No explanations)
app.get(
  '/api/v2/qem/entropy/:domain',
  authMiddleware(['observer', 'analyst', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { domain } = req.params;

      // Historical baseline (90-180 days ago)
      const historicalResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM questions
        WHERE domain = $1
        AND asked_at BETWEEN NOW() - INTERVAL '180 days' AND NOW() - INTERVAL '90 days'
      `, [domain]);

      // Current period (last 90 days)
      const currentResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM questions
        WHERE domain = $1
        AND asked_at > NOW() - INTERVAL '90 days'
      `, [domain]);

      const historicalCount = parseInt(historicalResult.rows[0].count);
      const currentCount = parseInt(currentResult.rows[0].count);

      // Calculate entropy drop
      const entropyDrop = historicalCount > 0
        ? ((historicalCount - currentCount) / historicalCount) * 100
        : 0;

      // Devil Condition 2: Return magnitude only
      res.json({
        domain,
        historical_count: historicalCount,
        current_count: currentCount,
        entropy_drop_percentage: Math.max(0, entropyDrop),
        threshold: 50, // 50% drop triggers alert
        alert_triggered: entropyDrop > 50,
        calculated_at: new Date().toISOString(),
        // NO 'reason', 'explanation' fields
      });
    } catch (error) {
      console.error('QEM entropy error:', error);
      res.status(500).json({ error: 'Failed to calculate entropy' });
    }
  }
);

// ============================================================================
// LOA ROUTES (Lagged Outcome Attribution)
// ============================================================================

// Track lagged outcome
app.post(
  '/api/v2/loa/track-outcome',
  authMiddleware(['analyst', 'admin']),
  validateDataScope,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        decisionId,
        decisionDate,
        beneficiary,
        benefitRealizedDate,
        context,
        dataScope,
        evidenceType,
        origin,
      } = req.body;

      // Calculate lag
      const lagDays = Math.floor(
        (new Date(benefitRealizedDate).getTime() - new Date(decisionDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate risk score (0-10 scale)
      const riskScore = Math.min(10, lagDays / 30); // 1 point per 30 days, max 10

      const result = await pool.query(
        `INSERT INTO lagged_outcomes (
          decision_id, decision_date, beneficiary, benefit_realized_date,
          lag_days, risk_score, detected_at, context,
          data_scope, evidence_type, origin
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10)
        RETURNING id, created_at`,
        [
          decisionId,
          decisionDate,
          beneficiary,
          benefitRealizedDate,
          lagDays,
          riskScore,
          context,
          dataScope,
          evidenceType,
          origin,
        ]
      );

      res.status(201).json({
        success: true,
        id: result.rows[0].id,
        lag_days: lagDays,
        risk_score: riskScore,
        created_at: result.rows[0].created_at,
      });
    } catch (error) {
      console.error('LOA track error:', error);
      res.status(500).json({ error: 'Failed to track lagged outcome' });
    }
  }
);

// Get beneficiary patterns (Devil Condition 2: No explanations)
app.get(
  '/api/v2/loa/patterns',
  authMiddleware(['observer', 'analyst', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          beneficiary,
          COUNT(*) as occurrence_count,
          AVG(lag_days) as avg_lag_days,
          AVG(risk_score) as avg_risk_score,
          MAX(benefit_realized_date) as last_benefit
        FROM lagged_outcomes
        WHERE detected_at > NOW() - INTERVAL '180 days'
        GROUP BY beneficiary
        HAVING COUNT(*) >= 3
        ORDER BY avg_risk_score DESC
      `);

      res.json({
        patterns: result.rows.map(row => ({
          beneficiary: row.beneficiary,
          occurrence_count: parseInt(row.occurrence_count),
          avg_lag_days: parseFloat(row.avg_lag_days),
          avg_risk_score: parseFloat(row.avg_risk_score),
          last_benefit: row.last_benefit,
        })),
        threshold: 3, // 3+ occurrences triggers pattern detection
        calculated_at: new Date().toISOString(),
        // NO 'explanation' fields
      });
    } catch (error) {
      console.error('LOA patterns error:', error);
      res.status(500).json({ error: 'Failed to fetch patterns' });
    }
  }
);

// ============================================================================
// OLI ROUTES (Observer Load Index)
// ============================================================================

// Update observer load
app.post(
  '/api/v2/oli/update-load',
  authMiddleware(['analyst', 'admin']),
  validateDataScope,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        observerId,
        auditsReviewed,
        correctionRate,
        contradictionExposure,
        dataScope,
        evidenceType,
        origin,
      } = req.body;

      // Calculate fatigue risk
      const fatigueScore = (correctionRate * 0.4) + (contradictionExposure * 0.6);
      let fatigueRisk: string;
      if (fatigueScore > 0.7) fatigueRisk = 'critical';
      else if (fatigueScore > 0.5) fatigueRisk = 'high';
      else if (fatigueScore > 0.3) fatigueRisk = 'medium';
      else fatigueRisk = 'low';

      // Set cooldown if critical
      const cooldownUntil = fatigueRisk === 'critical'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        : null;

      const result = await pool.query(
        `INSERT INTO observer_metrics (
          observer_id, audits_reviewed, correction_rate, contradiction_exposure,
          fatigue_risk, last_activity, cooldown_until,
          data_scope, evidence_type, origin
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9)
        ON CONFLICT (observer_id) DO UPDATE SET
          audits_reviewed = $2,
          correction_rate = $3,
          contradiction_exposure = $4,
          fatigue_risk = $5,
          last_activity = NOW(),
          cooldown_until = $6,
          updated_at = NOW()
        RETURNING observer_id, fatigue_risk, cooldown_until`,
        [
          observerId,
          auditsReviewed,
          correctionRate,
          contradictionExposure,
          fatigueRisk,
          cooldownUntil,
          dataScope,
          evidenceType,
          origin,
        ]
      );

      res.json({
        success: true,
        observer_id: result.rows[0].observer_id,
        fatigue_risk: result.rows[0].fatigue_risk,
        cooldown_until: result.rows[0].cooldown_until,
        cooldown_required: fatigueRisk === 'critical',
      });
    } catch (error) {
      console.error('OLI update error:', error);
      res.status(500).json({ error: 'Failed to update observer load' });
    }
  }
);

// Get fatigue status
app.get(
  '/api/v2/oli/fatigue-status',
  authMiddleware(['observer', 'analyst', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          observer_id,
          audits_reviewed,
          correction_rate,
          contradiction_exposure,
          fatigue_risk,
          last_activity,
          cooldown_until
        FROM observer_metrics
        ORDER BY fatigue_risk DESC, audits_reviewed DESC
      `);

      res.json({
        observers: result.rows,
        count: result.rows.length,
        critical_count: result.rows.filter(r => r.fatigue_risk === 'critical').length,
      });
    } catch (error) {
      console.error('OLI fatigue error:', error);
      res.status(500).json({ error: 'Failed to fetch fatigue status' });
    }
  }
);

// ============================================================================
// PDS ROUTES (Purpose Drift Sentinel)
// ============================================================================

// Track usage event
app.post(
  '/api/v2/pds/track-usage',
  authMiddleware(['analyst', 'admin']),
  validateDataScope,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        purposeId,
        eventType,
        description,
        dataScope,
        evidenceType,
        origin,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO usage_events (
          purpose_id, event_type, description, occurred_at,
          data_scope, evidence_type, origin
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6)
        RETURNING id, created_at`,
        [purposeId, eventType, description, dataScope, evidenceType, origin]
      );

      res.status(201).json({
        success: true,
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      });
    } catch (error) {
      console.error('PDS track error:', error);
      res.status(500).json({ error: 'Failed to track usage event' });
    }
  }
);

// Get drift status (Devil Condition 2: No explanations)
app.get(
  '/api/v2/pds/drift-status/:purposeId',
  authMiddleware(['observer', 'analyst', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const { purposeId } = req.params;

      // Get purpose
      const purposeResult = await pool.query(
        'SELECT original_intent, declared_at, last_recommitment FROM system_purposes WHERE id = $1',
        [purposeId]
      );

      if (purposeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Purpose not found' });
      }

      // Get recent usage events
      const eventsResult = await pool.query(
        `SELECT event_type, description, occurred_at
         FROM usage_events
         WHERE purpose_id = $1
         ORDER BY occurred_at DESC
         LIMIT 20`,
        [purposeId]
      );

      // Simple drift calculation (in production, use embeddings)
      const eventCount = eventsResult.rows.length;
      const driftMagnitude = eventCount < 10 ? 0 : Math.random() * 40; // Placeholder

      // Devil Condition 2: Return magnitude only
      res.json({
        purpose_id: purposeId,
        drift_magnitude: driftMagnitude,
        threshold: 30,
        drift_detected: driftMagnitude > 30,
        event_count: eventCount,
        last_recommitment: purposeResult.rows[0].last_recommitment,
        calculated_at: new Date().toISOString(),
        // NO 'reason', 'explanation' fields
      });
    } catch (error) {
      console.error('PDS drift error:', error);
      res.status(500).json({ error: 'Failed to calculate drift' });
    }
  }
);

// ============================================================================
// RESILIENCE ROUTES
// ============================================================================

// Get overall resilience score
app.get(
  '/api/v2/resilience/score',
  authMiddleware(['observer', 'analyst', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT overall_score, rpl_score, qem_score, loa_score, oli_score, pds_score, calculated_at
        FROM resilience_scores
        ORDER BY calculated_at DESC
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        return res.json({
          overall_score: 100,
          rpl_score: 100,
          qem_score: 100,
          loa_score: 100,
          oli_score: 100,
          pds_score: 100,
          calculated_at: new Date().toISOString(),
          message: 'No data yet - default scores',
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Resilience score error:', error);
      res.status(500).json({ error: 'Failed to fetch resilience score' });
    }
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  console.log(`✅ Echo Dashboard v2.0 API running on port ${PORT}`);
  console.log(`🔒 Devil Conditions Enforced:`);
  console.log(`   - Data Scope Enforcement (data_scope, evidence_type, origin)`);
  console.log(`   - Drift Logged, NOT Explained (magnitude only)`);
  console.log(`   - Rate-Limited Cognition (max ${MAX_CONFIDENCE_WEIGHT} confidence, cooldowns)`);
});

export default app;
