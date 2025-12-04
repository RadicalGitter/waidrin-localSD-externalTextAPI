// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Flex, HoverCard, IconButton, Link, Text, TextField } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { GiFairyWand } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import { useStateStore } from "@/lib/state";
import CharacterView from "./CharacterView";

export default function ActionChoice({ onAction, textSize = 5 }: { onAction: (action: string) => void; textSize?: number }) {
  const [customAction, setCustomAction] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lastActionsRef = useRef<string[]>([]);
  const [displayActions, setDisplayActions] = useState<string[]>([]);

  const { protagonist, actions } = useStateStore(
    useShallow((state) => ({
      protagonist: state.protagonist,
      actions: state.actions,
    })),
  );

  useEffect(() => {
    if (actions.length > 0) {
      lastActionsRef.current = actions;
      setDisplayActions(actions);
      setSelectedIndex(null);
    } else {
      // Keep showing the previous set while waiting for new actions.
      setDisplayActions(lastActionsRef.current);
    }
  }, [actions]);

  return (
    <Flex className="bg-(--sky-1)" direction="column" width="100%" p="6" gap="4">
      <Text size="6">
        What do you (
        <HoverCard.Root>
          <HoverCard.Trigger>
            <Link color="pink" href="#" onClick={(event) => event.preventDefault()}>
              {protagonist.name}
            </Link>
          </HoverCard.Trigger>
          <HoverCard.Content maxWidth="40rem">
            <Box p="2">
              <CharacterView character={protagonist} />
            </Box>
          </HoverCard.Content>
        </HoverCard.Root>
        ) do next?
      </Text>

      {displayActions.map((action, index) => {
        const isSelected = selectedIndex === index;
        const isDimmed = selectedIndex !== null && selectedIndex !== index;
        return (
          <Button
            // biome-ignore lint/suspicious/noArrayIndexKey: Actions are immutable, so this is valid.
            key={index}
            className="h-auto justify-start text-start py-[0.5em] whitespace-normal break-words transition-all duration-200"
            variant="surface"
            radius="large"
            color="sky"
            size="3"
            onClick={() => {
              setSelectedIndex(index);
              onAction(action);
              setCustomAction("");
            }}
            style={{
              opacity: isDimmed ? 0.2 : 1,
              pointerEvents: selectedIndex !== null ? (isSelected ? "auto" : "none") : "auto",
              boxShadow: isSelected ? "0 0 50px rgba(255, 233, 154, 0.78)" : undefined,
              transform: isSelected ? "scale(1.01)" : undefined,
              animation: isSelected ? "actionHighlight 800ms ease-out forwards" : undefined,
              backgroundColor: isSelected ? "rgba(255, 255, 255, 0.62)" : undefined,
            }}
          >
            <Text
              size={textSize}
              style={{
                color: isSelected ? "#d9a600ff" : undefined,
                transition: "color 300ms ease, filter 300ms ease, text-shadow 300ms ease",
                filter: isSelected ? "brightness(1)" : undefined,
                textShadow: isSelected ? "0 0 1px #493800ff" : undefined,
              }}
            >
              {action}
            </Text>
          </Button>
        );
      })}

      <TextField.Root
        value={customAction}
        onChange={(event) => setCustomAction(event.target.value)}
        className="text-(length:--font-size-5) px-0 [&_input]:indent-(--space-4)"
        radius="large"
        color="sky"
        size="3"
        placeholder="Something else..."
        maxLength={200}
        onKeyDown={(event) => {
          if (event.key === "Enter" && customAction) {
            onAction(customAction);
            setCustomAction("");
          }
        }}
        autoFocus
      >
        <TextField.Slot side="right" pr="3">
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => {
              if (customAction) {
                onAction(customAction);
                setCustomAction("");
              }
            }}
          >
            <GiFairyWand />
          </IconButton>
        </TextField.Slot>
      </TextField.Root>
    </Flex>
  );
}
