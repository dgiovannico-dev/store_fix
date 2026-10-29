# Log rotation (US-E14-08 / T5.17)

`compose.prod.yaml` usa driver `json-file` con:

```yaml
max-size: "20m"
max-file: "5"
```

su postgres, seaweedfs, app, worker, caddy.

Host opzionale:

```
/var/lib/docker/containers/*/*-json.log
```

già ruotati dal driver. Evitare log unbounded su VPS 40 GB.
