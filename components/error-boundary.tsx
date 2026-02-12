'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Global Error Boundary — Catch and display React rendering errors gracefully.
 * Prevents the entire app from crashing on a component error.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Alguna cosa ha anat malament
                    </h2>
                    <p className="text-secondary mb-6 max-w-md">
                        S&apos;ha produït un error inesperat. Prova de recarregar la pàgina.
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                        Recarregar
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mt-4 p-4 bg-muted rounded-lg text-left text-xs max-w-xl overflow-auto text-danger">
                            {this.state.error.message}
                            {'\n'}
                            {this.state.error.stack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
