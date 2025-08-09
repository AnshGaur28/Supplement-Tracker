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
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: "User required" });

    const data = (await kv.get(`supp-${user}`)) || {};
    const allowedMonths = getAllowedMonths();

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([date]) => {
        // Defensive: ensure date is string and length >= 7
        if (typeof date !== "string" || date.length < 7) return false;
        const monthKey = date.slice(0, 7); // "YYYY-MM"
        return allowedMonths.includes(monthKey);
      })
    );

    return res.status(200).json(filtered);
  } catch (error) {
    console.error("Error fetching supplements:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}