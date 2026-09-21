/**
 * app.js
 * ------
 * App shell: routing between views, and a render function per view.
 * Every render function is pure UI + reads from Store; every mutation
 * goes back through Store, then re-renders the current view so the
 * whole app (dashboard cards, progress bars, charts) always reflects
 * localStorage.
 */

const App = {
  view: "dashboard",
  dateKey: DateUtil.todayKey(),

  init() {
    Store.load();
    this.bindNav();
    this.bindGlobal();
    this.bindSplash();
    this.renderShellInfo();
    this.navigate("dashboard");
  },

  bindNav() {
    document.querySelectorAll("[data-view]").forEach((el) => {
      el.addEventListener("click", () => {
        this.navigate(el.dataset.view);
        closeSidebar();
      });
    });
  },

  bindGlobal() {
    document.getElementById("hamburgerBtn").addEventListener("click", openSidebar);
    document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);
  },

  bindSplash() {
    const splash = document.getElementById("splashScreen");
    const enterBtn = document.getElementById("splashEnterBtn");
    if (!splash || !enterBtn) return;
    document.body.classList.add("no-scroll");
    if (window.lucide) lucide.createIcons();
    const enter = () => {
      splash.classList.add("is-hidden");
      document.body.classList.remove("no-scroll");
      setTimeout(() => { splash.style.display = "none"; }, 650);
    };
    enterBtn.addEventListener("click", enter);
  },

  renderShellInfo() {
    document.getElementById("todayDate").textContent = DateUtil.formatShort(DateUtil.todayKey());
    const profile = Store.getProfile();
    const name = profile.name || "Guest";
    const initial = name.trim()[0] ? name.trim()[0].toUpperCase() : "U";
    document.getElementById("profileMiniName").textContent = name;
    document.getElementById("profileMiniLevel").textContent = profile.activityLevel || "ตั้งค่าโปรไฟล์";
    document.getElementById("avatarMini").textContent = initial;
    document.getElementById("avatarMiniTop").textContent = initial;
  },

  navigate(view) {
    this.view = view;
    document.querySelectorAll(".nav-item, .bnav-item").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.view === view);
    });
    this.render();
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  },

  render() {
    const main = document.getElementById("mainContent");
    const renderers = {
      dashboard: renderDashboard,
      plan: renderPlan,
      food: renderFood,
      sleep: renderSleep,
      workout: renderWorkout,
      hydration: renderHydration,
      coach: renderCoach,
      tips: renderTips,
      progress: renderProgress,
      profile: renderProfile
    };
    main.innerHTML = (renderers[this.view] || renderDashboard)();
    if (window.lucide) lucide.createIcons();
    const afterRenderers = {
      dashboard: bindDashboard,
      plan: bindPlan,
      food: bindFood,
      sleep: bindSleep,
      workout: bindWorkout,
      hydration: bindHydration,
      coach: bindCoach,
      progress: bindProgressCharts,
      profile: bindProfile
    };
    if (afterRenderers[this.view]) afterRenderers[this.view]();
  }
};

// ---------------------------------------------------------------------------
// Sidebar (mobile) open/close
// ---------------------------------------------------------------------------
function openSidebar() {
  document.getElementById("sidebar").classList.add("is-open");
  document.getElementById("sidebarOverlay").classList.add("is-visible");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("is-open");
  document.getElementById("sidebarOverlay").classList.remove("is-visible");
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

// ---------------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------------
function progressBar(percent, color) {
  const p = Math.max(0, Math.min(100, percent));
  return `<div class="pbar"><div class="pbar-fill pbar-fill--${color}" style="width:${p}%"></div></div>`;
}

// Compact, reusable image banner used at the top of Plan / Workout / Progress /
// Sleep / Health Tips. Keeps every page's photo usage consistent instead of
// hand-rolling markup per view.
function pageHero(imageObj, eyebrow, title, sub, modifier) {
  return `
    <div class="page-hero${modifier ? ` page-hero--${modifier}` : ""}" style="background-image:url('${imageObj.url}')" role="img" aria-label="${imageObj.alt}">
      <div class="page-hero-content">
        ${eyebrow ? `<p class="page-hero-eyebrow">${eyebrow}</p>` : ""}
        <h1>${title}</h1>
        ${sub ? `<p class="page-hero-sub">${sub}</p>` : ""}
      </div>
    </div>`;
}

function emptyState(icon, text, actionLabel, actionAttr) {
  return `
    <div class="empty-state">
      <i data-lucide="${icon}"></i>
      <p>${text}</p>
      ${actionLabel ? `<button class="btn btn--ghost" ${actionAttr}>${actionLabel}</button>` : ""}
    </div>`;
}

function computeTodayStats(day) {
  const sleepPct = day.sleep.durationMinutes ? Math.min(100, Math.round((day.sleep.durationMinutes / 480) * 100)) : 0;
  const workoutMin = day.workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0);
  const workoutPct = Math.min(100, Math.round((workoutMin / 30) * 100));
  const hydrationPct = Math.min(100, Math.round((day.hydrationMl / day.hydrationGoalMl) * 100));
  const mealsDone = Object.values(day.food).reduce((s, arr) => s + arr.filter(f => f.completed).length, 0);
  const mealsTotal = Math.max(3, Object.values(day.food).reduce((s, arr) => s + arr.length, 0));
  const foodPct = Math.round((mealsDone / mealsTotal) * 100);
  return { sleepPct, workoutMin, workoutPct, hydrationPct, mealsDone, mealsTotal, foodPct };
}

