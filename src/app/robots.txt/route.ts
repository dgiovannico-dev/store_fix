import { NextResponse } from "next/server";

/**
 * Private facility SoR — disallow all crawlers. Complements X-Robots-Tag.
 * Not an access-control mechanism.
 */
export function GET() {
  const body = ["User-agent: *", "Disallow: /", ""].join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
