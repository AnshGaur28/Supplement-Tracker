import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { user } = req.query;
  if (!user) return res.status(400).json({ error: "User required" });

  const data = await kv.get(`supp-${user}`);
  res.status(200).json(data || {});
}
