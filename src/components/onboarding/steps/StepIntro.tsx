// ============================================================================
// Step Intro Component
// ============================================================================
// Welcome screen (step 0) introducing the AI Math Tutor

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Step 0: Welcome/Intro
 * Introduces the user to AI Tutor Matematyki
 * Explains what they'll learn in the tutorial
 */
export function StepIntro() {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl">Witaj w AI Tutor Matematyki! 👋</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-lg text-muted-foreground">
            To krótki samouczek pomoże Ci poznać kluczowe funkcje aplikacji.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">W następnych krokach pokażemy Ci:</h3>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  aria-hidden="true"
                >
                  1
                </span>
                <div>
                  <strong className="font-medium">Jak rozmawiać z AI Tutorem</strong>
                  <p className="text-sm text-muted-foreground">
                    Zadawaj pytania głosem lub tekstem, a AI pomoże Ci zrozumieć problem krok po kroku.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  aria-hidden="true"
                >
                  2
                </span>
                <div>
                  <strong className="font-medium">Jak wpisywać wzory</strong>
                  <p className="text-sm text-muted-foreground">
                    Użyj prostej notacji matematycznej, którą AI automatycznie sformatuje.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  aria-hidden="true"
                >
                  3
                </span>
                <div>
                  <strong className="font-medium">Gdzie znajdziesz swój postęp</strong>
                  <p className="text-sm text-muted-foreground">
                    Zobacz mapę swoich umiejętności i śledź, które tematy już opanowałeś.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-8 rounded-lg bg-muted/50 p-4">
            <p className="text-center text-sm text-muted-foreground">
              Samouczek zajmie około <strong>2-3 minut</strong>. Możesz go pominąć w każdej chwili od kroku 3.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
