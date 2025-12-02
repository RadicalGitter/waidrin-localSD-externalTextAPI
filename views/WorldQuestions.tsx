// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

import { Box, Button, Checkbox, Flex, Separator, Text, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useState } from "react";
import { useShallow } from "zustand/shallow";
import * as z from "zod/v4";
import WizardStep from "@/components/WizardStep";
import { getBackend } from "@/lib/backend";
import { useStateStore } from "@/lib/state";

const suggestionsSchema = z.array(z.string().trim()).length(3);

export default function WorldQuestions({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { worldQuestions, setState } = useStateStore(
    useShallow((state) => ({
      worldQuestions: state.worldQuestions,
      setState: state.set,
    })),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setWorldType = (value: string) =>
    setState((state) => {
      state.worldQuestions.worldType = value;
    });

  const toggleAuto = (auto: boolean) =>
    setState((state) => {
      state.worldQuestions.autoWorldType = auto;
      if (auto) {
        state.worldQuestions.worldType = "";
      }
    });

  const copySuggestion = (index: number) =>
    setState((state) => {
      const value = state.worldQuestions.suggestions[index] ?? "";
      state.worldQuestions.autoWorldType = false;
      state.worldQuestions.worldType = value;
    });

  const requestSuggestions = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const promptText = `
Provide 3 one-sentence world pitches for a fantasy RPG. Each should be 10-30 words.
If a seed is given, lean into it. Seed (optional): "${worldQuestions.worldType}".
Return a JSON array of 3 strings.
`;

      const prompt = {
        system: "You are a creative world-builder who answers concisely.",
        user: promptText,
      };

      const suggestions = await getBackend().getObject(prompt, suggestionsSchema);

      setState((state) => {
        state.worldQuestions.suggestions = suggestions;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Failed to get suggestions");
    } finally {
      const elapsedMs = performance.now() - start;
      console.log(`[WorldQuestions] Suggest call took ${elapsedMs.toFixed(0)} ms`);
      setLoading(false);
    }
  };

  return (
    <WizardStep title="World Details" onNext={onNext} onBack={onBack}>
      <Box mb="6">
        <Label.Root>
          <Flex justify="between" align="center" mb="2">
            <Text size="6">World type</Text>
            <Flex align="center" gap="2">
              <Button variant="outline" size="2" disabled={loading} onClick={requestSuggestions}>
                {loading ? "Suggesting..." : "Suggest"}
              </Button>
              <Checkbox
                checked={worldQuestions.autoWorldType}
                onCheckedChange={(checked) => toggleAuto(checked === true)}
                id="autoWorldType"
              />
              <Text as="label" htmlFor="autoWorldType" size="3" color="gray">
                Let LLM decide
              </Text>
            </Flex>
          </Flex>
          <TextField.Root
            value={worldQuestions.worldType}
            disabled={worldQuestions.autoWorldType}
            onChange={(event) => setWorldType(event.target.value)}
            placeholder="e.g., high magic empire, grimdark frontier, post-cataclysm ruins"
            size="3"
          />
        </Label.Root>
      </Box>

      {error && (
        <Box mb="3">
          <Text color="red" size="3">
            {error}
          </Text>
        </Box>
      )}

      {worldQuestions.suggestions.length > 0 && (
        <>
          <Separator my="4" />
          <Text size="4" weight="bold" mb="3">
            Suggestions (click to copy)
          </Text>
          <Flex direction="column" gap="3">
            {worldQuestions.suggestions.map((suggestion, index) => {
              return (
                <Button key={index} size="3" color="purple" variant="soft" onClick={() => copySuggestion(index)}>
                  <Text color="gray" highContrast>
                    {suggestion || `Option ${index + 1}`}
                  </Text>
                </Button>
              );
            })}
          </Flex>
        </>
      )}
    </WizardStep>
  );
}
