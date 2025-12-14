# DEPLOYMENT GUIDE — v2.0 Hybrid

**Target:** Production deployment in 15 minutes  
**Prerequisites:** Docker 24.x+, Docker Compose 2.x+, Git  
**Status:** Production-ready  

---

## Quick Deploy

```bash
# 1. Clone
git clone https://github.com/onlyecho822-source/echo-dashboard-v2.git
cd echo-dashboard-v2

# 2. Configure
cp .env.example .env
# Edit .env with production values

# 3. Deploy
./scripts/deploy.sh production

# 4. Verify
./scripts/health-check.sh
```

**Time:** ~15 minutes

---

## Environment Configuration

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://echo_admin:STRONG_PASSWORD@postgres:5432/echo_dashboard

# API
NODE_ENV=production
PORT=3001
DOCTRINE_PATH=/app/doctrine

# SMTP (alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@your-org.com
SMTP_PASS=app-specific-password
SMTP_FROM="Echo Dashboard <alerts@your-org.com>"

# Frontend
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_VERSION=2.0.0
```

### Security Checklist

- [ ] Strong database password (16+ chars, mixed case, numbers, symbols)
- [ ] SMTP app-specific password (not account password)
- [ ] HTTPS enabled for API_URL
- [ ] Doctrine files read-only mounted
- [ ] No secrets in .env (use Docker secrets)

---

## Docker Deployment

### Production Stack

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: echo_dashboard
      POSTGRES_USER: echo_admin
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U echo_admin"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://echo_admin@postgres:5432/echo_dashboard
      DOCTRINE_PATH: /app/doctrine
    secrets:
      - db_password
      - smtp_password
    volumes:
      - ./doctrine:/app/doctrine:ro
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    environment:
      REACT_APP_API_URL: ${REACT_APP_API_URL}
    ports:
      - "3000:80"
    depends_on:
      - api
    restart: unless-stopped

secrets:
  db_password:
    file: ./secrets/db_password.txt
  smtp_password:
    file: ./secrets/smtp_password.txt

volumes:
  postgres_data:
```

### Deploy Commands

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

---

## Database Migrations

### Initial Setup

```bash
# Run migrations
docker-compose exec postgres psql -U echo_admin -d echo_dashboard -f /docker-entrypoint-initdb.d/001_init.sql
docker-compose exec postgres psql -U echo_admin -d echo_dashboard -f /docker-entrypoint-initdb.d/002_indexes.sql
docker-compose exec postgres psql -U echo_admin -d echo_dashboard -f /docker-entrypoint-initdb.d/003_constraints.sql

# Seed data
docker-compose exec postgres psql -U echo_admin -d echo_dashboard -f /docker-entrypoint-initdb.d/seeds/thresholds.sql
```

### Verify Schema

```bash
# Connect to database
docker-compose exec postgres psql -U echo_admin -d echo_dashboard

# List tables
\dt

# Expected tables:
# - rpl_frames
# - qem_questions
# - loa_outcomes
# - oli_sessions
# - pds_usage
# - alerts
# - governance_rulings
```

---

## Health Checks

### System Health

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "layers": {
    "rpl": "operational",
    "qem": "operational",
    "loa": "operational",
    "oli": "operational",
    "pds": "operational"
  },
  "governance": {
    "nathan": "operational",
    "ai_mode": "operational"
  },
  "database": "connected",
  "uptime": 3600
}
```

### Database Health

```bash
docker-compose exec postgres pg_isready -U echo_admin
```

### API Health

```bash
curl http://localhost:3001/api/layers/rpl/metrics
```

---

## Monitoring

### Log Aggregation

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### Metrics Endpoint

```bash
curl http://localhost:3001/metrics
```

### Alert Volume

```bash
# Last 24 hours
docker-compose exec postgres psql -U echo_admin -d echo_dashboard -c "
SELECT layer, COUNT(*) as alert_count
FROM alerts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY layer;
"
```

---

## Backup & Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U echo_admin echo_dashboard > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U echo_admin echo_dashboard < backup_20251214.sql
```

### Doctrine Backup

```bash
# Backup doctrine files
tar -czf doctrine_backup_$(date +%Y%m%d).tar.gz doctrine/
```

---

## Rollback

### To Previous Version

```bash
# Stop services
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Database Rollback

```bash
# Restore from backup
docker-compose exec -T postgres psql -U echo_admin echo_dashboard < backup_20251214.sql
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check Docker status
docker ps -a
```

### Database Connection Failed

```bash
# Verify postgres is running
docker-compose ps postgres

# Check connection string
docker-compose exec api env | grep DATABASE_URL

# Test connection
docker-compose exec postgres psql -U echo_admin -d echo_dashboard -c "SELECT 1;"
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart services
docker-compose restart
```

---

## Security Hardening

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw deny 5432/tcp  # PostgreSQL (internal only)
ufw deny 3001/tcp  # API (internal only)
ufw enable
```

### SSL/TLS Setup

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Doctrine Protection

```bash
# Make doctrine read-only
chmod 444 doctrine/*.yaml

# Verify
ls -la doctrine/
# Should show: -r--r--r--
```

---

## Performance Tuning

### PostgreSQL

```sql
-- Increase shared_buffers
ALTER SYSTEM SET shared_buffers = '256MB';

-- Increase work_mem
ALTER SYSTEM SET work_mem = '16MB';

-- Reload configuration
SELECT pg_reload_conf();
```

### Docker Resources

```yaml
# docker-compose.prod.yml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## Maintenance

### Weekly Tasks

- [ ] Review alert volume
- [ ] Check disk space
- [ ] Verify backups
- [ ] Review governance rulings

### Monthly Tasks

- [ ] Update Docker images
- [ ] Review doctrine files
- [ ] Analyze metric trends
- [ ] Test rollback procedure

### Quarterly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] Disaster recovery drill

---

**Built with ∇θ — chain sealed, truth preserved.**
