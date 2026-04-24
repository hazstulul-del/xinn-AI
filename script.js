const $ = (id) => document.getElementById(id);

const input = $("messageInput");
const chat = $("chatArea");
const welcome = $("welcome");
const sendBtn = $("sendBtn");

let chats = JSON.parse(localStorage.getItem("xinn_chats") || "[]");
let loading = false;

function save() {
  localStorage.setItem("xinn_chats", JSON.stringify(chats));
}

function scrollBottom() {
  chat.scrollTo({
    top: chat.scrollHeight,
    behavior: "smooth"
  });
}

function renderMarkdown(text) {
  if (!window.marked) return (text || "").replace(/\n/g, "<br>");
  return marked.parse(text || "");
}

function highlightCode() {
  if (window.Prism) Prism.highlightAll();

  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-code-btn")) return;

    const btn = document.createElement("button");
    btn.className = "copy-code-btn";
    btn.textContent = "Copy";

    btn.onclick = async (e) => {
      e.stopPropagation();
      const code = pre.querySelector("code")?.innerText || pre.innerText;
      await navigator.clipboard.writeText(code);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1200);
    };

    pre.appendChild(btn);
  });
}

function addMessage(role, text, saveIt = true) {
  if (welcome) welcome.style.display = "none";

  const row = document.createElement("div");
  row.className = `msg ${role}`;

  if (role === "ai") {
    const avatar = document.createElement("img");
    avatar.src = "./avatar.gif";
    avatar.className = "chat-avatar";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = renderMarkdown(text);

  row.appendChild(bubble);
  chat.appendChild(row);

  if (saveIt) {
    chats.push({ role, text });
    save();
  }

  highlightCode();
  scrollBottom();
  return bubble;
}

async function typingEffect(el, text) {
  // kalau ada code, tampil agak cepat per blok biar gak nunggu lama
  if (text.includes("```")) {
    await new Promise((r) => setTimeout(r, 500));
    el.innerHTML = renderMarkdown(text);
    highlightCode();
    scrollBottom();
    return;
  }

  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400)); // mikir sebentar

  let output = "";
  const words = text.split(" ");

  for (let i = 0; i < words.length; i++) {
    output += (i === 0 ? "" : " ") + words[i];

    el.innerHTML =
      renderMarkdown(output) +
      `<span class="typing-cursor"></span>`;

    highlightCode();
    scrollBottom();

    let delay = 18 + Math.random() * 18;

    if (/[.,!?]$/.test(words[i])) delay = 55;
    if (i % 12 === 0) delay += 45;

    await new Promise((r) => setTimeout(r, delay));
  }

  el.innerHTML = renderMarkdown(output);
  highlightCode();
  scrollBottom();
}

async function sendMessage() {
  if (loading) return;

  const text = input.value.trim();
  if (!text) return;

  loading = true;
  sendBtn.disabled = true;

  input.value = "";
  input.style.height = "auto";

  addMessage("user", text);

  const aiBubble = addMessage(
    "ai",
    `<span class="typing-dots"><span></span><span></span><span></span></span>`,
    false
  );

  try {
    await new Promise((r) => setTimeout(r, 700));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history: chats.slice(-10)
      })
    });

    const data = await res.json();

    const answer =
      data.text ||
      data.reply ||
      data.answer ||
      "⚠️ AI tidak memberi jawaban.";

    aiBubble.innerHTML = "";
    await typingEffect(aiBubble, answer);

    chats.push({ role: "ai", text: answer });
    save();
  } catch (err) {
    aiBubble.innerHTML = "⚠️ Error: API gagal atau koneksi bermasalah.";
  } finally {
    loading = false;
    sendBtn.disabled = false;
    scrollBottom();
  }
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 130) + "px";
});

window.sendMessage = sendMessage;
