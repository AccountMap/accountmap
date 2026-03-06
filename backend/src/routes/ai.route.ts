import { Router } from "express";
import { prisma } from "../lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

router.get("/analyze", async (req, res) => {
  try {
    const user = await prisma.user.findFirst(); 
    
    if (!user) {
      return res.status(400).send("No user found in database.");
    }

    const accounts = await prisma.account.findMany({
      where: { userid: user.id },
      include: { connections: { select: { identity: true } } },
    });

    if (!accounts || accounts.length === 0) {
      return res.status(400).send("No accounts found in DB for this user.");
    }

    console.log(`Sending ${accounts.length} accounts to Gemini...`);

    const sanitized = accounts.map((acc) => {
      const conns = (acc.connections as { identity?: { type?: string } }[]) || [];
      const recoveryTypes = conns
        .map((c) => c.identity?.type?.toLowerCase().replace("_", " "))
        .filter(Boolean);
      return {
        service: acc.name,
        username: acc.username ? "(has username)" : null,
        recoveredBy: recoveryTypes.length ? recoveryTypes.join(", ") : "none listed",
      };
    });

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
        You are a friendly security advisor explaining "Account Recovery Graphs" to a non-technical user.

        CONTEXT:
        This app maps how accounts (email, phone, etc.) are used to recover other services. No passwords or MFA data are stored. You only analyze recovery paths.

        STYLE:
        - Write in plain, user-friendly language. Avoid jargon; if you use a term, briefly explain it.
        - Never mention internal IDs, database IDs, or technical identifiers. Refer to accounts by service name and type (e.g. "your Gmail", "Netflix", "your phone number").
        - Be concise and under 200 words. Prioritize the most important risks first.

        RULES:
        1. Do NOT suggest adding password or MFA fields.
        2. Focus on: single points of failure (one email/phone recovering many accounts), circular loops (A recovers B, B recovers A), and over-reliance on SMS.
        3. Give clear, actionable advice in a reassuring tone.
      `,
    });

    const prompt = `
      Analyze this user's account recovery setup and explain the risks in simple terms:

      ${JSON.stringify(sanitized, null, 2)}

      Provide:
      1. The main risks in plain language (no IDs, use service names like "Gmail", "Netflix").
      2. Short, practical suggestions to improve recovery security.

      Keep it under 200 words and user-friendly.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(text);

  } catch (error: any) {
    console.error("!!! GEMINI CRASHED !!!");
    console.error(error);
    const msg = String(error?.message || error).toLowerCase();
    const isQuotaOrKey =
      msg.includes("429") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota") ||
      msg.includes("api key") ||
      msg.includes("api_key") ||
      msg.includes("invalid api key");
    if (isQuotaOrKey) {
      return res.status(403).send("Someone used Gemini API keys already. Wait for new ones later.");
    }
    return res.status(500).send(`Gemini Error: ${error.message}`);
  }
});

export default router;