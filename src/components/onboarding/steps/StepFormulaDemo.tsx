// ============================================================================
// Step Formula Demo Component
// ============================================================================
// Demonstrates formula input feature (step 2)

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { FormulaPreviewVM } from "@/types";

/**
 * Example formulas with descriptions
 */
const FORMULA_EXAMPLES = [
  {
    notation: "x^2 + 5x + 6",
    description: "Równanie kwadratowe",
    label: "Potęga: ^",
  },
  {
    notation: "sqrt(25)",
    description: "Pierwiastek kwadratowy",
    label: "Pierwiastek: sqrt()",
  },
  {
    notation: "(a + b) / 2",
    description: "Średnia arytmetyczna",
    label: "Ułamek: /",
  },
  {
    notation: "2 * pi * r",
    description: "Obwód koła",
    label: "Mnożenie: *",
  },
];

/**
 * Step 2: Formula Input Demo
 * Shows how to input mathematical formulas
 * Demonstrates:
 * - Simple text notation (^, sqrt, /, *)
 * - Live preview (plain text for MVP, KaTeX/MathJax in future)
 * - Example formulas
 */
export function StepFormulaDemo() {
  const [formula, setFormula] = useState<FormulaPreviewVM>({
    raw: "",
    rendered: undefined,
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormula({
      raw: value,
      rendered: value, // MVP: plain text, future: KaTeX render
    });
  };

  const handleExampleClick = (notation: string) => {
    setFormula({
      raw: notation,
      rendered: notation,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Wpisywanie wzorów matematycznych</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Użyj prostej notacji tekstowej - AI automatycznie sformatuje wzory podczas rozmowy.
          </p>
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Input field */}
            <div className="space-y-2">
              <Label htmlFor="formula-input">Spróbuj wpisać wzór matematyczny:</Label>
              <Input
                id="formula-input"
                type="text"
                placeholder="np. x^2 + 3x - 5"
                value={formula.raw}
                onChange={handleInputChange}
                className="font-mono text-base"
                aria-describedby="formula-preview"
              />
            </div>

            {/* Preview */}
            {formula.rendered && (
              <div id="formula-preview" className="rounded-lg bg-muted p-4" role="region" aria-label="Podgląd wzoru">
                <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Podgląd:</div>
                <div className="font-mono text-lg">{formula.rendered}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  W pełnej wersji AI będzie renderować wzory w ładnym formacie matematycznym
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Przykłady notacji</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {FORMULA_EXAMPLES.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example.notation)}
                className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Wstaw przykład: ${example.description}`}
              >
                <div className="flex-1">
                  <div className="mb-1 font-mono text-sm font-medium">{example.notation}</div>
                  <div className="text-xs text-muted-foreground">{example.description}</div>
                </div>
                <Badge variant="secondary" className="ml-3">
                  {example.label}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="mb-3 font-semibold">Często używane symbole:</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <code className="rounded bg-background px-2 py-1 font-mono">^</code>
              <span className="text-muted-foreground">Potęga (x^2)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <code className="rounded bg-background px-2 py-1 font-mono">/</code>
              <span className="text-muted-foreground">Dzielenie (a/b)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <code className="rounded bg-background px-2 py-1 font-mono">*</code>
              <span className="text-muted-foreground">Mnożenie (2*x)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <code className="rounded bg-background px-2 py-1 font-mono">sqrt()</code>
              <span className="text-muted-foreground">Pierwiastek (sqrt(16))</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