// =============================================================================
// 6 & 7 & 8. DASHBOARD
// =============================================================================
function renderDashboard() {
  const day = Store.getDay(DateUtil.todayKey());
  const stats = computeTodayStats(day);
  const profile = Store.getProfile();
  const name = profile.name ? `, ${profile.name}` : "";

  return `
    <section class="view view--dashboard">
      <div class="hero hero--photo" style="background-image:url('${imageAssets.dashboardHero.url}')" role="img" aria-label="${imageAssets.dashboardHero.alt}">
        <div class="hero-text">
          <p class="hero-eyebrow">${DateUtil.greeting()}${name}</p>
          <h1>Ready to take care of yourself today?</h1>
          <p class="hero-date">${DateUtil.formatThai(DateUtil.todayKey())}</p>
          <div class="hero-actions">
            <button class="btn btn--primary" id="btnStartToday"><i data-lucide="play"></i> Start Today</button>
            <button class="btn btn--outline" data-view="coach"><i data-lucide="sparkles"></i> Ask AI Coach</button>
          </div>
        </div>
      </div>

      <h2 class="section-title">Today's Overview</h2>
      <div class="grid grid--4">
        <div class="stat-card stat-card--green">
          <div class="stat-card-head"><i data-lucide="salad"></i><span>FOOD</span></div>
          <p class="stat-card-value">${stats.mealsDone} / ${stats.mealsTotal}</p>
          <p class="stat-card-sub">meals completed</p>
          ${progressBar(stats.foodPct, "green")}
        </div>
        <div class="stat-card stat-card--purple">
          <div class="stat-card-head"><i data-lucide="moon"></i><span>SLEEP</span></div>
          <p class="stat-card-value">${day.sleep.durationMinutes ? formatDuration(day.sleep.durationMinutes) : "—"}</p>
          <p class="stat-card-sub">${day.sleep.quality || "no data yet"}</p>
          ${progressBar(stats.sleepPct, "purple")}
        </div>
        <div class="stat-card stat-card--blue">
          <div class="stat-card-head"><i data-lucide="dumbbell"></i><span>WORKOUT</span></div>
          <p class="stat-card-value">${stats.workoutMin} min</p>
          <p class="stat-card-sub">${stats.workoutPct >= 100 ? "COMPLETED" : "in progress"}</p>
          ${progressBar(stats.workoutPct, "blue")}
        </div>
        <div class="stat-card stat-card--cyan">
          <div class="stat-card-head"><i data-lucide="droplets"></i><span>HYDRATION</span></div>
          <p class="stat-card-value">${(day.hydrationMl / 1000).toFixed(1)} / ${(day.hydrationGoalMl / 1000).toFixed(1)} L</p>
          <p class="stat-card-sub">${stats.hydrationPct}%</p>
          ${progressBar(stats.hydrationPct, "cyan")}
        </div>
      </div>

      <h2 class="section-title">Daily Timeline</h2>
      <div class="timeline-card">
        ${day.timeline.map(item => `
          <label class="timeline-row ${item.completed ? "is-done" : ""}">
            <input type="checkbox" data-timeline-id="${item.id}" ${item.completed ? "checked" : ""} />
            <span class="timeline-time">${item.time}</span>
            <span class="timeline-title">${item.title}</span>
          </label>
        `).join("")}
      </div>
    </section>
  `;
}

