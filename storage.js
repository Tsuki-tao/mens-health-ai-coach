/**
 * storage.js
 * ----------
 * Single source of truth for everything persisted in the browser.
 * Everything lives under one localStorage key ("healthAppData") as one
 * JSON blob, per the required data model:
 *   profile, dailyPlans, chatHistory, settings
 * (foodLogs / sleepLogs / workouts / hydration are nested inside each
 * day's record in dailyPlans, keyed by date, so a day's data never mixes
 * with another day's.)
 */

const STORAGE_KEY = "healthAppData";

// ---------------------------------------------------------------------------
// Date helpers (21. DATE SYSTEM)
// ---------------------------------------------------------------------------
const DateUtil = {
  todayKey() {
    return this.toKey(new Date());
  },
  toKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },
  fromKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  },
  addDays(key, delta) {
    const date = this.fromKey(key);
    date.setDate(date.getDate() + delta);
    return this.toKey(date);
  },
  formatThai(key) {
    const date = this.fromKey(key);
    const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
    return `วัน${days[date.getDay()]}ที่ ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
  },
  formatShort(key) {
    const date = this.fromKey(key);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  },
  greeting() {
    const h = new Date().getHours();
    if (h < 11) return "GOOD MORNING";
    if (h < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  },
  last7Keys(fromKey) {
    const keys = [];
    for (let i = 6; i >= 0; i--) keys.push(this.addDays(fromKey, -i));
    return keys;
  },
  weekdayShort(key) {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return days[this.fromKey(key).getDay()];
  }
};

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Core store
// ---------------------------------------------------------------------------
const Store = {
  _cache: null,

  _defaultData() {
    return {
      profile: {
        name: "",
        ageRange: "",
        activityLevel: "",
        typicalSleepSchedule: "",
        favoriteActivities: ""
      },
      dailyPlans: {},        // { "2026-09-14": freshDayRecord(), ... }
      chatHistory: [],       // [{ role: 'user'|'ai', text, ts }]
      settings: {
        hydrationGoalMl: 2000,
        onboarded: false
      }
    };
  },

  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._cache = raw ? JSON.parse(raw) : this._defaultData();
    } catch (e) {
      console.error("Failed to read healthAppData, resetting.", e);
      this._cache = this._defaultData();
    }
    return this._cache;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cache));
      return true;
    } catch (e) {
      console.error("Failed to persist healthAppData", e);
      return false;
    }
  },

  reset() {
    this._cache = this._defaultData();
    this.save();
  },

  // Returns the record for a given date key, creating it on first access.
  getDay(dateKey) {
    const data = this.load();
    if (!data.dailyPlans[dateKey]) {
      data.dailyPlans[dateKey] = freshDayRecord();
      this.save();
    }
    return data.dailyPlans[dateKey];
  },

  updateDay(dateKey, mutatorFn) {
    const day = this.getDay(dateKey);
    mutatorFn(day);
    this.save();
    return day;
  },

  getProfile() {
    return this.load().profile;
  },

  setProfile(partial) {
    const data = this.load();
    data.profile = { ...data.profile, ...partial };
    this.save();
  },

  getChatHistory() {
    return this.load().chatHistory;
  },

  pushChat(entry) {
    const data = this.load();
    data.chatHistory.push(entry);
    this.save();
  },

  clearChat() {
    const data = this.load();
    data.chatHistory = [];
    this.save();
  }
};
