# OpenBao policy for External Secrets Operator (F4-03).
# Apply after init: bao policy write facilityflow-eso deploy/openbao/policies/eso-read.hcl
# KV v2 path: secret/data/facilityflow/runtime

path "secret/data/facilityflow/*" {
  capabilities = ["read"]
}

path "secret/metadata/facilityflow/*" {
  capabilities = ["read", "list"]
}