function bindDashboard() {
  document.querySelectorAll("[data-timeline-id]").forEach((cb) => {
    cb.addEventListener("change", () => {
      Store.updateDay(DateUtil.todayKey(), (day) => {
        const item = day.timeline.find(t => t.id === cb.dataset.timelineId);
        if (item) item.completed = cb.checked;
      });
      App.render();
    });
  });
  const startBtn = document.getElementById("btnStartToday");
  if (startBtn) startBtn.addEventListener("click", () => App.navigate("plan"));
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

// =============================================================================
// 8. MY PLAN (timeline management)
// =============================================================================
function renderPlan() {
  const day = Store.getDay(App.dateKey);
  return `
    <section class="view">
      ${pageHero(imageAssets.planHero, "MY PLAN", "จัดตารางวันนี้ของคุณ", DateUtil.formatThai(App.dateKey))}
      ${dateNav()}
      <div class="panel">
        <div class="panel-head">
          <h2>Today's Timeline</h2>
          <button class="btn btn--primary btn--sm" id="btnAddTimeline"><i data-lucide="plus"></i> Add Activity</button>
        </div>
        ${day.timeline.length === 0 ? emptyState("calendar-x", "ยังไม่มีกิจกรรมในวันนี้", "ADD NOW", 'id="emptyAddTimeline"') : `
        <div class="timeline-card timeline-card--editable">
          ${day.timeline.map(item => `
            <div class="timeline-row timeline-row--editable ${item.completed ? "is-done" : ""}">
              <input type="checkbox" data-plan-toggle="${item.id}" ${item.completed ? "checked" : ""} />
              <span class="timeline-time">${item.time}</span>
              <span class="timeline-title">${item.title}</span>
              <div class="row-actions">
                <button class="icon-btn" data-plan-edit="${item.id}" aria-label="แก้ไข"><i data-lucide="pencil"></i></button>
                <button class="icon-btn icon-btn--danger" data-plan-delete="${item.id}" aria-label="ลบ"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
          `).join("")}
        </div>`}
      </div>
    </section>
  `;
}

function dateNav() {
  return `
    <div class="date-nav">
      <button class="icon-btn" id="datePrev" aria-label="วันก่อนหน้า"><i data-lucide="chevron-left"></i></button>
      <span class="date-nav-current">${App.dateKey === DateUtil.todayKey() ? "Today · " : ""}${DateUtil.formatShort(App.dateKey)}</span>
      <button class="icon-btn" id="dateNext" aria-label="วันถัดไป"><i data-lucide="chevron-right"></i></button>
    </div>`;
}

function bindDateNav(refreshFn) {
  const prev = document.getElementById("datePrev");
  const next = document.getElementById("dateNext");
  if (prev) prev.addEventListener("click", () => { App.dateKey = DateUtil.addDays(App.dateKey, -1); refreshFn(); });
  if (next) next.addEventListener("click", () => { App.dateKey = DateUtil.addDays(App.dateKey, 1); refreshFn(); });
}

function bindPlan() {
  bindDateNav(() => App.render());
  document.querySelectorAll("[data-plan-toggle]").forEach(cb => {
    cb.addEventListener("change", () => {
      Store.updateDay(App.dateKey, day => {
        const item = day.timeline.find(t => t.id === cb.dataset.planToggle);
        if (item) item.completed = cb.checked;
      });
      App.render();
    });
  });
  document.querySelectorAll("[data-plan-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      Store.updateDay(App.dateKey, day => {
        day.timeline = day.timeline.filter(t => t.id !== btn.dataset.planDelete);
      });
      showToast("ลบกิจกรรมแล้ว");
      App.render();
    });
  });
  document.querySelectorAll("[data-plan-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const day = Store.getDay(App.dateKey);
      const item = day.timeline.find(t => t.id === btn.dataset.planEdit);
      if (!item) return;
      const newTitle = prompt("แก้ไขชื่อกิจกรรม", item.title);
      if (newTitle === null) return;
      const newTime = prompt("แก้ไขเวลา (HH:MM)", item.time) || item.time;
      Store.updateDay(App.dateKey, d => {
        const it = d.timeline.find(t => t.id === item.id);
        it.title = newTitle.trim() || it.title;
        it.time = newTime.trim() || it.time;
      });
      App.render();
    });
  });
  const addBtn = document.getElementById("btnAddTimeline") || document.getElementById("emptyAddTimeline");
  if (addBtn) addBtn.addEventListener("click", () => {
    const title = prompt("ชื่อกิจกรรมใหม่");
    if (!title) return;
    const time = prompt("เวลา (HH:MM)", "12:00") || "12:00";
    Store.updateDay(App.dateKey, day => {
      day.timeline.push({ id: uid("t"), time, title: title.trim(), completed: false });
      day.timeline.sort((a, b) => a.time.localeCompare(b.time));
    });
    App.render();
  });
}

// =============================================================================
// 9. FOOD TRACKER
// =============================================================================
const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" }
];

