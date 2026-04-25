const $ = (id) => document.getElementById(id);

const input = $("messageInput");
const chat = $("chatArea");
const sendBtn = $("sendBtn");
const menuBtn = $("menuBtn");
const moreBtn = $("moreBtn");
const sidebar = $("sidebar");
const overlay = $("overlay");
const moreMenu = $("moreMenu");

let loading = false;

/* ================= SCROLL ================= */
function smoothScroll() {
  chat.scrollTo({
    top: chat.scrollHeight,
    behavior: "smooth"
  });
}

/* ================= ADD MESSAGE ================= */
function addMessage(role, html) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  if (role === "ai") {
    wrap.innerHTML = `
      <img src="./avatar.gif" class="avatar">
      <div class="bubble"></div>
    `;
  } else {
    wrap.innerHTML = `<div class="bubble"></div>`;
  }

  const bubble = wrap.querySelector(".bubble");
  bubble.innerHTML = html;

  chat.appendChild(wrap);
  smoothScroll();

  return bubble;
}

/* ================= MARKDOWN ================= */
function render(text) {
  if (window.marked) {
    return marked.parse(text);
  }
  return text.replace(/\n/g, "<br>");
}

/* ================= COPY BUTTON ================= */
function addCopy() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return;

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.innerText = "Copy";

    btn.onclick = () => {
      navigator.clipboard.writeText(pre.innerText);
      btn.innerText = "Copied";
      setTimeout(() => (btn.innerText = "Copy"), 1000);
    };

    pre.appendChild(btn);
  });
}

/* ================= TYPING ================= */
function typeText(el, text) {
  el.innerHTML = "...";

  setTimeout(() => {
    el.innerHTML = "";
    let i = 0;

    function typing() {
      if (i < text.length) {
        el.innerHTML += text.charAt(i);
        i++;
        smoothScroll();
        setTimeout(typing, 10);
      } else {
        el.innerHTML = render(text);
        addCopy();
      }
    }

    typing();
  }, 300);
}

/* ================= SEND ================= */
async function sendMessage() {
  if (loading) return;

  const text = input.value.trim();
  if (!text) return;

  loading = true;
  input.value = "";

  addMessage("user", text);
  const aiBubble = addMessage("ai", "...");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    const answer =
      data.text || data.reply || data.answer || "Tidak ada respon.";

    typeText(aiBubble, answer);

  } catch (err) {
    aiBubble.innerHTML = "❌ Error API";
  }

  loading = false;
}

/* ================= EVENT ================= */
document.addEventListener("DOMContentLoaded", () => {
  sendBtn?.addEventListener("click", sendMessage);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  menuBtn?.addEventListener("click", () => {
    sidebar?.classList.add("active");
    overlay?.classList.add("active");
  });

  overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("active");
    overlay?.classList.remove("active");
  });

  moreBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    moreMenu?.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    moreMenu?.classList.remove("active");
  });
});

/* ================= GLOBAL ================= */
window.sendMessage = sendMessage;
