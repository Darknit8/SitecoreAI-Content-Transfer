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
  } catch (err) { }
  return { source: null, destination: null };
}

function getDestinationConfig(envName?: string | null) {
  const config = loadConfig();

  // If a specific environment name is specified, lookup those credentials
  if (envName) {
    const name = envName.toUpperCase();
    const envHost = process.env[`SCT_${name}_HOST`];
    const envClientId = process.env[`SCT_${name}_CLIENT_ID`];
    const envClientSecret = process.env[`SCT_${name}_CLIENT_SECRET`];
    if (envHost && envClientId && envClientSecret) {
      return {
        host: envHost,
        clientId: envClientId,
        clientSecret: envClientSecret,
      };
    }
  }

  if (config.destination && config.destination.host) {
    // Resolve real secrets from process.env if they were masked ("********")
    const dest = { ...config.destination };
    if (dest.clientSecret === "********") {
      dest.clientSecret = process.env.SCT_DEST_CLIENT_SECRET || process.env.SCT_QA_CLIENT_SECRET || "";
    }
    return dest;
  }
  return {
    host: process.env.SCT_DEST_HOST || process.env.SCT_QA_HOST || "",
    clientId: process.env.SCT_DEST_CLIENT_ID || process.env.SCT_QA_CLIENT_ID || "",
    clientSecret: process.env.SCT_DEST_CLIENT_SECRET || process.env.SCT_QA_CLIENT_SECRET || "",
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const size = parseInt(searchParams.get("size") || "50", 10);
    const env = searchParams.get("env");

    const reqPassword = req.headers.get("x-auth-password") || searchParams.get("authPassword") || searchParams.get("adminPassword");
    const adminPassword = process.env.SCT_ADMIN_PASSWORD || "Admin123!";

    if (env && env.toUpperCase() === "PRODUCTION") {
      if (reqPassword !== adminPassword) {
        return NextResponse.json({ error: "Invalid authorization password. Access denied for Production environment." }, { status: 403 });
      }
    }

    const destination = getDestinationConfig(env);
    if (!destination.host || !destination.clientId || !destination.clientSecret) {
      return NextResponse.json({ error: `Destination environment variables for '${env || "QA"}' not configured` }, { status: 400 });
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
    const env = searchParams.get("env");

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) { }

    const finalEnv = env || body.env;
    const reqPassword = req.headers.get("x-auth-password") || searchParams.get("authPassword") || searchParams.get("adminPassword") || body.adminPassword || body.authPassword;
    const adminPassword = process.env.SCT_ADMIN_PASSWORD || "Admin123!";

    if (finalEnv && finalEnv.toUpperCase() === "PRODUCTION") {
      if (reqPassword !== adminPassword) {
        return NextResponse.json({ error: "Invalid authorization password. Access denied for Production environment." }, { status: 403 });
      }
    }

    const destination = getDestinationConfig(finalEnv);
    if (!destination.host || !destination.clientId || !destination.clientSecret) {
      return NextResponse.json({ error: `Destination environment variables for '${finalEnv || "QA"}' not configured` }, { status: 400 });
    }

    const client = new ItemTransferClient(destination);

    if (action === "consume") {
      const { fileName, blobName, database } = body;
      const db = database || "master";

      const location = await client.startConsume(db, { fileName, blobName });
      return NextResponse.json({ success: true, location });
    }

    if (action === "retry") {
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const name = searchParams.get("name");
    const env = searchParams.get("env");

    if (!name) {
      return NextResponse.json({ error: "Source name is required" }, { status: 400 });
    }

    const reqPassword = req.headers.get("x-auth-password") || searchParams.get("authPassword") || searchParams.get("adminPassword");
    const adminPassword = process.env.SCT_ADMIN_PASSWORD || "Admin123!";

    if (env && env.toUpperCase() === "PRODUCTION") {
      if (reqPassword !== adminPassword) {
        return NextResponse.json({ error: "Invalid authorization password. Access denied for Production environment." }, { status: 403 });
      }
    }

    const destination = getDestinationConfig(env);
    if (!destination.host || !destination.clientId || !destination.clientSecret) {
      return NextResponse.json({ error: `Destination environment variables for '${env || "QA"}' not configured` }, { status: 400 });
    }

    const client = new ItemTransferClient(destination);

    if (action === "blob") {
      await client.deleteBlobSource(name);
      return NextResponse.json({ success: true });
    }

    if (action === "file") {
      await client.deleteFileSource(name);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action parameter" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