function renderFood() {
  const day = Store.getDay(App.dateKey);
  const tip = pickDeterministic([
    "ลองเพิ่มผักหรือผลไม้ในมื้ออาหารวันนี้",
    "เลือกธัญพืชไม่ขัดสีแทนแป้งขาวบ้างก็ดีนะครับ",
    "อย่าลืมดื่มน้ำเปล่าคู่กับมื้ออาหารด้วยครับ"
  ], App.dateKey);

  return `
    <section class="view">
      ${pageHero(imageAssets.foodHero, "FOOD", "เติมพลังให้ร่างกายพร้อมลุย", "บันทึกมื้ออาหารของวันนี้ ไม่ต้องนับแคลอรี่ เน้นความหลากหลาย", "food")}
      ${dateNav()}
      <div class="tip-banner tip-banner--green"><i data-lucide="lightbulb"></i><span>${tip}</span></div>

      ${MEAL_TYPES.map(meal => `
        <div class="panel">
          <div class="panel-head">
            <h2>${meal.label}</h2>
            <button class="btn btn--primary btn--sm" data-add-food="${meal.key}"><i data-lucide="plus"></i> Add Food</button>
          </div>
          ${day.food[meal.key].length === 0
            ? emptyState("utensils", "No meals logged yet.", "ADD NOW", `data-add-food="${meal.key}"`)
            : `<div class="food-grid">
                ${day.food[meal.key].map(f => `
                  <div class="food-card ${f.completed ? "is-done" : ""}">
                    <div class="food-card-img" style="background-image:url('${f.image || mealDefaultImages[meal.key].url}')"></div>
                    <div class="food-card-body">
                      <div class="food-card-top">
                        <h3>${escapeHtml(f.name)}</h3>
                        <label class="mini-check">
                          <input type="checkbox" data-food-toggle="${meal.key}:${f.id}" ${f.completed ? "checked" : ""} />
                        </label>
                      </div>
                      <p class="food-card-time">${f.time || ""}</p>
                      ${f.description ? `<p class="food-card-desc">${escapeHtml(f.description)}</p>` : ""}
                      <div class="row-actions">
                        <button class="icon-btn icon-btn--danger" data-food-delete="${meal.key}:${f.id}" aria-label="ลบ"><i data-lucide="trash-2"></i></button>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>`
          }
        </div>
      `).join("")}
    </section>
  `;
}

function bindFood() {
  bindDateNav(() => App.render());
  document.querySelectorAll("[data-add-food]").forEach(btn => {
    btn.addEventListener("click", () => openFoodForm(btn.dataset.addFood));
  });
  document.querySelectorAll("[data-food-toggle]").forEach(cb => {
    cb.addEventListener("change", () => {
      const [mealKey, id] = cb.dataset.foodToggle.split(":");
      Store.updateDay(App.dateKey, day => {
        const item = day.food[mealKey].find(f => f.id === id);
        if (item) item.completed = cb.checked;
      });
      App.render();
    });
  });
  document.querySelectorAll("[data-food-delete]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [mealKey, id] = btn.dataset.foodDelete.split(":");
      Store.updateDay(App.dateKey, day => {
        day.food[mealKey] = day.food[mealKey].filter(f => f.id !== id);
      });
      showToast("ลบรายการอาหารแล้ว");
      App.render();
    });
  });
}

function openFoodForm(defaultMealKey) {
  const name = prompt("ชื่ออาหาร (Food Name)");
  if (!name) return;
  const mealTypeInput = prompt("ประเภทมื้อ (breakfast / lunch / dinner / snack)", defaultMealKey) || defaultMealKey;
  const mealKey = MEAL_TYPES.some(m => m.key === mealTypeInput) ? mealTypeInput : defaultMealKey;
  const time = prompt("เวลา (HH:MM)", "12:00") || "";
  const description = prompt("รายละเอียด (ไม่บังคับ)") || "";
  Store.updateDay(App.dateKey, day => {
    day.food[mealKey].push({ id: uid("food"), name: name.trim(), time, description, completed: false });
  });
  showToast("บันทึกอาหารแล้ว");
  App.render();
}

function pickDeterministic(arr, seedKey) {
  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) hash = (hash * 31 + seedKey.charCodeAt(i)) >>> 0;
  return arr[hash % arr.length];
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// =============================================================================
// 10. SLEEP TRACKER
// =============================================================================
function renderSleep() {
  const day = Store.getDay(App.dateKey);
  const score = sleepScore(day.sleep.durationMinutes, day.sleep.quality);
  const weekKeys = DateUtil.last7Keys(App.dateKey);
  return `
    <section class="view">
      ${pageHero(imageAssets.recoveryHero, "SLEEP & RECOVERY", "พักผ่อนให้เพียงพอ คือส่วนหนึ่งของแผน", "ติดตามการนอนหลับเพื่อสุขภาพที่ดีขึ้น", "calm")}
      ${dateNav()}
      <div class="grid grid--2">
        <div class="panel">
          <h2>Sleep Log</h2>
          ${day.sleep.durationMinutes ? `
            <div class="sleep-summary">
              <div><span class="label">Bed Time</span><strong>${day.sleep.bedTime || "—"}</strong></div>
              <div><span class="label">Wake Time</span><strong>${day.sleep.wakeTime || "—"}</strong></div>
              <div><span class="label">Duration</span><strong>${formatDuration(day.sleep.durationMinutes)}</strong></div>
              <div><span class="label">Quality</span><strong>${day.sleep.quality || "—"}</strong></div>
            </div>
          ` : emptyState("moon", "ยังไม่มีข้อมูลการนอน", "LOG SLEEP", 'id="emptyLogSleep"')}
          <button class="btn btn--primary" id="btnLogSleep"><i data-lucide="pencil"></i> Log Sleep</button>
        </div>
        <div class="panel score-panel score-panel--purple">
          <h2>Sleep Score</h2>
          <p class="score-value">${score !== null ? `${score} / 100` : "—"}</p>
          <p class="score-label">${scoreLabel(score)}</p>
        </div>
      </div>
      <div class="panel">
        <h2>7-Day Sleep Trend</h2>
        <div class="chart-wrap"><canvas id="sleepChart"></canvas></div>
      </div>
      <div class="tip-banner tip-banner--purple"><i data-lucide="lightbulb"></i><span>พยายามรักษาเวลานอนและเวลาตื่นให้ใกล้เคียงกันในแต่ละวัน</span></div>
    </section>
  `;
}

function sleepScore(minutes, quality) {
  if (!minutes) return null;
  const durationScore = Math.max(0, 100 - Math.abs(480 - minutes) / 4);
  const qualityBonus = { "Excellent": 10, "Good": 5, "Fair": 0, "Poor": -10 }[quality] || 0;
  return Math.max(0, Math.min(100, Math.round(durationScore + qualityBonus)));
}
function scoreLabel(score) {
  if (score === null) return "no data yet";
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "FAIR";
  return "NEEDS ATTENTION";
}

function bindSleep() {
  bindDateNav(() => App.render());
  const weekKeys = DateUtil.last7Keys(App.dateKey);
  const hours = weekKeys.map(k => {
    const d = Store.getDay(k);
    return d.sleep.durationMinutes ? Math.round((d.sleep.durationMinutes / 60) * 10) / 10 : 0;
  });
  renderSleepChart("sleepChart", weekKeys.map(DateUtil.weekdayShort.bind(DateUtil)), hours);

  const openForm = () => {
    const bedTime = prompt("เวลาเข้านอน (HH:MM)", "23:00");
    if (bedTime === null) return;
    const wakeTime = prompt("เวลาตื่น (HH:MM)", "06:30") || "06:30";
    const quality = prompt("คุณภาพการนอน (Excellent / Good / Fair / Poor)", "Good") || "Good";
    const duration = computeSleepMinutes(bedTime, wakeTime);
    Store.updateDay(App.dateKey, day => {
      day.sleep = { bedTime, wakeTime, durationMinutes: duration, quality };
    });
    App.render();
  };
  const btn1 = document.getElementById("btnLogSleep");
  const btn2 = document.getElementById("emptyLogSleep");
  if (btn1) btn1.addEventListener("click", openForm);
  if (btn2) btn2.addEventListener("click", openForm);
}

function computeSleepMinutes(bedTime, wakeTime) {
  const [bh, bm] = bedTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
  return wakeMinutes - bedMinutes;
}

// =============================================================================
// 11. WORKOUT
// =============================================================================
function renderWorkout() {
  const day = Store.getDay(App.dateKey);
  const doneIds = day.workouts.map(w => w.planId);
  const featured = workoutLibrary.plans.find(p => !doneIds.includes(p.id)) || workoutLibrary.plans[0];
  return `
    <section class="view">
      ${pageHero(imageAssets.workoutHero, "WORKOUT", "ฝึกวันนี้ให้คุ้มค่า", "เลือกโปรแกรมที่เหมาะกับวันนี้ ไม่จำเป็นต้องหักโหม")}
      ${dateNav()}

      <div class="featured-workout-card featured-workout-card--${featured.color}">
        <div class="featured-workout-label">TODAY'S WORKOUT</div>
        <h2>${featured.name}</h2>
        <div class="featured-workout-stats">
          <span><i data-lucide="flame"></i> ${featured.estimatedMinutes} นาที</span>
          <span><i data-lucide="dumbbell"></i> ${featured.exercises.length} Exercises</span>
          <span><i data-lucide="zap"></i> ${featured.difficulty}</span>
        </div>
        <button class="btn btn--primary" data-start-workout="${featured.id}"><i data-lucide="play"></i> เริ่มออกกำลังกาย</button>
      </div>

      <div class="chip-row">
        ${workoutLibrary.categories.map(c => `<span class="chip">${c}</span>`).join("")}
      </div>
      <div class="grid grid--2">
        ${workoutLibrary.plans.map(plan => `
          <div class="workout-plan-card workout-plan-card--${plan.color}">
            <div class="workout-plan-head">
              <span class="tag tag--${plan.color}">${plan.category}</span>
              <h3>${plan.name}</h3>
            </div>
            <ul class="exercise-list">
              ${plan.exercises.slice(0, 3).map(ex => `<li>${ex.name} · ${ex.duration}</li>`).join("")}
              ${plan.exercises.length > 3 ? `<li class="exercise-list-more">+${plan.exercises.length - 3} more</li>` : ""}
            </ul>
            <button class="btn btn--primary btn--sm" data-start-workout="${plan.id}"><i data-lucide="play"></i> Start Workout</button>
          </div>
        `).join("")}
      </div>

      ${day.workouts.length > 0 ? `
        <div class="panel">
          <h2>Today's Activity</h2>
          <ul class="done-list">
            ${day.workouts.map(w => `<li><i data-lucide="check-circle-2"></i> ${escapeHtml(w.name)} — ${w.durationMinutes} min</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <div id="workoutRunner"></div>
    </section>
  `;
}

let workoutTimerState = { seconds: 0, interval: null, running: false };

function bindWorkout() {
  bindDateNav(() => App.render());
  document.querySelectorAll("[data-start-workout]").forEach(btn => {
    btn.addEventListener("click", () => startWorkoutRunner(btn.dataset.startWorkout));
  });
}

function startWorkoutRunner(planId) {
  const plan = workoutLibrary.plans.find(p => p.id === planId);
  if (!plan) return;
  clearInterval(workoutTimerState.interval);
  workoutTimerState = { seconds: 300, interval: null, running: false, planId };
  renderWorkoutRunner(plan);
}

function renderWorkoutRunner(plan) {
  const holder = document.getElementById("workoutRunner");
  if (!holder) return;
  holder.innerHTML = `
    <div class="panel runner-panel">
      <h2>${plan.name}</h2>
      <p class="runner-exercises">${plan.exercises.map(e => e.name).join(" → ")}</p>
      <p class="runner-safety"><i data-lucide="shield-check"></i> ${plan.exercises[0].safetyTip}</p>
      <div class="runner-timer" id="runnerTimer">${formatTimer(workoutTimerState.seconds)}</div>
      <div class="runner-controls">
        <button class="btn btn--outline" id="btnPauseResume">${workoutTimerState.running ? "Pause" : "Resume"}</button>
        <button class="btn btn--primary" id="btnFinishWorkout"><i data-lucide="flag"></i> Finish</button>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  document.getElementById("btnPauseResume").addEventListener("click", () => {
    toggleWorkoutTimer(plan);
  });
  document.getElementById("btnFinishWorkout").addEventListener("click", () => finishWorkout(plan));
  toggleWorkoutTimer(plan, true); // auto-start
}

