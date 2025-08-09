import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { user, date, supplements } = req.body;
  if (!user || !date) return res.status(400).json({ error: "User and date required" });

  const currentData = (await kv.get(`supp-${user}`)) || {};
  currentData[date] = supplements;
  await kv.set(`supp-${user}`, currentData);
  res.status(200).json({ ok: true });
}
