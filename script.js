// Inisialisasi variabel global
let currentQueueNumber = 1;
let callHistory = [];
let audioEnabled = true;
let volumeLevel = 0.8;
let speechVoices = [];
let femaleIndonesianVoice = null;

const operators = [
    { id: 1, name: "Operator 1", type: "Pendaftaran", status: "available", calls: 0 },
    { id: 2, name: "Operator 2", type: "Verifikasi Dokumen", status: "available", calls: 0 },
    { id: 3, name: "Operator 3", type: "Wawancara", status: "available", calls: 0 },
    { id: 4, name: "Operator 4", type: "Tes Akademik", status: "available", calls: 0 },
    { id: 5, name: "Operator 5", type: "Tes Psikologi", status: "available", calls: 0 },
    { id: 6, name: "Operator 6", type: "Pengumuman Hasil", status: "available", calls: 0 },
    { id: 7, name: "Operator 7", type: "Konsultasi", status: "available", calls: 0 },
    { id: 8, name: "Operator 8", type: "Administrasi", status: "available", calls: 0 }
];

// Elemen DOM
const queueNumberInput = document.getElementById('queue-number');
const operatorSelect = document.getElementById('operator-select');
const callBtn = document.getElementById('call-btn');
const resetBtn = document.getElementById('reset-btn');
const increaseBtn = document.getElementById('increase-btn');
const decreaseBtn = document.getElementById('decrease-btn');
const currentNumberDisplay = document.getElementById('current-number');
const currentOperatorDisplay = document.getElementById('current-operator');
const lastCallTimeDisplay = document.getElementById('last-call-time');
const operatorsContainer = document.getElementById('operators-container');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const audioToggle = document.getElementById('audio-toggle');
const testAudioBtn = document.getElementById('test-audio-btn');
const bellTestBtn = document.getElementById('bell-test-btn');
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const closeNotification = document.getElementById('close-notification');

// Audio elements
const bellAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3');
bellAudio.preload = 'auto';

// Inisialisasi aplikasi
function initApp() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Set nilai awal
    queueNumberInput.value = currentQueueNumber;
    currentNumberDisplay.textContent = currentQueueNumber;
    
    initializeOperators();
    updateHistoryDisplay();
    updateVolumeDisplay();
    
    // Inisialisasi speech synthesis
    initSpeechSynthesis();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load saved data
    loadSavedData();
    
    // Coba aktifkan audio context
    activateAudioContext();
}

// Fungsi untuk mengaktifkan audio context
function activateAudioContext() {
    // Membuat dan memainkan audio diam untuk mengaktifkan audio context
    const silentAudio = new Audio();
    silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
    silentAudio.volume = 0;
    
    silentAudio.play().then(() => {
        console.log('Audio context berhasil diaktifkan');
    }).catch(error => {
        console.log('Gagal mengaktifkan audio context:', error);
    });
}

// Inisialisasi speech synthesis dengan voice Indonesia
function initSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        console.warn('Browser tidak mendukung Text-to-Speech');
        showNotification('Browser tidak mendukung fitur suara. Gunakan Chrome atau Edge.');
        return;
    }
    
    // Load voices
    speechVoices = speechSynthesis.getVoices();
    
    // Cari voice perempuan Indonesia
    findIndonesianFemaleVoice();
    
    // Jika voices belum dimuat, tunggu event voiceschanged
    if (speechVoices.length === 0) {
        speechSynthesis.onvoiceschanged = () => {
            speechVoices = speechSynthesis.getVoices();
            findIndonesianFemaleVoice();
            console.log('Voices loaded:', speechVoices.length);
            
            if (femaleIndonesianVoice) {
                console.log('Voice perempuan Indonesia ditemukan:', femaleIndonesianVoice.name);
            } else {
                console.log('Voice perempuan Indonesia tidak ditemukan, menggunakan voice default');
            }
        };
    }
}

