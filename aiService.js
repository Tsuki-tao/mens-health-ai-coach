/**
 * aiService.js
 * ------------
 * AI COACH engine.
 *
 * 16. AI API ARCHITECTURE
 * ------------------------
 * This file never talks to Claude directly, and it never holds an API key.
 * The intended production flow is:
 *
 *     Frontend  --fetch()-->  Backend API  --Anthropic SDK-->  Claude API
 *         ^                                                        |
 *         |________________________ response ______________________|
 *
 * Today, AI_MODE is "mock": getAIResponse() runs entirely in the browser
 * using simple rules + the user's own logged data. To go live later,
 * only AI_MODE and callBackendAI() below need to change — nothing in
 * app.js has to know the difference, because both modes return the same
 * shape: { text }.
 *
 * To connect a real backend:
 *   1. Stand up an endpoint, e.g. POST /api/coach { message, context, history }
 *      that holds the ANTHROPIC_API_KEY server-side only.
 *   2. Set AI_MODE = "live" below.
 *   3. Implement callBackendAI() to fetch() that endpoint and return
 *      { text: data.reply }.
 *   4. Use the SYSTEM_PROMPT text (below) as the backend's system prompt.
 */

const AI_MODE = "mock"; // "mock" | "live"

const SYSTEM_PROMPT = `
คุณคือ "MEN'S HEALTH AI COACH" ผู้ช่วยด้านสุขภาพสำหรับเว็บไซต์ MEN'S HEALTH
หน้าที่: ให้ความรู้เกี่ยวกับการออกกำลังกาย การนอน อาหาร การดื่มน้ำ การสร้างกิจวัตร และสุขนิสัยในชีวิตประจำวัน
ตอบภาษาไทยเป็นหลัก ใช้ภาษาที่เข้าใจง่าย เป็นมิตร ให้กำลังใจ
ไม่ตัดสินรูปร่าง น้ำหนัก หรือรูปลักษณ์ของผู้ใช้
ไม่ส่งเสริมการอดอาหาร ไม่สนับสนุนการออกกำลังกายแบบหักโหม ไม่แนะนำวิธีที่อาจเป็นอันตราย
หากผู้ใช้มีอาการผิดปกติหรือปัญหาสุขภาพที่ควรได้รับการประเมิน ให้แนะนำให้ปรึกษาผู้ปกครอง ผู้ดูแล หรือบุคลากรทางการแพทย์ที่เหมาะสม
ไม่อ้างว่าตัวเองเป็นแพทย์ หากข้อมูลไม่เพียงพอ ให้ถามข้อมูลเพิ่มเติมก่อนให้คำแนะนำเฉพาะเจาะจง
`.trim();

// A little conversational memory: what was the last topic discussed,
// so a short follow-up like "ถ้ามีแค่ 20 นาทีล่ะ?" resolves correctly.
let lastTopic = null;

