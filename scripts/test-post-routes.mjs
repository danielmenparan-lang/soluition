#!/usr/bin/env node
/**
 * Verify app POST routes never return 405 (Method Not Allowed).
 * Usage: node scripts/test-post-routes.mjs [baseUrl]
 */
const base = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const shopQuery = "shop=test.myshopify.com&host=dGVzdA&embedded=1";

const cases = [
  { name: "overview (layout fallback)", path: `/app?${shopQuery}`, expect405: false },
  { name: "overview (index action)", path: `/app?index=&${shopQuery}`, expect405: false },
  { name: "recommendations", path: `/app/recommendations?${shopQuery}`, expect405: false },
  { name: "segments", path: `/app/segments?${shopQuery}`, expect405: false },
  { name: "reports", path: `/app/reports?${shopQuery}`, expect405: false },
  { name: "chat", path: `/app/chat?${shopQuery}`, body: "message=hello", expect405: false },
];

let failed = 0;

for (const testCase of cases) {
  const url = `${base}${testCase.path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: testCase.body ?? "intent=generate_recommendations",
  });

  const is405 = response.status === 405;
  const ok = testCase.expect405 ? is405 : !is405;

  if (ok) {
    console.log(`OK  POST ${testCase.name} -> ${response.status}`);
  } else {
    console.error(
      `FAIL POST ${testCase.name} -> ${response.status} (expected${testCase.expect405 ? "" : " not"} 405)`,
    );
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\n${failed} route(s) failed`);
  process.exit(1);
}

console.log("\nAll POST route checks passed");
