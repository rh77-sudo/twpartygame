/** Policy spectrum quiz v2 — pick anonymous party stances per issue */
/** @typedef {"dpp"|"kmt"|"tpp"} Party */
/** @typedef {"dpp"|"kmt"|"tpp"} Pick */

const APP_VERSION = "2.2.1";

const PARTY_META = {
  dpp: { name: "民進黨", short: "民", class: "dpp" },
  kmt: { name: "國民黨", short: "國", class: "kmt" },
  tpp: { name: "民眾黨", short: "眾", class: "tpp" },
};

const PARTIES = /** @type {Party[]} */ (["dpp", "kmt", "tpp"]);
const OPT_LABELS = ["立場 A", "立場 B", "立場 C"];
const QUESTIONS_PER_ROUND = 6;

const state = {
  mode: /** @type {"national"|"city"} */ ("national"),
  selectedCity: /** @type {string|null} */ (null),
  round: /** @type {any[]} */ ([]),
  index: 0,
  /** @type {{ issue: any, optionOrder: Party[], pick: Pick|null }[]} */
  answers: [],
  /** @type {Pick|null} */
  currentPick: null,
  _results: null,
};

let autoAdvanceTimer = null;

// —— Theme ——
function getPreferredTheme() {
  const saved = localStorage.getItem("policy-spectrum-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.getElementById("meta-theme-color");
  if (meta) meta.setAttribute("content", theme === "dark" ? "#12151c" : "#f3f0ea");
  const btn = document.getElementById("btn-theme");
  if (btn) btn.setAttribute("aria-label", theme === "dark" ? "切換淺色模式" : "切換深色模式");
  localStorage.setItem("policy-spectrum-theme", theme);
}
applyTheme(getPreferredTheme());

function getNationalCount() {
  return typeof ISSUES !== "undefined" ? ISSUES.length : 0;
}
function getCityCount(cityId) {
  if (typeof CITY_ISSUES === "undefined") return 0;
  if (!cityId) return CITY_ISSUES.length;
  return CITY_ISSUES.filter((x) => x.city === cityId).length;
}

function refreshPoolDisplays() {
  const info = document.getElementById("pool-info");
  if (!info) return;
  if (state.mode === "city") {
    if (state.selectedCity && typeof CITY_META !== "undefined" && CITY_META[state.selectedCity]) {
      const n = getCityCount(state.selectedCity);
      info.innerHTML = `<strong>${CITY_META[state.selectedCity].name}</strong> · ${n} 題 · 每局抽 ${Math.min(
        QUESTIONS_PER_ROUND,
        n
      )} · 三匿名立場`;
    } else {
      info.textContent = `城市題庫合計 ${getCityCount()} 題 · 請先選城市`;
    }
  } else {
    const n = getNationalCount();
    info.textContent = n
      ? `全國議題題庫 ${n} 題 · 每局抽 ${Math.min(QUESTIONS_PER_ROUND, n)} · 三匿名立場`
      : "題庫載入中…";
  }
}

function renderCityGrid() {
  const grid = document.getElementById("city-grid");
  if (!grid || typeof CITY_META === "undefined") return;
  grid.innerHTML = Object.entries(CITY_META)
    .map(([id, meta]) => {
      const n = getCityCount(id);
      const sel = state.selectedCity === id ? " selected" : "";
      return `<button type="button" class="city-chip${sel}" data-city="${id}" aria-pressed="${
        state.selectedCity === id ? "true" : "false"
      }">${meta.name}</button>`;
    })
    .join("");
  grid.querySelectorAll(".city-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedCity = btn.dataset.city;
      renderCityGrid();
      refreshPoolDisplays();
    });
  });
}

