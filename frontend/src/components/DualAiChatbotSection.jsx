import React, { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';

export default function DualAiChatbotSection({
  cityAStats,
  cityBStats,
  userBudget,
  originCity
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'rohan',
      title: 'Rohan (The Strict Budget CA)',
      avatar: '💼',
      badge: 'Penny-Pincher',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      text: `Listen to your wallet! Here is the cold, hard rupee reality:\n• Gokarna via train leaves ₹${(userBudget - cityAStats.totalCost).toLocaleString('en-IN')} in your bank account, whereas flights eat up 45% of your total budget before you even land.\n• In Pondicherry, staying in the French Quarter costs ₹2,800/night vs Zostel Gokarna cliff dorms at ₹1,250/night.\n• Verdict: If your wallet is priority #1, book Gokarna with the overnight sleeper train right now!`
    },
    {
      id: 2,
      sender: 'maya',
      title: 'Maya (Local Vibe Scout)',
      avatar: '🎒',
      badge: 'Experience Guru',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      text: `Rohan is right on numbers, but you cannot put a price on vibes! ✨\n• Pondicherry has a LIVE French courtyard Jazz Fest at Alliance Française this Saturday night that is FREE entry!\n• Plus, sipping hibiscus iced tea at Cafe des Arts and cycling through White Town bougainvillea streets is magical.\n• But if you want cliff sunsets, bonfires at Kudle Beach, and the Half-Moon night trek, Gokarna is pure raw freedom!`
    }
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const SUGGESTED_QUESTIONS = [
    "Which destination has better budget seafood?",
    "Can 3 college friends do this under ₹10k each?",
    "Should we take the flight or overnight sleeper bus?"
  ];

  const handleAsk = (questionText) => {
    const q = questionText || inputQuestion;
    if (!q.trim() || isAnswering) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      title: 'You',
      avatar: '👤',
      badge: 'Traveler Question',
      badgeColor: 'bg-stone-100 text-stone-700',
      text: q
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAnswering(true);

    // Simulate Dual Bot Gemini response
    setTimeout(() => {
      let rohanAnswer = '';
      let mayaAnswer = '';

      if (q.toLowerCase().includes('seafood') || q.toLowerCase().includes('food')) {
        rohanAnswer = `Seafood Math Check:\n• Gokarna: Prema Restaurant and Middle Beach shacks serve full Kingfish thalis for ₹180-250.\n• Pondicherry: Coromandel and seaside French bistros charge ₹650+ for prawn platters.\n• CA Verdict: Gokarna saves ₹400 per meal on local fish!`;
        mayaAnswer = `Foodie Experience Verdict:\n• Pondicherry has legendary Creole & French fusion! Coromandel Cafe's garlic butter prawns and Surguru's crispy ghee roast dosa are unforgettable.\n• In Gokarna, eating grilled pomfret under candle lanterns at Namaste Cafe right on Om Beach is unmatched coastal bliss!`;
      } else if (q.toLowerCase().includes('friend') || q.toLowerCase().includes('10k') || q.toLowerCase().includes('college')) {
        rohanAnswer = `Squad Budget Calculation:\n• With 3-4 friends, book the KSRTC AC Sleeper (₹2,100 roundtrip each) and split a 4-bed room at Zostel Gokarna.\n• Your stay drops to ₹600/night/person! Total trip will be under ₹7,200 per head easily!`;
        mayaAnswer = `Group Vibe Check:\n• Gokarna is 100% the move for a college squad! Rent scooters for ₹350/day, do the 5-beach cliff trek, and jam to guitars at Kudle Beach bonfire. Total memories!`;
      } else {
        rohanAnswer = `Financial perspective on "${q}":\n• Always calculate door-to-door transit: Airport cab transfers often add ₹1,200 unseen charges.\n• Train or overnight sleeper bus saves you one full hotel night cost while traveling while you sleep!`;
        mayaAnswer = `Local experience on "${q}":\n• The google_events data shows vibrant weekend energy! Check the Saturday night flea markets and try local street bakeries before sunset!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'rohan',
          title: 'Rohan (The Strict Budget CA)',
          avatar: '💼',
          badge: 'Penny-Pincher',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          text: rohanAnswer
        },
        {
          id: Date.now() + 2,
          sender: 'maya',
          title: 'Maya (Local Vibe Scout)',
          avatar: '🎒',
          badge: 'Experience Guru',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          text: mayaAnswer
        }
      ]);
      setIsAnswering(false);
    }, 900);
  };

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-100 text-crimson-800 text-xs font-bold uppercase tracking-wider">
          <Bot className="w-3.5 h-3.5" />
          <span>Dual AI Persona System • Powered by Google Gemini</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-stone-900">
          The Great Travel Debate: Rohan vs Maya
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          Two opposing AI minds analyze your live SerpApi data: One guards your bank account, the other maximizes your memories.
        </p>
      </div>

      {/* Side-by-side Persona Avatars & Bios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        {/* Rohan Profile */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-2xl shadow-sm">
            💼
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-stone-900 text-sm">Rohan (The Budget CA)</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Penny-Pincher
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Focuses on SerpApi flight & stay math. Roasts impulse spending and calculates exact rupee margins.
            </p>
          </div>
        </div>

        {/* Maya Profile */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl shadow-sm">
            🎒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-stone-900 text-sm">Maya (Local Vibe Scout)</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-200 text-teal-900">
                Experience Guru
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Focuses on SerpApi google_events & local cafes. Unearths live jazz nights, beach treks and artisan sourdough.
            </p>
          </div>
        </div>

      </div>

      {/* Chat Messages Stream */}
      <div className="sandal-card p-6 bg-white border border-sandal-300 shadow-sm space-y-4 mb-6 max-h-[480px] overflow-y-auto">
        {messages.map((m) => {
          const isRohan = m.sender === 'rohan';
          const isMaya = m.sender === 'maya';
          const isUser = m.sender === 'user';

          return (
            <div
              key={m.id}
              className={`p-4 rounded-2xl border transition-all ${
                isRohan
                  ? 'bg-amber-50/60 border-amber-200'
                  : isMaya
                  ? 'bg-teal-50/60 border-teal-200'
                  : 'bg-stone-50 border-stone-200 ml-auto max-w-lg'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">{m.avatar}</span>
                <span className="font-bold text-xs sm:text-sm text-stone-900">{m.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                  {m.badge}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                {m.text}
              </div>
            </div>
          );
        })}

        {isAnswering && (
          <div className="p-4 rounded-2xl bg-sandal-100 border border-sandal-200 animate-pulse text-xs text-stone-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-crimson-700 animate-spin" />
            <span>Rohan and Maya are both reviewing live SerpApi data to debate your question...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-stone-500">Ask the Bots:</span>
        {SUGGESTED_QUESTIONS.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleAsk(sq)}
            className="text-xs bg-sandal-100 hover:bg-sandal-200 text-stone-800 border border-sandal-300 px-3 py-1.5 rounded-xl transition-colors font-medium text-left"
          >
            "{sq}"
          </button>
        ))}
      </div>

      {/* Interactive Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask Rohan & Maya anything about this trip (e.g., Is flight worth the extra ₹3k?)..."
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          className="flex-1 px-4 py-3 rounded-2xl bg-white border border-sandal-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-stone-800 shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isAnswering}
          className="px-6 py-3 rounded-2xl bg-crimson-700 hover:bg-crimson-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-crimson-800/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span>Ask Both Bots</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

    </section>
  );
}
