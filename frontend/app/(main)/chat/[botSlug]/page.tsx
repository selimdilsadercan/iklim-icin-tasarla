import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ChatPageClient from "./ChatPageClient";

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

  return (
    <ProtectedRoute>
      <ChatPageClient botSlug={botSlug} />
    </ProtectedRoute>
  );
}


