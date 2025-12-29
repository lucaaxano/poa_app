'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatContainer } from '@/components/claims/chat/chat-container';

export default function ChatClaimPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={'/claims/new' as Route}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Schaden per Chat melden
            </h1>
            <p className="text-muted-foreground">
              Unser KI-Assistent fuehrt Sie durch die Schadenmeldung
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <ChatContainer />
    </div>
  );
}
