// ==========================================
// VOICE RECOGNITION & TEXT-TO-SPEECH
// ==========================================

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

let recognition = null;
let isListening = false;

// Store available voices by language for fallback
let availableVoices = {};
let allVoices = [];

// Initialize available voices when they load
if (SpeechSynthesis) {
    // Wait for voices to be loaded
    function loadVoices() {
        allVoices = speechSynthesis.getVoices();
        console.log(`[Voice System] Loaded ${allVoices.length} voices:`, 
            allVoices.map(v => `${v.lang} (${v.name})`).join(', '));
        
        // Organize voices by language
        availableVoices = {
            'en': findBestVoice(['en-US', 'en-GB', 'en-AU', 'en'], allVoices),
            'hi': findBestVoice(['hi-IN', 'hi', 'hi_IN'], allVoices),
            'te': findBestVoice(['te-IN', 'te', 'te_IN'], allVoices)
        };
        
        console.log('[Voice System] Language voice mapping:', {
            'English': availableVoices['en'] ? availableVoices['en'].name : 'Default',
            'Hindi': availableVoices['hi'] ? availableVoices['hi'].name : 'Default (will use English)',
            'Telugu': availableVoices['te'] ? availableVoices['te'].name : 'Default (will use English)'
        });
    }
    
    // Load voices on page load
    loadVoices();
    
    // Reload voices when they change (some browsers do this after a delay)
    speechSynthesis.onvoiceschanged = loadVoices;
}

// Find the best voice for a language
function findBestVoice(langCodes, voices) {
    if (!voices || voices.length === 0) return null;
    
    // Try exact matches first (case-insensitive)
    for (let langCode of langCodes) {
        const match = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
        if (match) {
            console.log(`[Voice] Found exact match for ${langCode}: ${match.name}`);
            return match;
        }
    }
    
    // Try prefix matches
    for (let langCode of langCodes) {
        const prefix = langCode.split('-')[0].toLowerCase();
        const match = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
        if (match) {
            console.log(`[Voice] Found prefix match for ${langCode}: ${match.name}`);
            return match;
        }
    }
    
    return null;
}

// Initialize Speech Recognition
function initializeSpeechRecognition() {
    if (!SpeechRecognition) {
        console.warn('[Voice System] Speech Recognition not supported in this browser');
        return false;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getLanguageCode(currentLanguage);
    
    recognition.onstart = function() {
        isListening = true;
        updateVoiceButton('listening');
    };
    
    recognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        handleVoiceCommand(transcript.toLowerCase().trim());
    };
    
    recognition.onerror = function(event) {
        console.error('[Voice System] Speech recognition error:', event.error);
        updateVoiceButton('error');
        setTimeout(() => updateVoiceButton('idle'), 2000);
    };
    
    recognition.onend = function() {
        isListening = false;
        updateVoiceButton('idle');
    };
    
    return true;
}

// Start listening
function startListening() {
    if (!recognition) {
        if (!initializeSpeechRecognition()) {
            showToast(t('microphoneNotSupported'));
            return;
        }
    }
    
    if (!isListening) {
        recognition.lang = getLanguageCode(currentLanguage);
        recognition.start();
    }
}

// Stop listening
function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

// Get language code for speech recognition and synthesis
function getLanguageCode(lang) {
    const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'te': 'te-IN'
    };
    return langMap[lang] || 'en-US';
}

// Get the best available voice for the current language
function getVoiceForCurrentLanguage() {
    // First try to use pre-loaded voice
    const voice = availableVoices[currentLanguage];
    if (voice) {
        console.log(`[Voice] Using voice for ${currentLanguage}: ${voice.name}`);
        return voice;
    }
    
    // If not available, try to find one
    const langCode = getLanguageCode(currentLanguage);
    const voices = speechSynthesis ? speechSynthesis.getVoices() : [];
    const found = findBestVoice([langCode], voices);
    
    if (found) {
        console.log(`[Voice] Found fallback voice: ${found.name}`);
        return found;
    }
    
    console.warn(`[Voice] No voice found for ${currentLanguage}, will use browser default`);
    return null;
}

