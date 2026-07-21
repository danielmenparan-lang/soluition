import type { LoaderFunctionArgs } from "react-router";
import { readFile } from "fs/promises";
import { join } from "path";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const scriptPath = join(process.cwd(), "public", "tracker.js");
  const script = await readFile(scriptPath, "utf-8");

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
