// SPDX-License-Identifier: AGPL-3.0-or-later
// Proxy to Venice API to avoid browser-side CORS issues.
import type { NextRequest } from "next/server";

const VENICE_BASE = "https://api.venice.ai/api/v1";

function buildTargetUrl(pathSegments: string[], search: string): string {
  const path = pathSegments.join("/");
  return `${VENICE_BASE}/${path}${search ?? ""}`;
}

async function forward(request: NextRequest, pathSegments: string[]): Promise<Response> {
  const targetUrl = buildTargetUrl(pathSegments, request.nextUrl.search);
  const headers = new Headers(request.headers);

  // Always set Authorization from the server-side secret.
  headers.set("Authorization", `Bearer ${process.env.VENICE_API_KEY ?? ""}`);
  headers.delete("host");

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  });

  // Pass through status/body; strip hop-by-hop headers.
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-encoding");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(request, params.path);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
