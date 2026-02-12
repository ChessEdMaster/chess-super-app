const { Chess } = require('chess.js');

try {
    const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
    console.log(`Testing FEN: ${fen}`);
    const chess = new Chess(fen);
    console.log('Success!');
} catch (error) {
    console.error('Error caught:', error.message);
}
