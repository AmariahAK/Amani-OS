import { Type } from "typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import bylawsChunks from "../data/bylaws_chunks.json";
import members from "../data/members.json";
import transactions from "../data/transactions.json";
import { textResult } from "./helpers";

type BylawChunk = (typeof bylawsChunks)[number];
type Member = (typeof members)[number];
type Transaction = (typeof transactions)[number];

const searchSchema = Type.Object({
  query: Type.String({ description: "Search terms or article number e.g. 7.2, penalty, expulsion" }),
});

export const searchBylawsTool: AgentTool<typeof searchSchema> = {
  label: "Search bylaws",
  name: "search_bylaws",
  description:
    "Search Amani Investment Chama bylaws by keyword or article. Returns relevant clauses for citation.",
  parameters: searchSchema,
  execute: async (_id, args) => {
    const q = args.query.toLowerCase();
    const results = (bylawsChunks as BylawChunk[])
      .map((chunk) => {
        const text = `${chunk.article} ${chunk.title} ${chunk.text}`.toLowerCase();
        const score =
          (text.includes(q) ? 3 : 0) +
          (chunk.article.toLowerCase().includes(q) ? 5 : 0) +
          q.split(/\s+/).filter((w) => w && text.includes(w)).length;
        return { chunk, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => ({
        id: r.chunk.id,
        article: r.chunk.article,
        title: r.chunk.title,
        text: r.chunk.text,
      }));
    return textResult(
      JSON.stringify(results.length ? results : { message: "No matching bylaws found.", query: args.query }, null, 2),
    );
  },
};

const txSchema = Type.Object({
  member: Type.Optional(Type.String({ description: "Member full or partial name" })),
  month: Type.Optional(Type.String({ description: "YYYY-MM e.g. 2024-01" })),
  penaltyOnly: Type.Optional(Type.Boolean({ description: "Only rows with penalties" })),
  missedOnly: Type.Optional(Type.Boolean({ description: "Only missed/not paid" })),
});

export const queryTransactionsTool: AgentTool<typeof txSchema> = {
  label: "Query transactions",
  name: "query_transactions",
  description: "Query mock M-Pesa Paybill 247247 contribution records for Amani Chama.",
  parameters: txSchema,
  execute: async (_id, args) => {
    let rows = transactions as Transaction[];
    if (args.member) {
      const m = args.member.toLowerCase();
      rows = rows.filter((r) => r.member.toLowerCase().includes(m));
    }
    if (args.month) rows = rows.filter((r) => r.month === args.month);
    if (args.penaltyOnly) rows = rows.filter((r) => r.penalty != null && r.penalty > 0);
    if (args.missedOnly) rows = rows.filter((r) => r.status === "NOT PAID" || r.amount === 0);
    return textResult(JSON.stringify(rows, null, 2));
  },
};

const memberSchema = Type.Object({
  name: Type.Optional(Type.String({ description: "Optional filter by name" })),
});

export const getMemberRegisterTool: AgentTool<typeof memberSchema> = {
  label: "Member register",
  name: "get_member_register",
  description: "Get registered members, status, roles, and contribution miss notes.",
  parameters: memberSchema,
  execute: async (_id, args) => {
    let rows = members as Member[];
    if (args.name) {
      const n = args.name.toLowerCase();
      rows = rows.filter((m) => m.fullName.toLowerCase().includes(n));
    }
    const enriched = rows.map((m) => {
      const txs = (transactions as Transaction[]).filter((t) => t.member === m.fullName);
      const missed = txs.filter((t) => t.status === "NOT PAID" || t.amount === 0).length;
      return { ...m, missedContributions: missed, recentTransactions: txs.slice(-3) };
    });
    return textResult(JSON.stringify(enriched, null, 2));
  },
};

const dateSchema = Type.Object({});

export const getCurrentDatetimeTool: AgentTool<typeof dateSchema> = {
  label: "Current datetime",
  name: "get_current_datetime",
  description: "Returns current date/time in Africa/Nairobi and user timezone.",
  parameters: dateSchema,
  execute: async () => {
    const now = new Date();
    const nairobi = now.toLocaleString("en-KE", {
      timeZone: "Africa/Nairobi",
      dateStyle: "full",
      timeStyle: "long",
    });
    return textResult(
      JSON.stringify(
        {
          utc: now.toISOString(),
          africaNairobi: nairobi,
          local: now.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        null,
        2,
      ),
    );
  },
};
