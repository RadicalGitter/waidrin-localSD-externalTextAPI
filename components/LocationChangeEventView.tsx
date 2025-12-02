// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Flex, Heading, Text } from "@radix-ui/themes";
import { useShallow } from "zustand/shallow";
import { type LocationChangeEvent, useStateStore } from "@/lib/state";

const SD_PLUGIN_NAME = "Stable Diffusion (ComfyUI)";

export default function LocationChangeEventView({ event }: { event: LocationChangeEvent }) {
  const { location, pluginImage } = useStateStore(
    useShallow((state) => {
      const location = state.locations[event.locationIndex];
      const sdPlugin = state.plugins.find((plugin) => plugin.name === SD_PLUGIN_NAME);
      const locationImages =
        sdPlugin && typeof sdPlugin.settings === "object" && sdPlugin.settings !== null
          ? (sdPlugin.settings as { locationImages?: unknown }).locationImages
          : undefined;

      const typedImages =
        locationImages && typeof locationImages === "object"
          ? (locationImages as Record<string, { url?: string }>)
          : undefined;

      return {
        location,
        pluginImage: location && typedImages ? typedImages[location.name] : undefined,
      };
    }),
  );

  const imageSrc = pluginImage?.url || `/images/${location.type}.png`;
  const imageAlt = pluginImage ? location.name : location.type;

  return (
    <Flex direction="column" width="100%">
      <img src={imageSrc} alt={imageAlt} style={{ width: "100%", height: "auto", display: "block" }} />

      <Flex className="bg-(--orange-2)" direction="column" p="6">
        <Heading className="lowercase" size="7" color="orange" align="center" mb="5">
          {location.name}
        </Heading>
        <Text
          className="first-letter:float-left first-letter:mr-2 first-letter:text-[350%] first-letter:mt-[0.11em] first-line:tracking-wider first-line:uppercase"
          size="5"
          color="bronze"
        >
          {location.description}
        </Text>
      </Flex>
    </Flex>
  );
}
