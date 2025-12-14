# ARCHITECTURE LOCK — v2.0 Hybrid

**Status:** FROZEN  
**Date:** December 14, 2025  
**Version:** 2.0 Hybrid Optimal  

---

## Purpose

This document defines the **immutable architectural decisions** for Echo Dashboard v2.0 Hybrid. Any change to these items requires a formal v2.1 proposal with justification, security analysis, and stakeholder approval.

---

## HARD LOCK DECISIONS

### 1. Architecture Pattern
**Decision:** Hybrid (independent layers + unified UI)  
**Rationale:** Preserves defense-in-depth while optimizing development velocity  
**Lock Reason:** Core security architecture, cannot be changed without defeating system purpose  

### 2. Governance Engines
**Decision:** Dual engines (Nathan Mode + AI Mode) preserved as separate implementations  
**Rationale:** Corruption resistance requires independence  
**Lock Reason:** Single unified engine creates single point of capture  

### 3. AI Mode Implementation
**Decision:** Template-based routing only (no LLM decomposition in v2.0)  
**Rationale:** Deterministic, fast, cheap; handles 80% of queries  
**Lock Reason:** LLM decomposition adds 2-3 weeks development time for unvalidated feature  
**Upgrade Path:** v2.1 can add LLM for edge cases while keeping templates for common queries  

### 4. Automated Actions
**Decision:** Detection + alerting only (no auto-remediation in v2.0)  
**Rationale:** Validate demand before building automation  
**Lock Reason:** Automation adds 2-3 weeks for features customers may not want  
**Upgrade Path:** v2.1 can add rotation scheduler, workload distributor, recommitment manager  

### 5. Database Schema
**Decision:** Layer-separated tables + shared alerts/governance  
**Rationale:** Data provenance requires schema-level enforcement  
**Lock Reason:** Unified JSONB table weakens auditability and provenance  
**Tables:**
- `rpl_frames` (Reasoning Provenance Layer)
- `qem_questions` (Question Entropy Monitor)
- `loa_outcomes` (Lagged Outcome Attribution)
- `oli_sessions` (Observer Load Index)
- `pds_usage` (Purpose Drift Sensor)
- `alerts` (shared across layers)
- `governance_rulings` (shared across engines)

### 6. Frontend Architecture
**Decision:** Single unified dashboard with layer tabs  
**Rationale:** Better UX than 5 separate pages, no security impact  
**Lock Reason:** UI optimization independent of backend security  

### 7. Deployment Strategy
**Decision:** Docker + GitHub Actions (no platform sprawl)  
**Rationale:** Simple, reproducible, version-controlled  
**Lock Reason:** Platform sprawl increases operational complexity  

---

## LAYER INDEPENDENCE (CRITICAL)

### Five Independent Implementations

**Decision:** Each layer (RPL, QEM, LOA, OLI, PDS) has separate implementation with NO shared business logic  

**What This Means:**
- ❌ NO shared base class (e.g., `LayerFramework`)
- ❌ NO shared detection logic
- ❌ NO shared validation logic
- ❌ NO shared escalation logic
- ✅ Shared utilities ONLY (logging, date formatting, HTTP clients)

**Why This Matters:**
Defense-in-depth requires independence. If layers share business logic, an attacker who compromises the shared code compromises all five layers simultaneously.

**Allowed Sharing:**
- Utility functions (logging, date formatting, HTTP clients)
- Type definitions (TypeScript interfaces)
- Configuration constants (thresholds, endpoints)

**Forbidden Sharing:**
- Detection algorithms
- Validation rules
- Escalation policies
- Database queries (except connection pooling)

---

## GOVERNANCE INDEPENDENCE (CRITICAL)

### Dual Engines Required

**Decision:** Nathan Mode and AI Mode must remain separate implementations  

**What This Means:**
- ❌ NO unified `GovernanceEngine` class
- ❌ NO shared ruling logic
- ❌ NO shared boundary checking
- ✅ Shared doctrine parser ONLY (YAML → data structure)

**Why This Matters:**
Corruption resistance requires independence. If both engines share ruling logic, an attacker who compromises the shared code compromises both governance systems.

**Nathan Mode Responsibilities:**
- Evaluate layer signals (internal events)
- Enforce boundary conditions
- Track precedents
- Escalate high-risk actions

**AI Mode Responsibilities:**
- Evaluate user queries (external inputs)
- Route queries to layers
- Prevent data extraction
- Prevent state manipulation