// Handle voice commands
function handleVoiceCommand(transcript) {
    console.log('Voice command received:', transcript);
    
    // Check for navigation commands
    const commands = t('voiceCommand');
    
    for (const [feature, command] of Object.entries(commands)) {
        if (transcript.includes(command.toLowerCase())) {
            navigateByVoice(feature);
            return;
        }
    }
    
    // If no command recognized, speak feedback
    const msg = `I didn't understand that. You said: ${transcript}. Please try again.`;
    speakText(msg);
}

// Navigate using voice
function navigateByVoice(feature) {
    const sectionMap = {
        'diseaseDetection': 'disease',
        'yieldPrediction': 'yield',
        'marketPrices': 'market',
        'govSchemes': 'schemes',
        'history': 'history',
        'home': 'home'
    };
    
    const section = sectionMap[feature];
    if (section) {
        const navLink = document.querySelector(`a[onclick="navigateTo('${section}')"]`);
        if (navLink) {
            navigateTo(section);
            // Speak the explanation
            const explanation = t(`voiceExplanation.${feature}`);
            speakText(explanation);
        }
    }
}

// Update voice button state
function updateVoiceButton(state) {
    const btn = document.getElementById('voiceButton');
    if (!btn) return;
    
    switch(state) {
        case 'listening':
            btn.classList.add('listening');
            btn.title = t('listening');
            btn.innerHTML = '🎤';
            break;
        case 'speaking':
            btn.classList.add('speaking');
            btn.title = t('speaking');
            btn.innerHTML = '🔊';
            break;
        case 'error':
            btn.classList.add('error');
            btn.innerHTML = '❌';
            break;
        case 'idle':
        default:
            btn.classList.remove('listening', 'speaking', 'error');
            btn.title = t('voiceInput');
            btn.innerHTML = '🎤';
    }
}

