import { create } from 'zustand';
import { PlayerProfile, ConceptCard, Chest } from '@/types/rpg';

interface PlayerState {
    profile: PlayerProfile;
    cards: ConceptCard[];
    chests: (Chest | null)[];

    // Actions
    addGold: (amount: number) => void;
    addGems: (amount: number) => void;
    addXp: (amount: number) => void;
    addCardCopy: (cardId: string, amount?: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
    profile: {
        id: 'mock-player-1',
        username: 'GrandmasterFlash',
        avatarId: 'king-piece',
        level: 3,
        xp: 450,
        currencies: {
            gold: 1000,
            gems: 50,
        },
        attributes: {
            AGGRESSION: 12,
            SOLIDITY: 8,
            KNOWLEDGE: 15,
            SPEED: 10,
        },
    },
    cards: [
        // AGGRESSION (1-25)
        { id: 'c1', title: 'La Forquilla', rarity: 'COMMON', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Atacar dues peces alhora amb una sola peça.', minigameId: 'puzzle-fork' },
        { id: 'c2', title: 'La Clavada', rarity: 'COMMON', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Immobilitzar una peça perquè no exposi una de més valor.', minigameId: 'puzzle-pin' },
        { id: 'c3', title: "L'Enfilada", rarity: 'COMMON', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Atacar una peça valuosa i capturar la que hi ha darrere.', minigameId: 'puzzle-skewer' },
        { id: 'c4', title: 'Escac a la Descoberta', rarity: 'RARE', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Moure una peça per obrir línia d\'atac amb una altra.', minigameId: 'puzzle-discovered' },
        { id: 'c5', title: 'Escac Doble', rarity: 'RARE', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Fer escac amb dues peces alhora. El rei s\'ha de moure obligatòriament.', minigameId: 'puzzle-double' },
        { id: 'c6', title: 'Mate del Passadís', rarity: 'COMMON', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Mate a la vuitena fila perquè els peons bloquegen el rei.', minigameId: 'puzzle-backrank' },
        { id: 'c7', title: 'Eliminació del Defensor', rarity: 'RARE', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Capturar o desviar la peça que protegeix l\'objectiu.', minigameId: 'puzzle-remove' },
        { id: 'c8', title: 'Desviació', rarity: 'RARE', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Obligar una peça a moure\'s i abandonar una tasca defensiva.', minigameId: 'puzzle-deflection' },
        { id: 'c9', title: 'Raigs X', rarity: 'EPIC', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Controlar caselles a través de les peces rivals.', minigameId: 'puzzle-xray' },
        { id: 'c10', title: 'Sobrecàrrega', rarity: 'RARE', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Una peça defensa massa punts alhora i col·lapsa.', minigameId: 'puzzle-overload' },
        { id: 'c11', title: 'Sacrifici Clàssic', rarity: 'COMMON', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Entregar material per guanyar temps o atac.', minigameId: 'puzzle-sac' },
        { id: 'c12', title: 'Mate de la Coça', rarity: 'EPIC', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Mate amb cavall quan el rei està envoltat de les seves peces.', minigameId: 'puzzle-smothered' },
        { id: 'c13', title: 'Intercepció', rarity: 'EPIC', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Posar una peça al mig per tallar la comunicació defensiva.', minigameId: 'puzzle-interception' },
        { id: 'c14', title: 'Jugada Intermèdia', rarity: 'LEGENDARY', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Fer una jugada sorpresa abans de la resposta òbvia.', minigameId: 'puzzle-zwischenzug' },
        { id: 'c15', title: 'El Molí de Vent', rarity: 'LEGENDARY', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Sèrie d\'escacs a la descoberta devastadors.', minigameId: 'puzzle-windmill' },
        { id: 'c16', title: 'Atac al Punt f7/f2', rarity: 'COMMON', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Atacar el punt més feble de l\'obertura.', minigameId: 'puzzle-f7' },
        { id: 'c17', title: 'Mate de l\'Àrab', rarity: 'RARE', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Mate amb Torre i Cavall a la cantonada.', minigameId: 'puzzle-arabian' },
        { id: 'c18', title: 'Mate de Boden', rarity: 'EPIC', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Mate creuat amb dos alfils.', minigameId: 'puzzle-boden' },
        { id: 'c19', title: 'Mate d\'Anastasia', rarity: 'EPIC', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Mate amb Cavall i Torre a la banda.', minigameId: 'puzzle-anastasia' },
        { id: 'c20', title: 'Sacrifici Grec', rarity: 'LEGENDARY', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Sacrificar l\'alfil a h7/h2 per obrir el rei.', minigameId: 'puzzle-greek' },
        { id: 'c21', title: 'Clavada en Creu', rarity: 'EPIC', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Una peça clavada clava a una altra peça.', minigameId: 'puzzle-crosspin' },
        { id: 'c22', title: 'Atracció del Rei', rarity: 'RARE', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Sacrifici per obligar el rei a anar a una casella perillosa.', minigameId: 'puzzle-attraction' },
        { id: 'c23', title: 'Demolició de l\'Enroc', rarity: 'EPIC', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Destruir els peons que protegeixen el rei.', minigameId: 'puzzle-demolition' },
        { id: 'c24', title: 'La Bateria', rarity: 'COMMON', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Dama + Alfil o Torre alineats per atacar.', minigameId: 'puzzle-battery' },
        { id: 'c25', title: 'Calaix de Sastre', rarity: 'LEGENDARY', category: 'AGGRESSION', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Sacrificar una peça perduda per causar el màxim dany possible.', minigameId: 'puzzle-desperado' },

        // SOLIDITY (26-50)
        { id: 'c26', title: 'Control del Centre', rarity: 'COMMON', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Dominar les caselles e4, d4, e5, d5.', minigameId: 'puzzle-center' },
        { id: 'c27', title: 'Desenvolupament', rarity: 'COMMON', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Treure les peces ràpidament a l\'inici.', minigameId: 'puzzle-development' },
        { id: 'c28', title: 'Seguretat del Rei', rarity: 'COMMON', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Enrocar aviat i no debilitar l\'estructura.', minigameId: 'puzzle-safety' },
        { id: 'c29', title: 'Columna Oberta', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Una columna sense peons per a les torres.', minigameId: 'puzzle-openfile' },
        { id: 'c30', title: 'Avantatge d\'Espai', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Tenir més territori per maniobrar les peces.', minigameId: 'puzzle-space' },
        { id: 'c31', title: 'Peó Passat', rarity: 'EPIC', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Un peó sense rivals al davant que corre a coronar.', minigameId: 'puzzle-passedpawn' },
        { id: 'c32', title: 'Peó Aïllat', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Un peó sense companys als costats.', minigameId: 'puzzle-isolated' },
        { id: 'c33', title: 'Peons Doblats', rarity: 'COMMON', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Dos peons del mateix color a la mateixa columna.', minigameId: 'puzzle-doubled' },
        { id: 'c34', title: 'Cadena de Peons', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Peons en diagonal que es defensen mútuament.', minigameId: 'puzzle-chain' },
        { id: 'c35', title: 'Casella Feble', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Una casella on no hi ha peons per defensar-la.', minigameId: 'puzzle-hole' },
        { id: 'c36', title: 'Avantprojecte', rarity: 'EPIC', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Un cavall instal·lat en una casella forta enemiga.', minigameId: 'puzzle-outpost' },
        { id: 'c37', title: 'Parella d\'Alfils', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Tenir els dos alfils en posicions obertes.', minigameId: 'puzzle-bishops' },
        { id: 'c38', title: 'Alfil Bo vs Alfil Dolent', rarity: 'EPIC', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Tenir l\'alfil que no xoca amb els teus propis peons.', minigameId: 'puzzle-badbishop' },
        { id: 'c39', title: 'Bloqueig', rarity: 'EPIC', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Aturar un peó passat amb un cavall o peça menor.', minigameId: 'puzzle-blockade' },
        { id: 'c40', title: 'Profilaxi', rarity: 'LEGENDARY', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Prevenir els plans del rival abans que passin.', minigameId: 'puzzle-prophylaxis' },
        { id: 'c41', title: 'Centralització', rarity: 'COMMON', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Portar les peces cap al mig del tauler.', minigameId: 'puzzle-centralization' },
        { id: 'c42', title: 'Illa de Peons', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Grups de peons separats (menys illes és millor).', minigameId: 'puzzle-pawnislands' },
        { id: 'c43', title: 'Peó Endarrerit', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Un peó que s\'ha quedat enrere i és difícil de defensar.', minigameId: 'puzzle-backward' },
        { id: 'c44', title: 'Domini de la 7a Fila', rarity: 'EPIC', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Torres a la setena fila atacant la base enemiga.', minigameId: 'puzzle-7thrank' },
        { id: 'c45', title: 'Coordinació de Peces', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Que les peces treballin juntes i no es destorbin.', minigameId: 'puzzle-coordination' },
        { id: 'c46', title: 'Simplificació', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Canviar peces quan vas guanyant per arribar al final.', minigameId: 'puzzle-simplification' },
        { id: 'c47', title: 'Atac de Minories', rarity: 'EPIC', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Atacar amb menys peons per crear debilitats.', minigameId: 'puzzle-minority' },
        { id: 'c48', title: 'Superpoblació', rarity: 'RARE', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Massa peces en un espai petit (manca de mobilitat).', minigameId: 'puzzle-overcrowding' },
        { id: 'c49', title: 'Maniobra', rarity: 'EPIC', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Moure una peça diverses vegades per millorar-la.', minigameId: 'puzzle-maneuver' },
        { id: 'c50', title: 'Domini del Color', rarity: 'LEGENDARY', category: 'SOLIDITY', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Controlar totes les caselles d\'un sol color.', minigameId: 'puzzle-colorcomplex' },

        // KNOWLEDGE (51-75)
        { id: 'c51', title: 'Obertura Italiana', rarity: 'COMMON', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Clàssica i directa (Bc4).', minigameId: 'puzzle-italian' },
        { id: 'c52', title: 'Obertura Espanyola', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Una de les més antigues i sòlides (Bb5).', minigameId: 'puzzle-ruylopez' },
        { id: 'c53', title: 'Defensa Siciliana', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Agressiva i complexa per a les negres (c5).', minigameId: 'puzzle-sicilian' },
        { id: 'c54', title: 'Gàmbit de Dama', rarity: 'COMMON', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Sacrificar un peó central per domini (c4).', minigameId: 'puzzle-queensgambit' },
        { id: 'c55', title: 'Defensa Francesa', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Sòlida i tancada (e6).', minigameId: 'puzzle-french' },
        { id: 'c56', title: 'Defensa Caro-Kann', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Molt sòlida, com una roca (c6).', minigameId: 'puzzle-carokann' },
        { id: 'c57', title: 'Índia de Rei', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Hipermoderna i d\'atac al flanc de rei.', minigameId: 'puzzle-kid' },
        { id: 'c58', title: 'Sistema Londres', rarity: 'COMMON', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Fàcil d\'aprendre, sòlida i esquemàtica.', minigameId: 'puzzle-london' },
        { id: 'c59', title: 'Obertura Catalana', rarity: 'LEGENDARY', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Posicional i estratègica (g3 + d4). La nostra joia!', minigameId: 'puzzle-catalan' },
        { id: 'c60', title: 'Defensa Escandinava', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Treure la dama aviat (d5).', minigameId: 'puzzle-scandi' },
        { id: 'c61', title: 'Gàmbit de Rei', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Romàntica i perillosa (f4).', minigameId: 'puzzle-kingsgambit' },
        { id: 'c62', title: 'Defensa Eslava', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Similar al Gàmbit de Dama però més sòlida.', minigameId: 'puzzle-slav' },
        { id: 'c63', title: 'Nimzoíndia', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Controlar el centre sense ocupar-lo amb peons.', minigameId: 'puzzle-nimzo' },
        { id: 'c64', title: 'Defensa Pirc', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Permetre al blanc fer centre per atacar-lo després.', minigameId: 'puzzle-pirc' },
        { id: 'c65', title: 'Defensa Alekhine', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Provocar els peons blancs amb el cavall.', minigameId: 'puzzle-alekhine' },
        { id: 'c66', title: 'Anglesa', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Començar pel flanc (c4).', minigameId: 'puzzle-english' },
        { id: 'c67', title: 'Holandesa', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Agressiva contra d4 (f5).', minigameId: 'puzzle-dutch' },
        { id: 'c68', title: 'Atac Indi de Rei', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Sistema tancat per a blanques.', minigameId: 'puzzle-kia' },
        { id: 'c69', title: 'Gàmbit Evans', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Sacrifici de peó a l\'Italiana per atac ràpid.', minigameId: 'puzzle-evans' },
        { id: 'c70', title: 'Defensa Petrov', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'La defensa russa, molt taulífera.', minigameId: 'puzzle-petrov' },
        { id: 'c71', title: 'Benoni Moderna', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Desequilibri i caos al tauler.', minigameId: 'puzzle-benoni' },
        { id: 'c72', title: 'Gàmbit Budapest', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Parany per a les negres contra d4.', minigameId: 'puzzle-budapest' },
        { id: 'c73', title: 'Obertura Bird', rarity: 'RARE', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Començar amb f4 (poc comuna).', minigameId: 'puzzle-bird' },
        { id: 'c74', title: 'Gàmbit Smith-Morra', rarity: 'EPIC', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Atac ferotge contra la Siciliana.', minigameId: 'puzzle-smithmorra' },
        { id: 'c75', title: 'Bongcloud', rarity: 'LEGENDARY', category: 'KNOWLEDGE', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'La broma suprema (Re2). Només per a valents!', minigameId: 'puzzle-bongcloud' },

        // SPEED (76-100)
        { id: 'c76', title: 'L\'Oposició', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Posar el rei davant del rival per guanyar espai.', minigameId: 'puzzle-opposition' },
        { id: 'c77', title: 'Regla del Quadrat', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Saber si el rei arriba a aturar el peó sense comptar.', minigameId: 'puzzle-square' },
        { id: 'c78', title: 'Triangulació', rarity: 'LEGENDARY', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Perdre un temps amb el rei per posar el rival en Zugzwang.', minigameId: 'puzzle-triangulation' },
        { id: 'c79', title: 'Zugzwang', rarity: 'LEGENDARY', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Qualsevol moviment que faci el rival el farà perdre.', minigameId: 'puzzle-zugzwang' },
        { id: 'c80', title: 'Posició de Lucena', rarity: 'EPIC', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'La clau per guanyar finals de Torre ("El Pont").', minigameId: 'puzzle-lucena' },
        { id: 'c81', title: 'Posició de Philidor', rarity: 'EPIC', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'La clau per fer taules en finals de Torre.', minigameId: 'puzzle-philidor' },
        { id: 'c82', title: 'Coronació', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Convertir el peó en Dama.', minigameId: 'puzzle-promotion' },
        { id: 'c83', title: 'Subpromoció', rarity: 'EPIC', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Coronar Cavall o Torre per evitar ofegar o fer mate.', minigameId: 'puzzle-underpromotion' },
        { id: 'c84', title: 'Rei Ofegat', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'El rei no té moviments legals i no està en escac (Taules).', minigameId: 'puzzle-stalemate' },
        { id: 'c85', title: 'La Fortalesa', rarity: 'EPIC', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Crear una defensa impenetrable tot i tenir menys material.', minigameId: 'puzzle-fortress' },
        { id: 'c86', title: 'Regla dels 50 Moviments', rarity: 'RARE', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Taules si no es mou peó ni es captura en 50 torns.', minigameId: 'puzzle-50moves' },
        { id: 'c87', title: 'Taules per Repetició', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Repetir la posició 3 vegades.', minigameId: 'puzzle-repetition' },
        { id: 'c88', title: 'Mate amb Torre', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Tècnica bàsica de tallar el rei.', minigameId: 'puzzle-rookmate' },
        { id: 'c89', title: 'Mate amb dos Alfils', rarity: 'RARE', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Tècnica d\'arrossegar el rei a la cantonada.', minigameId: 'puzzle-bishopsmate' },
        { id: 'c90', title: 'Mate Alfil + Cavall', rarity: 'LEGENDARY', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'El final més difícil. Només per a mestres.', minigameId: 'puzzle-bishopknight' },
        { id: 'c91', title: 'Peó de Torre (Final)', rarity: 'RARE', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Saber quan és taules automàtiques (Rei davant).', minigameId: 'puzzle-rookpawn' },
        { id: 'c92', title: 'Ruptura de Peons', rarity: 'EPIC', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Sacrificar peons per crear-ne un de passat.', minigameId: 'puzzle-breakthrough' },
        { id: 'c93', title: 'Rei Actiu', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'En el final, el rei és una peça d\'atac.', minigameId: 'puzzle-activeking' },
        { id: 'c94', title: 'Principi de Dues Debilitats', rarity: 'LEGENDARY', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 100, description: 'Atacar dos punts allunyats per col·lapsar la defensa.', minigameId: 'puzzle-weaknesses' },
        { id: 'c95', title: 'Sacrifici de Qualitat', rarity: 'EPIC', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Donar Torre per Alfil/Cavall per canviar el curs del joc.', minigameId: 'puzzle-exchange' },
        { id: 'c96', title: 'Escac Perpetu', rarity: 'COMMON', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 10, description: 'Forçar taules fent escac constantment.', minigameId: 'puzzle-perpetual' },
        { id: 'c97', title: 'Temps (Tempo)', rarity: 'RARE', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Guanyar un torn extra o fer perdre un torn al rival.', minigameId: 'puzzle-tempo' },
        { id: 'c98', title: 'L\'Oposició Distant', rarity: 'EPIC', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 50, description: 'Com l\'oposició, però amb caselles pel mig.', minigameId: 'puzzle-distant' },
        { id: 'c99', title: 'Finals de Torres', rarity: 'RARE', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 20, description: '"Tots els finals de torres són taules".', minigameId: 'puzzle-rookendgames' },
        { id: 'c100', title: 'Finals d\'Alfils Diferents', rarity: 'RARE', category: 'SPEED', level: 1, cardsOwned: 0, cardsRequired: 20, description: 'Tendència a taules fins i tot amb peons de menys.', minigameId: 'puzzle-oppositebishops' },
    ],
    chests: [
        { id: 'c1', type: 'WOODEN', unlockTime: 3600, status: 'LOCKED' },
        null,
        null,
        null
    ],

    addGold: (amount) => set((state) => ({
        profile: {
            ...state.profile,
            currencies: { ...state.profile.currencies, gold: state.profile.currencies.gold + amount }
        }
    })),
    addGems: (amount) => set((state) => ({
        profile: {
            ...state.profile,
            currencies: { ...state.profile.currencies, gems: state.profile.currencies.gems + amount }
        }
    })),
    addXp: (amount) => set((state) => ({
        profile: {
            ...state.profile,
            xp: state.profile.xp + amount
        }
    })),
    addCardCopy: (cardId, amount = 1) => set((state) => ({
        cards: state.cards.map(card =>
            card.id === cardId
                ? { ...card, cardsOwned: card.cardsOwned + amount }
                : card
        )
    })),
}));
