import React from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

export default function BudgetComparatorSection({
  userBudget,
  daysCount,
  nightsCount,
  cityAStats,
  cityBStats,
}) {
  const renderMeter = (stats, cityName) => {
    const totalCost = stats.totalCost;
    const diff = userBudget - totalCost;
    const percentUsed = Math.min(100, Math.round((totalCost / userBudget) * 100));

    let status = 'green'; // green, amber, red
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
      <div className={`p-6 rounded-2xl bg-white border transition-all ${statusBg} ${statusGlow}`}>
        
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
            <span>Target: ₹{userBudget.toLocaleString('en-IN')}</span>
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
            <span>Transit ({stats.transitMode}):</span>
            <span className="font-semibold text-stone-900">₹{stats.transitPrice.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Stay ({nightsCount} nights @ ₹{stats.nightlyRate}/night):</span>
            <span className="font-semibold text-stone-900">₹{stats.stayTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Est. Food & Live Local Gigs ({daysCount} days):</span>
            <span className="font-semibold text-stone-900">₹{stats.foodTotal.toLocaleString('en-IN')}</span>
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

  const aCheaper = cityAStats.totalCost <= cityBStats.totalCost;
  const difference = Math.abs(cityAStats.totalCost - cityBStats.totalCost);

  return (
    <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-100 text-crimson-800 text-xs font-bold uppercase tracking-wider">
          <Wallet className="w-3.5 h-3.5" />
          <span>True Pocket Damage Showdown</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-stone-900">
          City A vs City B: Budget Meter
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          Calculates Transit + (Hotel × Nights) + (Local Food × Days) against your ₹{userBudget.toLocaleString('en-IN')} wallet.
        </p>
      </div>

      {/* Showdown Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderMeter(cityAStats, 'Gokarna')}
        {renderMeter(cityBStats, 'Pondicherry')}
      </div>

      {/* Direct Rupee Winner Verdict Banner */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-sandal-200 via-sandal-100 to-sandal-200 border border-sandal-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-crimson-700 text-white flex items-center justify-center shrink-0 font-bold shadow-md">
            ₹
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-wider text-crimson-800">
              The Pocket Reality Verdict
            </div>
            <div className="font-serif font-bold text-base sm:text-lg text-stone-900">
              {aCheaper ? 'Gokarna' : 'Pondicherry'} saves you ₹{difference.toLocaleString('en-IN')} over {aCheaper ? 'Pondicherry' : 'Gokarna'}!
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-sandal-300 shadow-sm">
          💡 Change transport mode above to compare flight vs bus math!
        </div>
      </div>

    </section>
  );
}
