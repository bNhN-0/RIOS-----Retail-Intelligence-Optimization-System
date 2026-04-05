import { type NextRequest } from "next/server";

import { getBackendBaseUrl } from "@/lib/api/riosBackend";

export const dynamic = "force-dynamic";

function buildUpstreamUrl(pathSegments: string[], search: string) {
  const normalizedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");

  return `${getBackendBaseUrl()}/${normalizedPath}${search}`;
}

async function forwardRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const upstreamUrl = buildUpstreamUrl(path, request.nextUrl.search);
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();
  const headers = new Headers();
  const accept = request.headers.get("accept");
  const contentType = request.headers.get("content-type");

  if (accept) {
    headers.set("accept", accept);
  }

  if (contentType) {
    headers.set("content-type", contentType);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      cache: "no-store",
      body,
      headers,
      method: request.method,
    });
    const upstreamBody = await upstreamResponse.text();
    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get("content-type");

    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }

    responseHeaders.set("cache-control", "no-store");

    return new Response(upstreamBody, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { detail: "Unable to reach backend data service." },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return forwardRequest(request, context);
}
