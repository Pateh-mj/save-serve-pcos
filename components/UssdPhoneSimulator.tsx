"use client";
import { useState, useEffect } from "react";
import { Phone, PhoneOff, RotateCcw, Send, Signal, BatteryMedium, WifiOff } from "lucide-react";

interface Props {
  initialPhone?: string;
  onAppointmentBooked?: () => void;
}

export default function UssdPhoneSimulator({ initialPhone = "+260971000001", onAppointmentBooked }: Props) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [sessionActive, setSessionActive] = useState(false);
  const [screenText, setScreenText] = useState("Dial *384# to launch SaveServe USSD Gateway");
  const [inputVal, setInputVal] = useState("");
  const [textAccumulator, setTextAccumulator] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionType, setSessionType] = useState<"IDLE" | "CON" | "END">("IDLE");
  const [history, setHistory] = useState<Array<{ text: string; response: string }>>([]);

  async function sendUssd(currentPath: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: `SIM-${Date.now()}`,
          serviceCode: "*384#",
          phoneNumber: phoneNumber.trim(),
          text: currentPath,
        }),
      });

      const raw = await res.text();
      const isCon = raw.startsWith("CON ");
      const isEnd = raw.startsWith("END ");
      const content = raw.replace(/^(CON |END )/, "").trim();

      setScreenText(content);
      setSessionType(isCon ? "CON" : isEnd ? "END" : "IDLE");

      if (isEnd) {
        setSessionActive(false);
        if (content.includes("SUCCESS") && onAppointmentBooked) {
          onAppointmentBooked();
        }
      } else if (isCon) {
        setSessionActive(true);
      }

      setHistory((prev) => [...prev, { text: currentPath || "*384#", response: raw }]);
    } catch (err) {
      console.error(err);
      setScreenText("Network connection error. Please try again.");
      setSessionType("END");
      setSessionActive(false);
    } finally {
      setLoading(false);
      setInputVal("");
    }
  }

  function handleDial() {
    if (inputVal.trim() === "*384#" || !sessionActive) {
      setTextAccumulator("");
      setSessionActive(true);
      sendUssd("");
    } else {
      handleSend();
    }
  }

  function handleSend() {
    if (!inputVal.trim()) return;
    const nextPath = textAccumulator ? `${textAccumulator}*${inputVal.trim()}` : inputVal.trim();
    setTextAccumulator(nextPath);
    sendUssd(nextPath);
  }

  function handleKeypadPress(val: string) {
    setInputVal((prev) => prev + val);
  }

  function handleBackspace() {
    setInputVal((prev) => prev.slice(0, -1));
  }

  function handleReset() {
    setSessionActive(false);
    setSessionType("IDLE");
    setTextAccumulator("");
    setInputVal("");
    setScreenText("Dial *384# to launch SaveServe USSD Gateway");
  }

  return (
    <div className="flex flex-col items-center select-none">
      {/* Phone Body Container */}
      <div className="w-[320px] bg-slate-900 border-4 border-slate-700 rounded-[44px] shadow-2xl p-5 flex flex-col items-center relative ring-8 ring-slate-950/20">
        
        {/* Speaker grille & brand */}
        <div className="w-16 h-1.5 bg-slate-700 rounded-full mb-2"></div>
        <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mb-2 font-bold">
          PCOS GSM · 2G / USSD
        </div>

        {/* LCD Screen Frame */}
        <div className="w-full bg-[#8fae87] border-4 border-[#6c8665] rounded-xl p-3 shadow-inner min-h-[220px] flex flex-col justify-between font-mono text-[#182a17]">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-[11px] border-b border-[#6c8665]/40 pb-1 mb-1 font-bold">
            <div className="flex items-center gap-1">
              <Signal className="w-3.5 h-3.5" />
              <span>AIRTEL ZM</span>
            </div>
            <div className="flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-[#182a17]/70" />
              <BatteryMedium className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Main LCD Output */}
          <div className="flex-1 py-1 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed font-bold tracking-tight">
            {loading ? (
              <div className="h-full flex items-center justify-center animate-pulse text-sm">
                Requesting *384#...
              </div>
            ) : (
              screenText
            )}
          </div>

          {/* User Input Line */}
          <div className="border-t border-[#6c8665]/40 pt-1 flex items-center justify-between text-xs">
            <span className="font-extrabold text-[10px] uppercase">
              {sessionActive ? "REPLY:" : "INPUT:"}
            </span>
            <span className="font-extrabold text-sm tracking-wider px-1 bg-[#7d9b75]/40 rounded">
              {inputVal || "_"}
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation Buttons */}
        <div className="w-full grid grid-cols-3 gap-2 my-4">
          <button
            onClick={sessionActive ? handleSend : handleDial}
            disabled={loading}
            className="h-10 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md transition"
          >
            <Phone className="w-3.5 h-3.5" /> {sessionActive ? "Send" : "Call"}
          </button>

          <button
            onClick={handleReset}
            className="h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 shadow-md transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            onClick={handleReset}
            className="h-10 bg-rose-700 hover:bg-rose-600 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-md transition"
          >
            <PhoneOff className="w-3.5 h-3.5" /> End
          </button>
        </div>

        {/* Numeric Keypad Grid */}
        <div className="w-full grid grid-cols-3 gap-2">
          {[
            { k: "1", sub: "" },
            { k: "2", sub: "ABC" },
            { k: "3", sub: "DEF" },
            { k: "4", sub: "GHI" },
            { k: "5", sub: "JKL" },
            { k: "6", sub: "MNO" },
            { k: "7", sub: "PQRS" },
            { k: "8", sub: "TUV" },
            { k: "9", sub: "WXYZ" },
            { k: "*", sub: "" },
            { k: "0", sub: "+" },
            { k: "#", sub: "" },
          ].map(({ k, sub }) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className="h-11 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-100 border border-slate-700 rounded-xl flex flex-col items-center justify-center shadow transition"
            >
              <span className="text-sm font-bold leading-none">{k}</span>
              {sub && <span className="text-[8px] text-slate-400 leading-none mt-0.5">{sub}</span>}
            </button>
          ))}
        </div>

        {/* Clear Key */}
        <div className="w-full flex justify-end mt-2">
          <button
            type="button"
            onClick={handleBackspace}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-200 px-3 py-1 bg-slate-800/80 rounded-lg"
          >
            ⌫ Clear
          </button>
        </div>
      </div>

      {/* Phone Configuration Helper */}
      <div className="w-full max-w-[320px] mt-4 bg-card border border-border rounded-2xl p-4 text-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">Active SIM Phone:</span>
          <span className="font-mono text-primary font-semibold">{phoneNumber}</span>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => { setPhoneNumber("+260971000001"); handleReset(); }}
            className="flex-1 py-1.5 bg-secondary hover:bg-muted text-foreground rounded-lg font-medium text-[11px] transition"
          >
            Demo Patient
          </button>
          <button
            onClick={() => { setPhoneNumber(`+26097${Math.floor(1000000 + Math.random() * 9000000)}`); handleReset(); }}
            className="flex-1 py-1.5 bg-secondary hover:bg-muted text-foreground rounded-lg font-medium text-[11px] transition"
          >
            New Number
          </button>
        </div>
      </div>
    </div>
  );
}
