import { Howl } from 'howler';

const sounds: Record<string, Howl> = {};

if (typeof window !== 'undefined') {
    sounds.move = new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/move.mp3'] });
    sounds.capture = new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/capture.mp3'] });
    sounds.check = new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/move-check.mp3'] });
    sounds.castle = new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/castle.mp3'] });
    sounds.game_start = new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/game-start.mp3'] });
    sounds.game_end = new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/game-end.mp3'] });
}

export function playSound(type: string) {
    try {
        if (sounds[type]) {
            sounds[type].play();
        }
    } catch (e) {
        console.error("Error playing sound:", e);
    }
}
