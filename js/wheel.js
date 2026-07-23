let SEGMENTS = loadProjects();

function refreshSegments() {
    SEGMENTS = loadProjects();
    drawWheel(null, null);
    renderProjectBtns();
    renderStats();
}

const canvas = document.getElementById('roue');
const ctx    = canvas.getContext('2d');
const cx     = canvas.width  / 2;
const cy     = canvas.height / 2;
const RAYON  = 250;

let activeIndex   = -1;
let wheelRotation = 0;
let spinCandidates = null;

// === EASTER EGG — clique 5x rapidement sur le centre de la roue ===
let discoClickTimes  = [];
let discoActive      = false;
let discoFrame       = 0;
let confettiParticles = [];
const COULEURS_CONFETTI = ['#ff0090', '#00e5ff', '#ffd700', '#7fff00', '#ff4500', '#da70ff'];

function drawWheel(fillRatio, activeColor, timeText = null, liveIndex = -1, liveMinutes = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data      = loadData();
    const wm        = [...data.weekMinutes]; // copie pour ne pas modifier l'original
    
    if (spinCandidates !== null) {
        wm.fill(0);
        spinCandidates.forEach(i => wm[i] = 1);
    }
    
    if (liveIndex >= 0 && liveMinutes > 0) wm[liveIndex] += liveMinutes;
    const totalMins = wm.reduce(function(a, b) { return a + b; }, 0);

    // === ROUE (avec rotation) ===
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wheelRotation);

    let startAngle = -Math.PI / 2;

    SEGMENTS.forEach(function(seg, i) {
        const ratio      = totalMins > 0 ? wm[i] / totalMins : 1 / SEGMENTS.length;
        if (ratio === 0) return; // skip empty segments
        const sliceAngle = Math.PI * 2 * ratio;
        const endAngle   = startAngle + sliceAngle;

        // Fond segment
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, RAYON, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = '#0d0d0d';
        ctx.fill();

        // Arc coloré (arc-en-ciel si le mode disco est actif)
        const couleurArc = discoActive ? `hsl(${(discoFrame * 8 + i * 45) % 360}, 100%, 60%)` : seg.couleur;
        ctx.beginPath();
        ctx.arc(0, 0, RAYON, startAngle, endAngle);
        ctx.shadowColor = couleurArc;
        ctx.shadowBlur  = discoActive ? 30 : (i === activeIndex ? 25 : 10);
        ctx.strokeStyle = couleurArc;
        ctx.lineWidth   = discoActive ? 5 : (i === activeIndex ? 4 : 2);
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // Label (flip basé sur l'angle visuel réel)
        const midAngle  = startAngle + sliceAngle / 2;
        const actualMid = midAngle + wheelRotation;
        const angle360  = ((actualMid % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const flip      = angle360 > Math.PI / 2 && angle360 < Math.PI * 1.5;

        ctx.save();
        ctx.rotate(midAngle);
        ctx.font         = 'bold 14px Segoe UI, sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = seg.couleur;
        ctx.shadowBlur   = 12;
        ctx.fillStyle    = seg.couleur;
        if (flip) { ctx.rotate(Math.PI); ctx.fillText(seg.label, -RAYON * 0.62, 0); }
        else      { ctx.fillText(seg.label,  RAYON * 0.62, 0); }
        ctx.shadowBlur = 0;
        ctx.restore();

        startAngle = endAngle;
    });

    // Séparatrices neutres
    let divAngle = -Math.PI / 2;
    SEGMENTS.forEach(function(seg, i) {
        const ratio = totalMins > 0 ? wm[i] / totalMins : 1 / SEGMENTS.length;
        if (ratio === 0) return; // skip empty segments
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(divAngle) * RAYON, Math.sin(divAngle) * RAYON);
        ctx.strokeStyle = '#333';
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 0;
        ctx.stroke();
        divAngle += Math.PI * 2 * ratio;
    });

    ctx.restore(); // fin rotation roue

    // === CENTRE (fixe, coordonnées absolues) ===
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0d0d';
    ctx.fill();

    if (fillRatio !== null && fillRatio > 0 && activeColor) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 69, 0, Math.PI * 2);
        ctx.clip();
        const fillHeight = 140 * fillRatio;
        ctx.fillStyle   = activeColor + '55';
        ctx.shadowColor = activeColor;
        ctx.shadowBlur  = 15;
        ctx.fillRect(cx - 70, cy + 70 - fillHeight, 140, fillHeight);
        ctx.shadowBlur  = 0;
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.strokeStyle = activeColor || '#333';
    ctx.lineWidth   = 1.5;
    if (activeColor) { ctx.shadowColor = activeColor; ctx.shadowBlur = 10; }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === TEMPS RESTANT AU CENTRE ===
    if (timeText) {
        ctx.font         = 'bold 17px Segoe UI, sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'white';
        ctx.shadowColor  = activeColor;
        ctx.shadowBlur   = 10;
        ctx.fillText(timeText, cx, cy);
        ctx.shadowBlur   = 0;
    }

    // === POINTEUR GOLD (fixe en haut) ===
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx,      cy - RAYON - 6);
    ctx.lineTo(cx - 11, cy - RAYON - 26);
    ctx.lineTo(cx + 11, cy - RAYON - 26);
    ctx.closePath();
    ctx.fillStyle   = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur  = 25;
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.restore();
}

