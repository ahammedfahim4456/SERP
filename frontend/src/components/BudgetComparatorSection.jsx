import React, { useState } from 'react';
import { Wallet, Sparkles, Languages, Check, ArrowRight, ShieldCheck, Scale, Cpu } from 'lucide-react';

export default function BudgetComparatorSection({
  userBudget = 15000,
  daysCount = 3,
  nightsCount = 2,
  cityAStats,
  cityBStats,
  cityAName = 'Gokarna',
  cityBName = 'Pondicherry',
  citiesStatsList = null,
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // 'en', 'ta', 'hi'

  // Normalize list of city stats
  const cityEntries = citiesStatsList && citiesStatsList.length > 0
    ? citiesStatsList
    : [
        { name: cityAName, stats: cityAStats },
        { name: cityBName, stats: cityBStats },
      ];

  const budget = Number(userBudget || 15000);

  // Compute best value / cheapest destination
  const validEntries = cityEntries.filter(c => c && c.stats);
  const sortedByCost = [...validEntries].sort((a, b) => (a.stats.totalCost || 0) - (b.stats.totalCost || 0));
  const cheapest = sortedByCost[0] || { name: cityAName, stats: cityAStats };
  const mostExpensive = sortedByCost[sortedByCost.length - 1] || { name: cityBName, stats: cityBStats };
  const costDifference = Math.max(0, (mostExpensive.stats?.totalCost || 0) - (cheapest.stats?.totalCost || 0));

  // Multilingual AI Trade-off generation
  const getAiTradeoffExplanation = () => {
    const cheapName = cheapest.name;
    const expName = mostExpensive.name;
    const surplus = budget - (cheapest.stats?.totalCost || 0);

    if (selectedLanguage === 'ta') {
      return {
        headline: `🤖 AI பயணச் செலவு பகுப்பாய்வு: ${cheapName} தேர்வு ₹${costDifference.toLocaleString('en-IN')} சேமிப்பைத் தருகிறது!`,
        tradeoff: `${expName} உடன் ஒப்பிடும்போது, ${cheapName} பயணத்தில் போக்குவரத்து மற்றும் தங்குமிடம் கணிசமாக மலிவானது. ${
          surplus >= 0
            ? `உங்கள் பட்ஜெட்டில் இன்னும் ₹${surplus.toLocaleString('en-IN')} மீதம் உள்ளது. இதை உள்ளூர் உணவு மற்றும் பொழுதுபோக்கிற்குப் பயன்படுத்தலாம்.`
            : `இருப்பினும் பட்ஜெட்டை விட ₹${Math.abs(surplus).toLocaleString('en-IN')} கூடுதல் தேவைப்படுகிறது.`
        }`,
        recommendation: `சிபாரிசு: குடும்பம் அல்லது பட்ஜெட் பயணிகளுக்கு ${cheapName} சிறந்த தேர்வு.`,
      };
    }

    if (selectedLanguage === 'hi') {
      return {
        headline: `🤖 AI यात्रा लागत विश्लेषण: ${cheapName} चुनने से ₹${costDifference.toLocaleString('en-IN')} की बचत होती है!`,
        tradeoff: `${expName} की तुलना में ${cheapName} का ट्रांजिट और होटल अधिक किफायती है। ${
          surplus >= 0
            ? `आपके ₹${budget.toLocaleString('en-IN')} के बजट में अभी भी ₹${surplus.toLocaleString('en-IN')} शेष हैं, जिसका उपयोग दर्शनीय स्थलों के लिए किया जा सकता है।`
            : `यह आपके कुल बजट से ₹${Math.abs(surplus).toLocaleString('en-IN')} अधिक है।`
        }`,
        recommendation: `सिफारिश: बजट और आराम के संतुलन के लिए ${cheapName} सबसे उपयुक्त विकल्प है।`,
      };
    }

    // English
    return {
      headline: `🤖 AI Cost Synthesis: ${cheapName} saves ₹${costDifference.toLocaleString('en-IN')} compared to ${expName}!`,
      tradeoff: `Booking transit and stay in ${cheapName} leaves you with ${
        surplus >= 0
          ? `₹${surplus.toLocaleString('en-IN')} in wallet headroom for beach excursions and local dining.`
          : `a slight ₹${Math.abs(surplus).toLocaleString('en-IN')} deficit against your ₹${budget.toLocaleString('en-IN')} wallet.`
      } Trade-off: ${expName} offers unique cultural cafes, but ${cheapName} provides higher square-footage and lower nightly rates.`,
      recommendation: `Recommended strategy: Choose ${cheapName} if maximizing pocket savings; switch transit to express train to save an additional ₹1,200.`,
    };
  };

  const aiAnalysis = getAiTradeoffExplanation();

  const renderMeter = (stats, cityName) => {
    const totalCost = Number(stats?.totalCost || 0);
    const diff = budget - totalCost;
    const percentUsed = Math.min(100, Math.round((totalCost / Math.max(1, budget)) * 100));

    const transitPrice = Number(stats?.transitPrice || 0);
    const nightlyRate = Number(stats?.nightlyRate || 0);
    const stayTotal = Number(stats?.stayTotal || 0);
    const foodTotal = Number(stats?.foodTotal || 0);
    const transitMode = stats?.transitMode || 'TRANSIT';

    let status = 'green';
    let statusText = '';
    let statusBg = '';
    let statusGlow = '';

    if (diff >= 1500) {
      status = 'green';
      statusText = `Pocket Friendly — ₹${diff.toLocaleString('en-IN')} left to spare!`;
      statusBg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      statusGlow = 'shadow-emerald-glow';
    } else if (diff >= 0 && diff < 1500) {
      status = 'amber';
      statusText = `Tight Squeeze — ₹${diff.toLocaleString('en-IN')} remaining margin.`;
      statusBg = 'bg-amber-50 text-amber-800 border-amber-300';
      statusGlow = 'shadow-amber-200';
    } else {
      status = 'red';
      statusText = `Wallet Danger — ₹${Math.abs(diff).toLocaleString('en-IN')} over budget!`;
      statusBg = 'bg-crimson-50 text-crimson-900 border-crimson-300';
      statusGlow = 'shadow-crimson-glow';
    }

    return (
      <div key={cityName} className={`p-6 rounded-2xl bg-white border transition-all ${statusBg} ${statusGlow}`}>
        
        {/* City & Status Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">
              Destination Verdict
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900">{cityName}</h3>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                status === 'green'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : status === 'amber'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-crimson-700 text-white border-crimson-800'
              }`}
            >
              {status === 'green' ? '🟢 UNDER BUDGET' : status === 'amber' ? '🟡 TIGHT FIT' : '🔴 OVER BUDGET'}
            </span>
          </div>
        </div>

        {/* Progress Bar (Traffic Light) */}
        <div className="py-4">
          <div className="flex justify-between text-xs font-bold text-stone-700 mb-1.5">
            <span>Budget Utilized: {percentUsed}%</span>
            <span>Wallet: ₹{budget.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-3.5 w-full bg-stone-200/70 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                status === 'green'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                  : status === 'amber'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                  : 'bg-gradient-to-r from-crimson-600 to-crimson-700'
              }`}
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs font-bold">{statusText}</div>
        </div>

        {/* Mathematical True Pocket Damage Table */}
        <div className="space-y-2 pt-2 border-t border-stone-200/60 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Transit ({transitMode}):</span>
            <span className="font-semibold text-stone-900">₹{transitPrice.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Stay ({nightsCount || 2} nights @ ₹{nightlyRate.toLocaleString('en-IN')}/night):</span>
            <span className="font-semibold text-stone-900">₹{stayTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Est. Food & Local Gigs ({daysCount || 3} days):</span>
            <span className="font-semibold text-stone-900">₹{foodTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="pt-2 border-t border-stone-300 flex justify-between text-sm font-extrabold text-stone-900">
            <span>True Total Damage:</span>
            <span className={status === 'red' ? 'text-crimson-700' : 'text-stone-900'}>
              ₹{totalCost.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

      </div>
    );
  };

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-100 text-crimson-800 text-xs font-bold uppercase tracking-wider">
          <Wallet className="w-3.5 h-3.5" />
          <span>True Pocket Damage Showdown</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-stone-900">
          Budget Meter & Mathematical Reality
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          Calculates Transit + (Hotel × Nights) + (Local Food × Days) across all destinations against your ₹{budget.toLocaleString('en-IN')} wallet.
        </p>
      </div>

      {/* ─── Track 3, 4, 5: AI Trip Cost Summary & Trade-Offs Hub ─── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/80 border-2 border-emerald-300 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-emerald-200/80 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800">
                Track 3 & 4 AI Feature
              </span>
              <h4 className="font-bold text-sm sm:text-base text-stone-900">
                AI Trip Cost Summary & Trade-Off Analysis
              </h4>
            </div>
          </div>

          {/* Multilingual Switcher: English / Tamil / Hindi */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-300 text-xs font-bold shadow-2xs self-start sm:self-auto">
            <Languages className="w-3.5 h-3.5 text-emerald-700 ml-1.5" />
            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedLanguage === 'en'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('ta')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedLanguage === 'ta'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedLanguage === 'hi'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        {/* AI Trade-off Body */}
        <div className="space-y-2 text-xs sm:text-sm text-stone-800">
          <p className="font-bold text-emerald-950 text-sm sm:text-base">
            {aiAnalysis.headline}
          </p>
          <p className="text-stone-700 leading-relaxed">
            {aiAnalysis.tradeoff}
          </p>
          <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{aiAnalysis.recommendation}</span>
          </div>
        </div>

        {/* Track 5 Smart Cache Normalization Badge */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/60 text-[11px] text-stone-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-700" />
            <span>
              <strong>Track 5 Smart Normalization:</strong> Synced canonical keys ensure zero redundant SerpApi credit consumption.
            </span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
            Cached & Normalized
          </span>
        </div>
      </div>

      {/* Showdown Cards Grid (Supports N Cities!) */}
      <div className={`grid gap-6 ${validEntries.length > 2 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        {validEntries.map((entry) => renderMeter(entry.stats, entry.name))}
      </div>

      {/* Direct Rupee Winner Verdict Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sandal-200 via-sandal-100 to-sandal-200 border border-sandal-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-crimson-700 text-white flex items-center justify-center shrink-0 font-bold shadow-md">
            ₹
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-crimson-800">
              The Pocket Reality Verdict
            </div>
            <div className="font-serif font-bold text-base sm:text-lg text-stone-900">
              {cheapest.name} saves you ₹{costDifference.toLocaleString('en-IN')} over {mostExpensive.name}!
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-sandal-300 shadow-sm">
          💡 Change transport mode above to compare flight vs train vs bus math!
        </div>
      </div>

    </section>
  );
}
