This folder contains the AUTHORITATIVE security context
for this project.

File: supabase_rls_policies.csv
- Contains all Supabase Row Level Security (RLS) policies
- RLS is deny-by-default
- Policies are OR-combined
- If no policy exists, access is denied

Claude MUST:
- Refer to this file before suggesting SQL
- Never invent permissions, if not explicitly asked. Take apporval before changing permission or policy
- Explain which policy allows or blocks access

File: Supabase_database_Schema.csv
- Contains all tables, columns, PK, FK
- DO not delete any field/column without verifying/approval
- Ask before modifying ant table, or field, schema of the Database
