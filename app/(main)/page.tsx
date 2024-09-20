"use client";

import CodeViewer from "@/components/code-viewer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ArrowLongRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import LoadingDots from "../../components/loading-dots";
import { shareApp } from "./actions";

export default function Home() {
  let [status, setStatus] = useState<
    "initial" | "creating" | "created" | "updating" | "updated"
  >("initial");
  let [generatedCode, setGeneratedCode] = useState("");
  let [initialAppConfig, setInitialAppConfig] = useState({
    model: "",
    shadcn: false,
  });
  let [ref, scrollTo] = useScrollTo();
  let [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  let [isPublishing, setIsPublishing] = useState(false);

  let loading = status === "creating" || status === "updating";

  async function generateCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status !== "initial") {
      scrollTo({ delay: 0.5 });
    }

    setStatus("creating");
    setGeneratedCode("");

    let formData = new FormData(e.currentTarget);
    let model = formData.get("model");
    let prompt = formData.get("prompt");
    let shadcn = !!formData.get("shadcn");
    if (typeof prompt !== "string" || typeof model !== "string") {
      return;
    }
    let newMessages = [{ role: "user", content: prompt }];

    const chatRes = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        model,
        shadcn,
      }),
    });
    if (!chatRes.ok) {
      throw new Error(chatRes.statusText);
    }

    const data = chatRes.body;
    if (!data) {
      return;
    }
    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          setGeneratedCode((prev) => prev + text);
        } catch (e) {
          console.error(e);
        }
      }
    };

    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }

    newMessages = [
      ...newMessages,
      { role: "assistant", content: generatedCode },
    ];

    setInitialAppConfig({ model, shadcn });
    setMessages(newMessages);
    setStatus("created");
  }

  async function modifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus("updating");

    let formData = new FormData(e.currentTarget);
    let prompt = formData.get("prompt");
    if (typeof prompt !== "string") {
      return;
    }
    let newMessages = [...messages, { role: "user", content: prompt }];

    setGeneratedCode("");
    const chatRes = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        model: initialAppConfig.model,
        shadcn: initialAppConfig.shadcn,
      }),
    });
    if (!chatRes.ok) {
      throw new Error(chatRes.statusText);
    }

    const data = chatRes.body;
    if (!data) {
      return;
    }
    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          setGeneratedCode((prev) => prev + text);
        } catch (e) {
          console.error(e);
        }
      }
    };

    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }

    newMessages = [
      ...newMessages,
      { role: "assistant", content: generatedCode },
    ];

    setMessages(newMessages);
    setStatus("updated");
  }

  useEffect(() => {
    let el = document.querySelector(".cm-scroller");
    if (el && loading) {
      let end = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: end });
    }
  }, [loading, generatedCode]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center py-2">
      <Header />

      <main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-20">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 pl-10">
          <img
            src="/artificial.png"
            alt="Artificial"
            className="w-80 h-auto max-w-full"
          />
        </div>

        <a
          className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[50px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(234,238,255,0.65)] bg-gray-100 px-7 py-5 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]"
          href="https://dub.sh/together-ai/?utm_source=example-app&utm_medium=llamacoder&utm_campaign=llamacoder-app-signup"
          target="_blank"
        >
          <span className="text-center">
            Powered by <span className="font-medium">Ella 3.1</span> e{" "}
            <span className="font-medium">LMS AI</span>
          </span>
        </a>
        <h1 className="my-6 max-w-3xl text-4xl font-bold text-gray-800 sm:text-6xl">
          Transforme sua <span className="text-blue-600">idéia</span>
          <br /> em um <span className="text-blue-600">app</span>
        </h1>

        <form className="w-full max-w-xl" onSubmit={generateCode}>
          <fieldset disabled={loading} className="disabled:opacity-75">
            <div className="relative mt-5">
              <div className="absolute -inset-2 rounded-[32px] bg-gray-300/50" />
              <div className="relative flex rounded-3xl bg-white shadow-sm">
                <div className="relative flex flex-grow items-stretch focus-within:z-10">
                  <input
                    required
                    name="prompt"
                    className="w-full rounded-l-3xl bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    placeholder="Crie um app de calculadora..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-blue-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed"
                >
                {loading ? (
  <LoadingDots color="#000" style="small" /> // Ou "large", dependendo do que você quer
) : (
  <ArrowLongRightIcon
    className="h-6 w-6 text-blue-500"
    aria-hidden="true"
  />
)}

                </button>
              </div>
            </div>
          </fieldset>
        </form>
        {generatedCode && (
          <>
            <h2
              className="mx-auto mt-10 mb-6 max-w-xl text-center text-3xl font-semibold"
              ref={ref}
            >
              Aqui está o código gerado!
            </h2>
            <CodeViewer code={generatedCode} />
          </>
        )}
      </main>

      <Footer />
      <Toaster />
    </div>
  );

}