// Mencari voice perempuan Indonesia
function findIndonesianFemaleVoice() {
    // Prioritas: voice dengan bahasa Indonesia dan gender perempuan
    femaleIndonesianVoice = speechVoices.find(voice => 
        (voice.lang === 'id-ID' || voice.lang.startsWith('id-')) &&
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('perempuan') ||
         voice.name.toLowerCase().includes('wanita') ||
         voice.name.toLowerCase().includes('zira') || // Voice perempuan di Windows
         voice.name.toLowerCase().includes('google indonesian female'))
    );
    
    // Jika tidak ditemukan, cari voice Indonesia apapun
    if (!femaleIndonesianVoice) {
        femaleIndonesianVoice = speechVoices.find(voice => 
            voice.lang === 'id-ID' || voice.lang.startsWith('id-')
        );
    }
    
    // Jika masih tidak ditemukan, cari voice perempuan apapun
    if (!femaleIndonesianVoice) {
        femaleIndonesianVoice = speechVoices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('zira')
        );
    }
    
    // Jika masih tidak ditemukan, gunakan voice default
    if (!femaleIndonesianVoice && speechVoices.length > 0) {
        femaleIndonesianVoice = speechVoices[0];
    }
    
    return femaleIndonesianVoice;
}

// Update waktu dan tanggal
function updateDateTime() {
    const now = new Date();
    
    const optionsDate = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    const dateString = now.toLocaleDateString('id-ID', optionsDate);
    document.getElementById('current-date').textContent = dateString;
    
    const timeString = now.toLocaleTimeString('id-ID');
    document.getElementById('current-time').textContent = timeString;
}

// Inisialisasi tampilan operator
function initializeOperators() {
    operatorsContainer.innerHTML = '';
    
    operators.forEach(operator => {
        const operatorItem = document.createElement('div');
        operatorItem.className = `operator-item ${operator.status}`;
        operatorItem.id = `operator-${operator.id}`;
        
        operatorItem.innerHTML = `
            <div class="operator-icon">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="operator-info">
                <div class="operator-name">${operator.name}</div>
                <div class="operator-type">${operator.type}</div>
                <div class="operator-status ${operator.status}">
                    ${operator.status === 'available' ? 'Tersedia' : 'Sedang Melayani'}
                </div>
            </div>
        `;
        
        operatorsContainer.appendChild(operatorItem);
    });
}

// Update status operator
function updateOperatorStatus(operatorId, status) {
    const operator = operators.find(op => op.id === operatorId);
    if (operator) {
        operator.status = status;
        
        if (status === 'busy') {
            operator.calls++;
        }
        
        const operatorElement = document.getElementById(`operator-${operatorId}`);
        if (operatorElement) {
            operatorElement.className = `operator-item ${status}`;
            const statusElement = operatorElement.querySelector('.operator-status');
            if (statusElement) {
                statusElement.textContent = status === 'available' ? 'Tersedia' : 'Sedang Melayani';
                statusElement.className = `operator-status ${status}`;
            }
        }
    }
}

// Memanggil antrian
function callQueue() {
    const selectedOperatorId = parseInt(operatorSelect.value);
    const selectedOperator = operators.find(op => op.id === selectedOperatorId);
    
    if (!selectedOperator) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Tambahkan ke riwayat
    const callRecord = {
        number: currentQueueNumber,
        operator: selectedOperator.name,
        operatorType: selectedOperator.type,
        time: timeString,
        timestamp: now.getTime()
    };
    
    callHistory.unshift(callRecord);
    if (callHistory.length > 20) {
        callHistory.pop();
    }
    
    // Update tampilan
    updateDisplay(callRecord);
    
    // Update status operator
    updateOperatorStatus(selectedOperatorId, 'busy');
    
    // Set timer untuk mengembalikan status operator setelah 3 menit
    setTimeout(() => {
        updateOperatorStatus(selectedOperatorId, 'available');
    }, 180000);
    
    // Mainkan suara panggilan
    if (audioEnabled) {
        playIndonesianCallSound(currentQueueNumber, selectedOperator.name, selectedOperator.type);
    }
    
    // Tampilkan notifikasi
    showNotification(`Nomor ${currentQueueNumber} dipanggil ke ${selectedOperator.name}`);
    
    // Increment nomor antrian
    currentQueueNumber++;
    queueNumberInput.value = currentQueueNumber;
    
    // Simpan ke localStorage
    saveData();
}

