import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { readAdminConfig } from "./config";
import { csrfCookie, privateHeaders, validCsrf, validOrigin } from "./security";
import { requestAdminClient } from "./supabase-server";
import { requireCatalogActor } from "../catalog/server-access";
export class AdminRequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function mutationSession(request: NextRequest) {
  const config = readAdminConfig();
  if (!config)
    throw new AdminRequestError("Admin integration is disabled.", 503);
  if (!validOrigin(request.headers, config.origin))
    throw new AdminRequestError("Request origin rejected.", 403);
  const client = await requestAdminClient(true);
  try {
    await requireCatalogActor(client, "manage");
  } catch {
    throw new AdminRequestError("Administrator access required.", 403);
  }
  return { client, config, csrf: (await cookies()).get(csrfCookie)?.value };
}
export async function readBounded(request: NextRequest, max: number) {
  if (Number(request.headers.get("content-length") || 0) > max)
    throw new AdminRequestError(
      "File or request exceeds the permitted size.",
      413,
    );
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  if (reader)
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new AdminRequestError(
          "File or request exceeds the permitted size.",
          413,
        );
      }
      chunks.push(next.value);
    }
  return Buffer.concat(chunks);
}
export async function jsonMutation(request: NextRequest) {
  const session = await mutationSession(request);
  if (!validCsrf(session.csrf, request.headers.get("x-csrf-token")))
    throw new AdminRequestError(
      "Security token expired. Refresh the page.",
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AdminRequestError("JSON request required.", 415);
  return {
    ...session,
    input: JSON.parse((await readBounded(request, 65536)).toString()),
  };
}
export async function multipartMutation(request: NextRequest, max: number) {
  const session = await mutationSession(request);
  if (!validCsrf(session.csrf, request.headers.get("x-csrf-token")))
    throw new AdminRequestError(
      "Security token expired. Refresh the page.",
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new AdminRequestError("Multipart upload required.", 415);
  const bytes = await readBounded(request, max);
  const form = await new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type")! },
    body: new Uint8Array(bytes),
  }).formData();
  return { ...session, form };
}
export function checked<T>(result: {
  data: T;
  error: { code?: string; message: string } | null;
}): T {
  if (result.error) {
    if (result.error.code === "40001" || /Stale/.test(result.error.message))
      throw new AdminRequestError(
        "This record changed. Refresh and review the latest version.",
        409,
      );
    throw new AdminRequestError(result.error.message.slice(0, 300), 422);
  }
  return result.data;
}
export function requestError(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof AdminRequestError
          ? error.message
          : "The operation could not be completed. Review the file and current record, then retry.",
    },
    {
      status: error instanceof AdminRequestError ? error.status : 422,
      headers: privateHeaders,
    },
  );
}