function toggleWorkoutTimer(plan, forceStart) {
  const shouldStart = forceStart || !workoutTimerState.running;
  workoutTimerState.running = shouldStart;
  clearInterval(workoutTimerState.interval);
  const btn = document.getElementById("btnPauseResume");
  if (btn) btn.textContent = shouldStart ? "Pause" : "Resume";
  if (shouldStart) {
    workoutTimerState.interval = setInterval(() => {
      workoutTimerState.seconds = Math.max(0, workoutTimerState.seconds - 1);
      const timerEl = document.getElementById("runnerTimer");
      if (timerEl) timerEl.textContent = formatTimer(workoutTimerState.seconds);
      if (workoutTimerState.seconds === 0) {
        clearInterval(workoutTimerState.interval);
        finishWorkout(plan);
      }
    }, 1000);
  }
}

function formatTimer(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function finishWorkout(plan) {
  clearInterval(workoutTimerState.interval);
  const elapsedMinutes = Math.max(1, Math.round((300 - workoutTimerState.seconds) / 60));
  Store.updateDay(App.dateKey, day => {
    day.workouts.push({ planId: plan.id, name: plan.name, durationMinutes: elapsedMinutes, completedAt: Date.now() });
  });
  const holder = document.getElementById("workoutRunner");
  if (holder) {
    holder.innerHTML = `
      <div class="panel runner-complete">
        <i data-lucide="party-popper"></i>
        <h2>WORKOUT COMPLETE</h2>
        <p>Duration: ${elapsedMinutes} min · Exercises: ${plan.exercises.length}</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }
  showToast("บันทึกการออกกำลังกายแล้ว 🎉");
  setTimeout(() => App.render(), 1400);
}

// =============================================================================
// 12. HYDRATION
// =============================================================================
function renderHydration() {
  const day = Store.getDay(App.dateKey);
  const pct = Math.min(100, Math.round((day.hydrationMl / day.hydrationGoalMl) * 100));
  return `
    <section class="view">
      ${pageHero(imageAssets.hydrationHero, "HYDRATION", "ดื่มน้ำให้เพียงพอในแต่ละวัน", "ร่างกายที่ชุ่มชื้น คือร่างกายที่พร้อมทำงาน", "hydration")}
      ${dateNav()}
      <div class="panel hydration-panel">
        <div class="hydration-ring" style="--pct:${pct}">
          <span class="hydration-ring-value">${(day.hydrationMl / 1000).toFixed(2)}L</span>
          <span class="hydration-ring-goal">/ ${(day.hydrationGoalMl / 1000).toFixed(1)} L</span>
        </div>
        <div class="hydration-actions">
          <button class="btn btn--outline" data-add-water="250">+250 ml</button>
          <button class="btn btn--outline" data-add-water="500">+500 ml</button>
          <button class="btn btn--ghost" id="btnResetWater">Reset</button>
        </div>
      </div>
      <div class="panel">
        <h2>7-Day Hydration</h2>
        <div class="chart-wrap"><canvas id="hydrationChart"></canvas></div>
      </div>
    </section>
  `;
}

function bindHydration() {
  bindDateNav(() => App.render());
  const weekKeys = DateUtil.last7Keys(App.dateKey);
  const ml = weekKeys.map(k => Store.getDay(k).hydrationMl);
  renderHydrationChart("hydrationChart", weekKeys.map(DateUtil.weekdayShort.bind(DateUtil)), ml, Store.getDay(App.dateKey).hydrationGoalMl);

  document.querySelectorAll("[data-add-water]").forEach(btn => {
    btn.addEventListener("click", () => {
      const amount = Number(btn.dataset.addWater);
      Store.updateDay(App.dateKey, day => { day.hydrationMl += amount; });
      App.render();
    });
  });
  const resetBtn = document.getElementById("btnResetWater");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    Store.updateDay(App.dateKey, day => { day.hydrationMl = 0; });
    App.render();
  });
}

// =============================================================================
// 13-17. AI COACH
// =============================================================================
function renderCoach() {
  const history = Store.getChatHistory();
  return `
    <section class="view view--coach">
      <div class="coach-header" style="background-image:url('${imageAssets.coachVisual.url}')" role="img" aria-label="${imageAssets.coachVisual.alt}">
        <div class="coach-avatar"><i data-lucide="sparkles"></i></div>
        <div>
          <h1>AI Coach</h1>
          <p>Your Personal Health Assistant</p>
        </div>
        <button class="btn btn--ghost btn--sm" id="btnClearChat"><i data-lucide="trash-2"></i> Clear Chat</button>
      </div>

      <div class="chat-window" id="chatWindow">
        ${history.length === 0 ? `
          <div class="chat-bubble chat-bubble--ai">
            สวัสดีครับ 👋<br/>วันนี้อยากให้ผมช่วยเรื่องอะไรครับ?
          </div>
        ` : history.map(m => `
          <div class="chat-bubble chat-bubble--${m.role === "user" ? "user" : "ai"}">${escapeHtml(m.text)}</div>
        `).join("")}
        <div id="chatTyping" class="chat-bubble chat-bubble--ai chat-bubble--typing" hidden>กำลังพิมพ์...</div>
      </div>

      <div class="chip-row chip-row--questions">
        ${aiQuickQuestions.map(q => `<button class="chip chip--interactive" data-quick-q="${escapeHtml(q)}">${q}</button>`).join("")}
      </div>

      <form class="chat-input-row" id="chatForm">
        <input type="text" id="chatInput" placeholder="ถาม AI Coach..." autocomplete="off" aria-label="ถาม AI Coach" />
        <button type="submit" class="btn btn--primary" aria-label="Send"><i data-lucide="send"></i></button>
      </form>
    </section>
  `;
}

function bindCoach() {
  const chatWindow = document.getElementById("chatWindow");
  chatWindow.scrollTop = chatWindow.scrollHeight;

  document.getElementById("btnClearChat").addEventListener("click", () => {
    if (confirm("ล้างประวัติการสนทนาทั้งหมด?")) {
      Store.clearChat();
      App.render();
    }
  });

  document.querySelectorAll("[data-quick-q]").forEach(chip => {
    chip.addEventListener("click", () => sendChatMessage(chip.dataset.quickQ));
  });

  const form = document.getElementById("chatForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendChatMessage(text);
  });
}

async function sendChatMessage(text) {
  Store.pushChat({ role: "user", text, ts: Date.now() });
  App.render();
  const typing = document.getElementById("chatTyping");
  if (typing) typing.hidden = false;
  const chatWindow = document.getElementById("chatWindow");
  if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;

  const response = await getAIResponse(text);
  Store.pushChat({ role: "ai", text: response.text, ts: Date.now() });
  App.render();
}

// =============================================================================
// 18. HEALTH TIPS
// =============================================================================
function renderTips() {
  const categories = [...new Set(healthTips.map(t => t.category))];
  return `
    <section class="view">
      ${pageHero(imageAssets.recoveryHero, "HEALTH TIPS", "เคล็ดลับสั้นๆ ที่นำไปใช้ได้จริง", "อาหาร การนอน การออกกำลังกาย และสุขนิสัยในชีวิตประจำวัน")}
      <div class="chip-row">
        ${categories.map(c => `<span class="chip">${c}</span>`).join("")}
      </div>
      <div class="grid grid--3">
        ${healthTips.map(tip => `
          <div class="tip-card tip-card--${tip.color}">
            <div class="tip-card-icon"><i data-lucide="${tip.icon}"></i></div>
            <span class="tip-card-cat">${tip.category}</span>
            <h3>${tip.title}</h3>
            <p>${tip.description}</p>
            <button class="tip-card-more">Read More</button>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

// =============================================================================
// 19. WEEKLY PROGRESS
// =============================================================================
function renderProgress() {
  const weekKeys = DateUtil.last7Keys(DateUtil.todayKey());
  const daysWithActivity = weekKeys.filter(k => {
    const d = Store.getDay(k);
    return d.workouts.length > 0 || d.sleep.durationMinutes || d.hydrationMl > 0 || Object.values(d.food).some(a => a.length > 0);
  }).length;

  return `
    <section class="view">
      ${pageHero(imageAssets.runningHero, "PROGRESS", "ความสม่ำเสมอ คือชัยชนะที่แท้จริง", "ภาพรวมความสม่ำเสมอใน 7 วันที่ผ่านมา")}
      <div class="panel">
        <h2>Weekly Summary</h2>
        <p class="progress-summary">คุณทำกิจกรรมตามแผนได้ ${daysWithActivity} จาก 7 วัน</p>
        <p class="progress-summary progress-summary--muted">ความสม่ำเสมอสำคัญกว่าความสมบูรณ์แบบ</p>
      </div>
      <div class="panel">
        <h2>7-Day Trend</h2>
        <div class="chart-wrap"><canvas id="progressChart"></canvas></div>
      </div>
    </section>
  `;
}

function bindProgressCharts() {
  const weekKeys = DateUtil.last7Keys(DateUtil.todayKey());
  const labels = weekKeys.map(k => DateUtil.weekdayShort(k));
  const sleepPct = weekKeys.map(k => {
    const d = Store.getDay(k);
    return d.sleep.durationMinutes ? Math.min(100, Math.round((d.sleep.durationMinutes / 480) * 100)) : 0;
  });
  const workoutPct = weekKeys.map(k => {
    const d = Store.getDay(k);
    const min = d.workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0);
    return Math.min(100, Math.round((min / 30) * 100));
  });
  const hydrationPct = weekKeys.map(k => {
    const d = Store.getDay(k);
    return Math.min(100, Math.round((d.hydrationMl / d.hydrationGoalMl) * 100));
  });

  renderProgressChart("progressChart", labels, [
    { label: "Sleep", data: sleepPct, borderColor: "#8B5CF6", backgroundColor: "rgba(139,92,246,0.12)", tension: 0.35 },
    { label: "Workout", data: workoutPct, borderColor: "#3B82F6", backgroundColor: "rgba(59,130,246,0.12)", tension: 0.35 },
    { label: "Hydration", data: hydrationPct, borderColor: "#06B6D4", backgroundColor: "rgba(6,182,212,0.12)", tension: 0.35 }
  ]);
}

// =============================================================================
// 20. PROFILE
// =============================================================================
function renderProfile() {
  const p = Store.getProfile();
  return `
    <section class="view">
      <div class="view-header">
        <h1>Profile</h1>
        <p>ข้อมูลพื้นฐานที่ช่วยให้ AI Coach แนะนำได้ตรงจุดขึ้น</p>
      </div>
      <form class="panel profile-form" id="profileForm">
        <label>Name
          <input type="text" name="name" value="${escapeAttr(p.name)}" placeholder="ชื่อเล่นของคุณ" />
        </label>
        <label>Age Range
          <select name="ageRange">
            ${["", "Under 18", "18-24", "25-34", "35-44", "45-54", "55+"].map(v =>
              `<option value="${v}" ${p.ageRange === v ? "selected" : ""}>${v || "เลือกช่วงอายุ"}</option>`).join("")}
          </select>
        </label>
        <label>Activity Level
          <select name="activityLevel">
            ${["", "Sedentary", "Lightly Active", "Active", "Very Active"].map(v =>
              `<option value="${v}" ${p.activityLevel === v ? "selected" : ""}>${v || "เลือกระดับกิจกรรม"}</option>`).join("")}
          </select>
        </label>
        <label>Typical Sleep Schedule
          <input type="text" name="typicalSleepSchedule" value="${escapeAttr(p.typicalSleepSchedule)}" placeholder="เช่น 23:00 - 06:30" />
        </label>
        <label>Favorite Activities
          <input type="text" name="favoriteActivities" value="${escapeAttr(p.favoriteActivities)}" placeholder="เช่น วิ่ง, ว่ายน้ำ, โยคะ" />
        </label>
        <div class="profile-form-actions">
          <button type="submit" class="btn btn--primary"><i data-lucide="save"></i> Save</button>
          <button type="button" class="btn btn--ghost" id="btnResetData"><i data-lucide="rotate-ccw"></i> Reset Data</button>
        </div>
      </form>
    </section>
  `;
}

function escapeAttr(str) {
  return (str || "").replace(/"/g, "&quot;");
}

function bindProfile() {
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    Store.setProfile({
      name: fd.get("name").trim(),
      ageRange: fd.get("ageRange"),
      activityLevel: fd.get("activityLevel"),
      typicalSleepSchedule: fd.get("typicalSleepSchedule").trim(),
      favoriteActivities: fd.get("favoriteActivities").trim()
    });
    App.renderShellInfo();
    showToast("บันทึกโปรไฟล์แล้ว");
  });
  document.getElementById("btnResetData").addEventListener("click", () => {
    if (confirm("ล้างข้อมูลทั้งหมดในเว็บไซต์นี้? การกระทำนี้ย้อนกลับไม่ได้")) {
      Store.reset();
      App.renderShellInfo();
      App.navigate("dashboard");
      showToast("ล้างข้อมูลทั้งหมดแล้ว");
    }
  });
}

// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => App.init());
