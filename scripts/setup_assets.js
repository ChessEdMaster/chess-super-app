const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'public', 'assets', 'kingdom');

const folders = [
    'terrain/grass',      // Skins de terra (gespa)
    'terrain/snow',       // Skins de terra (neu)
    'terrain/lava',       // Skins de terra (lava)
    'buildings/economy',  // Mina d'or, Nexes
    'buildings/defense',  // Torres, Murs
    'buildings/decorative', // Estàtues, Fonts
    'obstacles',          // Roques, Arbres (per eliminar)
    'npcs',               // Personatges animats
    'ui/icons',           // Icones de recursos (Or, Manà)
];

console.log("🏗️  Construint els fonaments del Chess Kingdom...");

folders.forEach(folder => {
    const dirPath = path.join(baseDir, folder);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        // Creem un fitxer .gitkeep perquè es pugi a git encara que estigui buit
        fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');
        console.log(`✅ Creat: ${folder}`);
    }
});

console.log("👑 Estructura preparada per a l'Art Director!");
