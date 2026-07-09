const statsGrid = document.getElementById('statsGrid');
const sessionEndPanel = document.getElementById('sessionEndPanel');
const btnContinue = document.getElementById('btnContinue');
const btnSwitch   = document.getElementById('btnSwitch');

let currentIndex = -1;
let statsMode    = 'week';

// Génère les boutons de sélection de projet
function renderProjectBtns() {
    const container = document.getElementById('projectBtns');
    container.innerHTML = '';

    SEGMENTS.forEach(function(seg, i) {
        const btn = document.createElement('button');
        btn.className   = 'btn-project';
        btn.textContent = seg.label;
        btn.style.borderColor = seg.couleur;
        btn.style.color       = seg.couleur;

        btn.addEventListener('click', function() {
            startSession(i);
        });

        container.appendChild(btn);
    });
}

function renderProjectsList() {
    const container = document.getElementById('projectsList');
    container.innerHTML = '';

    SEGMENTS.forEach(function(seg, i) {
        const div = document.createElement('div');
        div.textContent = seg.label;
        container.appendChild(div);
    });
}

function pickWeightedRandom() {
    const data = loadData();

    // Projets pas encore travaillés cette semaine
    const candidats = SEGMENTS.map((s, i) => i).filter(i => data.weekMinutes[i] === 0);

    // Si tous ont été travaillés → fallback logique pondérée
    if (candidats.length === 0) {
        const lastIndex  = data.lastIndex;
        const totalPoids = SEGMENTS.reduce((sum, s) => sum + s.poids, 0);
        const totalMins  = data.weekMinutes.reduce((a, b) => a + b, 0);
        const poids = SEGMENTS.map(function(seg, i) {
            const cible  = seg.poids / totalPoids;
            const reel   = totalMins > 0 ? data.weekMinutes[i] / totalMins : cible;
            let w = seg.poids + (cible - reel) * 100;
            w = Math.max(1, w);
            if (i === lastIndex) w *= 0.4;
            return w;
        });
        const total = poids.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < poids.length; i++) {
            r -= poids[i];
            if (r <= 0) return { index: i, candidats: null };
        }
        return { index: SEGMENTS.length - 1, candidats: null };
    }

    // Pick aléatoire parmi les non-travaillés
    const index = candidats[Math.floor(Math.random() * candidats.length)];
    return { index, candidats };
}


document.getElementById('btnSpin').addEventListener('click', function() {
    const { index, candidats } = pickWeightedRandom();
    startSession(index, candidats);
});


// Démarre une session pour un projet
function startSession(index, candidats = null) {
    currentIndex = index;
    activeIndex  = index;

    document.querySelector('.selector-section').style.display = 'none';
    sessionEndPanel.style.display = 'none';

    spinToSegment(index, candidats, function() {
        startTimer(index);
    });
    renderStats();
}


// Affiche les stats
function renderStats() {
    const data = loadData();
    statsGrid.innerHTML = '';

    SEGMENTS.forEach(function(seg, i) {
        const mins   = statsMode === 'alltime' ? data.minutes[i] : data.weekMinutes[i];
        const label  = statsMode === 'alltime' ? 'total' : 'cette semaine';

        const heures = Math.floor(mins / 60);
        const reste  = mins % 60;
        const temps  = heures > 0
            ? heures + 'h' + String(reste).padStart(2, '0')
            : mins + 'min';
        const total     = statsMode === 'alltime' ? data.sessions[i]          : data.weekSessions[i];
        const completes = statsMode === 'alltime' ? data.completedSessions[i] : data.weekCompletedSessions[i];
        const ratio     = total > 0 ? completes + '/' + total + ' complète' + (total !== 1 ? 's' : '') : '—';

        const div = document.createElement('div');
        div.className = 'stat-card';
        div.innerHTML =
            '<span class="stat-label" style="color:' + seg.couleur + '">' + seg.label + '</span>' +
            '<span class="stat-count">' + total + ' session' + (total !== 1 ? 's' : '') + '</span>' +
            '<span class="stat-ratio">' + ratio + '</span>' +
            '<span class="stat-time">' + temps + ' ' + label + '</span>';
        statsGrid.appendChild(div);
    });
}

document.getElementById('btnStatsToggle').addEventListener('click', function() {
    statsMode = statsMode === 'week' ? 'alltime' : 'week';
    this.textContent = statsMode === 'week' ? '📊 All time' : '📅 Cette semaine';
    renderStats();
});

// Bouton Continuer — démarre le compteur overtime sur le même projet
btnContinue.addEventListener('click', function() {
    startOvertime(currentIndex);
});

// Bouton Switcher — retourne au sélecteur
btnSwitch.addEventListener('click', function() {
    activeIndex = -1;
    currentIndex = -1;
    sessionEndPanel.style.display = 'none';
    document.querySelector('.selector-section').style.display = 'block';
    drawWheel(null, null);
    renderStats();
});

// Bouton copier note de fin → clipboard SUIVI-PROJETS
document.getElementById('btnCopyNote').addEventListener('click', function() {
    const note  = document.getElementById('sessionNote').value.trim();
    if (!note) return;
    const today = new Date().toISOString().slice(0, 10);
    const seg   = currentIndex >= 0 ? SEGMENTS[currentIndex].label : 'Projet';
    const texte = '**Session ' + today + ' — ' + seg + ' :** ' + note;
    navigator.clipboard.writeText(texte).then(function() {
        const btn = document.getElementById('btnCopyNote');
        btn.textContent = '✅ Copié !';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = '📋 Copier pour SUIVI-PROJETS';
            btn.classList.remove('copied');
        }, 2000);
    });
});

// Gestionnaire de projets
document.getElementById('btnManageProjects').addEventListener('click', function() {
    const panel = document.getElementById('managePanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

// Init
renderProjectBtns();
drawWheel(null, null);
renderStats();
restoreTimer();
renderProjectsList();