// TEXT-TO-SPEECH with proper language and voice selection
function speakText(text) {
    if (!SpeechSynthesis) {
        console.warn('[Voice System] Speech Synthesis not supported in this browser');
        showToast(t('speakerNotSupported'));
        return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(currentLanguage);
    
    // Get language-specific voice if available
    const voice = getVoiceForCurrentLanguage();
    if (voice) {
        utterance.voice = voice;
    }
    
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = function() {
        updateVoiceButton('speaking');
    };
    
    utterance.onend = function() {
        updateVoiceButton('idle');
    };
    
    utterance.onerror = function(event) {
        console.error('[Voice System] Speech synthesis error:', event.error);
        updateVoiceButton('idle');
    };
    
    speechSynthesis.speak(utterance);
}

// Get preferred voice for language (kept for backward compatibility)
function getVoiceForLanguage(lang) {
    const voiceMap = {
        'en': 'Google UK English Female',
        'hi': 'Google हिन्दी',
        'te': 'Google తెలుగు'
    };
    return voiceMap[lang] || '';
}

// ==========================================
// DISEASE EXPLANATION TEXT-TO-SPEECH
// ==========================================

// Speak disease explanation with farmer-friendly language
function speakDiseaseExplanation(diseaseData) {
    if (!SpeechSynthesis) {
        console.warn('Speech Synthesis not supported in this browser');
        showToast(t('speakerNotSupported'));
        return;
    }
    
    // Build farmer-friendly explanation
    let explanation = buildFarmerFriendlyExplanation(diseaseData);
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(explanation);
    
    // CRITICAL: Set language to match user's selected language
    utterance.lang = getLanguageCode(currentLanguage);
    console.log(`[Voice] Set utterance language to: ${utterance.lang}`);
    
    // Get language-specific voice if available
    const voice = getVoiceForCurrentLanguage();
    if (voice) {
        utterance.voice = voice;
        console.log(`[Voice] Using voice: ${voice.name} (lang: ${voice.lang})`);
    } else {
        console.warn(`[Voice] No specific voice found for ${currentLanguage}, using browser default`);
    }
    
    // Slower speed for farmers to understand better
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = function() {
        // Update button state if exists
        const btn = document.querySelector('.listen-explanation-btn');
        if (btn) {
            btn.classList.add('speaking');
            btn.disabled = true;
        }
        const stopBtn = document.querySelector('.stop-explanation-btn');
        if (stopBtn) {
            stopBtn.style.display = 'inline-block';
        }
        console.log('[Voice] Speech synthesis started');
    };
    
    utterance.onend = function() {
        const btn = document.querySelector('.listen-explanation-btn');
        if (btn) {
            btn.classList.remove('speaking');
            btn.disabled = false;
        }
        const stopBtn = document.querySelector('.stop-explanation-btn');
        if (stopBtn) {
            stopBtn.style.display = 'none';
        }
        console.log('[Voice] Speech synthesis ended');
    };
    
    utterance.onerror = function(event) {
        console.error('[Voice System] Speech synthesis error:', event.error);
        showToast(t('voiceExplanationError'));
        const btn = document.querySelector('.listen-explanation-btn');
        if (btn) {
            btn.classList.remove('speaking');
            btn.disabled = false;
        }
        const stopBtn = document.querySelector('.stop-explanation-btn');
        if (stopBtn) {
            stopBtn.style.display = 'none';
        }
    };
    
    speechSynthesis.speak(utterance);
}

// Build farmer-friendly explanation text
function buildFarmerFriendlyExplanation(diseaseData) {
    let explanation = '';
    
    if (currentLanguage === 'hi') {
        // Hindi explanation
        explanation = `आपके पौधे को ${diseaseData.name} की बीमारी लगी है। `;
        
        switch(diseaseData.severity) {
            case 'High':
                explanation += 'यह बहुत गंभीर है। तुरंत इलाज शुरू करें। ';
                break;
            case 'Medium':
                explanation += 'यह मध्यम गंभीरता की बीमारी है। जल्द ही इलाज करें। ';
                break;
            case 'Low':
                explanation += 'यह हल्की बीमारी है। ध्यान से निगरानी करें। ';
                break;
            default:
                explanation += 'आपके पौधे स्वस्थ हैं। ';
        }
        
        if (diseaseData.pesticide && diseaseData.pesticide !== 'No treatment needed') {
            explanation += `सिफारिश की गई दवा है: ${diseaseData.pesticide}। `;
            explanation += `${diseaseData.safety} `;
        }
    } else if (currentLanguage === 'te') {
        // Telugu explanation
        explanation = `మీ పంటలకు ${diseaseData.name} వచ్చింది. `;
        
        switch(diseaseData.severity) {
            case 'High':
                explanation += 'ఇది చాలా తీవ్రమైనది. వెంటనే చికిత్స చేయండి. ';
                break;
            case 'Medium':
                explanation += 'ఇది మధ్యస్థ స్థాయి రోగం. త్వరలో చికిత్స చేయండి. ';
                break;
            case 'Low':
                explanation += 'ఇది తేలికైన రోగం. జాగ్రత్తగా చూసుకోండి. ';
                break;
            default:
                explanation += 'మీ పంటలు ఆరోగ్యకరమైనవి. ';
        }
        
        if (diseaseData.pesticide && diseaseData.pesticide !== 'No treatment needed') {
            explanation += `సిఫార్సు చేసిన కీటకനాశకం: ${diseaseData.pesticide}. `;
            explanation += `${diseaseData.safety} `;
        }
    } else {
        // English explanation (default)
        explanation = `Your crop has detected ${diseaseData.name}. `;
        
        switch(diseaseData.severity) {
            case 'High':
                explanation += 'This is very serious. Start treatment immediately. ';
                break;
            case 'Medium':
                explanation += 'This is medium level disease. Treat it soon. ';
                break;
            case 'Low':
                explanation += 'This is mild disease. Watch it carefully. ';
                break;
            default:
                explanation += 'Your crops are healthy. ';
        }
        
        if (diseaseData.pesticide && diseaseData.pesticide !== 'No treatment needed') {
            explanation += `Recommended pesticide is: ${diseaseData.pesticide}. `;
            explanation += `${diseaseData.safety}`;
        }
    }
    
    return explanation;
}

// Stop disease explanation audio
function stopDiseaseExplanation() {
    if (SpeechSynthesis) {
        speechSynthesis.cancel();
        const btn = document.querySelector('.listen-explanation-btn');
        if (btn) {
            btn.classList.remove('speaking');
            btn.disabled = false;
        }
        const stopBtn = document.querySelector('.stop-explanation-btn');
        if (stopBtn) {
            stopBtn.style.display = 'none';
        }
        console.log('[Voice] Speech synthesis stopped');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    initializeSpeechRecognition();
    console.log('[Voice System] Initialization complete');
});
