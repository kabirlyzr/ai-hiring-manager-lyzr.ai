/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ChevronDown, MousePointerClick } from 'lucide-react';
import LogoIcon from './ui/logosvg';
import { useRouter } from 'next/router';

interface RAGResult {
  id: any;
  text: string;
  title?: string;
  content?: string;
  score: number;
}

interface Message {
  content: string;
  role: 'user' | 'agent';
  timestamp: Date;
  ragResults?: RAGResult[];
  showRag?: boolean;
  showAllResults?: boolean;
}

const ChatInterface = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hello",
      role: 'agent',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<{
    text: string;
    position: { top: number; left: number };
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const resultBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedResult && !(event.target as Element).closest('.result-box')) {
        setSelectedResult(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedResult]);
  const toggleShowAllResults = (messageIndex: number) => {
    setMessages(prevMessages =>
      prevMessages.map((msg, idx) =>
        idx === messageIndex
          ? { ...msg, showAllResults: !msg.showAllResults }
          : msg
      )
    );
  };
  const formatTimestamp = (timestamp: Date) => {
    const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${date}, ${time}`;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;

    setMessages(prev => [...prev, {
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    }]);

    setInput('');
    setIsLoading(true);

    try {
      const [chatResponse, ragResponse] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, sessionId })
        }),
        fetch('/api/retrieve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage })
        })
      ]);

      const chatData = await chatResponse.json();
      const ragData = await ragResponse.json();

      if (!sessionId && chatData.session_id) {
        setSessionId(chatData.session_id);
      }

      const formattedRagResults = ragData.results
        ?.map(formatRAGResult)
        .filter(Boolean);

      setMessages(prev => [...prev, {
        content: chatData.response || chatData.message,
        role: 'agent',
        timestamp: new Date(),
        ragResults: formattedRagResults,
        showRag: false
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        content: 'Sorry, there was an error processing your message.',
        role: 'agent',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRAGResult = (result: any): RAGResult | null => {
    if (!result || !result.text) return null;
    const parts = result.text.split('\n');
    const title = parts[0].split('>').pop()?.trim() || '';
    const content = parts.slice(1).join('\n').trim();
    return { title, content, text: result.text, score: result.score, id: result.id };
  };

  const handleResultClick = (result: RAGResult) => {
    router.push(`/some-path/${result.id}`);
  };

  return (
    <div className="p-4">
      <div className="preview w-[70%] m-auto flex justify-center h-[94vh] rounded-3xl flex-col bg-[transparent]">
        {/* Header */}
        <div className="bg-transparent px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Employee Help Desk</h1>
          <button
            onClick={() => setMessages([
              {
                content: "👋 Welcome! I'm here to help with HR, IT, or payroll questions. Just ask, and I'll guide you through! Here are a few things you could ask:\n• 'How do I reset my password?'\n• 'How do I update my payroll info?'\n• 'Where can I find leave policies?'\n\nHow can I assist you today?",
                role: 'agent',
                timestamp: new Date()
              }
            ])}
            className="text-[#424242] flex-row border border-[#cacaca] hover:text-gray-800 flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100"
          >
            <Trash2 />
            <span className="text-sm font-semibold">Clear chat</span>
          </button>
        </div>
        
        {/* Chat Container */}
        <div ref={chatContainerRef} className="flex-1 preview overflow-y-auto p-6 space-y-6">
          {messages.map((message, messageIndex) => (
            <div key={messageIndex} className="space-y-3">
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex ${message.role === 'user' ? 'flex-col items-end' : 'flex-col items-start'} max-w-[80%]">
                  <div className="flex flex-row gap-3">
                    {message.role === 'agent' && (
                      <div className="mt-5">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <LogoIcon />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className='bg-[#F7F7F7] p-0 rounded-3xl w-full'>
                        <div className={`rounded-3xl mt-2 p-4 ${message.role === 'user'
                            ? 'bg-[#F1F1F1] text-[#292929] '
                            : 'bg-white border border-[#cacaca] max-full text-[#292929]'
                          }`}>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        </div>
                        {message.role === 'agent' && message.ragResults && message.ragResults.length > 0 && (
                          <div className="space-y-2 p-4">
                            <div className="flex flex-wrap gap-2">
                              {message.ragResults.slice(0, message.showAllResults ? message.ragResults.length : 3).map((result, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleResultClick(result)}
                                  className="inline-flex items-center px-3 py-1.5  hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-600"
                                >
                                <u>{result.title}</u> 
                                </button>
                              ))}

                              {message.ragResults.length > 3 && (
                                <button
                                  onClick={() => toggleShowAllResults(messageIndex)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 border border-dashed border-[#B48BFA] rounded-full text-xs text-gray-600"
                                >
                                  {!message.showAllResults ? (
                                    <>
                                     <u> <span>View more</span></u>
                                      <MousePointerClick size={12} />
                                    </>
                                  ) : (
                                    <>
                                      <u><span>View less</span></u>
                                      <ChevronDown size={12} />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`mt-1 ${message.role === 'user' ? 'ml-auto mr-1 justify-end flex' : 'ml-1'}`}>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start ">
              <div className="h-8 w-8 bg-gray-200  flex items-center justify-center">
                <LogoIcon />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Result Box */}
        {selectedResult && (
          <div
            ref={resultBoxRef}
            className="fixed preview bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-96 max-h-64 overflow-y-auto z-50"
            style={{
              top: selectedResult.position.top,
              left: selectedResult.position.left,
              transform: 'translateZ(0)'
            }}
          >
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedResult.text}</p>
          </div>
        )}

       

        {/* Input Area */}
        <div className="bg-transparent p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-purple-600 disabled:text-gray-300 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;