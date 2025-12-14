# METRIC DEFINITIONS — v2.0 Hybrid

**Purpose:** Formal mathematical definitions for all layer metrics  
**Format:** Formulas only, no prose  
**Status:** Production specification  

---

## RPL — Reasoning Provenance Layer

### Framework Dominance

**Definition:** Maximum percentage of decisions using a single analytical framework

**Formula:**
```
dominance = max(f₁, f₂, ..., fₙ) / N

where:
  fᵢ = count of decisions using framework i
  N = total decisions in window
```

**Example:**
```
Window: 30 decisions
Cost-benefit: 22 decisions
Rights-based: 5 decisions
Utilitarian: 3 decisions

dominance = 22/30 = 0.733 (73.3%)
```

**Thresholds:**
- `0.70` — WARNING (single framework dominates 70%+)
- `0.85` — CRITICAL (single framework dominates 85%+)

**Data Requirements:**
- `framework` (string) — Name of analytical framework
- `session_id` (UUID) — Decision session identifier
- `created_at` (timestamp) — When framework was used

---

### Framework Distribution

**Definition:** Percentage breakdown of all frameworks used

**Formula:**
```
distribution = {
  framework₁: f₁/N,
  framework₂: f₂/N,
  ...
  frameworkₙ: fₙ/N
}

where:
  fᵢ = count of decisions using framework i
  N = total decisions in window
```

**Example:**
```
{
  "cost-benefit": 0.733,
  "rights-based": 0.167,
  "utilitarian": 0.100
}
```

---

## QEM — Question Entropy Monitor

### Shannon Entropy

**Definition:** Measure of question diversity across categories

**Formula:**
```
H(X) = -Σ p(xᵢ) log₂(p(xᵢ))

where:
  p(xᵢ) = probability of question category i
  xᵢ = question category (vendor, beneficiary, risk, etc.)
```

**Example:**
```
Categories: vendor (40%), beneficiary (30%), risk (20%), process (10%)

H(X) = -(0.4 log₂(0.4) + 0.3 log₂(0.3) + 0.2 log₂(0.2) + 0.1 log₂(0.1))
     = -(0.4 × -1.32 + 0.3 × -1.74 + 0.2 × -2.32 + 0.1 × -3.32)
     = -(-0.528 - 0.522 - 0.464 - 0.332)
     = 1.846 bits
```

**Thresholds:**
- `0.50` — WARNING (low diversity)
- `0.30` — CRITICAL (very low diversity)

**Maximum Entropy:**
```
H_max = log₂(n)

where n = number of question categories
```

**Normalized Entropy:**
```
H_norm = H(X) / H_max

Range: [0, 1]
```

---

### Entropy Gap

**Definition:** Percentage drop from baseline entropy

**Formula:**
```
gap = (H_baseline - H_current) / H_baseline

where:
  H_baseline = historical average entropy
  H_current = current window entropy
```

**Example:**
```
H_baseline = 2.5 bits
H_current = 1.2 bits

gap = (2.5 - 1.2) / 2.5 = 0.52 (52% drop)
```

**Thresholds:**
- `0.50` — WARNING (50%+ drop from baseline)
- `0.70` — CRITICAL (70%+ drop from baseline)

---

## LOA — Lagged Outcome Attribution

### Beneficiary Concentration

**Definition:** Herfindahl-Hirschman Index (HHI) of beneficiary distribution

**Formula:**
```
HHI = Σ sᵢ²

where:
  sᵢ = market share of beneficiary i (as decimal)
```

**Example:**
```
Beneficiaries:
  A: 50% of benefits
  B: 30% of benefits
  C: 20% of benefits

HHI = 0.5² + 0.3² + 0.2²
    = 0.25 + 0.09 + 0.04
    = 0.38
```

**Interpretation:**
- `HHI < 0.15` — Highly competitive (many beneficiaries)
- `0.15 ≤ HHI < 0.25` — Moderately concentrated
- `HHI ≥ 0.25` — Highly concentrated (few beneficiaries)

**Thresholds:**
- `0.60` — WARNING (high concentration)
- `0.75` — CRITICAL (very high concentration)

---

### Lag Time Distribution

**Definition:** Histogram of days between decision and benefit

