'use client';

import React, { useEffect, useRef } from 'react';

interface MoveHistoryProps {
    history: string[];
}

export function MoveHistory({ history }: MoveHistoryProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col relative h-full min-h-[200px]">
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none"></div>
            <div className="p-3 bg-slate-800 border-b border-slate-700 font-bold text-slate-300 text-sm flex justify-between items-center shadow-md z-10">
                <span>Historial</span>
                <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 border border-slate-800">PGN</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs sm:text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                <div className="grid grid-cols-[30px_1fr_1fr] gap-y-1">
                    {history.reduce((rows: any[], move, index) => {
                        if (index % 2 === 0) {
                            rows.push([`${(index / 2) + 1}.`, move]);
                        } else {
                            rows[rows.length - 1].push(move);
                        }
                        return rows;
                    }, []).map((row, i) => (
                        <React.Fragment key={i}>
                            <div className="text-slate-500 text-right pr-2">{row[0]}</div>
                            <div className="bg-slate-800/50 rounded px-2 py-1 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer text-center">{row[1]}</div>
                            <div className="bg-slate-800/50 rounded px-2 py-1 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer text-center">{row[2] || ''}</div>
                        </React.Fragment>
                    ))}
                </div>
                {history.length === 0 && <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs gap-2 opacity-50"><span>Esperant moviments...</span></div>}
            </div>
        </div>
    );
}
