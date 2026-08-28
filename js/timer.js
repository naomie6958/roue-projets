let timerInterval    = null;
let timerSeconds     = 0;
let chosenMinutes    = 90;
let isPaused         = false;
let isOvertime       = false;
let overtimeSeconds  = 0;
let overtimeInterval = null;

const timerSection  = document.getElementById('timerSection');
const btnStopTimer  = document.getElementById('btnStopTimer');
const btnPause      = document.getElementById('btnPause');

function formatTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function tick(index, totalSecs) {
    timerSeconds--;
    const elapsedMins = (totalSecs - timerSeconds) / 60;
    drawWheel(1 - (timerSeconds / totalSecs), SEGMENTS[index].couleur, formatTime(timerSeconds), index, elapsedMins);
    document.title = '⏱ ' + formatTime(timerSeconds) + ' · Roue de Projets';

    if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        onSessionEnd(index);
    }
}

function startTimer(index) {
    const totalSecs      = chosenMinutes * 60;
    const startTimestamp = Date.now();
    timerSeconds         = totalSecs;
    saveTimerState(index, chosenMinutes, startTimestamp, totalSecs);
    timerSection.style.display = 'block';
    drawWheel(0, SEGMENTS[index].couleur, formatTime(totalSecs));

    timerInterval = setInterval(function() {
        tick(index, totalSecs);
    }, 1000);
}

function onSessionEnd(index) {
    document.title = '⏰ Session terminée ! · Roue de Projets';
    spinCandidates = null;
    clearTimerState();
    recordTime(index, chosenMinutes);
    recordSession(index);
    recordCompletedSession(index);
    celebrateSegment(index);
    feuArtifice(SEGMENTS[index].couleur);
    timerSection.style.display = 'none';

    const seg       = SEGMENTS[index];
    const data      = loadData();
    const totalMins = data.weekMinutes[index]
    const h         = Math.floor(totalMins / 60);
    const m         = totalMins % 60;
    const tempsStr  = h > 0 ? h + 'h' + String(m).padStart(2,'0') : totalMins + 'min';

    const panel = document.getElementById('sessionEndPanel');
    panel.querySelector('.session-end-msg').innerHTML =
        `⏰ Session terminée !<br>
        <span style="color:${seg.couleur}; font-size:1.1rem; font-weight:bold;">${seg.label}</span><br>
        <span style="font-size:0.85rem; color:#888;">+${chosenMinutes}min · ${tempsStr} cette semaine</span>`;
    panel.style.display = 'flex';
    document.getElementById('sessionNote').value = '';
    drawWheel(0, seg.couleur);
}

function renderOvertime(index) {
    const m = Math.floor(overtimeSeconds / 60);
    const s = overtimeSeconds % 60;
    const affichage = '+' + m + ':' + String(s).padStart(2, '0');
    drawWheel(0, SEGMENTS[index].couleur, affichage);
    document.title = '⏱ ' + affichage + ' · Roue de Projets';
}

function overtimeTick(index) {
    overtimeSeconds++;
    renderOvertime(index);
}

