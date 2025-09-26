import ChatPatternBackground from "@/components/ChatPatternBackground";
import ChatClient from "./ChatClient";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BackButton } from "./BackButton";
import { BOT_PERSONAS } from "@/lib/ai-service";
import { BotSlug } from "@/lib/chat-utils";
import Image from "next/image";

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
    <ProtectedRoute>
      <div className="h-screen w-full bg-gray-50 flex flex-col relative">
           <ChatPatternBackground botSlug={botSlug} />
          {/* Chat Header */}
          <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 relative z-20">
            <div className="flex items-center gap-3">
              <BackButton />
              <div className="w-10 h-10">
                {botInfo.icon}
              </div>
              <div className="flex-1">
                <h1 className="font-semibold text-gray-800 -mb-1 mt-0.5">{botInfo.name}</h1>
                <p className="text-sm text-gray-500">{botInfo.status}</p>
              </div>
            </div>
          </div>

          {/* Chat Client Component */}
          <ChatClient botSlug={botSlug} />
        </div>
    </ProtectedRoute>
  );
}

function getBotInfo(botSlug: string) {
  // Use AI personas for bot information
  const persona = BOT_PERSONAS[botSlug as BotSlug];
  if (persona) {
    // Map persona data to our consistent format
    const botMappings = {
      yaprak: {
        name: "Yaprak",
        gradient: "",
        icon: (
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl overflow-hidden">
            <Image 
              src="/bot/yaprak.jpeg" 
              alt="Yaprak" 
              width={40} 
              height={40} 
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        ),
        status: "Çevre Asistanı",
      },
      robi: {
        name: "Robi",
        gradient: "",
        icon: (
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl overflow-hidden">
            <Image 
              src="/bot/robi.jpeg" 
              alt="Robi" 
              width={40} 
              height={40} 
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        ),
        status: "Enerji Asistanı",
      },
      bugday: {
        name: "Buğday",
        gradient: "",
        icon: (
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl overflow-hidden">
            <Image 
              src="/bot/bugday.jpeg" 
              alt="Buğday" 
              width={40} 
              height={40} 
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        ),
        status: "Tarım Asistanı",
      },
      damla: {
        name: "Damla",
        gradient: "",
        icon: (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl overflow-hidden">
            <Image 
              src="/bot/damla.jpeg" 
              alt="Damla" 
              width={40} 
              height={40} 
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        ),
        status: "Su Asistanı",
      },
    };
    
    return botMappings[botSlug as keyof typeof botMappings] || botMappings.yaprak;
  }

  // Fallback to static data if persona not found
  const bots = {
    yaprak: {
      name: "Yaprak",
      gradient: "",
      icon: (
        <div className="w-10 h-10 rounded-xl overflow-hidden">
          <Image 
            src="/bot/yaprak.jpeg" 
            alt="Yaprak" 
            width={40} 
            height={40} 
            className="w-full h-full object-cover"
          />
        </div>
      ),
      status: "Çevre Asistanı",
    },
    robi: {
      name: "Robi",
      gradient: "",
      icon: (
        <div className="w-10 h-10 rounded-xl overflow-hidden">
          <Image 
            src="/bot/robi.jpeg" 
            alt="Robi" 
            width={40} 
            height={40} 
            className="w-full h-full object-cover"
          />
        </div>
      ),
      status: "Enerji Asistanı",
    },
    bugday: {
      name: "Buğday",
      gradient: "",
      icon: (
        <div className="w-10 h-10 rounded-xl overflow-hidden">
          <Image 
            src="/bot/bugday.jpeg" 
            alt="Buğday" 
            width={40} 
            height={40} 
            className="w-full h-full object-cover"
          />
        </div>
      ),
      status: "Tarım Asistanı",
    },
    damla: {
      name: "Damla",
      gradient: "",
      icon: (
        <div className="w-10 h-10 rounded-xl overflow-hidden">
          <Image 
            src="/bot/damla.jpeg" 
            alt="Damla" 
            width={40} 
            height={40} 
            className="w-full h-full object-cover"
          />
        </div>
      ),
      status: "Su Asistanı",
    },
  };

  return bots[botSlug as keyof typeof bots] || bots.yaprak;
}

