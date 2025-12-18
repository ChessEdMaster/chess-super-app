import ChessBookReader from '@/components/chess-book/ChessBookReader';

export const metadata = {
    title: 'Los 100 Finales que hay que saber | Chess Clans',
    description: 'Aprèn els 100 finals d\'escacs essencials amb el clàssic de Jesús de la Villa',
};

export default function Los100FinalesPage() {
    return (
        <ChessBookReader
            jsonPath="/books/los-100-finales/llibre_final24.json"
            diagramBasePath="/books/los-100-finales/"
        />
    );
}
