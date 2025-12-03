// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025

"use client";

import { DropdownMenu, IconButton, Text } from "@radix-ui/themes";
import { GiElfHelmet } from "react-icons/gi";
import { useShallow } from "zustand/shallow";
import { reset } from "@/lib/engine";
import { useStateStore } from "@/lib/state";

export default function MainMenu() {
  const { useNewLayout, setState } = useStateStore(
    useShallow((state) => ({
      useNewLayout: state.useNewLayout,
      setState: state.set,
    })),
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton className="fixed top-3 left-3" variant="ghost" color="gray">
          <GiElfHelmet size="35" />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content color="gray">
        <DropdownMenu.Item
          onClick={() => window.open("https://github.com/p-e-w/waidrin/issues", "_blank", "noopener,noreferrer")}
        >
          <Text size="5">Report an issue...</Text>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onClick={() =>
            setState((state) => {
              state.useNewLayout = !state.useNewLayout;
            })
          }
        >
          <Text size="5">{useNewLayout ? "Use classic layout" : "Use bin layout"}</Text>
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" onClick={reset}>
          <Text size="5">Reset state (wipes all progress)</Text>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
