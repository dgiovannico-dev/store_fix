# Template — OpenBao policy for one application ESO (F4-06 shared platform).
# 1. Copy to <APP_ID>-eso.hcl
# 2. Replace APP_ID (slug, e.g. facilityflow, billing)
# 3. bao policy write <APP_ID>-eso <APP_ID>-eso.hcl
# 4. Token / k8s role bound only to that app's namespace SA
#
# KV layout: secret/apps/<APP_ID>/…

path "secret/data/apps/APP_ID/*" {
  capabilities = ["read"]
}

path "secret/metadata/apps/APP_ID/*" {
  capabilities = ["read", "list"]
}

# Do NOT grant secret/data/* or secret/data/apps/* — least privilege per app.
