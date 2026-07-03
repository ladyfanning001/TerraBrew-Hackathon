import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  Sparkles,
  Coffee,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { askTerryChatbot } from "@/lib/auth-server";
import { toast } from "sonner";

interface Message {
  role: "user" | "model";
  content: string;
}

export function TerryChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hello! I am **TerraAI**, your TerraBrew AI Assistant. ☕💚\n\nI can help you determine the best processing methods for your coffee, explain the Ecoscore pillars, or guide you through the SEA certification process. What would you like to know today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlySpeaking, setCurrentlySpeaking] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop automatically when user stops speaking
        recognition.interimResults = false;
        recognition.lang = navigator.language || "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev + (prev ? " " : "") + transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error !== "no-speech") {
            toast.error("Speech input error: " + event.error);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported on this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Cancel speech on close/unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  const speak = (text: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech is not supported on this browser.");
      return;
    }

    if (currentlySpeaking === index) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean up Markdown and emojis for narration
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/[-*]\s+/g, "")
      .replace(/[☕💚]/g, "")
      .replace(/\n/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";

    utterance.onend = () => {
      setCurrentlySpeaking(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeaking(null);
    };

    setCurrentlySpeaking(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    if (!textToSend) setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await askTerryChatbot({
        data: {
          messages: newMessages,
        },
      });

      if (res.success && res.text) {
        setMessages((prev) => [...prev, { role: "model", content: res.text }]);
      } else {
        toast.error("Failed to get response from TerraAI: " + res.error);
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content:
              "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network or API Error");
    } finally {
      setIsLoading(false);
    }
  };

  const parseMarkdown = (text: string) => {
    // Escaping
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // List items
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li class='ml-4 list-disc'>$1</li>");
    // Newlines
    html = html.replace(/\n/g, "<br />");

    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="text-xs leading-relaxed space-y-1"
      />
    );
  };

  const QUICK_QUESTIONS = [
    "How to optimize washed coffee?",
    "What are the Ecoscore pillars?",
    "Explain Honey vs Natural process",
    "How is suitability calculated?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Window */}
      {isOpen && (
        <Card className="w-[360px] sm:w-[400px] h-[500px] rounded-3xl border border-border/80 shadow-[var(--shadow-elegant)] bg-card/90 backdrop-blur-md flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <CardHeader className="p-4 border-b border-border/40 bg-gradient-to-r from-forest/10 via-primary/5 to-honey/10 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-forest text-cream">
                <Coffee className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-primary flex items-center gap-1">
                  TerraAI
                  <Sparkles className="h-3 w-3 text-honey animate-pulse" />
                </CardTitle>
                <CardDescription className="text-[10px] font-medium text-forest">
                  TerraBrew Smart Assistant
                </CardDescription>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Chat Content */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                {msg.role === "model" && (
                  <div className="flex flex-col gap-1 shrink-0 items-center">
                    <div className="h-7 w-7 rounded-xl bg-forest/15 text-forest flex items-center justify-center border border-forest/10 mt-1">
                      <Bot className="h-4 w-4" />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-lg text-muted-foreground hover:text-forest hover:bg-forest/10"
                      onClick={() => speak(msg.content, idx)}
                      title={currentlySpeaking === idx ? "Stop narration" : "Speak response"}
                    >
                      {currentlySpeaking === idx ? (
                        <VolumeX className="h-3 w-3 text-destructive animate-pulse" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-forest text-cream rounded-tr-none"
                      : "bg-secondary/15 text-foreground rounded-tl-none border border-border/60"
                  }`}
                >
                  {parseMarkdown(msg.content)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="h-7 w-7 rounded-xl bg-forest/15 text-forest flex items-center justify-center shrink-0 border border-forest/10 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-secondary/15 text-foreground p-3 rounded-2xl rounded-tl-none border border-border/60 flex items-center gap-1.5 shadow-sm">
                  <span
                    className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-forest rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </CardContent>

          {/* Suggestions List */}
          {messages.length === 1 && !isLoading && (
            <div className="p-3 bg-secondary/5 border-t border-border/40 grid grid-cols-2 gap-1.5">
              {QUICK_QUESTIONS.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="text-[10px] text-left h-auto py-1.5 px-2.5 border-border/60 hover:bg-secondary/20 hover:border-forest/40 rounded-xl justify-start whitespace-normal leading-normal font-medium text-muted-foreground"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <CardFooter className="p-3 border-t border-border/40 bg-background/50 backdrop-blur-sm flex gap-2">
            <Input
              placeholder="Ask TerraAI anything about coffee..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="bg-secondary/25 border-border/80 rounded-xl text-xs h-10"
            />
            <Button
              size="icon"
              type="button"
              onClick={toggleListening}
              className={`rounded-xl h-10 w-10 shrink-0 border border-border/60 transition-all ${
                isListening
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse border-transparent"
                  : "bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/35"
              }`}
              title={isListening ? "Listening... click to stop" : "Start voice input"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-forest text-cream hover:bg-forest-deep rounded-xl h-10 w-10 shrink-0 shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-forest text-cream hover:bg-forest-deep shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-forest-deep flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative"
        style={{ background: "var(--gradient-eco)" }}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-200" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-honey opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-honey"></span>
            </span>
          </div>
        )}
      </Button>
    </div>
  );
}