// Update tampilan monitor
function updateDisplay(callRecord) {
    currentNumberDisplay.textContent = callRecord.number;
    currentOperatorDisplay.textContent = callRecord.operator;
    lastCallTimeDisplay.textContent = callRecord.time;
    
    updateHistoryDisplay();
}

// Update tampilan riwayat
function updateHistoryDisplay() {
    if (callHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-clock"></i>
                <p>Belum ada riwayat pemanggilan</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = '';
    
    callHistory.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        historyItem.innerHTML = `
            <div class="history-time">${record.time}</div>
            <div class="history-number">${record.number}</div>
            <div class="history-operator">${record.operator} - ${record.operatorType}</div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Fungsi untuk berbicara dalam Bahasa Indonesia
function speakIndonesian(text, delay = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (!('speechSynthesis' in window)) {
                console.log('Speech synthesis tidak tersedia');
                resolve();
                return;
            }
            
            if (!audioEnabled) {
                console.log('Audio dinonaktifkan');
                resolve();
                return;
            }
            
            // Pastikan ada voice yang tersedia
            if (!femaleIndonesianVoice && speechVoices.length === 0) {
                console.log('Tidak ada voice tersedia');
                resolve();
                return;
            }
            
            // Hentikan semua ucapan yang sedang berlangsung
            speechSynthesis.cancel();
            
            // Buat utterance
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = text;
            utterance.lang = 'id-ID';
            utterance.rate = 0.85; // Sedikit lebih lambat untuk kejelasan
            utterance.pitch = 1.1; // Sedikit lebih tinggi untuk suara perempuan
            utterance.volume = volumeLevel;
            
            // Gunakan voice perempuan Indonesia jika tersedia
            if (femaleIndonesianVoice) {
                utterance.voice = femaleIndonesianVoice;
                console.log('Menggunakan voice:', femaleIndonesianVoice.name);
            } else if (speechVoices.length > 0) {
                utterance.voice = speechVoices[0];
                console.log('Menggunakan voice default:', speechVoices[0].name);
            }
            
            utterance.onend = () => {
                console.log('Selesai berbicara:', text);
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.log('Error dalam speech synthesis:', event.error);
                resolve();
            };
            
            console.log('Memulai speech:', text);
            speechSynthesis.speak(utterance);
            
        }, delay);
    });
}

// Mainkan suara panggilan Bahasa Indonesia - VERSI DIPERBAIKI
async function playIndonesianCallSound(queueNumber, operatorName, operatorType) {
    console.log('Memulai panggilan suara untuk nomor:', queueNumber);
    
    if (!audioEnabled) {
        console.log('Audio dinonaktifkan');
        return;
    }
    
    try {
        // 1. Mainkan suara bel (panggilan bandara)
        await playBellSound();
        
        // 2. Tunggu sebentar
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 3. Panggilan pertama dengan format seperti bandara
        await speakIndonesian(`Perhatian. Panggilan untuk nomor antrian ${queueNumber}.`);
        
        // 4. Tunggu sebentar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 5. Informasi loket
        await speakIndonesian(`Silakan menuju ${operatorName}.`);
        
        // 6. Tunggu sebentar
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 7. Pengulangan panggilan
        await speakIndonesian(`Diulang. Nomor antrian ${queueNumber}. Silakan menuju ${operatorName}, untuk ${operatorType}.`);
        
        // 8. Penutup
        await new Promise(resolve => setTimeout(resolve, 1000));
        await speakIndonesian(`Terima kasih.`);
        
        console.log('Panggilan suara selesai');
        
    } catch (error) {
        console.log('Error dalam panggilan suara:', error);
        showNotification('Terjadi kesalahan pada sistem suara');
    }
}

// Mainkan suara bel
function playBellSound() {
    return new Promise((resolve) => {
        bellAudio.volume = volumeLevel;
        bellAudio.currentTime = 0;
        
        bellAudio.play().then(() => {
            console.log('Suara bel dimainkan');
            bellAudio.onended = resolve;
        }).catch(error => {
            console.log('Gagal memainkan suara bel:', error);
            // Lanjutkan meskipun bel gagal
            setTimeout(resolve, 1000);
        });
    });
}

// Tes suara lengkap
function testAudio() {
    if (!audioEnabled) {
        showNotification('Aktifkan suara terlebih dahulu');
        return;
    }
    
    console.log('Memulai tes audio lengkap');
    
    // Panggilan tes dengan nomor khusus
    playIndonesianCallSound(999, "Operator Percobaan", "Tes Suara");
    showNotification('Tes suara sedang berjalan...');
}

// Tes suara bel saja
function testBell() {
    bellAudio.volume = volumeLevel;
    bellAudio.currentTime = 0;
    bellAudio.play().then(() => {
        console.log('Suara bel tes dimainkan');
        showNotification('Suara bel diuji');
    }).catch(error => {
        console.log('Gagal memainkan suara bel:', error);
        showNotification('Gagal memainkan suara bel');
    });
}

// Tampilkan notifikasi
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Reset antrian
function resetQueue() {
    if (confirm('Apakah Anda yakin ingin mereset nomor antrian ke 1?')) {
        currentQueueNumber = 1;
        queueNumberInput.value = currentQueueNumber;
        currentNumberDisplay.textContent = currentQueueNumber;
        currentOperatorDisplay.textContent = 'OPERATOR 1';
        lastCallTimeDisplay.textContent = '-';
        
        operators.forEach(operator => {
            updateOperatorStatus(operator.id, 'available');
        });
        
        showNotification('Antrian telah direset ke nomor 1');
        saveData();
    }
}

// Hapus riwayat
function clearHistory() {
    if (callHistory.length === 0) return;
    
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat pemanggilan?')) {
        callHistory = [];
        updateHistoryDisplay();
        showNotification('Riwayat pemanggilan telah dihapus');
        saveData();
    }
}

// Update volume
function updateVolume() {
    volumeLevel = volumeSlider.value / 100;
    volumeValue.textContent = `${volumeSlider.value}%`;
    bellAudio.volume = volumeLevel;
}

// Update tampilan volume
function updateVolumeDisplay() {
    volumeSlider.value = volumeLevel * 100;
    volumeValue.textContent = `${volumeSlider.value}%`;
}

// Toggle audio
function toggleAudio() {
    audioEnabled = !audioEnabled;
    
    if (audioEnabled) {
        audioToggle.classList.add('active');
        audioToggle.innerHTML = '<i class="fas fa-volume-up"></i> SUARA ON';
        showNotification('Suara panggilan diaktifkan');
        
        // Coba aktifkan audio context saat audio diaktifkan
        activateAudioContext();
    } else {
        audioToggle.classList.remove('active');
        audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i> SUARA OFF';
        showNotification('Suara panggilan dimatikan');
    }
    
    saveData();
}

// Setup event listeners
function setupEventListeners() {
    callBtn.addEventListener('click', callQueue);
    resetBtn.addEventListener('click', resetQueue);
    
    increaseBtn.addEventListener('click', () => {
        currentQueueNumber++;
        queueNumberInput.value = currentQueueNumber;
        saveData();
    });
    
    decreaseBtn.addEventListener('click', () => {
        if (currentQueueNumber > 1) {
            currentQueueNumber--;
            queueNumberInput.value = currentQueueNumber;
            saveData();
        }
    });
    
    queueNumberInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
            value = 1;
        }
        currentQueueNumber = value;
        this.value = value;
        saveData();
    });
    
    queueNumberInput.addEventListener('input', function() {
        let value = parseInt(this.value);
        if (!isNaN(value) && value >= 1) {
            currentQueueNumber = value;
        }
    });
    
    audioToggle.addEventListener('click', toggleAudio);
    testAudioBtn.addEventListener('click', testAudio);
    bellTestBtn.addEventListener('click', testBell);
    
    volumeSlider.addEventListener('input', updateVolume);
    clearHistoryBtn.addEventListener('click', clearHistory);
    closeNotification.addEventListener('click', () => {
        notification.classList.remove('show');
    });
    
    // Shortcut keyboard
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, select, textarea')) {
            e.preventDefault();
            callQueue();
        }
        
        if ((e.code === 'Equal' || e.code === 'NumpadAdd') && !e.ctrlKey) {
            e.preventDefault();
            currentQueueNumber++;
            queueNumberInput.value = currentQueueNumber;
        }
        
        if ((e.code === 'Minus' || e.code === 'NumpadSubtract') && !e.ctrlKey) {
            e.preventDefault();
            if (currentQueueNumber > 1) {
                currentQueueNumber--;
                queueNumberInput.value = currentQueueNumber;
            }
        }
        
        if (e.code === 'KeyR' && e.ctrlKey) {
            e.preventDefault();
            resetQueue();
        }
        
        if (e.code === 'KeyH' && e.ctrlKey) {
            e.preventDefault();
            clearHistory();
        }
        
        if (e.code === 'KeyT' && e.ctrlKey) {
            e.preventDefault();
            testAudio();
        }
    });
    
    // Aktifkan audio pada interaksi pertama
    document.addEventListener('click', function initAudioOnFirstClick() {
        if (audioEnabled) {
            activateAudioContext();
        }
        document.removeEventListener('click', initAudioOnFirstClick);
    });
    
    // Juga aktifkan pada event pertama apa saja
    document.addEventListener('keydown', function initAudioOnFirstKey() {
        if (audioEnabled) {
            activateAudioContext();
        }
        document.removeEventListener('keydown', initAudioOnFirstKey);
    });
}

// Simpan data ke localStorage
function saveData() {
    const data = {
        currentQueueNumber,
        callHistory,
        audioEnabled,
        volumeLevel,
        operators
    };
    
    try {
        localStorage.setItem('spmbQueueData', JSON.stringify(data));
    } catch (error) {
        console.log('Gagal menyimpan data:', error);
    }
}

// Muat data dari localStorage
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('spmbQueueData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            currentQueueNumber = data.currentQueueNumber || 1;
            callHistory = data.callHistory || [];
            audioEnabled = data.audioEnabled !== undefined ? data.audioEnabled : true;
            volumeLevel = data.volumeLevel || 0.8;
            
            // Update UI
            queueNumberInput.value = currentQueueNumber;
            currentNumberDisplay.textContent = currentQueueNumber;
            
            if (!audioEnabled) {
                audioToggle.classList.remove('active');
                audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i> SUARA OFF';
            }
            
            updateVolumeDisplay();
            updateHistoryDisplay();
            initializeOperators();
        }
    } catch (error) {
        console.log('Gagal memuat data:', error);
    }
}

// Fungsi untuk mengatur voice manual (jika perlu)
window.setCustomVoice = function(voiceName) {
    if (!('speechSynthesis' in window)) return;
    
    const voices = speechSynthesis.getVoices();
    const customVoice = voices.find(voice => 
        voice.name.toLowerCase().includes(voiceName.toLowerCase())
    );
    
    if (customVoice) {
        femaleIndonesianVoice = customVoice;
        console.log('Voice diatur ke:', customVoice.name);
        showNotification(`Voice diatur ke: ${customVoice.name}`);
    } else {
        console.log('Voice tidak ditemukan:', voiceName);
        showNotification(`Voice "${voiceName}" tidak ditemukan`);
    }
};

// Tampilkan daftar voice yang tersedia
window.showAvailableVoices = function() {
    if (!('speechSynthesis' in window)) {
        console.log('Speech synthesis tidak tersedia');
        return;
    }
    
    const voices = speechSynthesis.getVoices();
    console.log('=== DAFTAR VOICE TERSEDIA ===');
    voices.forEach((voice, index) => {
        console.log(`${index}: ${voice.name} - ${voice.lang} ${voice.default ? '(default)' : ''}`);
    });
    
    // Tampilkan dalam notifikasi juga
    const voiceList = voices.map(v => v.name).join(', ');
    showNotification(`Terdapat ${voices.length} voice tersedia`);
};

// Inisialisasi
document.addEventListener('DOMContentLoaded', initApp);

// Pastikan speech synthesis direset saat halaman ditutup
window.addEventListener('beforeunload', () => {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
});