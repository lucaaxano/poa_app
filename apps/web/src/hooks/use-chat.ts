'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi, ChatMessage, ExtractedClaimData } from '@/lib/api/chat';
import type { Claim } from '@poa/shared';

/**
 * Initial greeting message from the AI
 */
const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'Hallo! Ich bin Ihr KI-Schadensassistent. Ich helfe Ihnen dabei, einen Schaden schnell und unkompliziert zu melden.\n\nWas ist passiert? Beschreiben Sie einfach, was vorgefallen ist.',
};

/**
 * Hook for managing chat state and interactions
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isComplete, setIsComplete] = useState(false);
  const [extractedData, setExtractedData] =
    useState<Partial<ExtractedClaimData> | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Track whether the component is still mounted to prevent zombie state updates
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Mutation for sending chat messages
   */
  const chatMutation = useMutation({
    mutationFn: (allMessages: ChatMessage[]) =>
      chatApi.sendMessage(allMessages),
    onSuccess: (response) => {
      if (!isMountedRef.current) return;
      setChatError(null);

      // Add assistant's response to messages
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.message },
      ]);

      // Update completion status
      setIsComplete(response.isComplete);

      // Update extracted data if available
      if (response.extractedData) {
        setExtractedData((prev) => ({
          ...prev,
          ...response.extractedData,
        }));
      }
    },
    onError: (error) => {
      if (!isMountedRef.current) return;
      console.error('Chat error:', error);
      setChatError(
        'Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
      );
    },
  });

  /**
   * Mutation for completing the chat and creating a claim
   */
  const completeMutation = useMutation({
    mutationFn: ({
      allMessages,
      submitImmediately,
    }: {
      allMessages: ChatMessage[];
      submitImmediately: boolean;
    }) => chatApi.completeClaim(allMessages, submitImmediately),
  });

  /**
   * Send a new message in the chat
   */
  const sendMessage = useCallback(
    (content: string) => {
      setChatError(null);

      // Add user message to state
      const userMessage: ChatMessage = { role: 'user', content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);

      // Send to API
      chatMutation.mutate(newMessages);
    },
    [messages, chatMutation]
  );

  /**
   * Retry sending the last message after an error
   */
  const retryLastMessage = useCallback(() => {
    setChatError(null);
    // Re-send current messages (last user message is already in state)
    chatMutation.mutate(messages);
  }, [messages, chatMutation]);

  /**
   * Submit the claim from the chat conversation
   */
  const submitClaim = useCallback(
    async (submitImmediately: boolean): Promise<Claim> => {
      return completeMutation.mutateAsync({
        allMessages: messages,
        submitImmediately,
      });
    },
    [messages, completeMutation]
  );

  /**
   * Reset the chat to initial state
   */
  const resetChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setIsComplete(false);
    setExtractedData(null);
    setChatError(null);
    chatMutation.reset();
  }, [chatMutation]);

  return {
    messages,
    isLoading: chatMutation.isPending,
    isSubmitting: completeMutation.isPending,
    isComplete,
    extractedData,
    error: chatMutation.error,
    chatError,
    sendMessage,
    retryLastMessage,
    submitClaim,
    resetChat,
  };
}
