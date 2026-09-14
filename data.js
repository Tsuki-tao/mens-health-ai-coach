/**
 * data.js
 * -------
 * Static content for the app: image asset map (with AI image-generation
 * prompts kept alongside so a future image-gen step can slot in easily),
 * the workout library, health tips library, and the shape of a "fresh"
 * daily record. Nothing in this file touches localStorage — see storage.js.
 */

// ---------------------------------------------------------------------------
// 23 & 24. IMAGE SYSTEM — swap any URL here to change imagery site-wide.
// Each entry keeps its generation prompt so a real image pipeline can
// regenerate it later without hunting through the codebase.
// ---------------------------------------------------------------------------
const imageAssets = {
  workout: {
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
    prompt: "Premium modern fitness photography of a young adult performing a functional workout in a minimalist dark navy gym, cinematic lighting, blue and cyan accent lights, professional health magazine aesthetic, realistic, clean composition, no text"
  },
  food: {
    url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop",
    prompt: "Premium healthy meal photography, balanced colorful meal on a dark modern table, natural ingredients, cinematic soft lighting, professional nutrition magazine aesthetic, realistic photography, no text"
  },
  sleep: {
    url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
    prompt: "Premium peaceful bedroom at night, dark navy and purple ambient lighting, modern minimal interior, calm atmosphere, professional lifestyle photography, realistic, no text"
  },
  lifestyle: {
    url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
    prompt: "Premium modern healthy lifestyle photography, confident young adult in daylight, minimal navy and white environment, editorial fitness magazine aesthetic, no text"
  },
  aiCoach: {
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
    prompt: "Futuristic friendly AI health assistant interface, blue and violet glowing holographic elements, premium dark navy environment, modern technology aesthetic, clean composition, no text"
  }
};

// ---------------------------------------------------------------------------
// 11. WORKOUT LIBRARY
// ---------------------------------------------------------------------------
const workoutLibrary = {
  categories: ["Cardio", "Strength", "Mobility", "Flexibility", "Daily Activity"],
  plans: [
    {
      id: "beginner-full-body",
      name: "Beginner Full Body",
      category: "Strength",
      color: "blue",
      exercises: [
        { name: "Squat", description: "ยืนแยกขากว้างเท่าไหล่ ย่อตัวลงช้าๆ แล้วดันขึ้น", difficulty: "Easy", duration: "12 reps", safetyTip: "หลังตรงเสมอ อย่าให้เข่าเลยปลายเท้ามาก" },
        { name: "Push-up", description: "วางมือกว้างกว่าไหล่เล็กน้อย ลดตัวลงแล้วดันขึ้น", difficulty: "Medium", duration: "10 reps", safetyTip: "ถ้าเมื่อยข้อมือ ให้พักหรือทำแบบชันเข่า" },
        { name: "Plank", description: "ค้ำตัวด้วยปลายแขนและปลายเท้า ลำตัวเป็นเส้นตรง", difficulty: "Easy", duration: "30 sec", safetyTip: "อย่ากลั้นหายใจ หายใจสม่ำเสมอ" },
        { name: "Lunge", description: "ก้าวขาไปข้างหน้าแล้วย่อตัวลง สลับข้าง", difficulty: "Medium", duration: "10 reps/ข้าง", safetyTip: "เข่าหน้าไม่เลยปลายเท้า" },
        { name: "Mountain Climber", description: "อยู่ในท่า Plank สลับดึงเข่าเข้าหาลำตัว", difficulty: "Medium", duration: "20 sec", safetyTip: "คุมจังหวะ ไม่ต้องเร็วเกินไป" }
      ]
    },
    {
      id: "quick-cardio",
      name: "Quick Cardio Burst",
      category: "Cardio",
      color: "cyan",
      exercises: [
        { name: "Jumping Jacks", description: "กระโดดกางแขนกางขาสลับ", difficulty: "Easy", duration: "30 sec", safetyTip: "ลงเท้าเบาๆ ปกป้องข้อเข่า" },
        { name: "High Knees", description: "วิ่งอยู่กับที่ยกเข่าสูง", difficulty: "Medium", duration: "30 sec", safetyTip: "แกนกลางลำตัวเกร็งเล็กน้อย" },
        { name: "Butt Kicks", description: "วิ่งอยู่กับที่เตะส้นเท้าแตะก้น", difficulty: "Easy", duration: "30 sec", safetyTip: "ก้าวสั้นๆ ควบคุมจังหวะ" }
      ]
    },
    {
      id: "morning-mobility",
      name: "Morning Mobility Flow",
      category: "Mobility",
      color: "green",
      exercises: [
        { name: "Cat-Cow Stretch", description: "คุกเข่าโก่งหลังและแอ่นหลังสลับกัน", difficulty: "Easy", duration: "8 reps", safetyTip: "เคลื่อนไหวช้าๆ ตามจังหวะหายใจ" },
        { name: "Hip Circles", description: "ยืนหมุนสะโพกเป็นวงกลม", difficulty: "Easy", duration: "10 รอบ/ข้าง", safetyTip: "หมุนช้าๆ ไม่ต้องฝืน" },
        { name: "Shoulder Rolls", description: "หมุนไหล่ไปข้างหน้าและข้างหลัง", difficulty: "Easy", duration: "10 รอบ", safetyTip: "ทำช้าๆ ผ่อนคลาย" }
      ]
    },
    {
      id: "evening-flexibility",
      name: "Evening Flexibility",
      category: "Flexibility",
      color: "purple",
      exercises: [
        { name: "Forward Fold", description: "ยืนก้มตัวลงเอื้อมมือแตะปลายเท้า", difficulty: "Easy", duration: "30 sec", safetyTip: "งอเข่าเล็กน้อยถ้าหลังตึง" },
        { name: "Seated Hamstring Stretch", description: "นั่งเหยียดขายืดกล้ามเนื้อต้นขาด้านหลัง", difficulty: "Easy", duration: "30 sec/ข้าง", safetyTip: "อย่ากระตุกตัว ยืดค้างนิ่งๆ" }
      ]
    },
    {
      id: "daily-steps",
      name: "10-Minute Walk",
      category: "Daily Activity",
      color: "orange",
      exercises: [
        { name: "Brisk Walk", description: "เดินเร็วต่อเนื่อง เพิ่มการเคลื่อนไหวระหว่างวัน", difficulty: "Easy", duration: "10 min", safetyTip: "สวมรองเท้าที่เหมาะสม" }
      ]
    }
  ]
};

