const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `smoke-${runId}@citywallet.local`;
const password = "demo-password";

async function main() {
  const signup = await request("/admin/api/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const cookie = signup.cookie;
  if (!cookie) {
    throw new Error("Signup did not return a session cookie");
  }

  const merchant = await request(
    "/admin/api/merchant",
    {
      method: "POST",
      body: JSON.stringify({
        name: `Smoke Store ${runId}`,
        category: "cafe",
        cityId: "admin-smoke",
        latitude: 48.3069,
        longitude: 14.2868,
        description: "Smoke Store — temporary merchant created by backend admin test.",
      }),
    },
    cookie,
  );

  await request(
    "/admin/api/rules",
    {
      method: "PUT",
      body: JSON.stringify({
        maxDiscountPercent: 12,
        allowedWindows: ["Mon-Fri 10:00-16:00"],
        exclusions: ["Gift cards"],
        tone: "warm and concise",
        validityMinutes: 20,
        extraInstructions: "Mention nearby foot traffic when relevant.",
        active: true,
      }),
    },
    cookie,
  );

  await request("/analytics/events", {
    method: "POST",
    body: JSON.stringify({
      merchantId: merchant.body.merchant.id,
      type: "RECOMMENDED",
      metadata: { source: "smoke-admin" },
    }),
  });

  const summary = await request("/admin/api/analytics/summary", {}, cookie);
  if (summary.body.counts.RECOMMENDED < 1) {
    throw new Error("Analytics summary did not include the smoke recommendation event");
  }

  console.log(
    `Admin smoke test passed for ${email} (${merchant.body.merchant.id}). Recommended=${summary.body.counts.RECOMMENDED}`,
  );
}

async function request(path: string, options: RequestInit = {}, cookie?: string) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${text}`);
  }
  return {
    body,
    cookie: response.headers.get("set-cookie")?.split(";")[0] ?? null,
  };
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
