# Cron host (backup + uptime)

## Backup giornaliero

```cron
15 2 * * * cd /opt/facilityflow && FF_COMPOSE=compose.prod.yaml /usr/bin/npm run db:backup >> /var/log/ff-backup.log 2>&1
```

Retention: vedi [`BACKUP.md`](./BACKUP.md) (14g dump locali).

## Uptime readiness

```cron
*/5 * * * * FF_HEALTH_URL=https://app.example.com/api/health/ready /opt/facilityflow/scripts/uptime-check.sh >> /var/log/ff-uptime.log 2>&1
```

Exit ≠ 0 → alert via cron MAILTO o wrapper SMTP self-host (no SaaS obbligatorio).
