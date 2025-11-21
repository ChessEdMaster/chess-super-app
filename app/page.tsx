'use client';

import React from 'react';
// En el teu projecte real de Next.js, descomenta la línia de sota i esborra el "const Link..." local.
// import Link from 'next/link';
import { Trophy, BookOpen, ShoppingBag, Users, ArrowRight, PlayCircle } from 'lucide-react';

// Mock de Link per a la previsualització (esborra això al teu projecte real)
const Link = ({ href, children, className }: any) => (
  <a href={href} className={className}>
    {children}
  </a>
);

// Aquest serà el teu menú principal
const MenuCard = ({ title, desc, icon: Icon, color, href }: any) => (
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
      {/* Header Senzill */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <Trophy className="text-indigo-500" size={32} />
          <h1 className="text-2xl font-bold text-white tracking-tight">ChessHub</h1>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">Iniciar Sessió</button>
          <button className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">Registrar-se</button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Més que només <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Escacs</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            La plataforma definitiva que combina joc competitiu, formació acadèmica, 
            comerç especialitzat i comunitat social. Tot en un sol lloc.
          </p>
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-slate-200 transition">
              <PlayCircle size={20} /> Jugar Ara
            </button>
          </div>
        </div>

        {/* Grid de Mòduls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MenuCard 
            title="Jugar" 
            desc="Partides ràpides, tornejos i anàlisi amb motor Stockfish." 
            icon={Trophy} 
            color="bg-amber-500"
            href="/play" 
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