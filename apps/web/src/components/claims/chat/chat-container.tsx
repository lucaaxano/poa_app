'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChatMessageComponent } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatTypingIndicator } from './chat-typing-indicator';
import { ChatSummary } from './chat-summary';
import { useChat } from '@/hooks/use-chat';
import { MessageCircle, Send, Save, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ChatContainer() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoading,
    isSubmitting,
    isComplete,
    extractedData,
    sendMessage,
    submitClaim,
    resetChat,
  } = useChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (submitImmediately: boolean) => {
    try {
      const claim = await submitClaim(submitImmediately);
      toast.success(
        submitImmediately
          ? 'Schaden erfolgreich gemeldet!'
          : 'Schaden als Entwurf gespeichert!'
      );
      router.push(`/claims/${claim.id}` as Route);
    } catch (error) {
      console.error('Error creating claim:', error);
      toast.error('Fehler beim Erstellen des Schadens. Bitte versuchen Sie es erneut.');
    }
  };

  const handleReset = () => {
    resetChat();
    toast.info('Chat zurueckgesetzt');
  };

  return (
    <Card className="rounded-2xl border shadow-soft h-[calc(100vh-220px)] min-h-[500px] flex flex-col">
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">KI-Schadensassistent</h3>
              <p className="text-sm text-muted-foreground">
                {isComplete
                  ? 'Bereit zur Meldung'
                  : isLoading
                    ? 'Schreibt...'
                    : 'Erfasst Ihre Schadendaten'}
              </p>
            </div>
          </div>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="rounded-xl"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Neu starten
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <ChatMessageComponent key={index} message={message} />
            ))}
            {isLoading && <ChatTypingIndicator />}
            {extractedData && Object.keys(extractedData).length > 0 && (
              <ChatSummary data={extractedData} />
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-4">
        {isComplete ? (
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Als Entwurf speichern
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Schaden melden
            </Button>
          </div>
        ) : (
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        )}
      </CardFooter>
    </Card>
  );
}
