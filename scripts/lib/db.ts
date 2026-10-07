import { Client } from "pg"

/**
 * Connects to Postgres using DATABASE_URL (never printed). Supabase requires TLS;
 * local test databases on localhost do not.
 */
export async function connectDatabase(): Promise<Client> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add the Session pooler connection string from Supabase → Connect to .env.local."
    )
  }
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString)
  const client = new Client({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    application_name: "regal-scripts",
  })
  try {
    await client.connect()
  } catch (error) {
    throw new Error(describeConnectionError(error))
  }
  return client
}

function describeConnectionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/password authentication failed/i.test(message)) {
    return "Database login failed. Check the password in DATABASE_URL (special characters must be URL-encoded) and that the user is postgres.<project-ref> for the pooler."
  }
  if (/ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return "Database host not found. Use the Session pooler host from Supabase → Connect (the direct db.<ref>.supabase.co host is IPv6-only)."
  }
  if (/ENETUNREACH|EHOSTUNREACH|ETIMEDOUT/i.test(message)) {
    return "Database host unreachable. Use the Session pooler connection string (port 5432 on *.pooler.supabase.com), not the direct connection."
  }
  if (/Tenant or user not found/i.test(message)) {
    return "Pooler rejected the user. For the pooler the user must be postgres.<project-ref>, copied from Supabase → Connect."
  }
  return `Could not connect to the database: ${message.replace(/postgres(ql)?:\/\/[^\s]+/g, "[connection string hidden]")}`
}