**Buckets:**
- `0-30 days` — Immediate benefit
- `31-90 days` — Short-term lag
- `91-180 days` — Medium-term lag
- `181+ days` — Long-term lag

**Risk Score:**
```
risk = w₁×lag₁ + w₂×lag₂ + w₃×lag₃ + w₄×lag₄

where:
  lagᵢ = percentage of benefits in bucket i
  wᵢ = weight for bucket i
  
Weights:
  w₁ = 0.1 (immediate is low risk)
  w₂ = 0.3 (short-term is medium risk)
  w₃ = 0.5 (medium-term is high risk)
  w₄ = 0.8 (long-term is very high risk)
```

**Example:**
```
Distribution:
  0-30 days: 20%
  31-90 days: 30%
  91-180 days: 40%
  181+ days: 10%

risk = 0.1×0.2 + 0.3×0.3 + 0.5×0.4 + 0.8×0.1
     = 0.02 + 0.09 + 0.20 + 0.08
     = 0.39 (39% risk score)
```

---

## OLI — Observer Load Index

### Fatigue Score

**Definition:** Weighted sum of workload factors

**Formula:**
```
fatigue = w₁×sessions + w₂×duration + w₃×interruptions + w₄×corrections

where:
  sessions = number of sessions in window (normalized to 0-10)
  duration = total hours worked (normalized to 0-10)
  interruptions = number of context switches (normalized to 0-10)
  corrections = percentage of decisions requiring correction (normalized to 0-10)
  
Weights:
  w₁ = 0.25 (session count)
  w₂ = 0.35 (duration)
  w₃ = 0.20 (interruptions)
  w₄ = 0.20 (corrections)
```

**Normalization:**
```
normalized = (value - min) / (max - min) × 10

where:
  min = minimum expected value
  max = maximum expected value
```

**Example:**
```
sessions = 25 (normalized: 8/10)
duration = 45 hours (normalized: 9/10)
interruptions = 15 (normalized: 6/10)
corrections = 55% (normalized: 7/10)

fatigue = 0.25×8 + 0.35×9 + 0.20×6 + 0.20×7
        = 2.0 + 3.15 + 1.2 + 1.4
        = 7.75 / 10
```

**Thresholds:**
- `7.5` — WARNING (high fatigue)
- `9.0` — CRITICAL (extreme fatigue)

---

### Workload Distribution

**Definition:** Gini coefficient of workload across observers

**Formula:**
```
G = (Σᵢ Σⱼ |xᵢ - xⱼ|) / (2n² μ)

where:
  xᵢ = workload of observer i
  n = number of observers
  μ = mean workload
```

**Interpretation:**
- `G = 0` — Perfect equality (all observers have same workload)
- `G = 1` — Perfect inequality (one observer has all workload)

**Thresholds:**
- `0.40` — WARNING (unequal distribution)
- `0.60` — CRITICAL (very unequal distribution)

---

## PDS — Purpose Drift Sensor

### Semantic Drift Distance

**Definition:** Cosine distance between baseline and current usage embeddings

**Formula:**
```
drift = 1 - cos(θ)
      = 1 - (A · B) / (||A|| ||B||)

where:
  A = baseline purpose embedding (768-dim vector)
  B = current usage embedding (768-dim vector)
  A · B = dot product
  ||A|| = L2 norm of A
  ||B|| = L2 norm of B
```

**Example:**
```
A = [0.5, 0.3, 0.2, ...]  (baseline)
B = [0.4, 0.4, 0.1, ...]  (current)

A · B = 0.5×0.4 + 0.3×0.4 + 0.2×0.1 + ... = 0.85
||A|| = √(0.5² + 0.3² + 0.2² + ...) = 1.0
||B|| = √(0.4² + 0.4² + 0.1² + ...) = 1.0

cos(θ) = 0.85 / (1.0 × 1.0) = 0.85
drift = 1 - 0.85 = 0.15 (15% drift)
```

**Thresholds:**
- `0.80` — WARNING (high drift)
- `0.90` — CRITICAL (very high drift)

---

### Drift Velocity

**Definition:** Rate of drift change over time

