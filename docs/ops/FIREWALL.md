# Firewall VPS (US-E14-10 / T5.20)

## UFW (minimo pilota)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH    # o 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp    # HTTP/3 opzionale
sudo ufw enable
sudo ufw status verbose
```

Non aprire `5432`, `8333`, `9333`, `3000` su `0.0.0.0`.

## fail2ban

**Opzionale** — non richiesto per Exit S5. Se usato: jail `sshd` + eventualmente Caddy access log; evitare ban aggressivi su `/api/health/*`.
