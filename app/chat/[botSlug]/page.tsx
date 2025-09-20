import ChatPatternBackground from "@/components/ChatPatternBackground";
import ChatClient from "./ChatClient";

// Generate static params for static export
export async function generateStaticParams() {
  return [
    { botSlug: 'yaprak' },
    { botSlug: 'robi' },
    { botSlug: 'bugday' },
    { botSlug: 'damla' },
  ];
}


interface ChatPageProps {
  params: Promise<{
    botSlug: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { botSlug } = await params;
  const botInfo = getBotInfo(botSlug);

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col relative">
         <ChatPatternBackground botSlug={botSlug} />
        {/* Chat Header */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 relative z-20">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${botInfo.color}`}>
              <span className="text-white font-bold text-lg">{botInfo.emoji}</span>
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-gray-800">{botInfo.name}</h1>
              <p className="text-sm text-gray-500">{botInfo.status}</p>
            </div>
          </div>
        </div>

        {/* Chat Client Component */}
        <ChatClient botSlug={botSlug} />
      </div>
  );
}

function getBotInfo(botSlug: string) {
  const bots = {
    yaprak: {
      name: "Yaprak - Çevre Asistanı",
      emoji: "🌱",
      color: "bg-green-500",
      status: "Çevre konularında yardım için buradayım",
    },
    robi: {
      name: "Robi - Enerji Asistanı",
      emoji: "⚡",
      color: "bg-blue-500",
      status: "Enerji tasarrufu konusunda rehberlik ediyorum",
    },
    bugday: {
      name: "Buğday - Tarım Asistanı",
      emoji: "🌾",
      color: "bg-yellow-500",
      status: "Sürdürülebilir tarım hakkında bilgi veriyorum",
    },
    damla: {
      name: "Damla - Su Asistanı",
      emoji: "💧",
      color: "bg-purple-500",
      status: "Su tasarrufu ve korunması konusunda yardımcıyım",
    },
  };

  return bots[botSlug as keyof typeof bots] || bots.yaprak;
}

