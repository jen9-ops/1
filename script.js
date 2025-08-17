// Змінні та константи
const chesterShiftBtn = document.getElementById('chesterShiftBtn');
const kozakShiftBtn = document.getElementById('kozakShiftBtn');
const settingsBtn = document.getElementById('settingsBtn');
const calculatorBtn = document.getElementById('calculatorBtn');
const settingsModal = document.getElementById('settingsModal');
const calculatorModal = document.getElementById('calculatorModal');
const closeSettingsBtn = settingsModal.querySelector('.close-btn');
const closeCalcBtn = document.getElementById('closeCalcBtn');
const searchInput = document.getElementById('searchInput');
const dataForm = document.getElementById('dataForm');
const rivenInput = document.getElementById('riven');
const dalnistInput = document.getElementById('dalnist');
const kutInput = document.getElementById('kut');
const newTargetBtn = document.getElementById('newTargetBtn');
const newTargetInput = document.getElementById('newTargetInput');
const coordsInput = document.getElementById('coordsInput');
const shotBtn = document.getElementById('shotBtn');
const undoShotBtn = document.getElementById('undoShotBtn');
const tableContainer = document.getElementById('table-container');
const ammoInput = document.getElementById('ammoInput');
const setAmmoBtn = document.getElementById('setAmmoBtn');
const totalShotsDisplay = document.getElementById('totalShotsDisplay');
const remainingAmmoDisplay = document.getElementById('remainingAmmoDisplay');
const downloadBtn = document.getElementById('downloadBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const uploadInput = document.getElementById('uploadInput');
const clearAllDataBtn = document.getElementById('clearAllDataBtn');
const calcInput1 = document.getElementById('calcInput1');
const calcInput2 = document.getElementById('calcInput2');
const calcAddBtn = document.getElementById('calcAddBtn');
const calcSubtractBtn = document.getElementById('calcSubtractBtn');
const calcResult = document.getElementById('calcResult');
const takeValueMenu = document.getElementById('takeValueMenu');
const takeRivenBtn = document.getElementById('takeRivenBtn');
const takeDalnistBtn = document.getElementById('takeDalnistBtn');
const takeKutBtn = document.getElementById('takeKutBtn');
const writeBackButtons = document.getElementById('writeBackButtons');
const writeToRivenBtn = document.getElementById('writeToRivenBtn');
const writeToDalnistBtn = document.getElementById('writeToDalnistBtn');
const writeToKutBtn = document.getElementById('writeToKutBtn');

// Змінні для даних
let currentShift = localStorage.getItem('currentShift') || 'Козак';
const shiftsData = JSON.parse(localStorage.getItem('shiftsData')) || {};
let currentAmmo = parseInt(localStorage.getItem(`${currentShift}-ammo`)) || 0;
let lastShotTime = null;

// Експорт функцій для voice.js
window.warn = (msg, isOk = false) => {
    const warnElement = document.getElementById('warn');
    warnElement.textContent = msg;
    warnElement.className = isOk ? 'ok' : 'warn';
};

window.setUI = (isListening) => {
    const startBtn = document.getElementById('start');
    const dot = document.getElementById('dot');
    const status = document.getElementById('status');
    if (isListening) {
        startBtn.classList.add('listening');
        dot.classList.add('live');
        status.textContent = 'Слухаю...';
    } else {
        startBtn.classList.remove('listening');
        dot.classList.remove('live');
        status.textContent = 'Не слухаю';
    }
};

// Функції
const updateShiftButtons = () => {
    chesterShiftBtn.classList.remove('active');
    kozakShiftBtn.classList.remove('active');
    if (currentShift === 'Честер') {
        chesterShiftBtn.classList.add('active');
    } else {
        kozakShiftBtn.classList.add('active');
    }
};

const updateTotalStats = () => {
    let totalShots = 0;
    if (shiftsData[currentShift]) {
        shiftsData[currentShift].forEach(target => {
            totalShots += target.shots.length;
        });
    }
    totalShotsDisplay.textContent = totalShots;
    remainingAmmoDisplay.textContent = currentAmmo;
};

const saveShiftsData = () => {
    localStorage.setItem('shiftsData', JSON.stringify(shiftsData));
    localStorage.setItem(`${currentShift}-ammo`, currentAmmo);
};

const renderTable = (data) => {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';
    if (data) {
        data.forEach((target, index) => {
            if (target.isDivider) {
                const dividerRow = document.createElement('tr');
                dividerRow.innerHTML = `
                <td colspan="8" class="section-divider">
                    <div class="divider-content">
                        <span class="shift-header">Ціль №${target.targetNumber}</span>
                        <div class="divider-coords">${target.coords}</div>
                    </div>
                </td>
                `;
                tableBody.appendChild(dividerRow);
            } else {
                const row = document.createElement('tr');
                if (target.highlight === 'yellow') {
                    row.classList.add('highlight-yellow');
                } else if (target.highlight === 'orange') {
                    row.classList.add('highlight-orange');
                }
                
                row.innerHTML = `
                    <td data-label="Рівень">${target.riven}</td>
                    <td data-label="Дальність">${target.dalnist}</td>
                    <td data-label="Кут">${target.kut}</td>
                    <td data-label="Кількість пострілів">${target.shots.length}</td>
                    <td data-label="Залишок б/к">${target.ammo || 0}</td>
                    <td data-label="Час пострілу">${target.lastShotTime || '—'}</td>
                    <td data-label="Час між пострілами">${target.timeBetweenShots || '—'}</td>
                    <td data-label="Дії" class="actions-cell">
                        <button class="shot-row-btn warning" data-index="${index}"><i class="fa-solid fa-forward"></i></button>
                        <button class="delete-row-btn danger" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    }
};

const searchData = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const currentShiftData = shiftsData[currentShift] || [];
    const filteredData = currentShiftData.filter(target => {
        const targetId = target.targetNumber;
        return (targetId && targetId.toString().toLowerCase().includes(searchTerm)) || (target.riven && target.riven.toString().includes(searchTerm)) || (target.dalnist && target.dalnist.toString().includes(searchTerm)) || (target.kut && target.kut.toString().includes(searchTerm));
    });
    renderTable(filteredData);
};


const handleAddShot = (index) => {
    if (currentAmmo <= 0) {
        warn('Недостатньо боєкомплекту.');
        return;
    }
    const now = new Date();
    const currentShiftData = shiftsData[currentShift];
    const target = currentShiftData[index];

    let timeBetweenShots = '—';
    if (target.lastShotTime) {
        const lastTime = new Date(target.lastShotTime);
        const diffInSeconds = Math.floor((now - lastTime) / 1000);
        timeBetweenShots = `${diffInSeconds} сек.`;
    }

    target.shots.push(now.toISOString());
    target.lastShotTime = now.toLocaleTimeString('uk-UA');
    target.timeBetweenShots = timeBetweenShots;
    currentAmmo--;
    target.ammo = currentAmmo;

    saveShiftsData();
    updateTotalStats();
    renderTable(currentShiftData);
    warn('Постріл зафіксовано.', true);
};

const handleDeleteRow = (index) => {
    const currentShiftData = shiftsData[currentShift];
    currentShiftData.splice(index, 1);
    saveShiftsData();
    renderTable(currentShiftData);
};

const openModal = (modal) => {
    modal.style.display = 'block';
};

const closeModal = (modal) => {
    modal.style.display = 'none';
};

// Обробники подій
document.addEventListener('DOMContentLoaded', () => {
    updateShiftButtons();
    updateTotalStats();
    renderTable(shiftsData[currentShift] || []);

    const COORDS_PREFIX = "37U DQ ";
    coordsInput.addEventListener('input', (event) => {
        const input = event.target;
        const value = input.value;
        const cursorPosition = input.selectionStart;
        if (!value.startsWith(COORDS_PREFIX)) {
            input.value = COORDS_PREFIX;
            return;
        }
        const rawCoords = value.substring(COORDS_PREFIX.length).replace(/[^0-9]/g, '');
        const formattedCoords = rawCoords.slice(0, 5) + (rawCoords.length > 5 ? ' ' + rawCoords.slice(5, 10) : '');
        input.value = COORDS_PREFIX + formattedCoords;
        const newCursorPosition = COORDS_PREFIX.length + formattedCoords.length;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    });

    coordsInput.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && coordsInput.value === COORDS_PREFIX) {
            event.preventDefault();
        }
    });
});


chesterShiftBtn.addEventListener('click', () => {
    currentShift = 'Честер';
    localStorage.setItem('currentShift', currentShift);
    updateShiftButtons();
    updateTotalStats();
    renderTable(shiftsData[currentShift] || []);
});

kozakShiftBtn.addEventListener('click', () => {
    currentShift = 'Козак';
    localStorage.setItem('currentShift', currentShift);
    updateShiftButtons();
    updateTotalStats();
    renderTable(shiftsData[currentShift] || []);
});

settingsBtn.addEventListener('click', () => {
    openModal(settingsModal);
});

closeSettingsBtn.addEventListener('click', () => {
    closeModal(settingsModal);
});

calculatorBtn.addEventListener('click', () => {
    openModal(calculatorModal);
});

closeCalcBtn.addEventListener('click', () => {
    closeModal(calculatorModal);
});

window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        closeModal(settingsModal);
    }
    if (event.target === calculatorModal) {
        closeModal(calculatorModal);
    }
});

searchInput.addEventListener('input', searchData);

dataForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const riven = rivenInput.value;
    const dalnist = dalnistInput.value;
    const kut = kutInput.value;

    if (!shiftsData[currentShift]) {
        shiftsData[currentShift] = [];
    }

    const newEntry = {
        riven: riven,
        dalnist: dalnist,
        kut: kut,
        shots: [],
        ammo: currentAmmo
    };
    shiftsData[currentShift].push(newEntry);
    saveShiftsData();
    renderTable(shiftsData[currentShift]);
    warn('Дані додано.', true);
    dataForm.reset();
});

newTargetBtn.addEventListener('click', () => {
    const targetNumber = newTargetInput.value.trim();
    const coords = coordsInput.value.trim();

    if (!targetNumber) {
        warn('Будь ласка, введіть номер цілі.');
        return;
    }

    if (!shiftsData[currentShift]) {
        shiftsData[currentShift] = [];
    }

    const newEntry = {
        targetNumber: targetNumber,
        coords: coords,
        riven: '0',
        dalnist: '0',
        kut: '0',
        shots: [],
        ammo: currentAmmo
    };

    const sectionExists = shiftsData[currentShift].some(item => item.targetNumber === targetNumber && item.isDivider);
    if (!sectionExists) {
        const divider = {
            targetNumber: targetNumber,
            coords: coords,
            isDivider: true
        };
        shiftsData[currentShift].push(divider);
    }

    shiftsData[currentShift].push(newEntry);
    saveShiftsData();
    renderTable(shiftsData[currentShift]);
    warn('Нову ціль додано.', true);
    newTargetInput.value = '';
    coordsInput.value = '37U DQ ';
});

shotBtn.addEventListener('click', () => {
    const currentShiftData = shiftsData[currentShift];
    if (currentShiftData && currentShiftData.length > 0) {
        const lastEntry = currentShiftData[currentShiftData.length - 1];
        if (!lastEntry.isDivider) {
            handleAddShot(currentShiftData.length - 1);
        } else {
            warn('Не можна стріляти, остання позиція - роздільник.');
        }
    } else {
        warn('Таблиця порожня. Додайте ціль.');
    }
});

undoShotBtn.addEventListener('click', () => {
    const currentShiftData = shiftsData[currentShift];
    if (currentShiftData && currentShiftData.length > 0) {
        const lastEntry = currentShiftData[currentShiftData.length - 1];
        if (lastEntry.shots.length > 0) {
            lastEntry.shots.pop();
            currentAmmo++;
            lastEntry.ammo = currentAmmo;
            lastEntry.lastShotTime = lastEntry.shots.length > 0 ? new Date(lastEntry.shots[lastEntry.shots.length - 1]).toLocaleTimeString('uk-UA') : '—';
            lastEntry.timeBetweenShots = '—';
            saveShiftsData();
            updateTotalStats();
            renderTable(currentShiftData);
            warn('Останній постріл відмінено.', true);
        } else {
            warn('Немає пострілів для відміни.');
        }
    } else {
        warn('Таблиця порожня.');
    }
});

tableContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('shot-row-btn') || event.target.closest('.shot-row-btn')) {
        const button = event.target.classList.contains('shot-row-btn') ? event.target : event.target.closest('.shot-row-btn');
        const index = button.dataset.index;
        handleAddShot(index);
    }
    if (event.target.classList.contains('delete-row-btn') || event.target.closest('.delete-row-btn')) {
        const button = event.target.classList.contains('delete-row-btn') ? event.target : event.target.closest('.delete-row-btn');
        const index = button.dataset.index;
        handleDeleteRow(index);
    }
});

setAmmoBtn.addEventListener('click', () => {
    const newAmmo = parseInt(ammoInput.value);
    if (!isNaN(newAmmo) && newAmmo >= 0) {
        currentAmmo = newAmmo;
        localStorage.setItem(`${currentShift}-ammo`, currentAmmo);
        updateTotalStats();
        warn('Боєкомплект встановлено.', true);
    } else {
        warn('Будь ласка, введіть дійсне число.');
    }
});

downloadBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(shiftsData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_${currentShift}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    warn('Дані збережено.', true);
});

downloadZipBtn.addEventListener('click', () => {
    const zip = new JSZip();
    zip.file(`data_${currentShift}.json`, JSON.stringify(shiftsData, null, 2));
    zip.generateAsync({ type: "blob" }).then(function(content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data_${currentShift}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        warn('Дані збережено в ZIP.', true);
    });
});

downloadPdfBtn.addEventListener('click', () => {
    const element = document.getElementById('table-container');
    const opt = {
        margin: 1,
        filename: `table_${currentShift}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
    warn('Дані збережено в PDF.', true);
});

uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            if (file.name.endsWith('.json')) {
                const loadedData = JSON.parse(content);
                Object.assign(shiftsData, loadedData);
                saveShiftsData();
                updateTotalStats();
                renderTable(shiftsData[currentShift] || []);
                warn('Дані завантажено.', true);
            } else if (file.name.endsWith('.zip')) {
                JSZip.loadAsync(content).then(zip => {
                    const jsonFile = Object.keys(zip.files).find(name => name.endsWith('.json'));
                    if (jsonFile) {
                        zip.files[jsonFile].async('string').then(jsonString => {
                            const loadedData = JSON.parse(jsonString);
                            Object.assign(shiftsData, loadedData);
                            saveShiftsData();
                            updateTotalStats();
                            renderTable(shiftsData[currentShift] || []);
                            warn('Дані з ZIP-файлу завантажено.', true);
                        });
                    } else {
                        warn('ZIP-файл не містить JSON-файлу.');
                    }
                });
            } else {
                warn('Непідтримуваний формат файлу.');
            }
        } catch (error) {
            warn('Помилка при завантаженні файлу: ' + error.message);
        }
    };
    if (file.name.endsWith('.zip')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
});

clearAllDataBtn.addEventListener('click', () => {
    const confirmation = prompt('Ви впевнені, що хочете видалити всі дані? Введіть "ТАК" для підтвердження.');
    if (confirmation === 'ТАК') {
        localStorage.clear();
        shiftsData = {};
        currentAmmo = 0;
        updateTotalStats();
        renderTable([]);
        warn('Усі дані видалено.', true);
        location.reload();
    } else {
        warn('Видалення скасовано.');
    }
});

// Калькулятор
let activeInput = null;

calcInput1.addEventListener('focus', () => { activeInput = calcInput1; takeValueMenu.style.display = 'flex'; });
calcInput1.addEventListener('blur', () => { setTimeout(() => { takeValueMenu.style.display = 'none'; }, 100); });
calcInput2.addEventListener('focus', () => { activeInput = calcInput2; takeValueMenu.style.display = 'flex'; });
calcInput2.addEventListener('blur', () => { setTimeout(() => { takeValueMenu.style.display = 'none'; }, 100); });

takeRivenBtn.addEventListener('click', () => {
    if (activeInput) {
        activeInput.value = rivenInput.value;
    }
});
takeDalnistBtn.addEventListener('click', () => {
    if (activeInput) {
        activeInput.value = dalnistInput.value;
    }
});
takeKutBtn.addEventListener('click', () => {
    if (activeInput) {
        activeInput.value = kutInput.value;
    }
});

const calculateResult = (operator) => {
    const val1 = parseFloat(calcInput1.value) || 0;
    const val2 = parseFloat(calcInput2.value) || 0;
    let result;
    if (operator === '+') {
        result = val1 + val2;
    } else if (operator === '-') {
        result = val1 - val2;
    }
    calcResult.textContent = result;
    writeBackButtons.style.display = 'flex';
};

calcAddBtn.addEventListener('click', () => calculateResult('+'));
calcSubtractBtn.addEventListener('click', () => calculateResult('-'));

writeToRivenBtn.addEventListener('click', () => { rivenInput.value = calcResult.textContent; closeModal(calculatorModal); });
writeToDalnistBtn.addEventListener('click', () => { dalnistInput.value = calcResult.textContent; closeModal(calculatorModal); });
writeToKutBtn.addEventListener('click', () => { kutInput.value = calcResult.textContent; closeModal(calculatorModal); });