import { NextRequest, NextResponse } from "next/server";
import { ItemTransferClient } from "../../../lib/clients";
import * as fs from "fs";
import * as path from "path";

const CONFIG_FILE_PATH = path.join(process.cwd(), "config.local.json");

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const data = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {}
  return { source: null, destination: null };
}

function getDestinationConfig() {
  const config = loadConfig();
  if (config.destination && config.destination.host) {
    // Resolve real secrets from process.env if they were masked ("********")
    const dest = { ...config.destination };
    if (dest.clientSecret === "********" && process.env.SCT_DEST_CLIENT_SECRET) {
      dest.clientSecret = process.env.SCT_DEST_CLIENT_SECRET;
    }
    return dest;
  }
  return {
    host: process.env.SCT_DEST_HOST || "",
    clientId: process.env.SCT_DEST_CLIENT_ID || "",
    clientSecret: process.env.SCT_DEST_CLIENT_SECRET || "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const size = parseInt(searchParams.get("size") || "50", 10);

    const destination = getDestinationConfig();
    if (!destination.host || !destination.clientId || !destination.clientSecret) {
      return NextResponse.json({ error: "Destination environment variables (SCT_DEST_*) not configured" }, { status: 400 });
    }

    const client = new ItemTransferClient(destination);

    if (action === "history") {
      const history = await client.getHistory(page, size);
      return NextResponse.json(history);
    }

    if (action === "sources") {
      const blobs = await client.listBlobSources(page, size);
      const files = await client.listFileSources(page, size);
      return NextResponse.json({ blobs, files });
    }

    if (action === "transfers") {
      const transfers = await client.listTransfers(page, size);
      return NextResponse.json(transfers);
    }

    return NextResponse.json({ error: "Unknown action parameter" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const destination = getDestinationConfig();
    if (!destination.host || !destination.clientId || !destination.clientSecret) {
      return NextResponse.json({ error: "Destination environment variables (SCT_DEST_*) not configured" }, { status: 400 });
    }

    const client = new ItemTransferClient(destination);

    if (action === "consume") {
      const body = await req.json();
      const { fileName, blobName, database } = body;
      const db = database || "master";

      const location = await client.startConsume(db, { fileName, blobName });
      return NextResponse.json({ success: true, location });
    }

    if (action === "retry") {
      const body = await req.json();
      const { database } = body;
      const db = database || "master";

      const result = await client.retryFailed(db);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action parameter" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