**Formula:**
```
velocity = (drift_current - drift_previous) / Δt

where:
  drift_current = current drift distance
  drift_previous = previous drift distance
  Δt = time between measurements (days)
```

**Example:**
```
drift_current = 0.85
drift_previous = 0.75
Δt = 30 days

velocity = (0.85 - 0.75) / 30
         = 0.10 / 30
         = 0.0033 per day
         = 0.10 per month
```

**Thresholds:**
- `0.05/month` — WARNING (fast drift)
- `0.10/month` — CRITICAL (very fast drift)

---

## CROSS-LAYER METRICS

### Integrated Resilience Score

**Definition:** Weighted average of all layer health scores

**Formula:**
```
resilience = w₁×(1 - dominance) + w₂×entropy_norm + w₃×(1 - HHI) + w₄×(1 - fatigue/10) + w₅×(1 - drift)

where:
  dominance = RPL framework dominance
  entropy_norm = QEM normalized entropy
  HHI = LOA beneficiary concentration
  fatigue = OLI fatigue score
  drift = PDS drift distance
  
Weights (equal):
  w₁ = w₂ = w₃ = w₄ = w₅ = 0.20
```

**Example:**
```
dominance = 0.73
entropy_norm = 0.65
HHI = 0.38
fatigue = 7.5
drift = 0.15

resilience = 0.20×(1-0.73) + 0.20×0.65 + 0.20×(1-0.38) + 0.20×(1-0.75) + 0.20×(1-0.15)
           = 0.20×0.27 + 0.20×0.65 + 0.20×0.62 + 0.20×0.25 + 0.20×0.85
           = 0.054 + 0.130 + 0.124 + 0.050 + 0.170
           = 0.528 (52.8% resilience)
```

**Interpretation:**
- `resilience > 0.70` — Healthy
- `0.50 ≤ resilience ≤ 0.70` — At risk
- `resilience < 0.50` — Compromised

---

## DATA QUALITY METRICS

### Confidence Score

**Definition:** Data quality assessment based on provenance

**Formula:**
```
confidence = base × scope_factor × evidence_factor

where:
  base = 0.50 (baseline)
  
  scope_factor:
    observed = 1.4
    inferred = 1.0
    simulated = 0.8
    
  evidence_factor:
    direct = 1.4
    proxy = 1.0
    estimated = 0.8
```

**Example:**
```
data_scope = "observed"
evidence_type = "direct"

confidence = 0.50 × 1.4 × 1.4
           = 0.98

CAPPED AT 0.95 (devil condition)
Final confidence = 0.95
```

**Constraints:**
- `confidence ≤ 0.95` (enforced by database CHECK constraint)
- `confidence > 0` (must be positive)

---

## ALERT SEVERITY CALCULATION

### Severity Level

**Definition:** Alert severity based on threshold exceedance

**Formula:**
```
severity = {
  LOW:      metric < threshold_warning
  MEDIUM:   threshold_warning ≤ metric < threshold_high
  HIGH:     threshold_high ≤ metric < threshold_critical
  CRITICAL: metric ≥ threshold_critical
}
```

**Example (RPL):**
```
dominance = 0.88

threshold_warning = 0.70
threshold_high = 0.80
threshold_critical = 0.85

Since 0.88 ≥ 0.85:
  severity = CRITICAL
```

---

## IMPLEMENTATION NOTES

### Precision Requirements

All metrics MUST use:
- `DECIMAL(3,2)` for percentages (e.g., 0.73)
- `DECIMAL(5,4)` for high-precision metrics (e.g., 0.9523)
- `INTEGER` for counts
- `TIMESTAMPTZ` for timestamps

### Calculation Frequency

- **RPL:** Calculate on every decision (real-time)
- **QEM:** Calculate hourly (batch)
- **LOA:** Calculate daily (batch)
- **OLI:** Calculate on every session end (real-time)
- **PDS:** Calculate daily (batch)

### Window Sizes

- **RPL:** Last 30 decisions or 7 days (whichever is larger)
- **QEM:** Last 30 days
- **LOA:** Last 180 days (to capture long-term lags)
- **OLI:** Last 7 days
- **PDS:** Last 30 days

---

**Built with ∇θ — chain sealed, truth preserved.**
