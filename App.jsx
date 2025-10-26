import { useEffect, useMemo, useRef, useState } from "react";

const MOODS = [
  {
    icon: "😄",
    label: "とても良い",
    description: "今日は最高の気分ですね！この活力を周りと分かち合いましょう。",
  },
  {
    icon: "😊",
    label: "やや良い",
    description: "穏やかな幸せを感じています。自分をねぎらう時間も大切に。",
  },
  {
    icon: "😐",
    label: "普通",
    description: "落ち着いた一日。小さな喜びを探してみるのもおすすめです。",
  },
  {
    icon: "😞",
    label: "やや落ち込み",
    description: "少し疲れ気味かもしれません。深呼吸して、ゆっくり休みましょう。",
  },
  {
    icon: "😢",
    label: "とても落ち込み",
    description: "つらい気持ちに寄り添いましょう。信頼できる人に話すのも一つの方法です。",
  },
];

const STORAGE_KEY = "daily-mood-entries";
const MAX_HISTORY = 7;

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
};

export default function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [history, setHistory] = useState([]);
  const isHydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        isHydrated.current = true;
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        isHydrated.current = true;
        return;
      }

      const normalized = parsed
        .filter((entry) => entry?.date && entry?.mood)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, MAX_HISTORY);

      setHistory(normalized);

      const today = new Date().toISOString().slice(0, 10);
      const todaysEntry = normalized.find((entry) => entry.date === today);
      setSelectedMood((todaysEntry ?? normalized[0])?.mood ?? null);
    } catch (error) {
      console.error("Failed to restore mood history", error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      isHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isHydrated.current) return;
    if (history.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [history]);

  const moodDescription = useMemo(() => {
    if (!selectedMood) return "まだ選択されていません";
    const matched = MOODS.find((mood) => mood.icon === selectedMood);
    return matched ? `${selectedMood}（${matched.label}）` : selectedMood;
  }, [selectedMood]);

  const moodDetail = useMemo(() => {
    if (!selectedMood) return "今の気分を教えてください。";
    const matched = MOODS.find((mood) => mood.icon === selectedMood);
    return matched?.description ?? "心の声を大切にしましょう。";
  }, [selectedMood]);

  const handleSelectMood = (moodIcon) => {
    setSelectedMood(moodIcon);
    const today = new Date().toISOString().slice(0, 10);

    setHistory((prev) => {
      const withoutToday = prev.filter((entry) => entry.date !== today);
      const updated = [
        { date: today, mood: moodIcon },
        ...withoutToday,
      ]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, MAX_HISTORY);

      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-emerald-100 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-[2.25rem] bg-white/80 backdrop-blur shadow-2xl p-10 text-center space-y-10 border border-white/60">
        <header className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
            Daily Mood Journal
          </p>
          <h1 className="text-3xl font-semibold text-slate-700">
            今日の気分を選んでください
          </h1>
          <p className="text-slate-500">
            直感でタップするだけで、心の変化を優しく記録できます。
          </p>
        </header>

        <div className="flex justify-center gap-4 flex-wrap">
          {MOODS.map((mood) => {
            const isActive = selectedMood === mood.icon;
            return (
              <button
                key={mood.icon}
                type="button"
                onClick={() => handleSelectMood(mood.icon)}
                aria-pressed={isActive}
                className={`group relative text-4xl transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/80 rounded-full p-4 ${
                  isActive
                    ? "bg-emerald-100 shadow-lg ring-2 ring-emerald-400 text-emerald-600"
                    : "bg-white/90 hover:-translate-y-1 hover:shadow-md ring-1 ring-sky-100/70"
                }`}
              >
                <span role="img" aria-label={mood.label}>
                  {mood.icon}
                </span>
                <span className="sr-only">{mood.label}</span>
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>

        <section className="bg-gradient-to-r from-sky-50 to-emerald-50 rounded-3xl p-8 shadow-inner space-y-3">
          <h2 className="text-lg font-semibold text-slate-600">あなたの気分</h2>
          <p className="text-4xl font-semibold text-slate-800">{moodDescription}</p>
          <p className="text-sm text-slate-500">{moodDetail}</p>
        </section>

        <section className="text-left space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-600">過去の記録</h3>
            <span className="text-xs uppercase tracking-wider text-slate-400">
              最大{MAX_HISTORY}件
            </span>
          </div>
          {history.length === 0 ? (
            <p className="text-slate-500 text-sm">
              まだ記録がありません。最初の一歩を踏み出してみましょう！
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {history.map((entry) => {
                const matched = MOODS.find((mood) => mood.icon === entry.mood);
                return (
                  <li
                    key={entry.date}
                    className="flex items-center justify-between rounded-2xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-500">
                        {formatDate(entry.date)}
                      </span>
                      {matched ? (
                        <span className="text-xs text-slate-400">{matched.label}</span>
                      ) : null}
                    </div>
                    <span className="text-3xl" aria-hidden>
                      {entry.mood}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
