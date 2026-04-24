const $ = (id) => document.getElementById(id);

const input = $("messageInput");
const chat = $("chatArea");
const welcome = $("welcome");
const sendBtn = $("sendBtn");
const sidebar = $("sidebar");
const overlay = $("overlay");
const moreMenu = $("moreMenu");
const plusMenu = $("plusMenu");

let chats = JSON.parse(localStorage.getItem("xinn_chats") || "[]");
let loading = false;

function save() {
  localStorage.setItem("xinn_chats", JSON.stringify(chats));
}

function scrollBottom() {
  if (!chat) return;
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
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
    avatar.alt = "Xinn AI";
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
  if (!el) return;

  if (text.includes("```")) {
    await new Promise((r) => setTimeout(r, 450));
    el.innerHTML = renderMarkdown(text);
    highlightCode();
    scrollBottom();
    return;
  }

  await new Promise((r) => setTimeout(r, 300 + Math.random() * 250));

  let output = "";
  const words = text.split(" ");

  for (let i = 0; i < words.length; i++) {
    output += (i === 0 ? "" : " ") + words[i];

    el.innerHTML =
      renderMarkdown(output) +
      `<span class="typing-cursor"></span>`;

    highlightCode();
    scrollBottom();

    let delay = 14 + Math.random() * 18;
    if (/[.,!?]$/.test(words[i])) delay = 55;
    if (words.length < 10) delay = 10;

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
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

function openSidebar() {
  if (sidebar) sidebar.classList.add("active");
  if (overlay) overlay.classList.add("active");
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

function toggleMore(e) {
  if (e) e.stopPropagation();
  if (moreMenu) moreMenu.classList.toggle("active");
  if (plusMenu) plusMenu.classList.remove("active");
}

function togglePlus(e) {
  if (e) e.stopPropagation();
  if (plusMenu) plusMenu.classList.toggle("active");
  if (moreMenu) moreMenu.classList.remove("active");
}

function newChat() {
  chats = [];
  localStorage.removeItem("xinn_chats");

  chat.innerHTML = "";

  if (welcome) {
    chat.appendChild(welcome);
    welcome.style.display = "flex";
  }

  closeSidebar();
}

function clearChat() {
  newChat();
  if (moreMenu) moreMenu.classList.remove("active");
}

function exportChat() {
  const blob = new Blob([JSON.stringify(chats, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "xinn-ai-chat.json";
  a.click();
}

function toggleTheme() {
  document.body.classList.toggle("light");
  localStorage.setItem(
    "xinn_theme",
    document.body.classList.contains("light") ? "light" : "dark"
  );

  if (moreMenu) moreMenu.classList.remove("active");
}

function quickAsk(text) {
  input.value = text;
  sendMessage();
}

function handleFile(file) {
  if (!file) return;
  addMessage("user", `File dipilih: **${file.name}**`);
  if (plusMenu) plusMenu.classList.remove("active");
}

if (localStorage.getItem("xinn_theme") === "light") {
  document.body.classList.add("light");
}

if (input) {
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
}

document.addEventListener("click", (e) => {
  if (
    moreMenu &&
    !e.target.closest("#moreMenu") &&
    !e.target.closest(".top-btn")
  ) {
    moreMenu.classList.remove("active");
  }

  if (
    plusMenu &&
    !e.target.closest("#plusMenu") &&
    !e.target.closest(".plus-btn")
  ) {
    plusMenu.classList.remove("active");
  }
});

window.sendMessage = sendMessage;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleMore = toggleMore;
window.togglePlus = togglePlus;
window.newChat = newChat;
window.clearChat = clearChat;
window.exportChat = exportChat;
window.toggleTheme = toggleTheme;
window.quickAsk = quickAsk;
window.handleFile = handleFile;
