// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025  Philipp Emanuel Weidmann <pew@worldwidemann.com>

import { Box, Checkbox, Code, Flex, Link, Select, Tabs, Text, TextField } from "@radix-ui/themes";
import { Label } from "radix-ui";
import { GiOuroboros } from "react-icons/gi";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { usePluginsStateStore } from "@/app/plugins";
import WizardStep from "@/components/WizardStep";
import { useStateStore } from "@/lib/state";

export default function ConnectionSetup({ onNext, onBack }: { onNext?: () => void; onBack?: () => void }) {
  const { apiUrl, apiKey, model, openaiMode, contextLength, activeBackend, setState } = useStateStore(
    useShallow((state) => ({
      apiUrl: state.apiUrl,
      apiKey: state.apiKey,
      model: state.model,
      openaiMode: state.openaiMode,
      contextLength: state.contextLength,
      activeBackend: state.activeBackend,
      setState: state.set,
    })),
  );

  const { backendUIs } = usePluginsStateStore(
    useShallow((state) => ({
      backendUIs: state.backendUIs,
    })),
  );

  const providers = useMemo(() => {
    const clean = (n: number) => n.toString().replace(/\.0+$/, "").replace(/(\.\d[1-9]*)0+$/, "$1");
    const formatModels = (models: { id: string; in: number; out: number }[]) => {
      const inStrings = models.map((m) => clean(m.in));
      const outStrings = models.map((m) => clean(m.out));
      const maxId = Math.max(...models.map((m) => m.id.length), 0);
      const maxIn = Math.max(...inStrings.map((s) => s.length), 1);
      const maxOut = Math.max(...outStrings.map((s) => s.length), 1);
      return models.map((m, idx) => {
        const inPrice = inStrings[idx].padStart(maxIn, " ");
        const outPrice = outStrings[idx].padStart(maxOut, " ");
        return {
          id: m.id,
          label: `${m.id.padEnd(maxId + 2, " ")}| $${inPrice} | $${outPrice}`,
        };
      });
    };

    return [
      {
        id: "custom",
        name: "Custom",
        url: "",
        models: [] as { id: string; label: string }[],
        defaultModel: "",
      },
      {
        id: "openai",
        name: "OpenAI",
        url: "https://api.openai.com/v1/",
        models: formatModels([
          { id: "gpt-5-mini", in: 0.25, out: 2 },
          { id: "gpt-5-nano", in: 0.05, out: 0.4 },
          { id: "gpt-4.1-mini", in: 0.4, out: 1.6 },
          { id: "gpt-4.1-nano", in: 0.1, out: 0.4 },
          { id: "gpt-4o-mini", in: 0.15, out: 0.6 },
          { id: "gpt-3.5-turbo", in: 0.5, out: 1.5 },
        ]),
        defaultModel: "gpt-4.1-mini",
      },
      {
        id: "google",
        name: "Google",
        url: "https://generativelanguage.googleapis.com/v1beta/",
        models: formatModels([
          { id: "gemini-2.5-flash", in: 0.6, out: 0.6 },
          { id: "gemini-2.5-flash-lite", in: 0.4, out: 0.4 },
          { id: "gemini-1.5-flash", in: 0.35, out: 1.05 },
          { id: "gemini-1.5-flash-8b", in: 0.2, out: 0.6 },
          { id: "gemini-1.0-flash", in: 0.3, out: 0.9 },
        ]),
        defaultModel: "gemini-1.5-flash",
      },
      {
        id: "venice",
        name: "VeniceAI",
        url: "https://api.venice.ai/api/v1/",
        models: formatModels([
          { id: "venice-uncensored", in: 0.2, out: 0.9 },
          { id: "venice-3b", in: 0.05, out: 0.15 },
          { id: "venice-8b", in: 0.1, out: 0.3 },
          { id: "venice-13b", in: 0.2, out: 0.6 },
          { id: "venice-70b", in: 0.25, out: 0.75 },
          { id: "qwen3-4b", in: 0.05, out: 0.15 },
          { id: "qwen3-235b-a22b-instruct-2507", in: 0.15, out: 0.75 },
          { id: "llama-3.2-3b", in: 0.15, out: 0.6 },
          { id: "mistral-31-24b", in: 0.5, out: 2 },
          { id: "llama-3.3-70b", in: 0.7, out: 2.8 },
          { id: "qwen3-coder-480b-a35b-instruct", in: 0.75, out: 3 },
          { id: "zai-org-glm-4.6", in: 0.85, out: 2.75 },
        ]),
        defaultModel: "venice-3b",
      },
      {
        id: "grok",
        name: "Grok (x.ai)",
        url: "https://api.x.ai/v1/",
        models: formatModels([
          { id: "grok-4-1-fast-reasoning", in: 0.2, out: 0.5 },
          { id: "grok-4-1-fast-non-reasoning", in: 0.2, out: 0.5 },
          { id: "grok-4-fast-reasoning", in: 0.2, out: 0.5 },
          { id: "grok-4-fast-non-reasoning", in: 0.2, out: 0.5 },
          { id: "grok-code-fast-1", in: 0.2, out: 1.5 },
          { id: "grok-3-mini", in: 0.3, out: 0.5 },
        ]),
        defaultModel: "grok-4-1-fast-reasoning",
      },
    ];
  }, []);

  const inferredProvider = useMemo(() => {
    const match = providers.find((p) => p.url && apiUrl.startsWith(p.url));
    return match ? match.id : "custom";
  }, [apiUrl, providers]);

  const [provider, setProvider] = useState<string>(inferredProvider);

  return (
    <WizardStep title="Connection" onNext={onNext} onBack={onBack}>
      <Flex gap="6" mb="8">
        <Box flexGrow="1">
          <Tabs.Root
            value={activeBackend}
            onValueChange={(value) =>
              setState((state) => {
                state.activeBackend = value;
              })
            }
          >
            <Tabs.List>
              <Tabs.Trigger value="default">
                <Text size="6">OpenAI-compatible</Text>
              </Tabs.Trigger>
              {backendUIs.map((backendUI) => (
                <Tabs.Trigger key={backendUI.backendName} value={backendUI.backendName}>
                  <Text size="6">{backendUI.configurationTab}</Text>
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Box mt="5">
              <Tabs.Content value="default">
                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end" gap="3" alignItems="center">
                      <Text size="6">API base URL</Text>
                      <Text size="4" color="gray">
                        Usually ends with <Code size="3">/v1/</Code>
                      </Text>
                    </Flex>
                    <Flex align="center" gap="3" className="mt-2" wrap="wrap">
                      <Select.Root
                        value={provider}
                        onValueChange={(value) => {
                          setProvider(value);
                          const preset = providers.find((p) => p.id === value);
                          if (preset) {
                            setState((state) => {
                              if (preset.url) state.apiUrl = preset.url;
                              if (preset.defaultModel) state.model = preset.defaultModel;
                              state.openaiMode = preset.id === "openai";
                            });
                          }
                        }}
                      >
                        <Select.Trigger className="w-[220px]" />
                        <Select.Content>
                          <Select.Group>
                            <Select.Label>Presets</Select.Label>
                            {providers.map((p) => (
                              <Select.Item key={p.id} value={p.id}>
                                {p.name}
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Content>
                      </Select.Root>
                      <TextField.Root
                        value={apiUrl}
                        onChange={(event) =>
                          setState((state) => {
                            state.apiUrl = event.target.value;
                          })
                        }
                        className="mt-1 font-mono flex-1"
                        size="3"
                        placeholder="http://localhost:8080/v1/"
                      />
                      <Flex align="center" gap="2">
                        <Checkbox
                          checked={openaiMode}
                          onCheckedChange={(checked) =>
                            setState((state) => {
                              state.openaiMode = checked === true;
                            })
                          }
                          id="openai-mode"
                        />
                        <Text as="label" htmlFor="openai-mode" size="3" color="gray">
                          OpenAI
                        </Text>
                      </Flex>
                    </Flex>
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">API key</Text>
                      <Text size="4" color="gray">
                        Can be left empty for local servers
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={apiKey}
                      onChange={(event) =>
                        setState((state) => {
                          state.apiKey = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="X-ABCDE-123456789"
                    />
                    <Text size="4" color="orange">
                      <strong>Note:</strong> The key is stored in the browser, not on the server where Waidrin runs.
                    </Text>
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">Model</Text>
                      <Text size="4" color="gray">
                        Can be left empty for llama.cpp and Kobold
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={model}
                      onChange={(event) =>
                        setState((state) => {
                          state.model = event.target.value;
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="mistral-small3.2"
                    />
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">Model</Text>
                      <Text size="4" color="gray">
                        Pick a preset or type your own
                      </Text>
                    </Flex>
                    <Flex align="center" gap="3" className="mt-2">
                      <Select.Root
                        value={
                          providers.find((p) => p.id === provider)?.models.find((m) => m.id === model)?.id || "custom"
                        }
                        onValueChange={(value) => {
                          if (value === "custom") return;
                          const preset = providers.find((p) => p.id === provider);
                          const modelEntry = preset?.models.find((m) => m.id === value);
                          if (modelEntry) {
                            setState((state) => {
                              state.model = modelEntry.id;
                            });
                          }
                        }}
                      >
                        <Select.Trigger className="w-[260px]" />
                        <Select.Content>
                          <Select.Group>
                            <Select.Label>Models</Select.Label>
                            <Select.Item value="custom">Custom</Select.Item>
                            {providers
                              .find((p) => p.id === provider)
                              ?.models.map((m) => (
                                <Select.Item key={m.id} value={m.id}>
                                  {m.label}
                                </Select.Item>
                              ))}
                          </Select.Group>
                        </Select.Content>
                      </Select.Root>
                      <TextField.Root
                        value={model}
                        onChange={(event) =>
                          setState((state) => {
                            state.model = event.target.value;
                          })
                        }
                        className="mt-1 font-mono flex-1"
                        size="3"
                        placeholder="gpt-4.1-mini"
                      />
                    </Flex>
                  </Label.Root>
                </Box>

                <Box mb="5">
                  <Label.Root>
                    <Flex width="100%" justify="between" align="end">
                      <Text size="6">Context length</Text>
                      <Text size="4" color="gray">
                        Check backend configuration or provider documentation for the correct value
                      </Text>
                    </Flex>
                    <TextField.Root
                      value={contextLength}
                      onChange={(event) =>
                        setState((state) => {
                          state.contextLength = Number(event.target.value);
                          if (Number.isNaN(state.contextLength)) {
                            state.contextLength = 0;
                          }

                          // Some API providers have input limits that are substantially lower
                          // than the context length. This is a pragmatic hack to address that
                          // without having to add yet another potentially confusing UI input.
                          state.inputLength = Math.min(state.contextLength, 250000);
                        })
                      }
                      className="mt-1 font-mono"
                      size="3"
                      placeholder="16384"
                    />
                  </Label.Root>
                </Box>

                <Box>
                  <Text size="5" color="amber">
                    <strong>Note:</strong> Waidrin uses constrained generation. It requires support for JSON schema
                    constraints (the <Code size="4">response_format</Code> parameter with the{" "}
                    <Code size="4">json_schema</Code> type). Backends that support JSON schemas include the{" "}
                    <Link href="https://github.com/ggml-org/llama.cpp/tree/master/tools/server">llama.cpp server</Link>,{" "}
                    <Link href="https://github.com/LostRuins/koboldcpp">KoboldCpp</Link>,{" "}
                    <Link href="https://ollama.com">Ollama</Link>, and many cloud providers. Some providers support
                    schemas only for certain models; check the provider documentation if in doubt.
                  </Text>
                </Box>
              </Tabs.Content>

              {backendUIs.map((backendUI) => (
                <Tabs.Content key={backendUI.backendName} value={backendUI.backendName}>
                  {backendUI.configurationPage}
                </Tabs.Content>
              ))}
            </Box>
          </Tabs.Root>
        </Box>

        <Box className="w-[250px]">
          <GiOuroboros className="transform scale-x-[-1] -mr-5" size="250" color="var(--amber-8)" />
        </Box>
      </Flex>
    </WizardStep>
  );
}
