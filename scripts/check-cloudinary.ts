import "dotenv/config";
import { randomUUID } from "node:crypto";
import https from "node:https";
import type { IncomingMessage } from "node:http";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnv } from "../src/shared/env";

const credentials = getCloudinaryEnv();
cloudinary.config({ cloud_name: credentials.cloudName, api_key: credentials.apiKey, api_secret: credentials.apiSecret });
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pXcAAAAASUVORK5CYII=", "base64");
type Asset = { publicId: string; type: "upload" | "authenticated" };
const assets: Asset[] = [];
const originalHttpsRequest = https.request;

function record(label: string, status: number | null, body: string) {
  console.log(JSON.stringify({ case: label, result: status !== null && status >= 200 && status < 300 ? "PASS" : "FAIL", http_status: status, raw_response_body: body }));
}

function captureSdkResponse(resolveBody: (body: string) => void) {
  const request = (...args: unknown[]) => {
    const callbackIndex = args.findIndex((argument) => typeof argument === "function");
    if (callbackIndex < 0) return Reflect.apply(originalHttpsRequest, https, args);
    const callback = args[callbackIndex] as (response: IncomingMessage) => void;
    args[callbackIndex] = (response: IncomingMessage) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
      callback(response);
    };
    return Reflect.apply(originalHttpsRequest, https, args);
  };
  Object.defineProperty(https, "request", { configurable: true, writable: true, value: request });
  return () => Object.defineProperty(https, "request", { configurable: true, writable: true, value: originalHttpsRequest });
}

async function sdkUpload(type: Asset["type"], publicId: string) {
  let resolveBody!: (body: string) => void;
  const rawBody = new Promise<string>((resolve) => { resolveBody = resolve; });
  const restoreRequest = captureSdkResponse(resolveBody);
  try {
    return await new Promise<{ status: number; body: string }>((resolve) => {
    const folder = "originals/diagnostics";
    cloudinary.uploader.upload_stream({ resource_type: "image", type, folder, public_id: publicId, overwrite: true }, (error, result) => {
      if (error || !result) {
        const provider = error as (Error & { http_code?: number }) | undefined;
        void Promise.race([rawBody, new Promise<string>((done) => setTimeout(() => done(provider?.message ?? "Cloudinary SDK upload failed"), 1500))])
          .then((body) => resolve({ status: provider?.http_code ?? 0, body }));
        return;
      }
      assets.push({ publicId: result.public_id, type });
      void rawBody.then((body) => resolve({ status: 200, body }));
    }).end(pixel);
    });
  } finally {
    restoreRequest();
  }
}

async function signedFetch(type: Asset["type"], publicId: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp, type };
  const signature = cloudinary.utils.api_sign_request(params, credentials.apiSecret);
  const form = new FormData();
  form.set("file", new Blob([pixel], { type: "image/png" }), "pixel.png");
  form.set("api_key", credentials.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("type", type);
  form.set("public_id", publicId);
  form.set("signature", signature);
  const url = "https://api.cloudinary.com/v1_1/" + encodeURIComponent(credentials.cloudName) + "/image/upload";
  const response = await fetch(url, { method: "POST", body: form });
  const body = await response.text();
  if (response.ok) assets.push({ publicId, type });
  return { status: response.status, body };
}

async function run(label: string, task: () => Promise<{ status: number; body: string }>) {
  try {
    const response = await task();
    record(label, response.status, response.body);
  } catch (error) {
    const failure = error as { http_code?: number; message?: string };
    record(label, failure.http_code ?? null, failure.message ?? "Request failed");
  }
}

async function main() {
  console.log(JSON.stringify({ storage_ts: {
    original: { folder: "originals/<photographerId>/<eventId>", options: { resource_type: "image", type: "authenticated", public_id: "<photoId>", overwrite: true } },
    preview: { folder: "previews/<photographerId>/<eventId>", options: { resource_type: "image", type: "upload", public_id: "<photoId>", overwrite: true, format: "webp" } },
  } }));
  await run("SDK upload_stream type=upload", () => sdkUpload("upload", "diagnostics/" + randomUUID()));
  await run("SDK upload_stream type=authenticated", () => sdkUpload("authenticated", "diagnostics/" + randomUUID()));
  await run("Signed fetch type=upload", () => signedFetch("upload", "diagnostics/" + randomUUID()));
  await run("Signed fetch type=authenticated", () => signedFetch("authenticated", "diagnostics/" + randomUUID()));
  for (const asset of assets) {
    try { await cloudinary.uploader.destroy(asset.publicId, { resource_type: "image", type: asset.type }); }
    catch { process.exitCode = 1; }
  }
}

void main();
