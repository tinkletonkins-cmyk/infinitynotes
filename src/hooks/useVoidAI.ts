import { useState, useCallback } from 'react';
import { Note } from './useNotes';
import { useToast } from './use-toast';

const VOID_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/void-ai`;

interface ConnectionSuggestion {
  from: string;
  to: string;
  reason: string;
}

export function useVoidAI() {
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [connectionSuggestions, setConnectionSuggestions] = useState<ConnectionSuggestion[]>([]);
  const { toast } = useToast();

  const generateSummary = useCallback(async (notes: Note[]) => {
    if (notes.length === 0) {
      toast({
        title: "No thoughts to summarize",
        description: "Add some notes to the void first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSummary(true);
    setSummary(null);

    try {
      const response = await fetch(VOID_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "summary",
          notes: notes.map(n => ({ id: n.id, text: n.text })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.result);
    } catch (error) {
      console.error("Summary error:", error);
      toast({
        title: "Summary failed",
        description: error instanceof Error ? error.message : "Could not generate summary",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [toast]);

  const suggestConnections = useCallback(async (notes: Note[]) => {
    if (notes.length < 2) {
      toast({
        title: "Need more notes",
        description: "Add at least 2 notes to find connections.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingConnections(true);
    setConnectionSuggestions([]);

    try {
      const response = await fetch(VOID_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "connections",
          notes: notes.map(n => ({ id: n.id, text: n.text })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze connections");
      }

      const data = await response.json();
      
      // Parse the JSON response from AI
      try {
        const parsed = JSON.parse(data.result);
        if (Array.isArray(parsed)) {
          setConnectionSuggestions(parsed);
          if (parsed.length === 0) {
            toast({
              title: "No connections found",
              description: "The AI couldn't find related notes.",
            });
          }
        }
      } catch {
        console.error("Failed to parse connections:", data.result);
        toast({
          title: "Parse error",
          description: "Could not understand AI response",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connections error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze connections",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConnections(false);
    }
  }, [toast]);

  const clearSummary = useCallback(() => setSummary(null), []);
  const clearSuggestions = useCallback(() => setConnectionSuggestions([]), []);

  return {
    // Summary
    summary,
    isLoadingSummary,
    generateSummary,
    clearSummary,
    // Connections
    connectionSuggestions,
    isLoadingConnections,
    suggestConnections,
    clearSuggestions,
  };
}
