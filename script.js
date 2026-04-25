const $ = (id) => document.getElementById(id);

const input = $("messageInput");
const chat = $("chatArea");
const welcome = $("welcome");
const sidebar = $("sidebar");
const overlay = $("overlay");
const moreMenu = $("moreMenu");
const plusMenu = $("plusMenu");
const loginBtn = $("loginBtn");
const userPhoto = $("userPhoto");
const profileMenu = $("profileMenu");
const profilePhoto = $("profilePhoto");
const profileName = $("profileName");
const profileEmail = $("profileEmail");
const logoutBtn = $("logoutBtn");

let chats = JSON.parse(localStorage.getItem("xinn_chats") || "[]");
let loading = false;

function scrollBottom() {
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

function renderText(text) {
  return window.marked ? marked.parse(text || "") : (text || "").replace(/\n/g, "<br>");
}

function addCopyButtons() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return;

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";

    btn.onclick = async (e) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(pre.innerText.replace("Copy", "").trim());
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 1000);
    };

    pre.appendChild(btn);
  });
}

function addMessage(role, text) {
  if (welcome) welcome.style.display = "none";

  const div = document.createElement("div");
  div.className = `message ${role}`;

  if (role === "ai") {
    div.innerHTML = `
      <img src="./avatar.gif" class="chat-avatar">
      <div class="bubble"></div>
    `;
  } else {
    div.innerHTML = `<div class="bubble"></div>`;
  }

  const bubble = div.querySelector(".bubble");
  bubble.innerHTML = text;

  chat.appendChild(div);
  scrollBottom();
  return bubble;
}

function typeText(el, text) {
  el.innerHTML = "...";

  setTimeout(() => {
    el.innerHTML = "";
    let i = 0;

    function run() {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        scrollBottom();
        setTimeout(run, 8);
      } else {
        el.innerHTML = renderText(text);
        addCopyButtons();
      }
    }

    run();
  }, 250);
}

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: chats.slice(-4) })
    });

    const data = await res.json();
    const answer = data.text || data.reply || data.answer || "AI tidak memberi jawaban.";

    typeText(aiBubble, answer);

    chats.push({ role: "user", text });
    chats.push({ role: "ai", text: answer });
    localStorage.setItem("xinn_chats", JSON.stringify(chats));
  } catch {
    aiBubble.innerHTML = "⚠️ Error API.";
  }

  loading = false;
}

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

function quickAsk(text) {
  input.value = text;
  input.focus();
}

function newChat() {
  chats = [];
  localStorage.removeItem("xinn_chats");
  location.reload();
}

function clearChat() {
  newChat();
}

function exportChat() {
  const blob = new Blob([JSON.stringify(chats, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "xinn-ai-chat.json";
  a.click();
}

function toggleTheme() {
  document.body.classList.toggle("light");
}

function handleFile(file) {
  if (!file) return;
  addMessage("user", `📎 File dipilih: ${file.name}`);
}

function setupUser() {
  const user = JSON.parse(localStorage.getItem("xinn_user") || "null");

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (userPhoto) {
      userPhoto.style.display = "block";
      userPhoto.src = user.photo || "./avatar.gif";
      userPhoto.onclick = (e) => {
        e.stopPropagation();
        profileMenu?.classList.toggle("active");
      };
    }

    if (profilePhoto) profilePhoto.src = user.photo || "./avatar.gif";
    if (profileName) profileName.textContent = user.name || "User";
    if (profileEmail) profileEmail.textContent = user.email || "";
  } else {
    if (loginBtn) {
      loginBtn.style.display = "block";
      loginBtn.onclick = () => location.href = "./login.html";
    }
    if (userPhoto) userPhoto.style.display = "none";
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("xinn_user");
      location.href = "./login.html";
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("menuBtn")?.addEventListener("click", openSidebar);
  $("moreBtn")?.addEventListener("click", toggleMore);
  $("sendBtn")?.addEventListener("click", sendMessage);
  document.querySelector(".plus-btn")?.addEventListener("click", togglePlus);
  overlay?.addEventListener("click", closeSidebar);

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  setupUser();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#moreMenu") && !e.target.closest("#moreBtn")) {
    moreMenu?.classList.remove("active");
  }

  if (!e.target.closest("#plusMenu") && !e.target.closest(".plus-btn")) {
    plusMenu?.classList.remove("active");
  }

  if (!e.target.closest("#userArea")) {
    profileMenu?.classList.remove("active");
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
