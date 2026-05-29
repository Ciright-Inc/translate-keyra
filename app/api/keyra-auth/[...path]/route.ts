import { NextRequest, NextResponse } from "next/server";
import { AUTH_BACKEND_TARGET_URL } from "@/lib/keyra-auth";

export const dynamic = "force-dynamic";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function buildUpstreamUrl(request: NextRequest, path: string[]) {
  const upstreamUrl = new URL(AUTH_BACKEND_TARGET_URL);
  const basePath = upstreamUrl.pathname.replace(/\/$/, "");
  const nextPath = path.map(encodeURIComponent).join("/");
  upstreamUrl.pathname = `${basePath}/${nextPath}`.replace(/\/{2,}/g, "/");
  upstreamUrl.search = request.nextUrl.search;
  return upstreamUrl;
}

function buildUpstreamHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      return;
    }

    headers.set(key, value);
  });

  return headers;
}

function buildResponseHeaders(upstream: Response) {
  const headers = new Headers();

  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      return;
    }

    headers.set(key, value);
  });

  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    headers.delete("set-cookie");
    for (const cookie of setCookies) {
      headers.append("set-cookie", cookie);
    }
  }

  return headers;
}

async function proxyToAuth(request: NextRequest, path: string[]) {
  const url = buildUpstreamUrl(request, path);
  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const upstream = await fetch(url, {
    method,
    headers: buildUpstreamHeaders(request),
    body,
    cache: "no-store",
    redirect: "manual",
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToAuth(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToAuth(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToAuth(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToAuth(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToAuth(request, path);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToAuth(request, path);
}
