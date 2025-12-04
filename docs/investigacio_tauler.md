# Informe Tècnic: Investigació del Tauler d'Escacs

## 1. Estat Actual i Diagnòstic

Després d'analitzar el codi font de `app/play/page.tsx`, `app/analysis/page.tsx` i `components/puzzle-solver.tsx`, hem identificat les causes arrel dels problemes reportats.

### A. Problema: "Tauler Bloquejat" (No es poden fer jugades)
**Símptoma:** L'usuari pot agafar peces però tornen a la seva posició original en deixar-les anar.
**Causa Tècnica:**
1. **Gestió d'Errors de `chess.js` v1.x:** La versió actual de `chess.js` (1.4.0) llança excepcions (`throw Error`) quan un moviment és invàlid, en lloc de retornar `null` com feien versions anteriors.
2. **Validació Estricta de Torn:** El mètode `game.move()` falla si s'intenta moure una peça que no correspon al torn actual (ex: moure blanques quan és torn de negres).
3. **Mutació d'Estat Incorrecta:** En `app/play/page.tsx`, la funció `attemptMove` intenta fer el moviment directament sobre la instància de l'estat `game` (`game.move(...)`) abans de crear-ne una còpia. Això pot causar desincronització entre l'estat intern de React i l'estat de l'objecte `Chess`.
4. **Retorn `false` en `onDrop`:** Quan `game.move()` falla (per excepció), el bloc `catch` retorna `false`. Això indica a `react-chessboard` que el moviment ha estat invàlid, provocant l'efecte de "snapback" (la peça torna al lloc).

### B. Problema: "No carreguen les posicions FEN als exercicis"
**Símptoma:** El tauler mostra la posició inicial en lloc del puzzle.
**Causa Tècnica:**
1. **Inicialització Única:** L'estat `game` s'inicialitza només una vegada al muntar el component (`useState`). Si la prop `exercise` arriba més tard (asíncronament), l'estat inicial ja s'ha establert com a tauler buit/inicial.
2. **Dependència de `useEffect`:** Tot i que hi ha un `useEffect` per actualitzar el joc quan canvia l'exercici, si la prop `exercise.fen` no està disponible immediatament o si hi ha problemes de renderitzat, el tauler pot quedar-se en l'estat per defecte.

### C. Problema: "No s'actualitza el tauler d'anàlisi des de la Base de Dades"
**Símptoma:** La notació canvia però les peces no es mouen.
**Causa Tècnica:**
1. **Desincronització de Props:** El component `Chessboard` rep la prop `position={fen}`. Si la funció `handleExplorerMove` actualitza l'estat `fen` però `react-chessboard` no detecta el canvi com a suficient per re-renderitzar (o si hi ha un conflicte amb l'animació interna), les peces no es mouen.
2. **Gestió de la Instància:** Similar al problema A, es crea una nova instància de `Chess` per validar el moviment, però la manera com es propaga aquest canvi a l'estat visual pot ser defectuosa si no es garanteix la immutabilitat completa.

---

## 2. Solució Proposada: Arquitectura Robusta

Per solucionar aquests problemes definitivament, cal refactoritzar la gestió de l'estat del tauler seguint aquests principis:

### 1. Hook Personalitzat `useChessGame`
Centralitzar la lògica de `chess.js` en un hook que garanteixi la immutabilitat i la gestió d'errors.

```typescript
// Exemple conceptual
function useChessGame(initialFen: string) {
  const [game, setGame] = useState(new Chess(initialFen));
  const [fen, setFen] = useState(initialFen);

  const makeMove = (moveData) => {
    const gameCopy = new Chess(game.fen()); // SEMPRE treballar sobre una còpia
    try {
      const result = gameCopy.move(moveData); // Intentar moviment
      if (result) {
        setGame(gameCopy); // Actualitzar estat amb la nova instància
        setFen(gameCopy.fen());
        return true;
      }
    } catch (e) {
      return false; // Moviment invàlid
    }
    return false;
  };

  return { game, fen, makeMove, setPosition };
}
```

### 2. Correcció de `onPieceDrop`
El manejador ha de ser pur i gestionar les excepcions de `chess.js` correctament.

```typescript
function onDrop(source, target) {
  // 1. Verificar torn (opcional, per UX)
  if (game.turn() !== playerColor) return false;

  // 2. Intentar moviment de forma segura
  const success = makeMove({ from: source, to: target, promotion: 'q' });
  
  // 3. Retornar resultat per a l'animació
  return success;
}
```

### 3. Sincronització Forçada (Key Prop)
Per als exercicis i canvis dràstics de posició, utilitzar la prop `key` per forçar el remuntatge del component `Chessboard` quan canvia l'exercici o la posició base.

```typescript
<Chessboard 
  key={exercise.id} // Força re-render complet quan canvia l'exercici
  position={fen} 
  // ... 
/>
```

### 4. Integració Base de Dades
Assegurar que `handleExplorerMove` actualitza tant l'estat `game` com `fen` utilitzant el mateix mecanisme segur que `onDrop`.

---

## 3. Pla d'Acció Immediat

1. **Refactoritzar `app/play/page.tsx`:** Implementar la lògica de "Còpia abans de Moure" per evitar mutacions d'estat i bloquejos.
2. **Arreglar `PuzzleSolver`:** Assegurar que el `useEffect` reinicialitza correctament el joc i utilitzar `key` per garantir el refresc visual.
3. **Revisar `AnalysisPage`:** Unificar la lògica de moviment (`onDrop` i `handleExplorerMove`) per utilitzar una funció comuna robusta que actualitzi l'estat de forma fiable.
