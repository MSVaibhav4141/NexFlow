import { NextRequest, NextResponse } from "next/server";

async function forwardToBackend(req: NextRequest, webhookId: string, method: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nexflow-ord3.onrender.com";
  
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams.toString();
    const targetUrl = `${backendUrl}/api/v0/execution/${webhookId}${searchParams ? `?${searchParams}` : ""}`;

    const headers = {
      "Content-Type": req.headers.get("content-type") || "application/json",
    };

    const options: RequestInit = { method, headers };

    if (method === "POST") {
      options.body = await req.text(); 
    }

    const backendRes = await fetch(targetUrl, options);
    const data = await backendRes.json();

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("Webhook Proxy Error:", error);
    return NextResponse.json({ detail: "Internal Proxy Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ webhook_id: string }> }) {

  const {webhook_id} = await params
  return forwardToBackend(req, webhook_id, "GET");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ webhook_id: string }> }) {
    
  const {webhook_id} = await params
    return forwardToBackend(req, webhook_id, "POST");
}