// Gamification Quiz Data — interactive economic literacy quiz

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "Jika Bank Indonesia menaikkan BI Rate sebesar 50 basis poin, apa dampak langsung yang paling mungkin?",
    options: [
      "Kredit bank menjadi lebih murah",
      "Kredit bank menjadi lebih mahal",
      "Harga saham pasti naik",
      "Ekspor meningkat drastis",
    ],
    correctIndex: 1,
    explanation: "Kenaikan BI Rate membuat suku bunga pinjaman bank naik, sehingga kredit menjadi lebih mahal. Ini bertujuan menahan inflasi dengan mengurangi jumlah uang beredar.",
    difficulty: "easy",
    topic: "Kebijakan Moneter",
  },
  {
    id: "q2",
    question: "Apa yang dimaksud dengan inflasi 'cost-push'?",
    options: [
      "Inflasi karena permintaan konsumen meningkat",
      "Inflasi karena biaya produksi naik",
      "Inflasi karena uang beredar terlalu banyak",
      "Inflasi karena impor menurun",
    ],
    correctIndex: 1,
    explanation: "Cost-push inflation terjadi ketika biaya produksi (bahan baku, upah, energi) naik, memaksa produsen menaikkan harga jual ke konsumen.",
    difficulty: "easy",
    topic: "Inflasi",
  },
  {
    id: "q3",
    question: "Jika Rupiah melemah 10% terhadap USD, siapa yang paling diuntungkan?",
    options: [
      "Importir barang elektronik",
      "Eksportir komoditas (CPO, batu bara)",
      "Konsumen yang membeli barang impor",
      "Perusahaan dengan utang dolar",
    ],
    correctIndex: 1,
    explanation: "Eksportir diuntungkan karena pendapatan dalam USD mereka bernilai lebih tinggi saat dikonversi ke Rupiah. Sebaliknya, importir dan perusahaan berutang dolar dirugikan.",
    difficulty: "medium",
    topic: "Kurs",
  },
  {
    id: "q4",
    question: "GDP Indonesia tumbuh 5.05% (YoY). Apa artinya?",
    options: [
      "Ekonomi tumbuh 5.05% dibanding bulan lalu",
      "Ekonomi tumbuh 5.05% dibanding kuartal yang sama tahun lalu",
      "Inflasi sebesar 5.05%",
      "Utang negara naik 5.05%",
    ],
    correctIndex: 1,
    explanation: "YoY (Year-over-Year) berarti perbandingan dengan periode yang sama di tahun sebelumnya. GDP growth 5.05% YoY artinya output ekonomi naik 5.05% dibanding kuartal yang sama tahun lalu.",
    difficulty: "easy",
    topic: "GDP",
  },
  {
    id: "q5",
    question: "Apa hubungan antara Current Account Deficit dan nilai tukar Rupiah?",
    options: [
      "Deficit memperkuat Rupiah",
      "Deficit melemahkan Rupiah karena lebih banyak devisa keluar",
      "Tidak ada hubungan",
      "Deficit hanya mempengaruhi inflasi",
    ],
    correctIndex: 1,
    explanation: "Current Account Deficit berarti Indonesia lebih banyak membayar ke luar negeri (impor > ekspor). Ini meningkatkan permintaan USD dan menekan nilai Rupiah.",
    difficulty: "medium",
    topic: "Neraca Pembayaran",
  },
  {
    id: "q6",
    question: "Apa yang terjadi pada yield obligasi pemerintah jika investor asing menarik dana dari Indonesia?",
    options: [
      "Yield turun karena harga obligasi naik",
      "Yield naik karena harga obligasi turun",
      "Yield tidak berubah",
      "Yield menjadi negatif",
    ],
    correctIndex: 1,
    explanation: "Ketika investor menjual obligasi (capital outflow), harga obligasi turun. Karena yield berbanding terbalik dengan harga, yield naik. Ini juga meningkatkan biaya pinjaman pemerintah.",
    difficulty: "hard",
    topic: "Pasar Modal",
  },
  {
    id: "q7",
    question: "Mengapa Bank Indonesia mempertahankan cadangan devisa yang besar?",
    options: [
      "Untuk membayar gaji PNS",
      "Untuk stabilisasi nilai tukar dan membayar impor",
      "Untuk investasi di luar negeri",
      "Untuk menambah uang beredar",
    ],
    correctIndex: 1,
    explanation: "Cadangan devisa digunakan untuk intervensi pasar valas (stabilisasi Rupiah), membayar utang luar negeri, dan menjamin kemampuan impor. Standar internasional minimal 3 bulan impor.",
    difficulty: "medium",
    topic: "Cadangan Devisa",
  },
  {
    id: "q8",
    question: "Apa dampak kenaikan harga minyak dunia terhadap APBN Indonesia?",
    options: [
      "Selalu menguntungkan karena Indonesia penghasil minyak",
      "Membebani subsidi BBM dan memperlebar defisit fiskal",
      "Tidak berpengaruh pada APBN",
      "Menurunkan inflasi domestik",
    ],
    correctIndex: 1,
    explanation: "Indonesia adalah net importer minyak. Kenaikan harga minyak dunia meningkatkan beban subsidi BBM dalam APBN, memperlebar defisit fiskal, dan berpotensi mendorong inflasi.",
    difficulty: "hard",
    topic: "Fiskal",
  },
  {
    id: "q9",
    question: "Apa itu 'tapering' oleh The Fed dan bagaimana dampaknya ke Indonesia?",
    options: [
      "Penurunan suku bunga AS yang menguntungkan Indonesia",
      "Pengurangan pembelian aset oleh The Fed yang bisa memicu capital outflow dari emerging markets",
      "Peningkatan bantuan ekonomi AS ke Indonesia",
      "Kebijakan perdagangan AS yang menurunkan tarif",
    ],
    correctIndex: 1,
    explanation: "Tapering adalah pengurangan stimulus moneter The Fed. Ini membuat aset AS lebih menarik, memicu capital outflow dari emerging markets seperti Indonesia, menekan Rupiah dan pasar saham.",
    difficulty: "hard",
    topic: "Kebijakan Global",
  },
  {
    id: "q10",
    question: "Jika inflasi inti (core inflation) rendah tapi inflasi volatile food tinggi, kebijakan apa yang tepat?",
    options: [
      "Naikkan BI Rate agresif",
      "Perbaiki distribusi pangan dan supply chain",
      "Cetak lebih banyak uang",
      "Turunkan pajak impor semua barang",
    ],
    correctIndex: 1,
    explanation: "Inflasi volatile food disebabkan gangguan supply (distribusi, cuaca), bukan excess demand. Solusinya adalah perbaikan supply chain, bukan pengetatan moneter yang justru bisa memperlambat ekonomi.",
    difficulty: "hard",
    topic: "Inflasi",
  },
];

export type QuizResult = {
  totalQuestions: number;
  correct: number;
  score: number; // percentage
  answers: Array<{ questionId: string; selectedIndex: number; isCorrect: boolean }>;
  completedAt: string;
};

const QUIZ_HISTORY_KEY = "MACROMIC_QUIZ_HISTORY";

export function getQuizHistory(): QuizResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUIZ_HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveQuizResult(result: QuizResult) {
  const history = getQuizHistory();
  history.push(result);
  localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history.slice(-20)));
}
