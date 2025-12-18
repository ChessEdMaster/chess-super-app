'use client';

import React, { useState, useEffect } from 'react';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { ChevronLeft, ChevronRight, BookOpen, Copy, Check, Menu, X, List } from 'lucide-react';

interface ContentBlock {
    type: 'text' | 'pgn_block';
    data: string;
    original_spanish?: string;
    diagram?: string;
    initial_fen?: string;
}

interface Chapter {
    title: string;
    start_page?: number;
    content: ContentBlock[];
}

interface BookData {
    metadata: {
        title: string;
        version: string;
    };
    chapters: Chapter[];
}

interface ChessBookReaderProps {
    jsonPath: string;
    diagramBasePath?: string;
}

export default function ChessBookReader({ jsonPath, diagramBasePath = '' }: ChessBookReaderProps) {
    const [bookData, setBookData] = useState<BookData | null>(null);
    const [currentChapter, setCurrentChapter] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetch(jsonPath)
            .then(res => res.json())
            .then(data => {
                setBookData(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Error loading book data');
                setLoading(false);
            });
    }, [jsonPath]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent"></div>
                    <p className="text-slate-300 font-medium">Carregant llibre...</p>
                </div>
            </div>
        );
    }

    if (error || !bookData) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-8 text-center">
                    <BookOpen className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-400 text-lg">{error || 'Failed to load book'}</p>
                </div>
            </div>
        );
    }

    const chapter = bookData.chapters[currentChapter];

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl text-white shadow-lg hover:bg-slate-700 transition-colors"
            >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Overlay for Mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative z-50 lg:z-auto
                w-80 h-full
                bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50
                flex flex-col flex-shrink-0
                transform transition-transform duration-300 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Book Header */}
                <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-amber-600/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-100 leading-tight">{bookData.metadata.title}</h1>
                            <p className="text-sm text-slate-400">v{bookData.metadata.version}</p>
                        </div>
                    </div>
                </div>

                {/* Chapter List Header */}
                <div className="px-6 py-3 border-b border-slate-700/50 flex items-center gap-2">
                    <List className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Capítols</span>
                    <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                        {bookData.chapters.length}
                    </span>
                </div>

                {/* Chapter Navigation */}
                <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {bookData.chapters.map((ch, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setCurrentChapter(idx);
                                setSidebarOpen(false);
                            }}
                            className={`
                                w-full text-left px-6 py-3 text-sm transition-all duration-200
                                flex items-center gap-3 group
                                ${idx === currentChapter
                                    ? 'bg-gradient-to-r from-amber-600/20 to-transparent text-amber-400 font-semibold border-l-4 border-amber-500'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-4 border-transparent'
                                }
                            `}
                        >
                            <span className={`
                                w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                                ${idx === currentChapter
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                                }
                            `}>
                                {idx + 1}
                            </span>
                            <span className="truncate">{ch.title}</span>
                        </button>
                    ))}
                </nav>

                {/* Progress Footer */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Progrés</span>
                        <span>{Math.round(((currentChapter + 1) / bookData.chapters.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${((currentChapter + 1) / bookData.chapters.length) * 100}%` }}
                        />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Sticky Header */}
                <header className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 px-4 lg:px-8 py-4 flex items-center justify-between z-30">
                    <div className="flex items-center gap-4 ml-12 lg:ml-0">
                        <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                            <BookOpen className="w-4 h-4" />
                            Capítol {currentChapter + 1}
                        </span>
                        <h2 className="text-lg lg:text-xl font-semibold text-slate-100 truncate max-w-xs lg:max-w-lg">
                            {chapter.title}
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                            disabled={currentChapter === 0}
                            className="p-2 lg:px-4 lg:py-2 bg-slate-800 border border-slate-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors flex items-center gap-2 text-slate-300"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="hidden lg:inline">Anterior</span>
                        </button>
                        <button
                            onClick={() => setCurrentChapter(Math.min(bookData.chapters.length - 1, currentChapter + 1))}
                            disabled={currentChapter === bookData.chapters.length - 1}
                            className="p-2 lg:px-4 lg:py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg flex items-center gap-2"
                        >
                            <span className="hidden lg:inline">Següent</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-8">
                    {chapter.content.map((block, idx) => (
                        <ContentBlockRenderer
                            key={idx}
                            block={block}
                            diagramBasePath={diagramBasePath}
                        />
                    ))}

                    {/* End of Chapter */}
                    <div className="text-center py-12 border-t border-slate-700/50 mt-12">
                        <p className="text-slate-500 text-sm mb-4">Fi del capítol</p>
                        {currentChapter < bookData.chapters.length - 1 && (
                            <button
                                onClick={() => setCurrentChapter(currentChapter + 1)}
                                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg font-medium"
                            >
                                Continuar al següent capítol →
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ContentBlockRenderer({ block, diagramBasePath }: { block: ContentBlock; diagramBasePath: string }) {
    if (block.type === 'text') {
        return (
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <p className="text-slate-200 leading-relaxed text-lg">
                    {block.data}
                </p>
            </div>
        );
    }

    if (block.type === 'pgn_block') {
        return <PGNBlock block={block} diagramBasePath={diagramBasePath} />;
    }

    return null;
}

function PGNBlock({ block, diagramBasePath }: { block: ContentBlock; diagramBasePath: string }) {
    const [copied, setCopied] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);

    const handleCopyPGN = () => {
        navigator.clipboard.writeText(block.data);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const diagramSrc = block.diagram
        ? `${diagramBasePath}${block.diagram.replace(/\\/g, '/')}`
        : null;

    // Use initial_fen if available, otherwise default starting position
    const fenToDisplay = block.initial_fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    return (
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
            <div className="flex flex-col lg:flex-row">
                {/* Interactive Chessboard */}
                <div className="lg:w-1/2 p-4 lg:p-6 flex items-center justify-center bg-slate-900/30">
                    <div className="w-full max-w-[400px] aspect-square rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-700/50">
                        <Chessboard2D
                            fen={fenToDisplay}
                            onSquareClick={() => { }}
                            orientation="white"
                        />
                    </div>
                </div>

                {/* Info Panel */}
                <div className="lg:w-1/2 p-6 space-y-5 flex flex-col">
                    {/* PGN Moves */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                Moviments (PGN)
                            </span>
                            <button
                                onClick={handleCopyPGN}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                    ${copied
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200'
                                    }
                                `}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copiat!' : 'Copiar'}
                            </button>
                        </div>
                        <div className="font-mono text-sm bg-slate-900/50 px-4 py-3 rounded-xl border border-slate-700/50 text-slate-200">
                            {block.data}
                        </div>
                    </div>

                    {/* Original Diagram from Book */}
                    {diagramSrc && (
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                Diagrama del Llibre
                            </span>
                            <img
                                src={diagramSrc}
                                alt="Diagrama original"
                                className="max-w-[180px] rounded-xl border border-slate-700/50 shadow-lg bg-white"
                            />
                        </div>
                    )}

                    {/* FEN */}
                    {block.initial_fen && (
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                FEN
                            </span>
                            <code className="block text-xs bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50 text-slate-400 font-mono break-all">
                                {block.initial_fen}
                            </code>
                        </div>
                    )}

                    {/* Original OCR (Collapsible) */}
                    {block.original_spanish && (
                        <div>
                            <button
                                onClick={() => setShowOriginal(!showOriginal)}
                                className="text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-400 transition-colors flex items-center gap-2"
                            >
                                <span>Original OCR</span>
                                <ChevronRight className={`w-3 h-3 transition-transform ${showOriginal ? 'rotate-90' : ''}`} />
                            </button>
                            {showOriginal && (
                                <p className="text-xs text-slate-500 italic mt-2 bg-slate-900/30 p-3 rounded-lg">
                                    {block.original_spanish}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
