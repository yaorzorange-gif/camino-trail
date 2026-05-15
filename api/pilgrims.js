import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const pilgrims = (await redis.get("pilgrims")) || [];
    const edges    = (await redis.get("edges"))    || [];
    res.status(200).json({ pilgrims, edges });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
