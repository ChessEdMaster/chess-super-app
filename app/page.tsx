'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, BookOpen, ShoppingBag, Users, ArrowRight, PlayCircle, Search } from 'lucide-react';

// Tipus per a les props del component MenuCard
interface MenuCardProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  href: string;
}

const MenuCard = ({ title, desc, icon: Icon, color, href }: MenuCardProps) => (
  <Link href={href} className="group relative overflow-hidden rounded-2xl bg-slate-800 p-6 hover:bg-slate-750 transition-all border border-slate-700 hover:border-slate-500 block">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon size={100} />
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-20 flex items-center justify-center mb-4 text-white`}>
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6">{desc}</p>
      <div className="flex items-center text-indigo-400 font-medium text-sm group-hover:translate-x-2 transition-transform">
        Entrar <ArrowRight size={16} className="ml-1" />
      </div>
    </div>
  </Link>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      {/* Hero Section - Sense Header duplicat (el SiteHeader ja ve del layout) */}
      <main className="max-w-6xl mx-auto pt-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Més que només <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Escacs</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            La plataforma definitiva que combina joc competitiu, formació acadèmica, 
            comerç especialitzat i comunitat social. Tot en un sol lloc.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/play">
              <button className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-slate-200 transition transform hover:scale-105">
                <PlayCircle size={20} /> Contra IA
              </button>
            </Link>
            <Link href="/lobby">
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition transform hover:scale-105">
                <Users size={20} /> Multiplayer
              </button>
            </Link>
          </div>
        </div>

        {/* Grid de Mòduls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MenuCard 
            title="Jugar" 
            desc="Partides contra Stockfish IA o contra altres jugadors en temps real." 
            icon={Trophy} 
            color="bg-amber-500"
            href="/play" 
          />
          <MenuCard 
            title="Anàlisi" 
            desc="Tauler d'anàlisi lliure amb historial de moviments i navegació completa." 
            icon={Search} 
            color="bg-indigo-500"
            href="/analysis" 
          />
          <MenuCard 
            title="Acadèmia" 
            desc="Cursos interactius estil Moodle per millorar el teu nivell." 
            icon={BookOpen} 
            color="bg-emerald-500"
            href="/learn" 
          />
          <MenuCard 
            title="Botiga" 
            desc="Equipament oficial, taulers i marxandatge exclusiu." 
            icon={ShoppingBag} 
            color="bg-blue-500"
            href="/shop" 
          />
          <MenuCard 
            title="Club Social" 
            desc="Connecta amb altres jugadors, comparteix partides i xateja." 
            icon={Users} 
            color="bg-purple-500"
            href="/club" 
          />
        </div>
      </main>
    </div>
  );
}