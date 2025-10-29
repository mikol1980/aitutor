// ============================================================================
// Step Conversation Demo Component
// ============================================================================
// Demonstrates AI conversation feature (step 1)

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MessageItemVM } from "@/types";

/**
 * Demo conversation data
 */
const DEMO_MESSAGES: MessageItemVM[] = [
  {
    sender: "user",
    text: "Jak rozwiązać równanie kwadratowe: x² + 5x + 6 = 0?",
  },
  {
    sender: "ai",
    text: "Świetne pytanie! Możemy rozwiązać to równanie na kilka sposobów. Zacznijmy od wzoru skróconego mnożenia. Czy widzisz liczby, które w sumie dają 5, a w iloczynie 6?",
  },
  {
    sender: "user",
    text: "Hmm... 2 i 3?",
  },
  {
    sender: "ai",
    text: "Dokładnie! Więc możemy zapisać: (x + 2)(x + 3) = 0. Teraz możemy łatwo znaleźć rozwiązania: x = -2 lub x = -3. Świetna robota! 🎉",
  },
];

/**
 * Step 1: AI Conversation Demo
 * Shows example conversation with AI tutor
 * Demonstrates:
 * - Question/answer flow
 * - Step-by-step guidance
 * - Encouraging feedback
 */
export function StepConversationDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const showNextMessage = () => {
    if (visibleMessages < DEMO_MESSAGES.length) {
      setIsAnimating(true);
      setTimeout(() => {
        setVisibleMessages((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const resetDemo = () => {
    setVisibleMessages(0);
  };

  const allMessagesVisible = visibleMessages === DEMO_MESSAGES.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Rozmowa z AI Tutorem</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            AI Tutor prowadzi Cię krok po kroku, zadaje pytania pomocnicze i dostosowuje wyjaśnienia do Twojego poziomu.
          </p>
        </CardContent>
      </Card>

      {/* Conversation Demo */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4" role="log" aria-label="Przykładowa konwersacja" aria-live="polite">
            {DEMO_MESSAGES.slice(0, visibleMessages).map((message, index) => (
              <div key={index} className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {/* Sender label for screen readers */}
                  <span className="sr-only">{message.sender === "user" ? "Użytkownik" : "AI Tutor"}:</span>

                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isAnimating && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex justify-center gap-3">
            {!allMessagesVisible && (
              <Button onClick={showNextMessage} disabled={isAnimating} aria-label="Pokaż następną wiadomość">
                {visibleMessages === 0 ? "Rozpocznij demo" : "Następna wiadomość"}
              </Button>
            )}

            {visibleMessages > 0 && (
              <Button variant="outline" onClick={resetDemo} disabled={isAnimating} aria-label="Zresetuj demo">
                Zacznij od nowa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="mb-3 font-semibold">Wskazówki:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden="true">💡</span>
              <span>Możesz rozmawiać głosem lub wpisywać pytania tekstem</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">🎯</span>
              <span>AI dostosowuje poziom wyjaśnień do Twojego zrozumienia tematu</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">🚀</span>
              <span>Nie bój się zadawać pytań - nie ma głupich pytań w matematyce!</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
