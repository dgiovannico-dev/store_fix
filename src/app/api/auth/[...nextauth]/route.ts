import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handlers } from "@/auth";
import {
  applyLogoutClearSiteData,
  isAuthJsSignOutPath,
} from "@/infrastructure/security/session-cleanup-headers";

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const response = await handlers.POST(request);
  if (!isAuthJsSignOutPath(request.nextUrl.pathname)) {
    return response;
  }
  const headers = new Headers(response.headers);
  applyLogoutClearSiteData(headers);
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
