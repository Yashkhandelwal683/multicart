import { NextResponse } from "next/server";

const GEMINI_URL =
  "https:

export async function POST(req: Request) {
  try {
    const { message, role, targetRole } = await req.json();

    if (!message || !role || !targetRole) {
      return NextResponse.json({ suggestions: [] });
    }

    

    let roleContext = "";

    if (role === "user" && targetRole === "vendor") {
      roleContext = `
You are replying as a USER.
You are asking a vendor for help.
Explain the issue clearly and politely.
`;
    }

    if (role === "vendor" && targetRole === "user") {
      roleContext = `
You are replying as a VENDOR.
Help the user resolve their issue professionally.
`;
    }

    if (role === "vendor" && targetRole === "admin") {
      roleContext = `
You are replying as a VENDOR.
Explain the problem clearly and ask admin for guidance.
`;
    }

    if (role === "admin" && targetRole === "vendor") {
      roleContext = `
You are replying as an ADMIN.
Either request missing information or provide a solution.
`;
    }

    

    const prompt = `
You are a professional support assistant.

${roleContext}

Last message received:
"${message}"

Generate 3 reply suggestions.

Rules:
- 5 to 10 words each
- Polite and professional
- One suggestion per line
- No bullets or numbering
`;

    

    const geminiResponse = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await geminiResponse.json();

    

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const suggestions = text
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("Suggestion error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
