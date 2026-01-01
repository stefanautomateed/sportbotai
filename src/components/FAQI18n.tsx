/**
 * FAQ Component - Serbian Version
 * 
 * Serbian translation of the FAQ section using translation system.
 */

'use client';

import FAQ, { FAQItem } from './FAQ';
import { TranslationsType } from '@/lib/i18n/translations';

interface FAQI18nProps {
  t: TranslationsType;
}

export default function FAQI18n({ t }: FAQI18nProps) {
  // Serbian FAQ data - translated from English homepage FAQ
  const faqItems: FAQItem[] = [
    {
      question: "Šta je SportBot AI?",
      answer: "SportBot AI je AI platforma za sportsku analitiku koja ti pomaže da razumeš bilo koji meč za 60 sekundi. Pružamo analizu u realnom vremenu uključujući formu timova, povrede, ključne statistike i kontekstualne uvide — tako da možeš doneti pametnije odluke kao navijač, kreator sadržaja ili analitičar."
    },
    {
      question: "Kako će mi pomoći?",
      answer: "Bilo da si obični navijač koji želi da razume meč pre gledanja, kreator sadržaja kojem je potrebno brzo istraživanje, ili neko ko želi dublje sportske uvide — SportBot AI ti štedi sate istraživanja pružajući AI kuriranu analizu trenutno."
    },
    {
      question: "Da li je ovo tipster servis?",
      answer: "Ne. Ne dajemo tikete niti ti govorimo šta da igraš. SportBot AI je edukativni alat koji ti daje razumevanje i kontekst. Vidiš podatke, analizu i uvide — zatim ti odlučuješ šta to znači za tebe."
    },
    {
      question: "Koje sportove pokrivate?",
      answer: "Pokrivamo sve glavne sportove uključujući Premijer Ligu, La Ligu, Seriju A, Ligu Šampiona, NBA, NFL, NHL, MLB, Evroligu Košarku i mnoge druge. Naš AI radi preko fudbala, košarke, američkog fudbala, hokeja i drugih popularnih liga."
    },
    {
      question: "Koliko košta SportBot AI?",
      answer: "Nudimo besplatan plan sa osnovnom analizom meča, plus Pro i Premium planove za napredne korisnike koji žele neograničen AI chat, market alarme i napredne funkcije. Pogledaj stranicu sa cenama za trenutne planove."
    },
    {
      question: "Kako da otkažem svoj plan?",
      answer: "Možeš otkazati bilo kada iz postavki naloga. Nema dugoročnih ugovora — otkaži kad god želiš i zadržaćeš pristup do kraja perioda naplate."
    },
  ];

  return (
    <FAQ 
      items={faqItems} 
      title={t.pricingPage.faqTitle}
      label="Podrška"
    />
  );
}
