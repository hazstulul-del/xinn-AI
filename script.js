const $ = (id) => document.getElementById(id);

const input = $("messageInput");
const chat = $("chatArea");
const welcome = $("welcome");
const sidebar = $("sidebar");
const overlay = $("overlay");
const moreMenu = $("moreMenu");
const plusMenu = $("plusMenu");

let chats = JSON.parse(localStorage.getItem("xinn_chats") || "[]");
let loading = false;

/* ================= SAVE ================= */
function save() {
  localStorage.setItem("xinn_chats", JSON.stringify(chats));
}

/* ================= SCROLL ================= */
function smoothScroll() {
  chat.scrollTo({
    top: chat.scrollHeight,
    behavior: "smooth"
  });
}

/* ================= MARKDOWN RENDER ================= */
function renderMarkdown(text) {
  if (window.marked) return marked.parse(text);
  return text.replace(/\n/g, "<br>");
}

/* ================= CODE COPY ================= */
function addCopyButtons() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return;

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.innerText = "Copy";

    btn.onclick = async () => {
      const code = pre.innerText;
      await navigator.clipboard.writeText(code);
      btn.innerText = "Copied!";
      setTimeout(() => (btn.innerText = "Copy"), 1200);
    };

    pre.appendChild(btn);
  });
}

/* ================= ADD MESSAGE ================= */
function addMessage(role, text) {
  if (welcome) welcome.style.display = "none";

  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  if (role === "ai") {
    wrap.innerHTML = `
      <div class="avatar">
        <img src="./avatar.gif">
      </div>
      <div class="bubble"></div>
    `;
  } else {
    wrap.innerHTML = `
      <div class="bubble"></div>
    `;
  }

  chat.appendChild(wrap);
  smoothScroll();

  return wrap.querySelector(".bubble");
}

/* ================= TYPING EFFECT ================= */
function typeText(el, text) {
  el.innerHTML = "";
  let i = 0;

  function typing() {
    if (i < text.length) {
      el.innerHTML += text.charAt(i);
      i++;
      smoothScroll();
      setTimeout(typing, 12); // kecepatan GPT feel
    } else {
      el.innerHTML = renderMarkdown(text);
      addCopyButtons();
    }
  }

  typing();
}

/* ================= SEND MESSAGE ================= */
async function sendMessage() {
  if (loading) return;

  const text = input.value.trim();
  if (!text) return;

  loading = true;
  input.value = "";

  addMessage("user", text);
  const aiBubble = addMessage("ai", "•••");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        history: chats.slice(-4)
      })
    });

    const data = await res.json();
    const answer =
      data.text ||
      data.reply ||
      data.answer ||
      "Maaf, terjadi kesalahan.";

    typeText(aiBubble, answer);

    chats.push({ role: "user", text });
    chats.push({ role: "ai", text: answer });
    save();
  } catch (err) {
    aiBubble.innerHTML = "⚠️ Error koneksi API.";
  }

  loading = false;
}

/* ================= UI ================= */
function openSidebar() {
  sidebar?.classList.add("active");
  overlay?.classList.add("active");
}

function closeSidebar() {
  sidebar?.classList.remove("active");
  overlay?.classList.remove("active");
}

function toggleMore(e) {
  e?.stopPropagation();
  moreMenu?.classList.toggle("active");
  plusMenu?.classList.remove("active");
}

function togglePlus(e) {
  e?.stopPropagation();
  plusMenu?.classList.toggle("active");
  moreMenu?.classList.remove("active");
}

/* ================= CLICK CLOSE ================= */
document.addEventListener("click", (e) => {
  if (!e.target.closest("#moreMenu") && !e.target.closest("#moreBtn")) {
    moreMenu?.classList.remove("active");
  }

  if (!e.target.closest("#plusMenu") && !e.target.closest(".plus-btn")) {
    plusMenu?.classList.remove("active");
  }
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  $("menuBtn")?.addEventListener("click", openSidebar);
  $("moreBtn")?.addEventListener("click", toggleMore);
  $("sendBtn")?.addEventListener("click", sendMessage);
  overlay?.addEventListener("click", closeSidebar);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});

/* ================= GLOBAL ================= */
window.sendMessage = sendMessage;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleMore = toggleMore;
window.togglePlus = togglePlus;
