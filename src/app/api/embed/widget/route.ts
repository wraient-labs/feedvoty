import { NextRequest, NextResponse } from 'next/server'

// ──────────────────────────────────────────────
// GET /api/embed/widget.js
// Serves the minified embeddable JS widget.
// Usage on any site:
//   <script src="https://feedback.yourdomain.com/api/embed/widget.js"
//           data-workspace-id="xxx"></script>
// ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const widgetJs = `
(function() {
  "use strict";

  // Read configuration from the script tag
  const scripts = document.getElementsByTagName("script");
  let config = {};
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src || "";
    if (src.indexOf("/api/embed/widget.js") !== -1) {
      config.workspaceId = scripts[i].getAttribute("data-workspace-id");
      config.apiUrl = scripts[i].getAttribute("data-api-url") || window.location.origin;
      config.theme = scripts[i].getAttribute("data-theme") || "light";
      config.position = scripts[i].getAttribute("data-position") || "bottom-right";
      config.lang = scripts[i].getAttribute("data-lang") || "en";
      break;
    }
  }

  if (!config.workspaceId) {
    console.error("[feedvoty] data-workspace-id is required on the script tag");
    return;
  }

  const API_BASE = config.apiUrl;
  const WORKSPACE_ID = config.workspaceId;

  // ── i18n ──────────────────────────────────
  const strings = {
    en: { title: "Feedback", submit: "Submit", cancel: "Cancel", placeholder: "Share your feedback...", voted: "Voted!", vote: "Vote", loading: "Loading..." },
    fr: { title: "Retour", submit: "Envoyer", cancel: "Annuler", placeholder: "Partagez votre avis...", voted: "Voté!", vote: "Voter", loading: "Chargement..." },
    de: { title: "Feedback", submit: "Senden", cancel: "Abbrechen", placeholder: "Teile dein Feedback...", voted: "Abgestimmt!", vote: "Abstimmen", loading: "Laden..." },
  };
  const t = strings[config.lang] || strings.en;

  // ── Styles ────────────────────────────────
  const colors = config.theme === "dark"
    ? { bg: "#1a1a2e", surface: "#16213e", text: "#e0e0e0", border: "#0f3460", accent: "#e94560", muted: "#888" }
    : { bg: "#ffffff", surface: "#f8f9fa", text: "#1a1a2e", border: "#e0e0e0", accent: "#4f46e5", muted: "#666" };

  const style = document.createElement("style");
  style.textContent = \`
    #feedvoty-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #feedvoty-widget { position: fixed; \${config.position === "bottom-right" ? "right" : "left"}: 24px; bottom: 24px; z-index: 2147483647; }
    #feedvoty-trigger { background: \${colors.accent}; color: #fff; border: none; border-radius: 50%; width: 56px; height: 56px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-size: 24px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
    #feedvoty-trigger:hover { transform: scale(1.1); }
    #feedvoty-panel { display: none; position: absolute; bottom: 64px; \${config.position === "bottom-right" ? "right" : "left"}: 0; width: 360px; max-height: 500px; background: \${colors.bg}; border: 1px solid \${colors.border}; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden; flex-direction: column; }
    #feedvoty-panel.open { display: flex; }
    #feedvoty-header { background: \${colors.accent}; color: #fff; padding: 16px; font-weight: 600; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
    #feedvoty-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; padding: 4px; }
    #feedvoty-body { padding: 16px; overflow-y: auto; flex: 1; }
    #feedvoty-form { display: flex; flex-direction: column; gap: 12px; }
    #feedvoty-input { width: 100%; min-height: 80px; padding: 12px; border: 1px solid \${colors.border}; border-radius: 8px; background: \${colors.surface}; color: \${colors.text}; font-size: 14px; resize: vertical; }
    #feedvoty-actions { display: flex; gap: 8px; justify-content: flex-end; }
    #feedvoty-submit { background: \${colors.accent}; color: #fff; border: none; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-weight: 500; font-size: 14px; }
    #feedvoty-cancel { background: transparent; color: \${colors.muted}; border: 1px solid \${colors.border}; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-size: 14px; }
    #feedvoty-posts { display: flex; flex-direction: column; gap: 8px; }
    .feedvoty-post { background: \${colors.surface}; border: 1px solid \${colors.border}; border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: flex-start; }
    .feedvoty-post-votes { background: \${colors.bg}; border: 1px solid \${colors.border}; border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 44px; cursor: pointer; font-size: 13px; font-weight: 600; color: \${colors.accent}; }
    .feedvoty-post-title { font-weight: 500; color: \${colors.text}; font-size: 14px; margin-bottom: 4px; }
    .feedvoty-post-meta { font-size: 12px; color: \${colors.muted}; }
    .feedvoty-badge { display: inline-block; background: \${colors.accent}22; color: \${colors.accent}; border-radius: 4px; padding: 2px 6px; font-size: 11px; margin-left: 8px; text-transform: uppercase; }
  \`;
  document.head.appendChild(style);

  // ── Build widget DOM ──────────────────────
  const widget = document.createElement("div");
  widget.id = "feedvoty-widget";
  widget.innerHTML = \`
    <div id="feedvoty-panel">
      <div id="feedvoty-header">
        <span>\${t.title}</span>
        <button id="feedvoty-close">&times;</button>
      </div>
      <div id="feedvoty-body">
        <div id="feedvoty-form">
          <textarea id="feedvoty-input" placeholder="\${t.placeholder}"></textarea>
          <div id="feedvoty-actions">
            <button id="feedvoty-cancel">\${t.cancel}</button>
            <button id="feedvoty-submit">\${t.submit}</button>
          </div>
        </div>
        <div id="feedvoty-posts"></div>
      </div>
    </div>
    <button id="feedvoty-trigger">💬</button>
  \`;
  document.body.appendChild(widget);

  // ── Interactivity ─────────────────────────
  const panel = document.getElementById("feedvoty-panel");
  const trigger = document.getElementById("feedvoty-trigger");
  const closeBtn = document.getElementById("feedvoty-close");
  const cancelBtn = document.getElementById("feedvoty-cancel");
  const submitBtn = document.getElementById("feedvoty-submit");
  const input = document.getElementById("feedvoty-input");
  const postsContainer = document.getElementById("feedvoty-posts");
  const form = document.getElementById("feedvoty-form");

  function openPanel() { panel.classList.add("open"); loadPosts(); }
  function closePanel() { panel.classList.remove("open"); }

  trigger.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  cancelBtn.addEventListener("click", () => { input.value = ""; closePanel(); });

  submitBtn.addEventListener("click", async () => {
    const title = input.value.trim();
    if (!title) return;
    submitBtn.textContent = t.loading;
    submitBtn.disabled = true;
    try {
      await fetch(\`\${API_BASE}/api/posts\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: WORKSPACE_ID, title }),
      });
      input.value = "";
      await loadPosts();
    } catch (e) { console.error("[feedvoty]", e); }
    submitBtn.textContent = t.submit;
    submitBtn.disabled = false;
  });

  async function loadPosts() {
    postsContainer.innerHTML = \`<p style="text-align:center;color:\${colors.muted};padding:20px">\${t.loading}</p>\`;
    form.style.display = "none";
    postsContainer.style.display = "flex";
    try {
      const res = await fetch(\`\${API_BASE}/api/posts?workspace_id=\${WORKSPACE_ID}&sort=votes\`);
      const json = await res.json();
      const posts = json.posts || [];
      if (!posts.length) {
        postsContainer.innerHTML = \`<p style="text-align:center;color:\${colors.muted};padding:20px">No feedback yet. Be the first!</p>\`;
        return;
      }
      postsContainer.innerHTML = posts.slice(0, 20).map(p => \`
        <div class="feedvoty-post" data-id="\${p.id}">
          <div class="feedvoty-post-votes">\${p.vote_count || 0}</div>
          <div>
            <div class="feedvoty-post-title">\${esc(p.title)}</div>
            <div class="feedvoty-post-meta">\${p.status ? \`<span class="feedvoty-badge">\${p.status.replace("_"," ")}</span>\` : ""}</div>
          </div>
        </div>
      \`).join("");
    } catch (e) {
      postsContainer.innerHTML = \`<p style="text-align:center;color:\${colors.muted};padding:20px">Error loading feedback</p>\`;
    }
  }

  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
})();
  `.trim();

  return new NextResponse(widgetJs, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
