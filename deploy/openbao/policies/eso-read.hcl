# Deprecated alias (F4-03 name) → use facilityflow-eso.hcl
# Kept so old runbook snippets still resolve; same ACL as facilityflow-eso.

path "secret/data/apps/facilityflow/*" {
  capabilities = ["read"]
}

path "secret/metadata/apps/facilityflow/*" {
  capabilities = ["read", "list"]
}
