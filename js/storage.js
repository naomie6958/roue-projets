// Clé unique pour ce projet dans localStorage
const STORAGE_KEY = 'tntmom-roue';

const PROJECTS_KEY = 'tntmom-roue-projets';

const DEFAULT_PROJECTS = [
    { id: 'tntm-ca',        label: 'TNTM - Site Web',     couleur: '#FF0090', poids: 10 },
    { id: 'bill-nao',       label: 'Bill/Nao - Outils',   couleur: '#FF6B00', poids: 10 },
    { id: 'portail-client', label: 'Portail Client',      couleur: '#00CED1', poids: 20 },
    { id: 'fd',             label: 'FamilyDashboard',     couleur: '#00FF88', poids: 15 },
    { id: 'clients',        label: 'Clients',             couleur: '#FFE500', poids: 25 },
    { id: 'formation',      label: 'Formation',           couleur: '#9D00FF', poids: 15 },
    { id: 'reseaux',        label: 'Réseaux',             couleur: '#00B4FF', poids:  5 },
];

// Charge la liste des projets (ou la seed avec les valeurs par défaut au premier lancement)
function loadProjects() {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) {
        saveProjects(DEFAULT_PROJECTS);
        return DEFAULT_PROJECTS;
    }
    return JSON.parse(raw);
}

// Sauvegarde la liste des projets
function saveProjects(projects) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function addProject(project) {
    const projects = loadProjects();
    projects.push(project);
    saveProjects(projects);

    const data = loadData();
    data.sessions.push(0);
    data.completedSessions.push(0);
    data.weekSessions.push(0);
    data.weekCompletedSessions.push(0);
    data.minutes.push(0);
    data.weekMinutes.push(0);
    saveData(data);
}

function updateProject(id, changes) {
    const projects = loadProjects();
    const i = projects.findIndex(p => p.id === id);
    projects[i] = { ...projects[i], ...changes };
    saveProjects(projects);
}

function deleteProject(id) {
    const projects = loadProjects();
    const i = projects.findIndex(p => p.id === id);
    if (i === -1) return;
    
    projects.splice(i, 1);
    saveProjects(projects);

    const data = loadData();
    data.sessions.splice(i, 1);
    data.completedSessions.splice(i, 1);
    data.weekSessions.splice(i, 1);
    data.weekCompletedSessions.splice(i, 1);
    data.minutes.splice(i, 1);
    data.weekMinutes.splice(i, 1);
    saveData(data);
}

// Charge les données (ou initialise si première fois)
function loadData() {
    const defaults = {
        lastIndex:             -1,
        sessions:              [0, 0, 0, 0, 0, 0, 0],
        completedSessions:     [0, 0, 0, 0, 0, 0, 0],
        weekSessions:          [0, 0, 0, 0, 0, 0, 0],
        weekCompletedSessions: [0, 0, 0, 0, 0, 0, 0],
        minutes:               [0, 0, 0, 0, 0, 0, 0],
        weekMinutes:           [0, 0, 0, 0, 0, 0, 0],
        weekStart:             null
    };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return Object.assign({}, defaults, JSON.parse(raw));
}

// Sauvegarde les données
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Enregistre une session pour un projet
function recordSession(index) {
    const data = loadData();
    data.sessions[index]++;
    data.weekSessions[index]++;
    data.lastIndex = index;
    saveData(data);
}

function recordCompletedSession(index) {
    const data = loadData();
    data.completedSessions[index]++;
    data.weekCompletedSessions[index]++;
    saveData(data);
}

function recordTime(index, minutes) {
    const data = loadData();

    // Calculer le lundi de la semaine en cours
    const today = new Date();
    const lundi = new Date(today);
    lundi.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    lundi.setHours(0, 0, 0, 0);
    const lundiStr = lundi.toISOString();

    // Nouvelle semaine → reset
    if (data.weekStart !== lundiStr) {
        data.weekMinutes           = [0, 0, 0, 0, 0, 0, 0];
        data.weekSessions          = [0, 0, 0, 0, 0, 0, 0];
        data.weekCompletedSessions = [0, 0, 0, 0, 0, 0, 0];
        data.weekStart             = lundiStr;
    }

    data.minutes[index]     += minutes;
    data.weekMinutes[index] += minutes;
    saveData(data);
}

// Retourne l'index du dernier projet joué
function getLastIndex() {
    return loadData().lastIndex;
}

// Retourne le tableau des compteurs de sessions
function getSessions() {
    return loadData().sessions;
}

function saveTimerState(index, chosenMinutes, startTimestamp, totalSeconds, overtime = false) {
    localStorage.setItem('tntmom-timer', JSON.stringify({
        index, chosenMinutes, startTimestamp, totalSeconds, overtime
    }));
}

function clearTimerState() {
    localStorage.removeItem('tntmom-timer');
}

function loadTimerState() {
    const raw = localStorage.getItem('tntmom-timer');
    return raw ? JSON.parse(raw) : null;
}
