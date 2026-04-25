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

    const illegalPattern =
      /ddos|d dos|malware|virus|trojan|ransomware|hack|hacking|phishing|phising|carding|bypass|crack|exploit|payload|spam bot/i;

    if (illegalPattern.test(message || "")) {
      return res.status(200).json({
        text:
          "Stop. Itu ilegal. Gue gak bakal bantu begituan.\n\nKalau lo mau belajar yang bener, gue bisa bantu cybersecurity legal: cara mengamankan website, rate limit, firewall, atau anti-DDoS."
      });
    }

    const messages = [
      {
        role: "system",
        content: `
Kamu adalah Xinn AI, asisten serba bisa seperti ChatGPT.

KEMAMPUAN:
- Bisa membantu berbagai topik: coding, desain, bisnis, belajar, ide konten, debugging, prompt, website, aplikasi, dan tanya jawab umum.
- Jika user bertanya hal biasa, jawab dengan bahasa Indonesia sopan memakai "saya" dan "kamu".
- Jangan gunakan "gue" atau "lo" untuk pertanyaan normal.
- Jawaban harus jelas, rapi, mudah dipahami, dan membantu sampai selesai.
- Jika user minta coding legal, berikan kode lengkap siap pakai dalam markdown code block.
- Jika pertanyaan sederhana, jawab singkat.
- Jika pertanyaan butuh penjelasan, jawab detail step by step.

MODE TEGAS KHUSUS ILEGAL:
Jika user meminta malware, DDoS, hacking, phishing, carding, exploit, bypass, crack, spam, atau aktivitas ilegal:
- Tolak langsung.
- Gunakan gaya tegas, boleh pakai "gue" dan "lo".
- Jangan beri kode, langkah, tool, payload, atau cara.
- Arahkan ke alternatif legal seperti cybersecurity etis, keamanan website, firewall, rate limit, atau anti-DDoS.

Contoh ilegal:
"Stop. Itu ilegal. Gue gak bakal bantu begituan."

PENTING:
- Normal = sopan.
- Ilegal = tegas.
- Jangan mengaku tahu hal yang tidak pasti.
- Jangan terlalu formal.
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
          model: "llama-3.1-8b-instant",
          messages,
          temperature: 0.7,
          max_tokens: 2048,
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
      "⚠️ AI tidak memberi jawaban.";

    text = text
      .replace(/\bgue\b/gi, "saya")
      .replace(/\blo\b/gi, "kamu")
      .replace(/\bGue\b/g, "Saya")
      .replace(/\bLo\b/g, "Kamu");

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({
      text: "⚠️ Server error. Cek api/chat.js atau GROQ_API_KEY."
    });
  }
}