function startOvertime(index) {
    isOvertime      = true;
    overtimeSeconds = 0;
    document.getElementById('sessionEndPanel').style.display = 'none';
    timerSection.style.display = 'block';
    btnPause.style.display = 'none';
    saveTimerState(index, null, Date.now(), null, true);
    renderOvertime(index);

    overtimeInterval = setInterval(function() {
        overtimeTick(index);
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isPaused = true;
    btnPause.textContent = '▶ Reprendre';
    const state = loadTimerState();
    if (state) {
        localStorage.setItem('tntmom-timer', JSON.stringify({
            ...state, paused: true, remainingAtPause: timerSeconds
        }));
    }
}

function resumeTimer() {
    isPaused = false;
    btnPause.textContent = '⏸ Pause';
    const totalSecs = chosenMinutes * 60;
    saveTimerState(currentIndex, chosenMinutes, Date.now() - (totalSecs - timerSeconds) * 1000, totalSecs);

    timerInterval = setInterval(function() {
        tick(currentIndex, totalSecs);
    }, 1000);
}

// Sous ce seuil, on considère que c'est un test (démarré puis arrêté tout de suite) et non une vraie session
const DUREE_MIN_SESSION = 5;

function stopTimer() {
    document.title = 'Roue de Projets — TNTMom';
    if (isOvertime){
        clearTimerState();
        clearInterval(overtimeInterval);
        overtimeInterval = null;
        const overtimeMins = Math.round(overtimeSeconds / 60);
        if (overtimeMins >= DUREE_MIN_SESSION && currentIndex >= 0) {
            recordTime(currentIndex, overtimeMins);
        }
        isOvertime      = false;
        overtimeSeconds = 0;
    } else {
        clearTimerState();
        clearInterval(timerInterval);
        timerInterval   = null;
        const elapsedMins = Math.round((chosenMinutes * 60 - timerSeconds) / 60);
        if (elapsedMins >= DUREE_MIN_SESSION && currentIndex >= 0) {
            recordTime(currentIndex, elapsedMins);
            recordSession(currentIndex);
        }
    }

    timerSection.style.display = 'none';
    btnPause.style.display = '';
    btnPause.textContent = '⏸ Pause';
    isPaused    = false;
    activeIndex = -1;
    spinCandidates = null;
    document.querySelector('.selector-section').style.display = 'block';
    drawWheel(null, null);
    renderStats();
}

function restoreTimer() {
    const state = loadTimerState();
    if (!state) return;

    if (state.overtime) {
        currentIndex    = state.index;
        activeIndex     = state.index;
        isOvertime      = true;
        overtimeSeconds = Math.floor((Date.now() - state.startTimestamp) / 1000);

        document.querySelector('.selector-section').style.display = 'none';
        document.getElementById('sessionEndPanel').style.display = 'none';
        timerSection.style.display = 'block';
        btnPause.style.display = 'none';

        spinToSegment(state.index, null, function() {
            renderOvertime(state.index);
            overtimeInterval = setInterval(function() {
                overtimeTick(state.index);
            }, 1000);
        });
        return;
    }

    const elapsed   = Math.floor((Date.now() - state.startTimestamp) / 1000);
    const remaining = state.totalSeconds - elapsed;

    if (remaining <= 0) {
        chosenMinutes = state.chosenMinutes;
        currentIndex  = state.index;
        activeIndex   = state.index;
        document.querySelector('.selector-section').style.display = 'none';
        onSessionEnd(state.index);
        return;
    }

    chosenMinutes = state.chosenMinutes;
    currentIndex  = state.index;
    activeIndex   = state.index;
    timerSeconds  = remaining;

    document.querySelector('.selector-section').style.display = 'none';
    timerSection.style.display = 'block';

    spinToSegment(state.index, null, function() {
        drawWheel(1 - (timerSeconds / state.totalSeconds), SEGMENTS[state.index].couleur, formatTime(timerSeconds));

        if (state.paused) {
            isPaused = true;
            btnPause.textContent = '▶ Reprendre';
            return;
        }

        timerInterval = setInterval(function() {
            tick(state.index, state.totalSeconds);
        }, 1000);
    });
}

function formatDuree(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return m + 'min';
    if (m === 0) return h + 'h';
    return h + 'h' + String(m).padStart(2, '0');
}

const inputDuree = document.getElementById('inputDuree');
const dureeLabel = document.getElementById('dureeLabel');

inputDuree.addEventListener('input', function() {
    chosenMinutes = parseInt(inputDuree.value);
    dureeLabel.textContent = formatDuree(chosenMinutes);
    localStorage.setItem('tntmom-duree', chosenMinutes);
});

// Restaure la dernière durée choisie
const savedDuree = localStorage.getItem('tntmom-duree');
if (savedDuree) {
    chosenMinutes = parseInt(savedDuree);
}
inputDuree.value = chosenMinutes;
dureeLabel.textContent = formatDuree(chosenMinutes);

btnPause.addEventListener('click', function() {
    isPaused ? resumeTimer() : pauseTimer();
});

btnStopTimer.addEventListener('click', stopTimer);
