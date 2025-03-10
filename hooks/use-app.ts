"use client";

import { useEffect, useState } from "react";
import { INITIAL_MESSAGE } from "@/configuration/chat";
import { WORD_CUTOFF, WORD_BREAK_MESSAGE } from "@/configuration/chat";
import {
  LoadingIndicator,
  DisplayMessage,
  StreamedDone,
  streamedDoneSchema,
  StreamedLoading,
  streamedLoadingSchema,
  StreamedMessage,
  streamedMessageSchema,
  Citation,
  StreamedError,
  streamedErrorSchema,
} from "@/types";

export default function useApp() {
  const initialAssistantMessage: DisplayMessage = {
    role: "assistant",
    content: INITIAL_MESSAGE,
    citations: [],
  };

  const [messages, setMessages] = useState<DisplayMessage[]>([
    initialAssistantMessage,
  ]);
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [indicatorState, setIndicatorState] = useState<LoadingIndicator[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setWordCount(
      messages.reduce(
        (acc, message) => acc + message.content.split(" ").length,
        0
      )
    );
  }, [messages]);

  const addUserMessage = (input: string) => {
    const newUserMessage: DisplayMessage = {
      role: "user",
      content: input,
      citations: [],
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    return newUserMessage;
  };

  const addAssistantMessage = (content: string, citations: Citation[]) => {
    const newAssistantMessage: DisplayMessage = {
      role: "assistant",
      content,
      citations,
    };
    setMessages((prevMessages) => [...prevMessages, newAssistantMessage]);
    return newAssistantMessage;
  };

  const fetchAssistantResponse = async (allMessages: DisplayMessage[]) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat: { messages: allMessages }, feedbackMode: false }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return response;
  };

  const fetchAssistantFeedback = async (allMessages: DisplayMessage[]) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat: { messages: allMessages }, feedbackMode: true }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return response;
  };

  const handleStreamedMessage = (streamedMessage: StreamedMessage) => {
    //throw new Error(JSON.stringify(streamedMessage));
    //console.error(JSON.stringify(streamedMessage));
    let ceOld = console.error;
    console.error = () => {};
    try {
      setIndicatorState([]);
    } catch (setIndicatorException) { }
    console.error = ceOld;
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];

      if (lastMessage && lastMessage.role === "assistant") {
        // Update the existing assistant message
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content: streamedMessage.message.content,
          citations: streamedMessage.message.citations,
        };
      } else {
        // Add a new assistant message
        updatedMessages.push({
          role: "assistant",
          content: streamedMessage.message.content,
          citations: streamedMessage.message.citations,
        });
      }

      return updatedMessages;
    });
  };

  const handleStreamedLoading = (streamedLoading: StreamedLoading) => {
    setIndicatorState((prevIndicatorState) => [
      ...prevIndicatorState,
      streamedLoading.indicator,
    ]);
  };

  const handleStreamedError = (streamedError: StreamedError) => {
    setIndicatorState((prevIndicatorState) => [
      ...prevIndicatorState,
      streamedError.indicator,
    ]);
  };

  const handleStreamedDone = (streamedDone: StreamedDone) => {};

  const routeResponseToProperHandler = (payload: string) => {
    //console.error(payload + "PL");
    const payloads = payload.split("\n").filter((p) => p.trim() !== "");

    if (payloads.length === 0) {
      return; // No non-empty payloads
    }
    var combinedPayload = "";
    for (const payload of payloads) {
      combinedPayload += payload;//+ "\n";
      var parsedPayload = {};
//      try {
        parsedPayload = JSON.parse(combinedPayload);
        combinedPayload = "";
//      } catch (parseError) { continue; }
      //throw new Error(JSON.stringify(parsedPayload));
      //console.error(JSON.stringify(parsedPayload) + "RRPH");
      if (streamedMessageSchema.safeParse(parsedPayload).success) {
        //throw new Error(JSON.stringify(parsedPayload));
        handleStreamedMessage(parsedPayload as StreamedMessage);
      } else if (streamedLoadingSchema.safeParse(parsedPayload).success) {
        handleStreamedLoading(parsedPayload as StreamedLoading);
      } else if (streamedErrorSchema.safeParse(parsedPayload).success) {
        handleStreamedError(parsedPayload as StreamedError);
      } else if (streamedDoneSchema.safeParse(parsedPayload).success) {
        handleStreamedDone(parsedPayload as StreamedDone);
      } else {
        throw new Error("Invalid payload type");
      }
    }
  };

  const processStreamedResponse = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No reader available");
    }

    var payload = "";

    while (true) {
      //console.error(payload);
      const { done, value } = await reader.read();
      if (done) break;
      //if (new TextDecoder().decode(value) == "") continue;
      try {
        if(false && payload == "") {
          const temp = JSON.parse(new TextDecoder().decode(value));
          routeResponseToProperHandler(new TextDecoder().decode(value));
          continue;
        }
      } catch(errorVal) { }
          

      payload += new TextDecoder().decode(value);

      try {
        //const temp = JSON.parse(payload);
        routeResponseToProperHandler(payload);
        payload = "";
      } catch(errorVal) { }
    }
  };

  const handleFeedback = async(e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // var inputString = "Please give feedback to the user in response to the following chat transcript:\n";
    // for(var i = Math.max(messages.length - 10, 0); i < messages.length; i++) {
    //   if(messages[i].role == "assistant" && i != 0) inputString += " -------------------------------- Then, you (the AI assistant) provided a response.\n\n";
    //   else inputString += " -------------------------------- The following message is from the " + messages[i].role + ": " + messages[i].content + "\n\n";
    // }
    // var inputString = "Please give feedback to the user, assessing features such as response quality, question quality, overall tone, and correctness. Please only consider the quality of the messages created by the user. Please do not consider or review the quality of the messages created by the assistant. Again, you must only provide feedback about the user's comments; never provide any feedback about yourself, the assistant."
    setIndicatorState([]);
    setIsLoading(true);
    setInput("");
    const newUserMessage = addUserMessage("Please provide feedback on my chat history using three 0-5 rubric scales.");
    if (wordCount > WORD_CUTOFF) {
      addAssistantMessage(WORD_BREAK_MESSAGE, []);
      setIsLoading(false);
    } else {
      setTimeout(() => {
        // NOTE: This is a hacky way to show the indicator state only after the user message is added.
        // TODO: Find a better way to do this.
        setIndicatorState([
          {
            status: "Understanding your message",
            icon: "understanding",
          },
        ]);
      }, 600);

      try {
        const response = await fetchAssistantFeedback([
          ...messages,
          newUserMessage,
        ]);
        await processStreamedResponse(response);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIndicatorState([]);
    setIsLoading(true);
    setInput("");
    const newUserMessage = addUserMessage(input);
    if (wordCount > WORD_CUTOFF) {
      addAssistantMessage(WORD_BREAK_MESSAGE, []);
      setIsLoading(false);
    } else {
      setTimeout(() => {
        // NOTE: This is a hacky way to show the indicator state only after the user message is added.
        // TODO: Find a better way to do this.
        setIndicatorState([
          {
            status: "Understanding your message",
            icon: "understanding",
          },
        ]);
      }, 600);

      try {
        const response = await fetchAssistantResponse([
          ...messages,
          newUserMessage,
        ]);
        await processStreamedResponse(response);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    // Load messages from local storage when component mounts
    const storedMessages = localStorage.getItem("chatMessages");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, [setMessages]);

  useEffect(() => {
    // Save messages to local storage whenever they change
    if (messages.length > 1) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    } else {
      localStorage.removeItem("chatMessages");
    }
  }, [messages]);

  const clearMessages = () => {
    setMessages([]);
    setWordCount(0);
  };

  return {
    messages,
    handleInputChange,
    handleSubmit,
    handleFeedback,
    indicatorState,
    input,
    isLoading,
    setMessages,
    clearMessages,
  };
}
