const particulesCanvas = document.getElementById('particules');
const pctx = particulesCanvas.getContext('2d');

function redimensionnerCanvas() {
    particulesCanvas.width = window.innerWidth;
    particulesCanvas.height = window.innerHeight;
}
redimensionnerCanvas();
window.addEventListener('resize', redimensionnerCanvas);

let particules = [];
let animationEnCours = false;

function varierCouleur(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const jitter = (v) => Math.min(255, Math.max(0, v + (Math.random() - 0.5) * 90));

    return `rgb(${jitter(r) | 0}, ${jitter(g) | 0}, ${jitter(b) | 0})`;
}

function feuArtifice(couleur) {
    const roueCanvas = document.getElementById('roue');
    const rect = roueCanvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 80; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vitesse = Math.random() * 6 + 2;
        particules.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * vitesse,
            vy: Math.sin(angle) * vitesse,
            vie: 1,
            couleur: varierCouleur(couleur),
        });
    }

    if (!animationEnCours) {
        animationEnCours = true;
        animerParticules();
    }
}

function animerParticules() {
    pctx.clearRect(0, 0, particulesCanvas.width, particulesCanvas.height);

    particules.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vie -= 0.015;

        pctx.shadowBlur = 12;
        pctx.shadowColor = p.couleur;

        pctx.beginPath();
        pctx.arc(p.x, p.y, 2 * Math.max(p.vie, 0), 0, Math.PI * 2);
        pctx.fillStyle = p.couleur;
        pctx.globalAlpha = Math.max(p.vie, 0);
        pctx.fill();
        pctx.globalAlpha = 1;
    });

    particules = particules.filter((p) => p.vie > 0);

    if (particules.length > 0) {
        requestAnimationFrame(animerParticules);
    } else {
        animationEnCours = false;
    }
}

function creerTrainee(x, y) {
    particules.push({
        x, y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vie: 1,
        couleur: varierCouleur('#FFD700'),
    });
    if (!animationEnCours) {
        animationEnCours = true;
        animerParticules();
    }
}

let dernierTrainee = 0;

window.addEventListener('mousemove', (e) => {
    const maintenant = Date.now();
    if (maintenant - dernierTrainee < 25) return; // ignore les mouvements trop rapprochés
    dernierTrainee = maintenant;
    creerTrainee(e.clientX, e.clientY);
});

window.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    for(let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vitesse = Math.random() * 5 + 1;
        particules.push({
            x, y,
            vx: Math.cos(angle) * vitesse,
            vy: Math.sin(angle) * vitesse,
            vie: 1,
            couleur: varierCouleur('#FFD700'),
        });
    }
    if (!animationEnCours) {
        animationEnCours = true;
        animerParticules();
    }
});