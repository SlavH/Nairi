# Backup and Recovery Procedures

## Overview

This document outlines backup strategies, recovery procedures, and disaster recovery plans for the Nairi application.

## Database Backups

### Supabase Automated Backups

Supabase provides automated daily backups:

- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 7 days (Free), 30 days (Pro), 90 days (Enterprise)
- **Location**: Encrypted storage in the same region as your database

### Manual Backup Procedure

```bash
# Export database schema
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  > schema_backup_$(date +%Y%m%d).sql

# Export data
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  > data_backup_$(date +%Y%m%d).sql

# Full backup
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  > full_backup_$(date +%Y%m%d).sql
```

### Backup Verification

```bash
# Test restore to a temporary database
psql -h db.your-project.supabase.co \
  -U postgres \
  -d test_restore \
  < full_backup_20260205.sql

# Verify data integrity
psql -h db.your-project.supabase.co \
  -U postgres \
  -d test_restore \
  -c "SELECT COUNT(*) FROM profiles;"
```

## File Storage Backups

### Supabase Storage

User-uploaded files are stored in Supabase Storage:

```bash
# Backup storage bucket
supabase storage download \
  --bucket user-uploads \
  --destination ./backups/storage/$(date +%Y%m%d)
```

### Automated Storage Backup Script

```bash
#!/bin/bash
# backup-storage.sh

BACKUP_DIR="./backups/storage/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Download all buckets
for bucket in user-uploads templates marketplace; do
  supabase storage download \
    --bucket "$bucket" \
    --destination "$BACKUP_DIR/$bucket"
done

# Compress backup
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

## Application Code Backups

### Git Repository

Code is version-controlled in Git:

- **Primary**: GitHub repository
- **Mirror**: GitLab (optional)
- **Local**: Developer machines

### Environment Variables

```bash
# Backup environment variables (encrypted)
cp .env .env.backup.$(date +%Y%m%d)
gpg --encrypt --recipient admin@nairi.ai .env.backup.$(date +%Y%m%d)
```

## Recovery Procedures

### Database Recovery

#### Point-in-Time Recovery (PITR)

Supabase Pro and Enterprise support PITR:

1. Go to Supabase Dashboard
2. Navigate to Database > Backups
3. Select "Point-in-Time Recovery"
4. Choose the timestamp to restore to
5. Confirm restoration

#### Manual Recovery from Backup

```bash
# Restore from backup file
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  < full_backup_20260205.sql

# Verify restoration
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) FROM profiles;"
```

### Storage Recovery

```bash
# Extract backup
tar -xzf backups/storage/20260205.tar.gz

