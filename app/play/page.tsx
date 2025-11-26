import React from 'react';
import SmartChessboard from '@/components/smart-chessboard';
import { Card } from '@/components/ui/card'; // Suposant que tens components UI

export default function PlayPage() {
  return (
    <div className="container mx-auto py-8 min-h-screen flex flex-col items-center gap-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
          Zona de Joc
        </h1>
        <p className="text-gray-500">
          Mode Entrenament vs Stockfish (Local)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Columna Esquerra: Informació / Rellotge */}
        <div className="hidden lg:block space-y-4">
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold mb-2">Dades de la Partida</h3>
            <p className="text-sm text-gray-600">Blanques: Tu</p>
            <p className="text-sm text-gray-600">Negres: CPU</p>
          </Card>
        </div>

        {/* Columna Central: EL TAULER */}
        <div className="col-span-1 lg:col-span-2 flex justify-center items-start">
          {/* Aquí integrem el component protegit */}
          <SmartChessboard boardOrientation="white" />
        </div>
      </div>
    </div>
  );
}