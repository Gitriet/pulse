import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

async function callAnthropic(prompt: string, apiKey: string, retries = 4): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const wait = retryAfter ? parseInt(retryAfter) * 1000 : 5000 * (attempt + 1);
      console.log(`Rate limited, waiting ${wait}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, wait));
      continue;
    }

    return response;
  }

  return new Response("Rate limited after retries", { status: 429 });
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await callAnthropic(prompt, apiKey);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return NextResponse.json(
        { error: "Anthropic API error", status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();

    const fullText = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n")
      .replace(/```json|```/g, "")
      .trim();

    const start = fullText.indexOf("{");
    const end = fullText.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return NextResponse.json(
        { error: "No JSON in response", raw: fullText.slice(0, 200) },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(fullText.slice(start, end + 1));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Widget API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
