// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

import { Box, Button, Checkbox, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useState } from "react";
import { useShallow } from "zustand/shallow";
import * as z from "zod/v4";
import WizardStep from "@/components/WizardStep";
import { getBackend } from "@/lib/backend";
import { useStateStore } from "@/lib/state";

interface QuestionConfig {
  label: string;
  field: "name" | "age" | "childhood" | "adolescence" | "description";
  autoField: "autoName" | "autoAge" | "autoChildhood" | "autoAdolescence" | "autoDescription";
  placeholder: string;
  multiline?: boolean;
  suggestable: boolean;
}

const questions: QuestionConfig[] = [
  { label: "Name", field: "name", autoField: "autoName", placeholder: "e.g., Arlen Thorne", suggestable: true },
  { label: "Current age", field: "age", autoField: "autoAge", placeholder: "e.g., 27", suggestable: false },
  {
    label: "What was their childhood like?",
    field: "childhood",
    autoField: "autoChildhood",
    placeholder: "e.g., raised in a bustling port town by a traveling merchant",
    multiline: true,
    suggestable: true,
  },
  {
    label: "How did they spend their adolescence?",
    field: "adolescence",
    autoField: "autoAdolescence",
    placeholder: "e.g., served as a squire, then joined a caravan across the desert",
    multiline: true,
    suggestable: true,
  },
  {
    label: "A brief description",
    field: "description",
    autoField: "autoDescription",
    placeholder: "e.g., calm but curious, loves maps and old songs",
    multiline: true,
    suggestable: true,
  },
];

export default function CharacterQuestions({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { answers, setState } = useStateStore(
    useShallow((state) => ({
      answers: state.characterQuestions,
      setState: state.set,
    })),
  );
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestSuggestion = async (target: QuestionConfig) => {
    setLoadingField(target.field);
    setError(null);

    const order = ["name", "age", "childhood", "adolescence", "description"] as const;
    const currentIndex = order.indexOf(target.field);

    const fieldsToRequest = new Set<string>([target.field]);
    // Include earlier fields that are set to auto.
    for (let i = 0; i < currentIndex; i++) {
      const field = order[i];
      const autoKey = `auto${field.charAt(0).toUpperCase()}${field.slice(1)}` as keyof typeof answers;
      if ((answers as Record<string, unknown>)[autoKey] === true) {
        fieldsToRequest.add(field);
      }
    }

    if (fieldsToRequest.size === 0) {
      setLoadingField(null);
      return;
    }

    const knownParts: string[] = [];
    if (answers.name && answers.autoName === false) knownParts.push(`Name: ${answers.name}`);
    if (answers.age && answers.autoAge === false) knownParts.push(`Age: ${answers.age}`);
    if (answers.childhood && answers.autoChildhood === false) knownParts.push(`Childhood: ${answers.childhood}`);
    if (answers.adolescence && answers.autoAdolescence === false)
      knownParts.push(`Adolescence: ${answers.adolescence}`);
    if (answers.description && answers.autoDescription === false) knownParts.push(`Description: ${answers.description}`);

    const targetList = Array.from(fieldsToRequest).join(", ");

    const prompt = {
      system: "You are a concise character writer.",
      user: `
Suggest concise entries for the following protagonist fields: ${targetList}.
${knownParts.length > 0 ? `Known details: ${knownParts.join(" | ")}` : ""}
Return a JSON object with exactly these keys: ${targetList}. Keep each value to 10-40 words. For "description", write 4 sentences.
`,
    };

    const schemaShape: Record<string, z.ZodTypeAny> = {};
    fieldsToRequest.forEach((field) => {
      schemaShape[field] = z.string().trim();
    });
    const schema = z.object(schemaShape);

    try {
      const result = await getBackend().getObject(prompt, schema);
      setState((state) => {
        const targetState = state.characterQuestions as Record<string, unknown>;
        for (const [key, value] of Object.entries(result)) {
          targetState[key] = value;
          const autoKey = `auto${key.charAt(0).toUpperCase()}${key.slice(1)}`;
          if (autoKey in targetState) {
            targetState[autoKey] = false;
          }
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Failed to get suggestion");
    } finally {
      setLoadingField(null);
    }
  };

  const renderInput = (question: QuestionConfig) => {
    const value = answers[question.field];
    const auto = answers[question.autoField];

    const onChange = (text: string) =>
      setState((state) => {
        state.characterQuestions[question.field] = text;
      });

    const onToggleAuto = (checked: boolean) =>
      setState((state) => {
        state.characterQuestions[question.autoField] = checked;
        if (checked) {
          state.characterQuestions[question.field] = "";
        }
      });

    return (
      <Box key={question.field} mb="5">
        <Label.Root>
          <Flex justify="between" align="center" mb="2">
            <Text size="6">{question.label}</Text>
            <Flex align="center" gap="2">
              {question.suggestable && (
                <Button
                  size="2"
                  variant="outline"
                  disabled={loadingField === question.field}
                  onClick={() => requestSuggestion(question)}
                >
                  {loadingField === question.field ? "Suggesting..." : "Suggest"}
                </Button>
              )}
              <Checkbox
                checked={auto}
                onCheckedChange={(checked) => onToggleAuto(checked === true)}
                id={`${question.field}-auto`}
              />
              <Text as="label" htmlFor={`${question.field}-auto`} size="3" color="gray">
                Let LLM decide
              </Text>
            </Flex>
          </Flex>
          {question.multiline ? (
            <TextArea
              value={value}
              disabled={auto}
              onChange={(event) => onChange(event.target.value)}
              placeholder={question.placeholder}
              size="3"
              minRows={3}
            />
          ) : (
            <TextField.Root
              value={value}
              disabled={auto}
              onChange={(event) => onChange(event.target.value)}
              placeholder={question.placeholder}
              size="3"
            />
          )}
        </Label.Root>
      </Box>
    );
  };

  return (
    <WizardStep title="Protagonist Details" onNext={onNext} onBack={onBack}>
          {questions.map((question) => renderInput(question))}
      {error && (
        <Text color="red" size="3">
          {error}
        </Text>
      )}
    </WizardStep>
  );
}
