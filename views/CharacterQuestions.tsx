// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

import { Box, Checkbox, Flex, Text, TextArea, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { useShallow } from "zustand/shallow";
import WizardStep from "@/components/WizardStep";
import { useStateStore } from "@/lib/state";

interface QuestionConfig {
  label: string;
  field: "age" | "childhood" | "adolescence" | "description";
  autoField: "autoAge" | "autoChildhood" | "autoAdolescence" | "autoDescription";
  placeholder: string;
  multiline?: boolean;
}

const questions: QuestionConfig[] = [
  { label: "Current age", field: "age", autoField: "autoAge", placeholder: "e.g., 27" },
  {
    label: "What was their childhood like?",
    field: "childhood",
    autoField: "autoChildhood",
    placeholder: "e.g., raised in a bustling port town by a traveling merchant",
    multiline: true,
  },
  {
    label: "How did they spend their adolescence?",
    field: "adolescence",
    autoField: "autoAdolescence",
    placeholder: "e.g., served as a squire, then joined a caravan across the desert",
    multiline: true,
  },
  {
    label: "A brief description",
    field: "description",
    autoField: "autoDescription",
    placeholder: "e.g., calm but curious, loves maps and old songs",
    multiline: true,
  },
];

export default function CharacterQuestions({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { answers, setState } = useStateStore(
    useShallow((state) => ({
      answers: state.characterQuestions,
      setState: state.set,
    })),
  );

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
    </WizardStep>
  );
}
