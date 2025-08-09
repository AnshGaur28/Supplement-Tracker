import { kv } from '@vercel/kv';

function getAllowedMonths() {
  const now = new Date();
  const months = [];

  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { user, date, supplements } = req.body;

    if (!user || !date) {
      return res.status(400).json({ error: "User and date required" });
    }

    if (!Array.isArray(supplements)) {
      return res.status(400).json({ error: "Supplements must be an array" });
    }

    const currentData = (await kv.get(`supp-${user}`)) || {};
    const allowedMonths = getAllowedMonths();

    currentData[date] = supplements;

    for (const d of Object.keys(currentData)) {
      if (typeof d !== "string" || d.length < 7) continue; 
      const monthKey = d.slice(0, 7);
      if (!allowedMonths.includes(monthKey)) {
        delete currentData[d];
      }
    }

    await kv.set(`supp-${user}`, currentData);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error saving supplements:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}