function snapToSegment(index) {
    const wm    = [...loadData().weekMinutes];
    const total = wm.reduce((a, b) => a + b, 0);
    if (total === 0) { wheelRotation = 0; return; }

    let angle      = -Math.PI / 2;
    let startAngle = 0;
    SEGMENTS.forEach(function(seg, i) {
        const ratio = wm[i] / total;
        const slice = Math.PI * 2 * ratio;
        if (i === index) startAngle = angle;
        angle += slice;
    });

    // Aligner le DÉBUT de l'arc (pas le centre) sur le pointeur
    const base = -Math.PI / 2 - startAngle;
    wheelRotation = ((base % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function spinToSegment(index, candidates, callback) {
    spinCandidates = candidates;

    let wm = [...loadData().weekMinutes];
    if (spinCandidates !== null) {
        wm.fill(0);
        spinCandidates.forEach(i => wm[i] = 1);
    }
    const total = wm.reduce(function(a, b) { return a + b; }, 0);

    let angle    = -Math.PI / 2;
    let midAngle = 0;
    SEGMENTS.forEach(function(seg, i) {
        const ratio = total > 0 ? wm[i] / total : 1 / SEGMENTS.length;
        const slice = Math.PI * 2 * ratio;
        if (i === index) midAngle = angle + slice / 2;
        angle += slice;
    });

    const base        = -Math.PI / 2 - midAngle;
    const diff        = ((base - wheelRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const finalTarget = wheelRotation + diff + Math.PI * 2 * 4;

    const duration  = 2500;
    const startTime = performance.now();
    const startRot  = wheelRotation;

    function frame(now) {
        const t    = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        wheelRotation = startRot + (finalTarget - startRot) * ease;
        drawWheel(null, null);
        if (t < 1) {
            requestAnimationFrame(frame);
        } else {
            wheelRotation = finalTarget;
            drawWheel(null, null);
            spinCandidates = null;
            snapToSegment(index);
            drawWheel(null, null);
            if (callback) callback();
        }
    }
    requestAnimationFrame(frame);
}


function celebrateSegment(index) {
    let frame = 0;

    const anim = setInterval(function() {
        const data  = loadData();
        const wm    = data.weekMinutes;
        const total = wm.reduce(function(a, b) { return a + b; }, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Roue avec rotation
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(wheelRotation);

        let startAngle = -Math.PI / 2;

        SEGMENTS.forEach(function(s, i) {
            const ratio      = total > 0 ? wm[i] / total : 1 / SEGMENTS.length;
            const sliceAngle = Math.PI * 2 * ratio;
            const endAngle   = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, RAYON, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = '#0d0d0d';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, RAYON, startAngle, endAngle);
            ctx.shadowColor = s.couleur;
            ctx.shadowBlur  = i === index ? 20 + Math.sin(frame * 0.3) * 15 : 10;
            ctx.strokeStyle = s.couleur;
            ctx.lineWidth   = i === index ? 4 : 2;
            ctx.stroke();
            ctx.shadowBlur  = 0;

            const midAngle  = startAngle + sliceAngle / 2;
            const actualMid = midAngle + wheelRotation;
            const angle360  = ((actualMid % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const flip      = angle360 > Math.PI / 2 && angle360 < Math.PI * 1.5;

            ctx.save();
            ctx.rotate(midAngle);
            ctx.font         = 'bold 12px Segoe UI, sans-serif';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor  = s.couleur;
            ctx.shadowBlur   = 12;
            ctx.fillStyle    = s.couleur;
            if (flip) { ctx.rotate(Math.PI); ctx.fillText(s.label, -RAYON * 0.62, 0); }
            else      { ctx.fillText(s.label,  RAYON * 0.62, 0); }
            ctx.shadowBlur = 0;
            ctx.restore();

            startAngle = endAngle;
        });

        let divAngle = -Math.PI / 2;
        SEGMENTS.forEach(function(s, i) {
            const ratio = total > 0 ? wm[i] / total : 1 / SEGMENTS.length;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(divAngle) * RAYON, Math.sin(divAngle) * RAYON);
            ctx.strokeStyle = '#333';
            ctx.lineWidth   = 1;
            ctx.shadowBlur  = 0;
            ctx.stroke();
            divAngle += Math.PI * 2 * ratio;
        });

        ctx.restore(); // fin rotation

        // Centre fixe
        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d0d';
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 69, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle   = SEGMENTS[index].couleur + '55';
        ctx.shadowColor = SEGMENTS[index].couleur;
        ctx.shadowBlur  = 10 + Math.sin(frame * 0.3) * 10;
        ctx.fillRect(cx - 70, cy - 70, 140, 140);
        ctx.shadowBlur  = 0;
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, 70, 0, Math.PI * 2);
        ctx.strokeStyle = SEGMENTS[index].couleur;
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = SEGMENTS[index].couleur;
        ctx.shadowBlur  = 10 + Math.sin(frame * 0.3) * 15;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // Pointeur gold
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx,      cy - RAYON - 6);
        ctx.lineTo(cx - 11, cy - RAYON - 26);
        ctx.lineTo(cx + 11, cy - RAYON - 26);
        ctx.closePath();
        ctx.fillStyle   = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur  = 25;
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.restore();

        frame++;
        if (frame > 40) clearInterval(anim);
    }, 50);
}

// === EASTER EGG — détection du clic secret ===
canvas.addEventListener('click', function(e) {
    if (activeIndex !== -1) return; // pas pendant une session active, pour ne rien déranger

    // Convertit la position du clic (pixels écran) en coordonnées du canvas
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top)  * scaleY;

    if (Math.hypot(clickX - cx, clickY - cy) > 70) return; // faut cliquer DANS le cercle central

    const now = Date.now();
    discoClickTimes.push(now);
    discoClickTimes = discoClickTimes.filter(t => now - t < 1200); // fenêtre de 1.2s

    if (discoClickTimes.length >= 5) {
        discoClickTimes = [];
        triggerDisco();
    }
});

function spawnConfetti() {
    confettiParticles = [];
    for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 6;
        confettiParticles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            couleur: COULEURS_CONFETTI[Math.floor(Math.random() * COULEURS_CONFETTI.length)],
            taille: 3 + Math.random() * 4,
            vie: 1
        });
    }
}

