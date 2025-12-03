// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Button, Flex, HoverCard, IconButton, Link, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { GiFairyWand } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import { useStateStore } from "@/lib/state";
import CharacterView from "./CharacterView";

export default function ActionChoice({ onAction, textSize = 5 }: { onAction: (action: string) => void; textSize?: 3 | 4 | 5 }) {
  const [customAction, setCustomAction] = useState("");

  const { protagonist, actions } = useStateStore(
    useShallow((state) => ({
      protagonist: state.protagonist,
      actions: state.actions,
    })),
  );

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

      {actions.map((action, index) => (
        <Button
          // biome-ignore lint/suspicious/noArrayIndexKey: Actions are immutable, so this is valid.
          key={index}
          className="h-auto justify-start text-start py-[0.5em] whitespace-normal break-words"
          variant="surface"
          radius="large"
          color="sky"
          size="3"
          onClick={() => {
            onAction(action);
            setCustomAction("");
          }}
        >
          <Text size={textSize}>{action}</Text>
        </Button>
      ))}

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