// ---------------------------------------------------------------------------
// 18. HEALTH TIPS LIBRARY
// ---------------------------------------------------------------------------
const healthTips = [
  { category: "Nutrition", color: "green", icon: "salad", title: "จานสีสัน ร่างกายแข็งแรง", description: "ลองให้ครึ่งจานเป็นผักหลากสี จะช่วยให้ได้วิตามินและใยอาหารครบถ้วนขึ้น" },
  { category: "Nutrition", color: "green", icon: "apple", title: "โปรตีนทุกมื้อ", description: "ใส่แหล่งโปรตีน เช่น ไข่ ถั่ว เนื้อไม่ติดมัน ในทุกมื้อ ช่วยให้อิ่มนานและซ่อมแซมกล้ามเนื้อ" },
  { category: "Sleep", color: "purple", icon: "moon-star", title: "กิจวัตรก่อนนอนที่คงที่", description: "เข้านอนและตื่นเวลาใกล้เคียงกันทุกวัน แม้แต่วันหยุด ช่วยปรับนาฬิกาชีวภาพให้เสถียร" },
  { category: "Sleep", color: "purple", icon: "smartphone-off", title: "ลดหน้าจอก่อนนอน", description: "งดหน้าจอ 30-60 นาทีก่อนนอน แสงสีฟ้าอาจรบกวนฮอร์โมนการนอนหลับ" },
  { category: "Exercise", color: "blue", icon: "dumbbell", title: "เริ่มจากน้อยแต่สม่ำเสมอ", description: "10-15 นาทีต่อวันอย่างสม่ำเสมอ ดีกว่าออกหนักครั้งเดียวแล้วหยุดไปนาน" },
  { category: "Exercise", color: "blue", icon: "footprints", title: "ขยับร่างกายระหว่างวัน", description: "ลุกเดินทุกๆ ชั่วโมงเมื่อทำงานนั่งโต๊ะนาน ช่วยลดความเมื่อยล้าได้ดี" },
  { category: "Hydration", color: "cyan", icon: "droplets", title: "เริ่มเช้าด้วยน้ำหนึ่งแก้ว", description: "ดื่มน้ำทันทีหลังตื่นนอนช่วยให้ร่างกายสดชื่นและกระตุ้นระบบเผาผลาญ" },
  { category: "Daily Habits", color: "orange", icon: "list-checks", title: "วางแผนวันล่วงหน้า", description: "ใช้เวลา 5 นาทีตอนเช้าวางกิจวัตรของวันนั้น ช่วยลดความเครียดและเพิ่มโฟกัส" },
  { category: "Mental Well-being", color: "pink", icon: "heart-handshake", title: "พักสมองสั้นๆ", description: "หายใจลึกๆ 1 นาทีระหว่างวันช่วยลดความเครียดสะสมได้จริง" }
];

// ---------------------------------------------------------------------------
// 13. AI COACH — quick questions shown as chips
// ---------------------------------------------------------------------------
const aiQuickQuestions = [
  "วันนี้ควรออกกำลังกายอะไร?",
  "กินอะไรดี?",
  "เมื่อคืนผมนอนน้อย ควรทำอย่างไร?",
  "ช่วยจัดตารางวันนี้ให้หน่อย",
  "มีวิธีสร้างนิสัยที่ดีไหม?"
];

// ---------------------------------------------------------------------------
// Default timeline template for a freshly-created day (7. / 8.)
// ---------------------------------------------------------------------------
function defaultTimeline() {
  return [
    { id: "t1", time: "06:30", title: "Wake Up", completed: false },
    { id: "t2", time: "07:00", title: "Breakfast", completed: false },
    { id: "t3", time: "08:00", title: "School / Work", completed: false },
    { id: "t4", time: "12:00", title: "Lunch", completed: false },
    { id: "t5", time: "16:30", title: "Workout", completed: false },
    { id: "t6", time: "18:30", title: "Dinner", completed: false },
    { id: "t7", time: "21:30", title: "Relax", completed: false },
    { id: "t8", time: "22:30", title: "Prepare for Sleep", completed: false },
    { id: "t9", time: "23:00", title: "Sleep", completed: false }
  ];
}

// Fresh, empty record for a calendar day — every dailyPlans[dateKey] starts here.
function freshDayRecord() {
  return {
    timeline: defaultTimeline(),
    food: { breakfast: [], lunch: [], dinner: [], snack: [] },
    sleep: { bedTime: null, wakeTime: null, durationMinutes: null, quality: null },
    workouts: [],           // { planId, name, durationMinutes, completedAt }
    hydrationMl: 0,
    hydrationGoalMl: 2000
  };
}