function triggerDisco() {
    discoActive = true;
    discoFrame  = 0;
    spawnConfetti();

    const anim = setInterval(function() {
        drawWheel(null, null); // redessine la roue — le contour sortira en arc-en-ciel (discoActive = true)

        // Physique des confettis : vitesse + gravité + décroissance de vie
        confettiParticles.forEach(function(p) {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += 0.15;
            p.vie -= 0.012;
        });
        confettiParticles = confettiParticles.filter(p => p.vie > 0);

        confettiParticles.forEach(function(p) {
            ctx.save();
            ctx.globalAlpha = Math.max(p.vie, 0);
            ctx.fillStyle   = p.couleur;
            ctx.shadowColor = p.couleur;
            ctx.shadowBlur  = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Message caché — apparaît en fondu, reste un moment, disparaît en fondu
        if (discoFrame > 5 && discoFrame < 90) {
            const apparition = Math.min(1, (discoFrame - 5) / 15, (90 - discoFrame) / 15);
            ctx.save();
            ctx.globalAlpha  = Math.max(0, apparition);
            ctx.font         = 'bold 22px Segoe UI, sans-serif';
            ctx.textAlign    = 'center';
            ctx.fillStyle    = '#fff';
            ctx.shadowColor  = '#ff0090';
            ctx.shadowBlur   = 20;
            ctx.fillText('✨ Easter egg trouvé ! ✨', cx, cy - RAYON - 45);
            ctx.restore();
        }

        discoFrame++;
        if (discoFrame > 100 && confettiParticles.length === 0) {
            discoActive = false;
            clearInterval(anim);
            drawWheel(null, null);
        }
    }, 30);
}
