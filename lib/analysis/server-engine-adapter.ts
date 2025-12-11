
export class ServerEngineAdapter {
    onmessage: ((event: MessageEvent) => void) | null = null;
    private abortController: AbortController | null = null;
    private options: string[] = [];
    private positionCommand: string = '';

    constructor() {
        console.log("ServerEngineAdapter initialized");
    }

    postMessage(message: string) {
        // Handle stop command immediately by aborting current request
        if (message === 'stop') {
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
            return;
        }

        // Buffer configuration commands
        if (message.startsWith('setoption')) {
            this.options.push(message);
            return;
        }

        if (message === 'uci') {
            // Fake immediate response for UCI initialization
            this.dispatchMessage('id name Stockfish Native');
            this.dispatchMessage('id author Tord Romstad, Marco Costalba, Joona Kiiski, et al.');
            this.dispatchMessage('uciok');
            return;
        }

        if (message === 'isready') {
            this.dispatchMessage('readyok');
            return;
        }

        if (message.startsWith('position')) {
            this.positionCommand = message;
            return;
        }

        // Trigger analysis on 'go'
        if (message.startsWith('go')) {
            this.startAnalysis(message);
        }
    }

    private async startAnalysis(goCommand: string) {
        // Cancel any pending request
        if (this.abortController) {
            this.abortController.abort();
        }

        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            const response = await fetch('/api/analysis/native', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commands: [
                        ...this.options,
                        this.positionCommand,
                        goCommand
                    ]
                }),
                signal
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        this.dispatchMessage(line.trim());
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Analysis aborted');
            } else {
                console.error('Server analysis error:', error);
            }
        } finally {
            this.abortController = null;
        }
    }

    private dispatchMessage(data: string) {
        if (this.onmessage) {
            this.onmessage({ data } as MessageEvent);
        }
    }

    terminate() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}