function summarizeToday() {
  const key = DateUtil.todayKey();
  const day = Store.getDay(key);
  const sleepH = day.sleep.durationMinutes ? Math.round((day.sleep.durationMinutes / 60) * 10) / 10 : null;
  const workoutMin = day.workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const mealsLogged = Object.values(day.food).reduce((sum, arr) => sum + arr.length, 0);
  return { sleepH, workoutMin, mealsLogged, hydrationMl: day.hydrationMl, hydrationGoalMl: day.hydrationGoalMl };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildReply(userText) {
  const text = userText.trim().toLowerCase();
  const ctx = summarizeToday();

  // --- Sleep-related ---
  if (/นอนน้อย|นอนไม่พอ|เมื่อยล้า|ไม่ได้นอน/.test(text)) {
    lastTopic = "low_sleep";
    const sleepNote = ctx.sleepH ? `เมื่อคืนคุณนอนไป ${ctx.sleepH} ชั่วโมง ` : "";
    return `${sleepNote}ถ้าวันนี้พักผ่อนมาน้อย ลองลดความหนักของกิจกรรมลงหน่อยนะครับ เช่น เดินเบาๆ หรือยืดเหยียดแทนการออกกำลังกายหนัก และพยายามหาเวลางีบสั้นๆ 15-20 นาทีถ้าทำได้ครับ 😊`;
  }

  if (lastTopic === "low_sleep" && /20 นาที|มีเวลาแค่|เวลาน้อย/.test(text)) {
    return `ถ้ามีแค่ 20 นาทีและนอนน้อยมาด้วย ผมแนะนำให้ทำ Mobility เบาๆ แทนครับ เช่น "Morning Mobility Flow" ในหน้า Workout ใช้เวลาไม่ถึง 10 นาที เน้นให้ร่างกายตื่นตัวโดยไม่ฝืนร่างกายเกินไป ดีกว่าออกกำลังกายหนักตอนพักผ่อนไม่พอครับ`;
  }

  // --- Workout suggestion ---
  if (/ออกกำลังกายอะไร|เล่นอะไรดี|ควรออกกำลังกายไหม/.test(text)) {
    lastTopic = "workout_suggestion";
    let note = "";
    if (ctx.workoutMin === 0) {
      note = ctx.sleepH && ctx.sleepH < 6
        ? "วันนี้ยังไม่มีข้อมูลออกกำลังกาย และคืนก่อนนอนค่อนข้างน้อย ผมแนะนำเริ่มจากอะไรเบาๆ ก่อนครับ "
        : "วันนี้ยังไม่มีข้อมูลออกกำลังกายเลย ลองเริ่มจาก ";
      return `${note}เช่น "Beginner Full Body" หรือ "10-Minute Walk" ในหน้า Workout ก็เพียงพอสำหรับวันนี้แล้วครับ อย่าลืมยืดเหยียดก่อน-หลังด้วยนะครับ`;
    }
    return `วันนี้คุณออกกำลังกายไปแล้ว ${ctx.workoutMin} นาที เยี่ยมมากครับ 🎉 ถ้าอยากเพิ่มเติม ลองยืดเหยียดเบาๆ ตอนเย็นเพื่อผ่อนคลายกล้ามเนื้อก็ได้ครับ`;
  }

  // --- Food suggestion ---
  if (/กินอะไรดี|มื้อนี้กิน|อาหาร/.test(text)) {
    lastTopic = "food_suggestion";
    const note = ctx.mealsLogged < 2
      ? "วันนี้ยังบันทึกมื้ออาหารไม่ครบ ลองเลือกเมนูที่มีผัก โปรตีน และคาร์โบไฮเดรตให้ครบถ้วนนะครับ "
      : "จากที่บันทึกไว้วันนี้ทานได้หลากหลายดีครับ ";
    return `${note}เช่น ข้าวกล้อง + อกไก่ย่าง + ผักลวก หรือถ้าอยากได้ไอเดียเพิ่ม ลองดูหน้า Health Tips หมวด Nutrition ได้เลยครับ ไม่จำเป็นต้องนับแคลอรี่เป๊ะๆ เน้นความหลากหลายและสมดุลพอครับ`;
  }

  // --- Schedule/planning ---
  if (/จัดตาราง|วางแผนวันนี้|ตารางวันนี้/.test(text)) {
    lastTopic = "schedule";
    return `ลองแบ่งวันนี้ง่ายๆ แบบนี้ครับ: เช้าทานอาหารที่มีโปรตีน, ช่วงบ่ายหาเวลาขยับร่างกายสัก 15-30 นาที, ดื่มน้ำให้ครบเป้าหมายตลอดวัน, และก่อนนอนลดหน้าจอสัก 30 นาทีเพื่อให้หลับสบายขึ้น ดูตารางเต็มๆ และปรับแก้ได้ที่หน้า My Plan เลยครับ`;
  }

  // --- Habit building ---
  if (/นิสัยที่ดี|สร้างนิสัย|วินัย/.test(text)) {
    lastTopic = "habit";
    return `เคล็ดลับง่ายๆ คือเริ่มเล็กและสม่ำเสมอครับ เช่น ดื่มน้ำ 1 แก้วทันทีที่ตื่น หรือเดิน 10 นาทีทุกวันในเวลาเดิมๆ พอทำได้ต่อเนื่องสัก 2-3 สัปดาห์ มันจะกลายเป็นอัตโนมัติเอง ความสม่ำเสมอสำคัญกว่าความสมบูรณ์แบบครับ`;
  }

  // --- Hydration ---
  if (/น้ำ|ดื่มน้ำ/.test(text)) {
    lastTopic = "hydration";
    const remain = Math.max(0, ctx.hydrationGoalMl - ctx.hydrationMl);
    return remain > 0
      ? `วันนี้ดื่มน้ำไปแล้ว ${ctx.hydrationMl} มล. จากเป้าหมาย ${ctx.hydrationGoalMl} มล. เหลืออีก ${remain} มล. ลองตั้งเตือนดื่มน้ำทุก 1-2 ชั่วโมงดูนะครับ`
      : `เยี่ยมเลยครับ วันนี้คุณดื่มน้ำครบเป้าหมายแล้ว 🎉`;
  }

  // --- Health concern → defer to professional ---
  if (/เจ็บ|ปวด|ไม่สบาย|ป่วย|เวียนหัว|แน่นหน้าอก/.test(text)) {
    lastTopic = "concern";
    return `ขอบคุณที่เล่าให้ฟังนะครับ อาการแบบนี้ผมไม่สามารถวินิจฉัยให้ได้ และอยากให้คุณปลอดภัยที่สุด แนะนำให้ปรึกษาผู้ปกครอง ผู้ดูแล หรือบุคลากรทางการแพทย์ที่ใกล้ตัวเพื่อประเมินอาการอย่างเหมาะสมครับ ระหว่างนี้พักผ่อนและสังเกตอาการตัวเองไปก่อนนะครับ`;
  }

  // --- Greeting ---
  if (/สวัสดี|หวัดดี|ดีครับ|ดีค่ะ/.test(text)) {
    return `สวัสดีครับ 👋 วันนี้อยากให้ผมช่วยเรื่องอะไรดีครับ จะเป็นเรื่องอาหาร การนอน การออกกำลังกาย หรือน้ำดื่มก็ได้ครับ`;
  }

  // --- Fallback ---
  return pick([
    "ขอบคุณที่เล่าให้ฟังนะครับ ช่วยเล่าเพิ่มอีกนิดได้ไหมครับ เช่น อยากให้ช่วยเรื่องอาหาร การนอน หรือการออกกำลังกาย จะได้แนะนำได้ตรงจุดขึ้นครับ",
    "รับทราบครับ ลองบอกรายละเอียดเพิ่มเติมหน่อยได้ไหมครับ จะได้ช่วยแนะนำแนวทางที่เหมาะกับคุณมากขึ้นครับ 😊"
  ]);
}

/**
 * Public entry point used by app.js. Returns a Promise<{text: string}>
 * so swapping AI_MODE to "live" later doesn't change any calling code.
 */
async function getAIResponse(userText) {
  if (AI_MODE === "live") {
    return callBackendAI(userText);
  }
  // Simulate a short thinking delay so the UI feels alive.
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
  try {
    return { text: buildReply(userText) };
  } catch (e) {
    console.error("Mock AI error", e);
    return { text: "ขออภัยครับ ตอนนี้ AI Coach ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง", error: true };
  }
}

/**
 * Placeholder for the real backend call. Never put an API key here —
 * this only talks to YOUR OWN backend, which then talks to Claude.
 */
async function callBackendAI(userText) {
  try {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        context: summarizeToday(),
        history: Store.getChatHistory().slice(-10)
      })
    });
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return { text: data.reply };
  } catch (e) {
    console.error("Live AI error", e);
    return { text: "ขออภัยครับ ตอนนี้ AI Coach ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง", error: true };
  }
}
