/**
 * Parse DATABASE_URL and return safe diagnostics (no password).
 */
export function validateDatabaseUrl(databaseUrl) {
  const trimmed = databaseUrl?.trim() ?? "";
  const issues = [];

  if (!trimmed) {
    return { valid: false, issues: ["DATABASE_URL is missing"], parsed: null };
  }

  if (!trimmed.startsWith("postgres")) {
    issues.push('Must start with postgresql:// or postgres://');
    return { valid: false, issues, parsed: null };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    issues.push("Invalid URL — check for special characters in password (use encodeURIComponent)");
    return { valid: false, issues, parsed: null };
  }

  const username = decodeURIComponent(parsed.username);
  const host = parsed.hostname;
  const port = parsed.port || "5432";
  const usesPooler = host.includes("pooler.supabase.com");

  if (usesPooler && !username.includes(".")) {
    issues.push(
      `Pooler username must be postgres.brmcddfmkgvsfbmtvtwf, not "${username}" — copy URI from Supabase Connect → Session pooler`,
    );
  }

  if (host.includes("db.") && host.includes(".supabase.co") && !usesPooler) {
    issues.push("Use Session pooler (pooler.supabase.com:5432), not direct db.*.supabase.co");
  }

  if (usesPooler && port !== "5432") {
    issues.push(`Session pooler must use port 5432, not ${port}`);
  }

  if (!parsed.password) {
    issues.push("Password is missing in DATABASE_URL");
  }

  return {
    valid: issues.length === 0,
    issues,
    parsed: {
      username,
      host,
      port,
      usesPooler,
    },
  };
}
