import { useState } from "react";
import { GraduationCap, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { QUIZ_QUESTIONS, saveQuizResult, getQuizHistory, type QuizQuestion, type QuizResult } from "@/lib/quiz-data";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizPanel() {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedIndex: number; isCorrect: boolean }>>([]);
  const [finished, setFinished] = useState(false);

  const history = getQuizHistory();
  const bestScore = history.length > 0 ? Math.max(...history.map((h) => h.score)) : 0;

  function startQuiz() {
    setQuestions(shuffleArray(QUIZ_QUESTIONS).slice(0, 5));
    setCurrentIdx(0);
    setSelected(null);
    setShowAnswer(false);
    setAnswers([]);
    setFinished(false);
    setStarted(true);
  }

  function handleSelect(idx: number) {
    if (showAnswer) return;
    setSelected(idx);
  }

  function handleConfirm() {
    if (selected === null) return;
    const q = questions[currentIdx];
    const isCorrect = selected === q.correctIndex;
    setAnswers((a) => [...a, { questionId: q.id, selectedIndex: selected, isCorrect }]);
    setShowAnswer(true);
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      // Finish
      const correct = answers.filter((a) => a.isCorrect).length + (selected === questions[currentIdx].correctIndex ? 0 : 0);
      const finalAnswers = answers;
      const result: QuizResult = {
        totalQuestions: questions.length,
        correct: finalAnswers.filter((a) => a.isCorrect).length,
        score: Math.round((finalAnswers.filter((a) => a.isCorrect).length / questions.length) * 100),
        answers: finalAnswers,
        completedAt: new Date().toISOString(),
      };
      saveQuizResult(result);
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowAnswer(false);
    }
  }

  if (!started) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-card text-center space-y-4">
        <GraduationCap className="h-12 w-12 text-primary mx-auto" />
        <h3 className="text-xl font-bold">Quiz Literasi Ekonomi</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Uji pemahaman Anda tentang ekonomi Indonesia. 5 pertanyaan acak dari bank soal.
          Jawab dan lihat penjelasan di setiap soal.
        </p>
        {history.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <Trophy className="h-3 w-3 inline" /> Skor terbaik: {bestScore}% · {history.length} kali bermain
          </p>
        )}
        <button
          onClick={startQuiz}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <GraduationCap className="h-4 w-4" /> Mulai Quiz
        </button>
      </div>
    );
  }

  if (finished) {
    const correct = answers.filter((a) => a.isCorrect).length;
    const score = Math.round((correct / questions.length) * 100);
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-card text-center space-y-4">
        <Trophy className={`h-12 w-12 mx-auto ${score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`} />
        <h3 className="text-2xl font-bold">{score}%</h3>
        <p className="text-sm text-muted-foreground">
          {correct} dari {questions.length} benar
        </p>
        <p className="text-sm">
          {score >= 80 ? "Luar biasa! Pemahaman ekonomi Anda sangat baik." :
           score >= 50 ? "Cukup baik! Terus belajar untuk meningkatkan pemahaman." :
           "Jangan menyerah! Baca bagian Edukasi untuk memperdalam pemahaman."}
        </p>
        <button
          onClick={startQuiz}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" /> Main Lagi
        </button>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase">
          Soal {currentIdx + 1}/{questions.length}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          q.difficulty === "easy" ? "bg-success/10 text-success border-success/20" :
          q.difficulty === "medium" ? "bg-warning/10 text-warning border-warning/20" :
          "bg-destructive/10 text-destructive border-destructive/20"
        }`}>
          {q.difficulty}
        </span>
      </div>

      <p className="text-sm font-semibold leading-relaxed">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let style = "border bg-background hover:bg-accent/50";
          if (showAnswer) {
            if (idx === q.correctIndex) style = "border-success bg-success/10";
            else if (idx === selected) style = "border-destructive bg-destructive/10";
            else style = "border bg-background opacity-50";
          } else if (idx === selected) {
            style = "border-primary bg-primary/10 ring-2 ring-primary";
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showAnswer}
              className={`w-full text-left rounded-xl p-3 text-sm transition ${style}`}
            >
              <span className="flex items-center gap-2">
                <span className="font-bold text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>
                {opt}
                {showAnswer && idx === q.correctIndex && <CheckCircle2 className="h-4 w-4 text-success ml-auto" />}
                {showAnswer && idx === selected && idx !== q.correctIndex && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
              </span>
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <div className="rounded-xl border bg-primary/5 p-3">
          <p className="text-xs font-bold text-primary mb-1">Penjelasan:</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {!showAnswer ? (
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Jawab
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {currentIdx + 1 >= questions.length ? "Lihat Hasil" : "Selanjutnya →"}
          </button>
        )}
      </div>
    </div>
  );
}
