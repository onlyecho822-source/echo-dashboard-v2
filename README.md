# Echo Dashboard v2.0

**Counter-Intelligence-Resilient Civil System**

> An institutional immune system with anti-capture safeguards that detects when systems stop asking the right questions, prevents single-perspective dominance, identifies delayed consequences, protects analysts from burnout, and ensures the system stays true to its purpose.

[![CI Status](https://github.com/onlyecho822-source/echo-dashboard-v2/workflows/CI/badge.svg)](https://github.com/onlyecho822-source/echo-dashboard-v2/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What Makes This System CI-Resilient

Traditional institutional monitoring systems are **reactive** - they detect problems after they happen. Echo Dashboard v2.0 is **proactive** - it detects capture patterns **during** the process, when they can still be reversed.

**The system cannot be quietly bent because:**

1. **Reasoning Provenance Layer (RPL)** prevents single-framework analytical capture
2. **Question Entropy Monitor (QEM)** detects when critical questions stop being asked
3. **Lagged Outcome Attribution Engine (LOA)** reveals time-shifted beneficiaries
4. **Observer Load Index (OLI)** prevents analyst burnout and cognitive capture
5. **Purpose Drift Sentinel (PDS)** forces recommitment when mission drifts

An attacker would need to defeat **all five layers simultaneously** to capture the system undetected.

---

## Five Invisible Layers

### 1. Reasoning Provenance Layer (RPL)

**Purpose:** Prevent analytical monoculture and lens lock-in

**How It Works:**
- Tracks which analytical frameworks are used in each decision
- Calculates framework dominance (% of analyses using single lens)
- Triggers alerts when dominance exceeds 70%
- Forces framework rotation to maintain analytical diversity

**Example Alert:**
> "Devil Lens Critique accounts for 85% of reasoning weight in last 30 audits. Risk of lens lock-in detected. Forcing RSGD 360 Spiral analysis for next 3 audits."

---

### 2. Question Entropy Monitor (QEM)

**Purpose:** Detect when critical questions stop being asked

**How It Works:**
- Maintains registry of questions asked across domains
- Calculates historical baseline frequency per domain
- Detects entropy gaps (>50% drop in question frequency)
- Auto-generates suppressed questions using LLM

**Example Alert:**
> "Vendor oversight questions dropped 60% in last 4 weeks (10/week → 4/week). Generating missing questions: 'Who audits the auditors?', 'What conflicts of interest exist?'"

---

### 3. Lagged Outcome Attribution Engine (LOA)

**Purpose:** Identify delayed consequences and hidden beneficiaries

**How It Works:**
- Tracks decisions and their outcomes over time
- Correlates beneficiaries with decision dates
- Calculates lag times (days between decision and benefit)
- Assigns risk scores based on lag patterns

**Example Alert:**
> "3 decisions from Q2 2024 show beneficiaries emerging 90+ days later. Pattern suggests delayed attribution obfuscation. Risk score: 8/10."

---

### 4. Observer Load Index (OLI)

**Purpose:** Prevent analyst burnout and cognitive capture

**How It Works:**
- Tracks observer workload (audits reviewed, correction rate, contradiction exposure)
- Calculates fatigue risk score (0-10 scale)
- Triggers mandatory cooldowns when risk exceeds threshold
- Automatically redistributes assignments from high-risk to low-risk observers

**Example Alert:**
> "Observer #3 fatigue risk: HIGH (score 8/10). 22 audits reviewed, 55% correction rate, 48 hours since last break. Triggering 48-hour mandatory cooldown."

---

### 5. Purpose Drift Sentinel (PDS)

**Purpose:** Ensure the system stays true to its original purpose

**How It Works:**
- Maintains registry of original system purposes
- Tracks current usage patterns
- Calculates semantic divergence between intent and usage
- Triggers mandatory pause when divergence exceeds 30%

**Example Alert:**
> "Purpose divergence detected: 42% semantic gap between original intent (institutional decay detection) and current usage (competitive intelligence). System paused. Recommitment required within 7 days."

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm 8+

### Installation

```bash
# Clone repository
git clone https://github.com/onlyecho822-source/echo-dashboard-v2.git
cd echo-dashboard-v2

# Install dependencies
pnpm install

# Set up database
./scripts/setup-database.sh

# Seed initial data
./scripts/seed-data.sh

# Start development server
pnpm dev
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/echo_dashboard
JWT_SECRET=your-secret-key
ADMIN_EMAIL=admin@example.com
```

---

## Architecture

```
echo-dashboard-v2/
├── dashboard/          # Frontend (Next.js + React + TypeScript)
│   └── src/
│       ├── modules/    # Five layer implementations
│       ├── components/ # Shared UI components
│       ├── lib/        # Utilities
│       └── pages/      # Next.js pages
├── api/                # Backend (Node.js + Express + TypeScript)
│   └── src/
│       ├── routes/     # API endpoints
│       ├── middleware/ # Auth, logging
│       ├── services/   # Business logic
│       └── db/         # Database schema & migrations
├── tests/              # Unit + integration tests
├── simulations/        # Red-team pressure tests
├── docs/               # Comprehensive documentation
└── scripts/            # Deployment & maintenance
```

---

## API Endpoints

### Reasoning Provenance Layer
- `POST /api/v2/rpl/track` - Track reasoning frame usage
- `GET /api/v2/rpl/dominance` - Get framework dominance metrics
- `GET /api/v2/rpl/alerts` - Get dominance alerts

### Question Entropy Monitor
- `POST /api/v2/qem/register` - Register question asked
- `GET /api/v2/qem/entropy/:domain` - Get entropy metrics for domain
- `GET /api/v2/qem/missing-questions` - Generate suppressed questions

### Lagged Outcome Attribution
- `POST /api/v2/loa/track-outcome` - Track lagged outcome
- `GET /api/v2/loa/patterns` - Get beneficiary patterns
- `GET /api/v2/loa/risk-scores` - Get risk scores

### Observer Load Index
- `POST /api/v2/oli/update-load` - Update observer workload
- `GET /api/v2/oli/fatigue-status` - Get fatigue status
- `POST /api/v2/oli/redistribute` - Redistribute assignments

### Purpose Drift Sentinel
- `POST /api/v2/pds/track-usage` - Track usage event
- `GET /api/v2/pds/drift-status` - Get drift status
- `POST /api/v2/pds/recommit` - Submit recommitment

### Integrated Resilience
- `GET /api/v2/resilience/score` - Get overall resilience score
- `GET /api/v2/resilience/trends` - Get resilience trends

---

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific layer tests
pnpm test:rpl
pnpm test:qem
pnpm test:loa
pnpm test:oli
pnpm test:pds
```

### Red-Team Simulations

```bash
# Run all simulations
./scripts/run-simulations.sh

# Run specific simulation
pnpm simulate:framework-dominance
pnpm simulate:question-suppression
pnpm simulate:beneficiary-obfuscation
```

---

## Deployment

### Staging

```bash
# Deploy to staging environment
pnpm deploy:staging
```

### Production

```bash
# Create production build
pnpm build

# Deploy to production
pnpm deploy:production
```

---

## Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture Deep Dive](ARCHITECTURE.md)
- [API Reference](docs/api-reference.md)
- [Configuration Guide](docs/configuration.md)
- [Red-Team Simulations](docs/red-team-simulations.md)
- [Deployment Guide](DEPLOYMENT.md)

---

## Monetization Path

**Service Offerings:**

1. **Resilience Audit** ($5,000) - Assess organization's resistance to institutional capture
2. **Missing Questions Workshop** ($2,000) - Identify unasked but critical questions
3. **Analyst Well-being Program** ($3,000) - Implement OLI to prevent burnout
4. **Purpose Alignment Review** ($4,000) - Ensure initiatives stay true to goals

**Year 1 Target:** $100,000 from 10-20 clients (NGOs, foundations, ethical corporations)

---

## Public Doctrine Framing

**For External Communication:**

> "Institutional Immune System with Anti-Capture Safeguards"

**Key Messages:**
1. "Detects when systems stop asking the right questions"
2. "Prevents single-perspective dominance in analysis"
3. "Identifies delayed consequences and hidden beneficiaries"
4. "Protects analysts from burnout and bias"
5. "Ensures the system stays true to its purpose"

**Non-Threatening Language:**
- ✅ "Resilience against institutional capture"
- ✅ "Diversity of analytical perspectives"
- ✅ "Outcome attribution for transparency"

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contact

- **Website:** https://echo-universe.vercel.app/v2
- **Documentation:** https://docs.echo-universe.vercel.app/ci-resilience
- **Issues:** https://github.com/onlyecho822-source/echo-dashboard-v2/issues

---

## Status

**✅ ALL FIVE LAYERS IMPLEMENTED**  
**✅ LIVE DASHBOARD DEPLOYED**  
**✅ SAFE DOCTRINE FRAMING**  
**✅ MONETIZATION PATH DEFINED**  
**✅ PRESSURE SIMULATIONS READY**

**The system is now what serious institutions fear:**

> A transparent, corrigible, purpose-locked system that gets stronger under pressure and cannot be co-opted without detection.

**Access it now:** https://echo-universe.vercel.app/v2
