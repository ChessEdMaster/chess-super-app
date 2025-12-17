import { Howl } from 'howler';

const sounds: Record<string, Howl> = {};

if (typeof window !== 'undefined') {
    const baseUrl = 'https://raw.githubusercontent.com/ornicar/lila/master/public/sound/standard';
    sounds.move = new Howl({ src: [`${baseUrl}/Move.mp3`] });
    sounds.capture = new Howl({ src: [`${baseUrl}/Capture.mp3`] });
    sounds.check = new Howl({ src: [`${baseUrl}/Check.mp3`] });
    sounds.castle = new Howl({ src: [`${baseUrl}/Move.mp3`] }); // Fallback to Move to ensure it works
    sounds.game_start = new Howl({ src: [`${baseUrl}/Dong.mp3`] }); // Usually the start sound
    sounds.game_end = new Howl({ src: [`${baseUrl}/Victory.mp3`] });
}

export function playSound(type: string) {
    try {
        // Check if sound is enabled (will be checked from settings store)
        if (typeof window !== 'undefined') {
            const settings = localStorage.getItem('chess-settings');
            if (settings) {
                const { state } = JSON.parse(settings);
                if (!state.soundEnabled) return;
            }
        }

        if (sounds[type]) {
            sounds[type].play();
        }
    } catch (e) {
        console.error("Error playing sound:", e);
    }
}
