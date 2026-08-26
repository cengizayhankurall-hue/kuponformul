'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, RefreshCw, MessageSquare, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function AIChatBot() {
  const pathname = usePathname();
  const isSporToto = pathname?.includes('/spor-toto');

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: isSporToto 
        ? 'Merhaba! 👋 Ben Spor Toto Yapay Zeka Asistanınızım. Maçların oran analizleri, sürpriz ihtimalleri veya bütçe/formül hesaplamaları hakkında bana danışabilirsiniz!'
        : 'Merhaba! 👋 Ben Yapay Zeka İddaa Asistanınızım. Bültendeki maçlar, oran analizleri veya tahminlerim hakkında bana istediğiniz maçı sorabilirsiniz!',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Listen for custom event to open chat and send a message
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      setIsOpen(true);
      if (e.detail && e.detail.message) {
        setTimeout(() => {
          handleSendMessage(e.detail.message);
        }, 300);
      }
    };
    window.addEventListener('OPEN_AI_CHAT', handleOpenChat);
    return () => window.removeEventListener('OPEN_AI_CHAT', handleOpenChat);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const payload: any = { message: text };
      if (isSporToto) {
        payload.context = 'spor-toto';
        if (typeof window !== 'undefined') {
          payload.totoContext = (window as any).sttTotoContext;
        }
      }

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || 'Şu an bülten analizi yapılırken bir sorun oluştu, lütfen tekrar deneyin.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };

      if (data.autoApplySelections && Array.isArray(data.autoApplySelections)) {
        if (typeof window !== 'undefined') {
          if ((window as any).sttTotoContext && typeof (window as any).sttTotoContext.setSelections === 'function') {
            (window as any).sttTotoContext.setSelections(data.autoApplySelections);
          }
          window.dispatchEvent(new CustomEvent('ST_APPLY_AI_SELECTIONS', { detail: { selections: data.autoApplySelections } }));
        }
      }

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Simple bold formatting replacement **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-extrabold text-emerald-400">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={idx}>
          {formattedLine}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[200] group flex items-center justify-center gap-2 p-2.5 sm:p-3.5 md:px-4 md:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-full md:rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-300 border border-emerald-400/40"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-amber-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-amber-400 rounded-full" />
          </div>
          <span className="hidden md:block text-xs tracking-wide">Yapay Zeka Asistanı</span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[200] w-[calc(100vw-24px)] sm:w-[420px] h-[540px] sm:h-[580px] max-h-[88vh] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 rounded-3xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="shrink-0 px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 rounded-xl shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white">
                    {isSporToto ? 'Spor Toto YZ Asistanı' : 'Yapay Zeka İddaa Asistanı'}
                  </h3>
                  <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Canlı Analiz
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isSporToto ? 'Sürpriz analizi & bütçe planlama' : 'İddaa oran veritabanı & anlık analiz'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs mt-0.5">
                    🤖
                  </div>
                )}
                <div className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-semibold rounded-tr-none shadow-md'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  <div>{renderFormattedText(msg.text)}</div>
                  <div className={`text-[9px] mt-1.5 text-right font-mono ${
                    msg.sender === 'user' ? 'text-slate-900/60' : 'text-slate-500'
                  }`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-400 bg-slate-800/40 p-3 rounded-2xl border border-slate-800/60 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Yapay zeka bülteni analiz ediyor...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage('Günün en banko maçı hangisi?')}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-emerald-400 border border-slate-700/50 transition"
            >
              🎯 Günün Bankoları
            </button>
            <button
              onClick={() => handleSendMessage('Hangi maçlarda KG VAR beklentisi yüksek?')}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-emerald-400 border border-slate-700/50 transition"
            >
              ⚽ KG VAR Maçları
            </button>
            <button
              onClick={() => handleSendMessage('Hangi maçta 2.5 ÜST beklentisi var?')}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-emerald-400 border border-slate-700/50 transition"
            >
              🔥 2.5 ÜST Maçlar
            </button>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Bir takım adı yazın veya maç hakkında sorun..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700/70 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputValue.trim()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}
