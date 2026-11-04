# OpenBao policy — FacilityFlow ESO only (F4-06).
# bao policy write facilityflow-eso deploy/openbao/policies/facilityflow-eso.hcl
# KV: secret/apps/facilityflow/…

path "secret/data/apps/facilityflow/*" {
  capabilities = ["read"]
}

path "secret/metadata/apps/facilityflow/*" {
  capabilities = ["read", "list"]
}

# ESO token introspection
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