# Upload to Supabase Storage
for file in backups/storage/20260205/user-uploads/*; do
  supabase storage upload \
    --bucket user-uploads \
    --file "$file"
done
```

### Application Recovery

```bash
# Clone repository
git clone https://github.com/your-org/nairi.git
cd nairi

# Checkout specific version
git checkout v1.2.3

# Restore environment variables
gpg --decrypt .env.backup.20260205.gpg > .env

# Install dependencies
npm install

# Build and deploy
npm run build
vercel --prod
```

## Disaster Recovery Plan

### RTO and RPO

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

### Disaster Scenarios

#### Scenario 1: Database Corruption

1. **Detection**: Monitoring alerts or user reports
2. **Assessment**: Identify extent of corruption (5-15 minutes)
3. **Recovery**: Restore from latest backup (30-60 minutes)
4. **Verification**: Test critical functions (15-30 minutes)
5. **Communication**: Notify users of any data loss

**Total Time**: 1-2 hours

#### Scenario 2: Complete Data Center Failure

1. **Detection**: Monitoring alerts (immediate)
2. **Failover**: Switch to backup region (15-30 minutes)
3. **Database**: Restore from geo-replicated backup (30-60 minutes)
4. **Storage**: Sync from backup location (1-2 hours)
5. **Verification**: Full system test (30-60 minutes)
6. **DNS Update**: Point to new region (5-15 minutes)

**Total Time**: 3-4 hours

#### Scenario 3: Accidental Data Deletion

1. **Detection**: User report or audit log (immediate)
2. **Assessment**: Identify deleted data (5-10 minutes)
3. **Recovery**: PITR to before deletion (15-30 minutes)
4. **Verification**: Confirm data restored (10-15 minutes)

**Total Time**: 30-60 minutes

### Emergency Contacts

- **Database Admin**: db-admin@nairi.ai
- **DevOps Lead**: devops@nairi.ai
- **Supabase Support**: support@supabase.io
- **On-Call Engineer**: +1-XXX-XXX-XXXX

## Backup Schedule

| Backup Type | Frequency | Retention | Automated |
|-------------|-----------|-----------|----------|
| Database (Full) | Daily | 30 days | Yes |
| Database (Incremental) | Hourly | 7 days | Yes |
| Storage Files | Daily | 30 days | Yes |
| Environment Config | Weekly | 90 days | Manual |
| Code Repository | Continuous | Indefinite | Yes |

## Testing

### Backup Testing Schedule

- **Monthly**: Restore test database from backup
- **Quarterly**: Full disaster recovery drill
- **Annually**: Complete system recovery test

### Backup verification (scheduled or post-deploy)

1. Restore the latest backup to a staging or temporary database (e.g. `psql $STAGING_DATABASE_URL < full_backup_YYYYMMDD.sql`).
2. Run smoke queries (e.g. `SELECT COUNT(*) FROM profiles;`, `SELECT COUNT(*) FROM creations;`).
3. Optionally run a minimal app against the restored DB and hit `GET /api/health/readiness`.
4. Document the result; alert if restore fails or data looks inconsistent.

### Test Checklist

- [ ] Database backup can be restored
- [ ] Storage files are accessible
- [ ] Application builds successfully
- [ ] All environment variables are backed up
- [ ] Recovery time meets RTO
- [ ] Data loss is within RPO
- [ ] Documentation is up to date

## Monitoring

### Backup Monitoring

```javascript
// Monitor backup status
const checkBackupStatus = async () => {
  const lastBackup = await getLastBackupTime()
  const hoursSinceBackup = (Date.now() - lastBackup) / (1000 * 60 * 60)
  
  if (hoursSinceBackup > 25) {
    await sendAlert('Backup overdue', 'critical')
  }
}
```

### Alerts

- Backup failure
- Backup older than 25 hours
- Storage usage > 80%
- Backup verification failed

## Data retention

Document retention for key tables (adjust per compliance):

- **audit_log**: Retain per compliance (e.g. 90 days); only service role or owning user can read. Use for login, billing, data export, account delete.
- **usage_logs**: Retain for billing and analytics (e.g. 24 months); aggregate or anonymize older data if needed.
- **activity_logs**: Retain per product needs (e.g. 90 days); RLS restricts to owning user.

**Export my data / Delete my account:** Call [lib/audit.ts](../lib/audit.ts) (or equivalent) before performing the action; document in SECURITY.md or compliance docs when implemented.

## Compliance

- **GDPR**: User data can be exported and deleted
- **SOC 2**: Encrypted backups with access logs
- **HIPAA**: (If applicable) Encrypted backups with audit trail

## Runbooks

Quick links: [Deploy to staging](#runbook-deploy-to-staging) | [Promote to production](#runbook-promote-to-production) | [High load](#runbook-high-load) | [Dependency failure](#runbook-dependency-failure)

### Runbook: Deploy to staging

1. Push to staging branch or open a PR targeting `main` (or your staging branch).
2. Vercel (or your CI) builds and deploys a preview URL.
3. Run E2E against the preview URL if configured in CI.
4. Verify critical flows: health, login, one create/chat flow, marketplace list.
5. Check env parity: staging uses same env var names as production but different secrets (no production keys in staging).

### Runbook: Promote to production

1. Merge approved changes to `main` (or trigger production deploy from dashboard).
2. Vercel auto-deploys production (or run your production deploy pipeline).
3. Monitor health: `GET /api/health` and `GET /api/health/readiness` should return 200.
4. Monitor error rates and latency in Sentry or your platform for 15–30 minutes.
5. If issues occur, follow [Rollback](#rollback) or [Dependency failure](#runbook-dependency-failure) as applicable.

### Runbook: High load

1. Check rate limits and Redis (if `REDIS_URL` is set); ensure limits are not too low for legitimate traffic.
2. Scale horizontally (Vercel scales automatically; for other platforms, add instances).
3. Enable or extend caching for read-heavy routes (marketplace, learn list, health).
4. If necessary, degrade non-critical features (e.g. disable heavy AI features temporarily) and communicate status.
5. Document incident and review SLOs; see [Load testing and resilience](#load-testing-and-resilience).

### Runbook: Dependency failure

1. **AI / Stripe / Supabase down**: Return 503 with `Retry-After` where applicable; use fallback AI providers if configured.
2. **Database unreachable**: Readiness returns 503; do not send traffic to the app until DB is back. Check Supabase status and connection string (use transaction pooler port 6543).
3. **Stripe webhook failing**: Verify `STRIPE_WEBHOOK_SECRET` and endpoint URL; check Stripe Dashboard → Webhooks for errors.
4. Optional: implement retry with backoff and circuit-breaker for external calls; document in ARCHITECTURE when added.
5. Communicate status to users (status page or in-app banner) and post-incident review.

## Staging and deployment (Phase 40)

- **Staging:** Use Vercel preview deployments (per-PR or branch) or a dedicated staging host. Env parity with production (different keys/secrets); no production secrets in repo or staging env.
- **Feature flags:** Optional env-based or service flags for phased rollout; document in [ARCHITECTURE.md](ARCHITECTURE.md).

## Load testing and resilience

- **Tools:** Use k6 or Artillery for load testing. Example script: `scripts/load/k6-health.js` (health and critical GET endpoints).
- **Targets:** Critical APIs — health, chat, builder generate, create. Define SLOs (e.g. p95 latency &lt; 3s, error rate &lt; 1%).
- **Runbook — High load:** (1) Check rate limits and Redis; (2) Scale horizontally (Vercel); (3) Enable caching for read-heavy routes; (4) Degrade non-critical features if needed.
- **Runbook — Dependency failure:** (1) AI/Stripe/Supabase down: return 503 with Retry-After; (2) Use fallback AI providers where configured; (3) Optional: retry with backoff and circuit-breaker for external calls (document in ARCHITECTURE when added).

## Updates

This document should be reviewed and updated:

- After any infrastructure changes
- Quarterly as part of security review
- After any disaster recovery event

**Last Updated**: February 5, 2026
**Next Review**: May 5, 2026
