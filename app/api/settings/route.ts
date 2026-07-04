import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    source: {
      host: process.env.SCT_SOURCE_HOST || process.env.SCT_DEV_HOST || "",
      clientId: process.env.SCT_SOURCE_CLIENT_ID || process.env.SCT_DEV_CLIENT_ID || "",
      // Mask secret for safety but indicate if it is present
      clientSecret: (process.env.SCT_SOURCE_CLIENT_SECRET || process.env.SCT_DEV_CLIENT_SECRET) ? "********" : "",
    },
    destination: {
      host: process.env.SCT_DEST_HOST || process.env.SCT_QA_HOST || "",
      clientId: process.env.SCT_DEST_CLIENT_ID || process.env.SCT_QA_CLIENT_ID || "",
      clientSecret: (process.env.SCT_DEST_CLIENT_SECRET || process.env.SCT_QA_CLIENT_SECRET) ? "********" : "",
    },
    dev: {
      host: process.env.SCT_DEV_HOST || "",
      clientId: process.env.SCT_DEV_CLIENT_ID || "",
      clientSecret: process.env.SCT_DEV_CLIENT_SECRET ? "********" : "",
    },
    qa: {
      host: process.env.SCT_QA_HOST || "",
      clientId: process.env.SCT_QA_CLIENT_ID || "",
      clientSecret: process.env.SCT_QA_CLIENT_SECRET ? "********" : "",
    },
    uat: {
      host: process.env.SCT_UAT_HOST || "",
      clientId: process.env.SCT_UAT_CLIENT_ID || "",
      clientSecret: process.env.SCT_UAT_CLIENT_SECRET ? "********" : "",
    },
    production: {
      host: process.env.SCT_PRODUCTION_HOST || "",
      clientId: process.env.SCT_PRODUCTION_CLIENT_ID || "",
      clientSecret: process.env.SCT_PRODUCTION_CLIENT_SECRET ? "********" : "",
    }
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "Writing credentials is disabled. Environment settings are read-only from process.env variables." },
    { status: 405 }
  );
}
