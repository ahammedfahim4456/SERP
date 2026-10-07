import React from 'react';
import { ArrowDown, ArrowRight, Compass, Globe2, Search } from 'lucide-react';

const links = [
  { label: 'Destinations', href: '#popular-destinations', dropdown: true },
  { label: 'Experiences', href: '#popular-destinations', dropdown: true },
  { label: 'Trips', href: '#journey-details-section' },
  { label: 'About us', href: '#about-truetrip' },
  { label: 'Journal', href: '#popular-destinations' },
];

export default function HeaderNavbar() {
  return (
    <header className="tt-navbar absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 border-b border-white/15 px-5 sm:px-8 lg:px-12">
        <a href="#top" aria-label="TrueTrip home" className="flex shrink-0 items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center text-teal-200"><Compass size={29} strokeWidth={1.35}/></span>
          <span><span className="block text-[13px] font-bold tracking-[.16em]">TRUE<span className="font-light">TRIP</span></span><span className="mt-0.5 block text-[7px] font-medium uppercase tracking-[.2em] text-white/55">Explore · dream · discover</span></span>
        </a>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {links.map(link => <a key={link.label} href={link.href} className="inline-flex items-center gap-1 text-[10px] font-medium text-white/80 transition hover:text-teal-200">{link.label}{link.dropdown && <ArrowDown size={10}/>}</a>)}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#journey-details-section" aria-label="Search trips" className="hidden h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 sm:flex"><Search size={14}/></a>
          <button type="button" aria-label="Language: English" className="hidden items-center gap-1.5 text-[9px] font-semibold text-white/80 sm:inline-flex"><Globe2 size={12}/>EN <ArrowDown size={10}/></button>
          <a href="#journey-details-section" className="inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-teal-200 sm:px-5">Plan your trip <ArrowRight size={13}/></a>
        </div>
      </div>
    </header>
  );
}
