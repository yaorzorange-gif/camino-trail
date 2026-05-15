import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { pilgrim, newEdges } = req.body;

    const pilgrims = (await redis.get("pilgrims")) || [];
    const edges    = (await redis.get("edges"))    || [];

    pilgrims.push(pilgrim);
    edges.push(...newEdges);

    await redis.set("pilgrims", pilgrims);
    await redis.set("edges",    edges);

    res.status(200).json({ ok: true, pilgrim });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
