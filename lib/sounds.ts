import { Howl } from 'howler';

const sounds = {
    move: new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/move.mp3'] }),
    capture: new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/capture.mp3'] }),
    check: new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/move-check.mp3'] }),
    castle: new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/castle.mp3'] }),
    game_start: new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/game-start.mp3'] }),
    game_end: new Howl({ src: ['https://images.chesscomfiles.com/chess-themes/sounds/_Common/note/game-end.mp3'] }),
};

export function playSound(type: keyof typeof sounds) {
    try {
        sounds[type].play();
    } catch (e) {
        console.error("Error playing sound:", e);
    }
}
