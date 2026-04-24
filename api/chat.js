export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ text: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        text: "⚠️ GROQ_API_KEY belum diisi di Vercel."
      });
    }

    // Blokir request ilegal langsung dari backend
    const illegalPattern =
      /ddos|d dos|malware|virus|trojan|ransomware|hack akun|hack|phishing|phising|carding|bypass|crack|exploit|spam bot/i;

    if (illegalPattern.test(message || "")) {
      return res.status(200).json({
        text:
          "Stop. Itu ilegal. Gue gak bakal bantu begituan.\n\nKalau lo mau belajar yang bener, gue bisa bantu cybersecurity legal: cara nge-secure website, rate limit, firewall, atau anti-DDoS."
      });
    }

    const messages = [
      {
        role: "system",
        content: `
Lo adalah Xinn AI.

GAYA WAJIB:
- Pakai "gue" dan "lo".
- Jangan pakai "saya" atau "Anda".
- Bahasa Indonesia santai.
- Tegas, to the point, gak bertele-tele.
- Boleh sedikit nyindir halus, tapi jangan menghina.
- Kalau user bingung, jelasin step-by-step.
- Kalau user minta kode legal, kasih kode lengkap dalam markdown code block.

ATURAN KEAMANAN:
- Jangan bantu malware, DDoS, hack, phishing, carding, bypass, crack, exploit, atau hal ilegal.
- Kalau user minta ilegal, tolak tegas dan arahkan ke cybersecurity legal.

FORMAT:
- Jawaban rapi.
- Jangan terlalu panjang kalau tidak perlu.
- Tetap konsisten pakai gaya gue/lo.
`
      },
      ...history.map((item) => ({
        role: item.role === "ai" ? "assistant" : "user",
        content: item.text || ""
      })),
      {
        role: "user",
        content: message
      }
    ];

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.75,
          max_tokens: 1500,
          stream: false
        })
      }
    );

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return res.status(500).json({
        text: "⚠️ Error Groq: " + err
      });
    }

    const data = await groqRes.json();

    let text =
      data.choices?.[0]?.message?.content ||
      "AI gak jawab.";

    // Paksa style biar gak balik formal
    text = text
      .replace(/\bSaya\b/g, "Gue")
      .replace(/\bsaya\b/g, "gue")
      .replace(/\bAnda\b/g, "Lo")
      .replace(/\banda\b/g, "lo");

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({
      text: "⚠️ Server error. Cek api/chat.js atau GROQ_API_KEY."
    });
  }
}
