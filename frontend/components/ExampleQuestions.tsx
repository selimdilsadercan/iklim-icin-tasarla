"use client";

interface ExampleQuestionsProps {
  botSlug: string;
  onQuestionClick: (question: string) => void;
}

const exampleQuestions = {
  yaprak: [
    "En çevre dostu ulaşım nedir?",
    "Plastik yerine ne kullanabilirim?",
    "Evde enerji tasarrufu nasıl yapılır?",
    "Sürdürülebilir yaşam için ne yapabilirim?"
  ],
  robi: [
    "En çok enerji harcayan cihaz hangisi?",
    "Elektrik faturasını nasıl düşürebilirim?",
    "Güneş enerjisi ev için uygun mu?",
    "Enerji tasarruflu ampul nasıl seçilir?"
  ],
  bugday: [
    "Organik tarımın en büyük faydası ne?",
    "Evde sebze nasıl yetiştirilir?",
    "Sürdürülebilir tarım nedir?",
    "Toprak sağlığı nasıl korunur?"
  ],
  damla: [
    "Damla sulama mı yağmurlama mı daha verimli?",
    "Su tasarrufu nasıl yapılır?",
    "Gri su nedir ve nasıl kullanılır?",
    "Kuraklık döneminde ne yapmalıyım?"
  ]
};

export default function ExampleQuestions({ botSlug, onQuestionClick }: ExampleQuestionsProps) {
  const questions = exampleQuestions[botSlug as keyof typeof exampleQuestions] || [];

  if (questions.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="text-sm bg-white/90 hover:bg-white text-gray-700 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left flex items-center gap-3 group"
          >
            <span className="text-lg">🔮</span>
            <span className="flex-1">{question}</span>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
