// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Flex, Heading, ScrollArea, Separator, Text } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import ActionChoice from "@/components/ActionChoice";
import ErrorBar from "@/components/ErrorBar";
import EventView from "@/components/EventView";
import CharacterIntroductionEventView from "@/components/CharacterIntroductionEventView";
import LocationChangeEventView from "@/components/LocationChangeEventView";
import NarrationEventView from "@/components/NarrationEventView";
import ProcessingBar from "@/components/ProcessingBar";
import { abort, isAbortError, next } from "@/lib/engine";
import { type Event, type LocationChangeEvent, useStateStore } from "@/lib/state";

export default function Chat() {
  const [lastAction, setLastAction] = useState<string | undefined>(undefined);
  const [barVisible, setBarVisible] = useState(false);
  const [barTitle, setBarTitle] = useState("");
  const [barTokenCount, setBarTokenCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const doAction = async (action?: string) => {
    try {
      await next(action, (title, _message, tokenCount) => {
        setBarVisible(true);
        setBarTitle(title);
        setBarTokenCount(tokenCount);
      });
    } catch (error) {
      if (!isAbortError(error)) {
        let message = error instanceof Error ? error.message : String(error);
        if (!message) {
          message = "Unknown error";
        }
        setErrorMessage(message);
      }
    } finally {
      setBarVisible(false);
    }
  };

  const { events, actions, useNewLayout, locations, plugins } = useStateStore(
    useShallow((state) => ({
      events: state.events,
      actions: state.actions,
      useNewLayout: state.useNewLayout,
      locations: state.locations,
      plugins: state.plugins,
    })),
  );

  const imageForLocation = (locationIndex: number) => {
    const location = locations[locationIndex];
    if (!location) return null;
    const sdPlugin = plugins.find((plugin) => plugin.name === "Stable Diffusion (ComfyUI)");
    const sdImage =
      sdPlugin && sdPlugin.settings && typeof sdPlugin.settings === "object"
        ? (sdPlugin.settings as { locationImages?: Record<string, { url?: string }> }).locationImages?.[location.name]
        : undefined;
    return sdImage?.url || `/images/${location.type}.png`;
  };

  const lastLocationChangeIndex = [...events].reverse().findIndex((ev) => ev.type === "location_change");
  const locationChangeAbsoluteIndex =
    lastLocationChangeIndex >= 0 ? events.length - 1 - lastLocationChangeIndex : -1;
  const currentLocationEvent =
    locationChangeAbsoluteIndex >= 0 ? (events[locationChangeAbsoluteIndex] as LocationChangeEvent) : null;
  const eventsSinceLocationChange =
    locationChangeAbsoluteIndex >= 0 ? events.slice(locationChangeAbsoluteIndex + 1) : events;
  const introEvents = eventsSinceLocationChange.filter((ev) => ev.type === "character_introduction");
  const historyEvents = eventsSinceLocationChange.filter(
    (ev) => ev.type === "narration" || ev.type === "action",
  );

  const eventsContainerRef = useRef<HTMLDivElement | null>(null);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the bottom of the events container when new content is added (classic layout only).
  //
  // biome-ignore lint/correctness/useExhaustiveDependencies: The dependency is indirect.
  useEffect(() => {
    if (useNewLayout) return;
    const eventsContainer = eventsContainerRef.current;
    if (eventsContainer) {
      eventsContainer.scroll({
        top: eventsContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [events, useNewLayout]);

  // Smooth scroll to bottom for history bin in new layout.
  useEffect(() => {
    if (!useNewLayout) return;
    const node = historyContainerRef.current;
    if (node) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [historyEvents, useNewLayout]);

  // Forward the state machine once after transitioning to the chat view
  // to generate initial narration and actions.
  //
  // biome-ignore lint/correctness/useExhaustiveDependencies: This should run only once.
  useEffect(() => {
    if (actions.length === 0) {
      doAction();

      // Note that in Strict Mode (used during development), React runs the effect twice
      // *even with an empty dependency array*, so the cleanup function is important here
      // (see https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development).
      return () => abort();
    }
  }, []);

  return (
    <Flex width="100%" justify="center">
      {!useNewLayout && (
        <Flex
          className="bg-black border-l border-r border-(--gold-10) shadow-[0_0_30px_var(--slate-10)]"
          direction="column"
          width="60rem"
          height="100vh"
        >
          <ScrollArea ref={eventsContainerRef}>
            <Flex direction="column">
              {events.map((event, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Events are append-only, so this is valid.
                <EventView key={index} event={event} />
              ))}
            </Flex>
          </ScrollArea>

          {actions.length > 0 && !errorMessage && (
            <ActionChoice
              onAction={(action) => {
                setLastAction(action);
                doAction(action);
              }}
            />
          )}

          {barVisible && (
            <ProcessingBar title={barTitle} onCancel={abort}>
              <Text className="tabular-nums" as="div" align="right" size="4" color="lime" mr="2">
                {barTokenCount ? `Tokens generated: ${barTokenCount}` : "Waiting for response..."}
              </Text>
            </ProcessingBar>
          )}

          {errorMessage && (
            <ErrorBar
              errorMessage={errorMessage}
              onRetry={() => {
                setErrorMessage("");
                doAction(lastAction);
              }}
              onCancel={() => setErrorMessage("")}
            />
          )}
        </Flex>
      )}

      {useNewLayout && (
        <Flex
          className="bg-black border-(--gold-10) shadow-[0_0_30px_var(--slate-10)]"
          direction="row"
          width="100%"
          style={{ height: "100vh", overflow: "hidden", gap: "2rem", padding: "0 20px" }}
        >
          <Flex direction="column" style={{ flex: "0.95 1 0", minWidth: 0, gap: "0.75rem", paddingLeft: 0 }}>
            <Box
              className="bg-(--orange-2) rounded-(--radius-4) shadow-(--base-card-surface-box-shadow)"
              p="2"
              style={{ flex: "0 0 40%", minHeight: 0 }}
            >
              {currentLocationEvent ? (
                <img
                  src={imageForLocation(currentLocationEvent.locationIndex) || "/images/tavern.png"}
                  alt="Location"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: "var(--radius-4)",
                  }}
                />
              ) : (
                <Text color="gray">No location yet.</Text>
              )}
            </Box>

            <Box
              className="bg-(--jade-2) rounded-(--radius-4) shadow-[inset 10px 0 20px -10px rgba(255,255,255,0.4)]"
              p="3"
              style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column" }}
            >
              <ScrollArea type="auto" className="flex-1 min-h-0">
                <Flex direction="column" gap="3">
                  {introEvents.length === 0 && <Text color="gray">No characters introduced yet.</Text>}
                  {introEvents.map((event, idx) => (
                    <CharacterIntroductionEventView
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable slice of events.
                      key={idx}
                      event={event as any}
                    />
                  ))}
                </Flex>
              </ScrollArea>
            </Box>
          </Flex>

          <Flex
            direction="column"
            className="rounded-none rt-Flex rt-r-fd-column rt-r-w rt-r-h border-l border-r border-(--gold-10) shadow-[0_0_40px_4px_var(--slate-10)] rounded-none
            bg-[rgba(30,30,30,0.8)]"
            p="3"
            style={{
              flex: "0.8 1 0",
              minWidth: 0,
              minHeight: 0,
              marginLeft: "1.5rem",
              marginRight: "1.5rem",
            }}
          >
            <div
              ref={historyContainerRef}
              style={{
                overflowY: "auto",
                flex: 1,
                minHeight: 0,
                scrollbarWidth: "none",
              }}
              className="no-scrollbar"
            >
              <Flex direction="column" gap="2" px="2">
                {historyEvents.length === 0 && <Text color="gray">No history yet.</Text>}
                {historyEvents.map((event, idx) => (
                  <Box key={idx} className=" border-(--slate-6) pb-2">
                    {event.type === "narration" && <NarrationEventView event={event as any} />}
                    {event.type === "action" && <EventView event={event as Event} />}
                  </Box>
                ))}
              </Flex>
            </div>
          </Flex>

          <Flex direction="column" style={{ flex: "0.95 1 0", minWidth: 0, gap: "0.75rem", paddingRight: 0 }}>
            <Box
              className="bg-(--orange-2) rounded-(--radius-4) shadow-(--base-card-surface-box-shadow)"
              p="3"
              style={{ flex: "0 0 40%", minHeight: 0 }}
            >
              {currentLocationEvent && locations[currentLocationEvent.locationIndex] ? (
                <Flex direction="column" height="100%" style={{marginLeft: "1.5rem", marginRight: "1rem", flex: "1 1 0"}} p="3">
                  <Heading className="lowercase " size="7" weight="regular" color="orange" align="center" mb="3">
                    {locations[currentLocationEvent.locationIndex].name}
                  </Heading>
                  <Text
                    className="first-letter:float-left first-letter:mr-2 first-letter:text-[350%] first-letter:mt-[0.11em] first-line:tracking-wider first-line:uppercase"
                    size="5"
                    color="bronze"
                  >
                    {locations[currentLocationEvent.locationIndex].description}
                  </Text>
                </Flex>
              ) : (
                <Text color="gray">Awaiting first location...</Text>
              )}
            </Box>

            <Box
              className="bg-(--sky-1) rounded-(--radius-4) shadow-[inset -10px 0 20px -10px rgba(255,255,255,0.4)]"
              p="3"
              style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column" }}
            >
              {actions.length > 0 && !errorMessage ? (
                <ActionChoice
                  textSize={4}
                  onAction={(action) => {
                    setLastAction(action);
                    doAction(action);
                  }}
                />
              ) : (
                <Text color="gray">No actions available.</Text>
              )}
            </Box>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