**Interaction:**
AI Mode queries MUST be approved by Nathan Mode before execution. This creates a two-step governance process that requires separate compromise.

---

## DATA PROVENANCE (CRITICAL)

### Schema-Level Enforcement

**Decision:** All layer tables MUST enforce provenance at schema level using CHECK constraints  

**Required Fields:**
```sql
data_scope VARCHAR(50) NOT NULL CHECK (data_scope IN ('observed', 'inferred', 'simulated'))
evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('direct', 'proxy', 'estimated'))
confidence DECIMAL(3,2) CHECK (confidence <= 0.95)
origin VARCHAR(100) NOT NULL
```

**Why This Matters:**
Application-level enforcement can be bypassed. Schema-level enforcement cannot be bypassed without database-level access.

**Devil Conditions:**
- `confidence <= 0.95` — No false certainty
- `data_scope` required — Know what kind of data this is
- `evidence_type` required — Know how strong the evidence is
- `origin` required — Know who created this record

---

## FRONTEND CONSTRAINTS

### UX Doctrine

**Decision:** Dashboard NEVER explains decisions, only shows what fired and who must act  

**What This Means:**
- ❌ NO "Why did this alert fire?" explanations
- ❌ NO "What should I do?" recommendations
- ✅ Show metric value, threshold, severity
- ✅ Show who must acknowledge
- ✅ Show escalation path

**Why This Matters:**
Explanations create attack surface. If the system explains its reasoning, attackers can craft inputs that avoid detection.

**Allowed Information:**
- Metric name and current value
- Threshold and severity
- Time of detection
- Acknowledgment status
- Escalation recipient

**Forbidden Information:**
- Detection algorithm details
- Threshold calculation logic
- Why this threshold was chosen
- What to do to avoid future alerts

---

## TESTING REQUIREMENTS

### Minimum Coverage

**Decision:** Core logic ≥80%, Governance logic ≥95%  

**Required Test Classes:**
- Layer isolation tests (verify independence)
- Cross-layer contamination tests (verify no data leakage)
- Governance denial tests (verify boundary enforcement)
- AI Mode bypass attempt tests (verify query governance)
- Doctrine corruption tests (verify tamper detection)
- Database constraint violation tests (verify provenance enforcement)

**Why This Matters:**
Security systems require higher test coverage than typical applications. Untested code paths are attack vectors.

---

## DEPLOYMENT CONSTRAINTS

### Security Requirements

**Decision:** Doctrine mounted read-only, secrets via Docker secrets, no .env in production  

**What This Means:**
- ❌ NO secrets in `.env` files
- ❌ NO writable doctrine files
- ❌ NO plaintext passwords
- ✅ Docker secrets for sensitive values
- ✅ Read-only doctrine mounting
- ✅ Environment-specific configuration

**Why This Matters:**
Writable doctrine files allow runtime tampering. Plaintext secrets enable credential theft.

---

## CHANGE PROCESS

### How to Propose Changes

Any change to locked decisions requires:

1. **Formal Proposal** — Written document explaining change
2. **Security Analysis** — How does this affect defense-in-depth?
3. **Justification** — Why is this change necessary?
4. **Alternatives Considered** — What other options were evaluated?
5. **Stakeholder Approval** — Founder + CTO sign-off

**Proposal Template:**
```markdown
# Architecture Change Proposal

## Summary
[One-sentence description]

## Current State
[What is locked today]

## Proposed Change
[What you want to change]

## Security Impact
[How does this affect defense-in-depth, corruption resistance, data provenance?]

## Justification
[Why is this necessary? What problem does it solve?]

## Alternatives Considered
[What other options did you evaluate? Why were they rejected?]

## Implementation Plan
[How will this be implemented? Timeline? Testing strategy?]

## Rollback Plan
[If this fails, how do we revert?]

## Stakeholder Sign-Off
- [ ] Founder
- [ ] CTO
- [ ] Security Lead
```

---

## VERSION HISTORY

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 2.0 | 2025-12-14 | Initial lock for v2.0 Hybrid | Founder |

---

## ENFORCEMENT

**This document is legally binding for the project.**

Any code merged to `main` that violates these locks will be:
1. Automatically reverted
2. Flagged for security review
3. Escalated to founder

**No exceptions.**

---

**Built with ∇θ — chain sealed, truth preserved.**