function setMode(mode) {
  state.mode = mode;
  if (mode !== "city") state.selectedCity = null;
  document.querySelectorAll(".mode-card").forEach((el) => {
    if (el.disabled) return;
    const on = el.dataset.mode === mode;
    el.classList.toggle("selected", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const picker = document.getElementById("city-picker");
  if (picker) picker.classList.toggle("show", mode === "city");
  if (mode === "city") {
    if (!state.selectedCity && typeof CITIES !== "undefined" && CITIES.length) {
      state.selectedCity = CITIES[0];
    }
    renderCityGrid();
  }
  refreshPoolDisplays();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function activeBank() {
  if (state.mode === "city") {
    if (typeof CITY_ISSUES === "undefined") return [];
    if (!state.selectedCity) return [];
    return CITY_ISSUES.filter((x) => x.city === state.selectedCity);
  }
  return typeof ISSUES !== "undefined" ? ISSUES : [];
}

function pickRound(n = QUESTIONS_PER_ROUND) {
  const bank = activeBank();
  if (!bank.length) return [];
  return shuffle(bank).slice(0, Math.min(n, bank.length));
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startGame() {
  if (state.mode === "city" && !state.selectedCity) {
    alert("請先選擇要挑戰的城市");
    return;
  }
  state.round = pickRound(QUESTIONS_PER_ROUND);
  if (!state.round.length) {
    alert("題庫不足，請確認 data/issues-data.js 與 data/city-issues-data.js 是否載入成功");
    return;
  }
  state.index = 0;
  state.answers = state.round.map((issue) => ({
    issue,
    optionOrder: shuffle(PARTIES.slice()),
    pick: null,
  }));
  state.currentPick = null;
  state._results = null;
  const label =
    state.mode === "city" && state.selectedCity && typeof CITY_META !== "undefined"
      ? CITY_META[state.selectedCity].name
      : "全國";
  console.info(
    `[政策光譜 v${APP_VERSION}] ${label} 抽題 ${state.round.length}/${activeBank().length}`
  );
  showScreen("screen-quiz");
  renderQuestion();
}

function startOverToHome() {
  state.round = [];
  state.index = 0;
  state.answers = [];
  state.currentPick = null;
  state._results = null;
  showScreen("screen-start");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnToEditAnswers() {
  if (!state.round.length) {
    startOverToHome();
    return;
  }
  state.index = Math.max(0, state.round.length - 1);
  showScreen("screen-quiz");
  renderQuestion();
}

function renderQuestion() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  const slot = state.answers[state.index];
  const issue = slot.issue;
  const n = state.index + 1;
  const total = state.round.length;

  document.getElementById("progress-text").textContent = `第 ${n}／${total} 題`;
  document.getElementById("progress-pct").textContent = `${Math.round((n / total) * 100)}%`;
  document.getElementById("progress-fill").style.width = `${(n / total) * 100}%`;
  document.getElementById("progress-bar").setAttribute("aria-valuenow", String(n));
  document.getElementById("progress-bar").setAttribute("aria-valuemax", String(total));

  document.getElementById("q-category").textContent = issue.category || "議題";
  document.getElementById("q-text").textContent = issue.topic;

  const prev = slot.pick;
  state.currentPick = prev || null;

  const box = document.getElementById("stance-options");
  box.innerHTML = slot.optionOrder
    .map((party, i) => {
      const st = issue.stances[party] || {};
      const text = st.text || "";
      const plain = (st.plain || "").trim();
      const sel = prev === party ? " selected" : "";
      const pressed = prev === party ? "true" : "false";
      const helpBtn = plain
        ? `<button type="button" class="stance-plain-btn" data-party="${party}" data-label="${OPT_LABELS[i]}" aria-label="用白話說明${OPT_LABELS[i]}" title="白話說明">?</button>`
        : "";
      return `<div class="stance-opt-row${plain ? " has-plain" : ""}">
        <button type="button" class="stance-opt${sel}" data-party="${party}" aria-pressed="${pressed}">
          <span class="opt-label">${OPT_LABELS[i]}</span>
          <span class="opt-text">${escapeHtml(text)}</span>
        </button>
        ${helpBtn}
      </div>`;
    })
    .join("");

  box.querySelectorAll(".stance-opt").forEach((btn) => {
    btn.addEventListener("click", () => selectPick(/** @type {Party} */ (btn.dataset.party)));
  });
  box.querySelectorAll(".stance-plain-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const party = /** @type {Party} */ (btn.dataset.party);
      const label = btn.dataset.label || "此立場";
      openStancePlain(issue, party, label);
    });
  });

  const nextBtn = document.getElementById("btn-next");
  if (prev) nextBtn.classList.add("ready");
  else nextBtn.classList.remove("ready");
  nextBtn.textContent = n === total ? "看結果" : "下一題";

  document.getElementById("btn-prev").disabled = state.index <= 0;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectPick(pick, { autoAdvance = true } = {}) {
  state.currentPick = pick;
  const slot = state.answers[state.index];
  if (slot) slot.pick = pick;

  document.querySelectorAll(".stance-opt").forEach((btn) => {
    const on = btn.dataset.party === pick;
    btn.classList.toggle("selected", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.getElementById("btn-next").classList.add("ready");

  if (autoAdvance) {
    if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null;
      nextQuestion();
    }, 280);
  }
}

function nextQuestion() {
  if (!state.currentPick) return;
  state.answers[state.index].pick = state.currentPick;
  if (state.index >= state.round.length - 1) {
    const missing = state.answers.findIndex((a) => !a.pick);
    if (missing >= 0) {
      state.index = missing;
      renderQuestion();
      alert(`還有題目未作答（第 ${missing + 1} 題），已帶你回去補答。`);
      return;
    }
    renderResults();
    showScreen("screen-results");
  } else {
    state.index++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (state.index <= 0) return;
  if (state.currentPick && state.answers[state.index]) {
    state.answers[state.index].pick = state.currentPick;
  }
  state.index--;
  renderQuestion();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openHelpModal(title, body, { expandHelpBtn = false } = {}) {
  document.getElementById("help-title").textContent = title;
  document.getElementById("help-body").textContent = body;
  const helpModal = document.getElementById("help-modal");
  helpModal.hidden = false;
  helpModal.classList.add("open");
  if (expandHelpBtn) {
    document.getElementById("btn-help").setAttribute("aria-expanded", "true");
  }
  document.getElementById("btn-help-close").focus();
}

function openHelp() {
  const issue = state.answers[state.index].issue;
  openHelpModal("白話說明", issue.simple || issue.topic, { expandHelpBtn: true });
}

function openStancePlain(issue, party, label) {
  const plain = (issue.stances[party] && issue.stances[party].plain) || "";
  if (!plain) return;
  openHelpModal(`${label} · 白話解釋`, plain);
}

function closeHelp() {
  const helpModal = document.getElementById("help-modal");
  helpModal.classList.remove("open");
  helpModal.hidden = true;
  const helpBtn = document.getElementById("btn-help");
  if (helpBtn) helpBtn.setAttribute("aria-expanded", "false");
}

function computeResults() {
  const counts = { dpp: 0, kmt: 0, tpp: 0 };
  let picked = 0;
  for (const a of state.answers) {
    if (a.pick && counts[a.pick] !== undefined) {
      counts[a.pick]++;
      picked++;
    }
  }
  let topParties = [];
  let topCount = -1;
  for (const p of PARTIES) {
    if (counts[p] > topCount) {
      topCount = counts[p];
      topParties = [p];
    } else if (counts[p] === topCount) {
      topParties.push(p);
    }
  }
  return { counts, picked, total: state.answers.length, topParties, topCount };
}

function renderPartyBars(R) {
  const el = document.getElementById("party-bars");
  const max = Math.max(1, ...PARTIES.map((p) => R.counts[p]));
  el.innerHTML = PARTIES.map((p) => {
    const pm = PARTY_META[p];
    const c = R.counts[p];
    const pct = R.picked ? Math.round((c / R.picked) * 100) : 0;
    const w = Math.round((c / max) * 100);
    return `<div class="party-bar-card">
      <h3><span class="pill-name ${pm.class}">${pm.name}</span><span style="font-size:0.85rem;color:var(--muted)">${c} 次 · ${pct}%</span></h3>
      <div class="party-metric">
        <span class="m-label">對齊</span>
        <div class="m-track"><div class="m-fill ${pm.class}" data-w="${w}"></div></div>
        <span class="m-count">${c}</span>
      </div>
    </div>`;
  }).join("");

  requestAnimationFrame(() => {
    el.querySelectorAll(".m-fill").forEach((bar) => {
      bar.style.width = `${bar.getAttribute("data-w") || 0}%`;
    });
  });
}

function renderResults() {
  const R = computeResults();
  state._results = R;

  document.getElementById("stat-picked").textContent = String(R.picked);
  document.getElementById("stat-total").textContent = String(R.total);

  if (R.picked === 0) {
    document.getElementById("headline-insight").textContent =
      "本局尚未完成表態；請每題選一個最認同的立場後再看結果。";
  } else if (R.topParties.length === 1) {
    const name = PARTY_META[R.topParties[0]].name;
    const pct = Math.round((R.topCount / R.picked) * 100);
    document.getElementById("headline-insight").textContent =
      `本局你的選擇最常對齊${name}（${R.topCount}／${R.picked} 題，約 ${pct}%）。`;
  } else {
    const names = R.topParties.map((p) => PARTY_META[p].name).join("、");
    document.getElementById("headline-insight").textContent =
      `本局對齊次數打平：${names}（各 ${R.topCount} 次）。`;
  }

  renderPartyBars(R);

  const insights = [];
  if (R.picked === 0) {
    insights.push("沒有可計算的對齊結果。每題請選一個最接近的立場。");
  } else {
    const ranked = PARTIES.slice().sort((a, b) => R.counts[b] - R.counts[a]);
    insights.push(
      ranked
        .map((p) => `${PARTY_META[p].name} ${R.counts[p]} 次`)
        .join(" · ")
    );
  }
  document.getElementById("insights").innerHTML = insights.map((l) => `<li>${l}</li>`).join("");

  const review = document.getElementById("review-list");
  review.innerHTML = state.answers
    .map((a) => {
      const issue = a.issue;
      const pick = a.pick;
      const pickLabel = pick && PARTY_META[pick] ? PARTY_META[pick].name : "未選";
      const allStances = PARTIES.map((p) => {
        const mark = pick === p ? " ← 你的選擇" : "";
        return `<p><strong class="party ${PARTY_META[p].class}">${PARTY_META[p].name}</strong>：${issue.stances[p].text}${mark}</p>`;
      }).join("");
      return `<details class="review-item">
        <summary>
          <div class="review-head">
            <span class="op-chip agree">對齊 ${pickLabel}</span>
            <span>${issue.category || ""}</span>
          </div>
          <span class="review-text">${issue.topic}</span>
        </summary>
        <div class="review-body">
          <p>${issue.simple || ""}</p>
          ${allStances}
          ${issue.stances.dpp.note || issue.stances.kmt.note || issue.stances.tpp.note
            ? `<p class="note">備註僅供對照：${[issue.stances.dpp.note, issue.stances.kmt.note, issue.stances.tpp.note].filter(Boolean).join(" ／ ")}</p>`
            : ""}
        </div>
      </details>`;
    })
    .join("");
}

// —— Confirm ——
let confirmCallback = null;
const confirmModal = document.getElementById("confirm-modal");

function openConfirm(title, body, onOk) {
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  confirmCallback = onOk;
  confirmModal.hidden = false;
  confirmModal.classList.add("open");
  document.getElementById("btn-confirm-ok").focus();
}
function closeConfirm() {
  confirmModal.classList.remove("open");
  confirmModal.hidden = true;
  confirmCallback = null;
}
function confirmRestart(kind) {
  if (kind === "home") {
    openConfirm("確定要回首頁重來？", "目前作答進度將會清除，且無法復原。", () => {
      closeConfirm();
      startOverToHome();
    });
  } else {
    openConfirm("確定要再玩一輪？", "將重新抽題並清除本輪答案，無法復原。", () => {
      closeConfirm();
      startGame();
    });
  }
}

// —— Events ——
document.getElementById("btn-theme").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  applyTheme(cur === "dark" ? "light" : "dark");
  if (state._results) renderPartyBars(state._results);
});

document.querySelectorAll(".mode-card:not(:disabled)").forEach((card) => {
  card.addEventListener("click", () => setMode(/** @type {"national"|"city"} */ (card.dataset.mode)));
});

document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-next").addEventListener("click", () => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  nextQuestion();
});
document.getElementById("btn-prev").addEventListener("click", () => {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  prevQuestion();
});
document.getElementById("btn-quiz-home").addEventListener("click", () => confirmRestart("home"));
document.getElementById("btn-help").addEventListener("click", openHelp);
document.getElementById("btn-help-close").addEventListener("click", closeHelp);
document.getElementById("help-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("help-modal")) closeHelp();
});
document.getElementById("btn-confirm-cancel").addEventListener("click", closeConfirm);
document.getElementById("btn-confirm-ok").addEventListener("click", () => {
  if (confirmCallback) confirmCallback();
});
document.getElementById("confirm-modal").addEventListener("click", (e) => {
  if (e.target === confirmModal) closeConfirm();
});
document.getElementById("btn-restart").addEventListener("click", () => confirmRestart("again"));
document.getElementById("btn-home").addEventListener("click", () => confirmRestart("home"));
document.getElementById("btn-review-answers").addEventListener("click", returnToEditAnswers);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (confirmModal.classList.contains("open")) closeConfirm();
    else if (document.getElementById("help-modal").classList.contains("open")) closeHelp();
  }
});

// CSS helpers for party name in bars
const styleExtra = document.createElement("style");
styleExtra.textContent = `
  .pill-name { font-weight: 800; }
  .pill-name.dpp { color: var(--dpp-deep); }
  .pill-name.kmt { color: var(--kmt-deep); }
  .pill-name.tpp { color: var(--tpp-ink); }
  .m-fill.dpp { background: var(--dpp); }
  .m-fill.kmt { background: var(--kmt); }
  .m-fill.tpp { background: var(--tpp); }
  .party.dpp { color: var(--dpp-deep); }
  .party.kmt { color: var(--kmt-deep); }
  .party.tpp { color: var(--tpp-ink); }
`;
document.head.appendChild(styleExtra);

document.querySelectorAll(".app-version, #version-badge").forEach((el) => {
  el.textContent = "v" + APP_VERSION;
});
setMode("national");
console.info(
  `[政策光譜 v${APP_VERSION}] 全國 ${getNationalCount()} · 城市 ${getCityCount()}`
);
