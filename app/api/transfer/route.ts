import { NextRequest, NextResponse } from "next/server";
import { TransferOrchestrator } from "../../../lib/orchestrator";
import { transferStore, activeOrchestrators } from "../../../lib/store";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dataTrees, database, authPassword } = body;

    const config = loadConfig();
    const source = body.source || config.source;
    const destination = body.destination || config.destination;

    if (
      !source.host || !source.clientId || !source.clientSecret ||
      !destination.host || !destination.clientId || !destination.clientSecret
    ) {
      return NextResponse.json(
        { error: "Missing configuration credentials. Please save environment settings first." },
        { status: 400 }
      );
    }

    const hasExpensive = dataTrees?.some((tree: any) =>
      tree.scope === "ItemAndDescendants" ||
      tree.mergeStrategy === "OverrideExistingItem" ||
      tree.mergeStrategy === "OverrideExistingTree"
    );

    if (hasExpensive) {
      const adminPassword = process.env.SCT_ADMIN_PASSWORD || "Admin123!";
      if (authPassword !== adminPassword) {
        return NextResponse.json(
          { error: "Invalid authorization password. Access denied for high-risk operations." },
          { status: 403 }
        );
      }
    } else {
      const standardPassword = process.env.SCT_STANDARD_PASSWORD || "Standard123!";
      if (authPassword !== standardPassword) {
        return NextResponse.json(
          { error: "Invalid authorization password. Access denied." },
          { status: 403 }
        );
      }
    }

    const transferId = crypto.randomUUID();
    const controller = new AbortController();
    activeOrchestrators.set(transferId, controller);
    
    transferStore.create(transferId);

    // Resolve real secrets from process.env if they were masked ("********") in body
    const realSource = { ...source };
    if (realSource.clientSecret === "********" && process.env.SCT_SOURCE_CLIENT_SECRET) {
      realSource.clientSecret = process.env.SCT_SOURCE_CLIENT_SECRET;
    }
    const realDest = { ...destination };
    if (realDest.clientSecret === "********" && process.env.SCT_DEST_CLIENT_SECRET) {
      realDest.clientSecret = process.env.SCT_DEST_CLIENT_SECRET;
    }

    const orchestrator = new TransferOrchestrator(realSource, realDest);

    orchestrator.on((event) => {
      transferStore.addEvent(transferId, event);
    });

    orchestrator
      .run(
        {
          transferId,
          dataTrees,
          database: database || "master",
        },
        {
          database: database || "master",
          signal: controller.signal,
        }
      )
      .then(() => {
        activeOrchestrators.delete(transferId);
      })
      .catch((err) => {
        activeOrchestrators.delete(transferId);
        console.error("Orchestrator run error:", err);
      });

    return NextResponse.json({ transferId, state: "running" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transferId = searchParams.get("id");
  const sse = searchParams.get("sse");

  if (!transferId) {
    return NextResponse.json(transferStore.list());
  }

  const run = transferStore.get(transferId);
  if (!run) {
    return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
  }

  if (sse === "true") {
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Enqueue existing events immediately
        for (const event of run.events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }

        let lastCount = run.events.length;
        const interval = setInterval(() => {
          const currentCount = run.events.length;
          
          if (currentCount > lastCount) {
            for (let i = lastCount; i < currentCount; i++) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(run.events[i])}\n\n`));
            }
            lastCount = currentCount;
          }

          if (run.state !== "running") {
            clearInterval(interval);
            controller.close();
          }
        }, 500);

        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Content-Encoding": "none",
        "X-Accel-Buffering": "no"
      },
    });
  }

  return NextResponse.json(run);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transferId = searchParams.get("id");

  if (!transferId) {
    return NextResponse.json({ error: "Missing transfer id" }, { status: 400 });
  }

  const controller = activeOrchestrators.get(transferId);
  if (!controller) {
    return NextResponse.json({ error: "Active transfer not found or already completed" }, { status: 404 });
  }

  controller.abort();
  activeOrchestrators.delete(transferId);

  return NextResponse.json({ cancelled: true });
}
