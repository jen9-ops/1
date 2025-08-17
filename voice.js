// Импорт глобальных функций, определенных в script.js
import { warn, setUI } from './script.js';

let SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
    warn('Розпізнавання голосу не підтримується цим браузером.');
    setUI(false);
}

const rivenInput = document.getElementById('riven');
const dalnistInput = document.getElementById('dalnist');
const kutInput = document.getElementById('kut');

let recognition = null;
let running = false;
let wantListen = false;
let armed = null; // Поточне поле для запису

// Слова для команд
const commands = {
    'рівень': 'riven',
    'дальність': 'dalnist',
    'кут': 'kut',
    'додати': 'add',
    'постріл': 'shot',
    'відмінити': 'undo',
    'очистити': 'clear',
    'нова ціль': 'new_target',
    'координати': 'coords',
    'пошук': 'search'
};

function processText(text) {
    text = text.trim().toLowerCase();
    
    // Перевірка на ключові слова
    function onlyKeywords(t) {
        const words = t.split(' ');
        if (words.length > 2) return false;
        return words.every(word => Object.keys(commands).includes(word));
    }
    
    // Виявлення ключа команди
    function detectKey(t) {
        const words = t.split(' ');
        for (const word of words) {
            if (commands[word]) {
                return commands[word];
            }
        }
        return null;
    }

    // Витягнення числа
    function extractNumber(t) {
        const match = t.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }
    
    // Запис у поле
    function writeToField(key, num) {
        if (key === 'riven') {
            rivenInput.value = num;
        } else if (key === 'dalnist') {
            dalnistInput.value = num;
        } else if (key === 'kut') {
            kutInput.value = num;
        } else if (key === 'coords') {
            document.getElementById('coordsInput').value += num;
        }
        warn(`Записано ${num} в ${key}`, true);
    }

    if (text === 'старт') {
        safeStart();
        return;
    }

    if (text === 'стоп') {
        stopListen();
        return;
    }

    if (onlyKeywords(text)){
        const k = detectKey(text);
        if (k) armed = k;
        return;
    }

    if (armed){
        const num = extractNumber(text);
        if (num){
            writeToField(armed, num);
            armed = null;
            return;
        }
        const k2 = detectKey(text);
        if (k2){ armed = k2; }
        return;
    }

    const k = detectKey(text);
    const num = extractNumber(text);
    if (k && num){
        writeToField(k, num);
        armed = null;
        return;
    }

    if (k && !num){
        armed = k;
        return;
    }
}

function setupRecognition() {
    if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
    }
    recognition = new SR();
    recognition.lang = 'uk-UA';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
        }
        console.log("Recognized:", text);
        processText(text);
    };

    recognition.onerror = (event) => {
        warn('Помилка розпізнавання: ' + event.error);
        running = false;
        setUI(false);
    };

    recognition.onend = () => {
        running = false;
        if (wantListen) {
            setTimeout(() => {
                if (wantListen) {
                    try {
                        recognition.start();
                        running = true;
                        setUI(true);
                    } catch (e) {
                        warn('Помилка перезапуску розпізнавання.');
                    }
                }
            }, 100);
        } else {
            setUI(false);
        }
    };
}

let secureOk = window.isSecureContext;

async function ensureMicPermission() {
    try {
        const st = await navigator.mediaDevices.getUserMedia({ audio: true });
        st.getTracks().forEach(t => t.stop());
        warn('Мікрофон дозволено.', true);
        return true;
    } catch (err) {
        warn('Немає доступу до мікрофона: ' + (err.name || err.message));
        return false;
    }
}

async function safeStart() {
    if (!SR) return;
    wantListen = true;
    setupRecognition();
    if (running) {
        setUI(true);
        return;
    }
    if (!secureOk) warn('Увага: сторінка не в захищеному контексті (HTTPS/localhost).');
    const ok = await ensureMicPermission();
    if (!ok) {
        wantListen = false;
        setUI(false);
        return;
    }
    recognition.start();
    running = true;
    setUI(true);
}

function stopListen() {
    wantListen = false;
    if (running && recognition) {
        recognition.stop();
    } else {
        setUI(false);
    }
}

document.getElementById('start').addEventListener('click', () => {
    if (running) {
        stopListen();
    } else {
        safeStart();
    }
});