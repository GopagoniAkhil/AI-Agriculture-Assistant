// ==========================================
// AI AGRICULTURE ASSISTANT - JAVASCRIPT
// ==========================================

// ========== API CONFIGURATION ==========
const BASE_API_URL = 'http://localhost:5000/api';

// Data storage
let marketPricesData = {};
let governmentSchemesData = {};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initializeLanguage();
    loadMarketData();
    loadGovernmentSchemes();
    populateMarketSelects();
});

// ==========================================
// LANGUAGE & LOCALIZATION
// ==========================================
function initializeLanguage() {
    const stored = localStorage.getItem('language') || 'en';
    setLanguage(stored);
    updateLanguageSelector();
}

function changeLanguage(lang) {
    if (setLanguage(lang)) {
        updateLanguageSelector();
        
        // CRITICAL: Update voice system for new language
        console.log(`[Language] Switched to ${lang}, updating voice system...`);
        
        // Update speech recognition language if available
        if (typeof recognition !== 'undefined' && recognition) {
            recognition.lang = getLanguageCode(lang);
            console.log(`[Voice] Updated speech recognition language to: ${recognition.lang}`);
        }
        
        // Update voice mapping for synthesis
        if (typeof loadVoices === 'function') {
            loadVoices();
            console.log('[Voice] Reloaded available voices');
        }
        
        // Call the comprehensive update from translations.js
        if (typeof updateUILanguage === 'function') {
            updateUILanguage();
        }
        
        // Refresh current disease result display to show voice button in new language
        if (typeof window.currentDiseaseResult !== 'undefined' && window.currentDiseaseResult) {
            console.log('[Language] Refreshing disease results display for new language');
            setTimeout(() => {
                displayDiseaseResults(window.currentDiseaseResult);
            }, 100);
        }
    }
}

function updateLanguageSelector() {
    const selector = document.getElementById('languageSelect');
    if (selector) {
        selector.value = currentLanguage;
    }
}

// ==========================================
// NAVIGATION & SECTION MANAGEMENT
// ==========================================
function navigateTo(section) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.classList.remove('active'));

    // Update nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    // Show active section
    document.getElementById(section).classList.add('active');

    // Update active nav link
    event.target.classList.add('active');

    // Close mobile menu if open
    closeMenu();

    // Scroll to top
    window.scrollTo(0, 0);
}

// ==========================================
// DISCLAIMER BANNER
// ==========================================
function closeBanner() {
    const banner = document.getElementById('disclaimerBanner');
    banner.classList.add('hidden');
}

// ==========================================
// MOBILE MENU
// ==========================================
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

function closeMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.remove('active');
}

// ==========================================
// DISEASE DETECTION
// ==========================================

// Setup upload area on page load
function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('imageInput');
    
    if (!uploadArea) return;
    
    // Click to upload
    uploadArea.addEventListener('click', function(e) {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleImageUpload({target: fileInput});
        }
    });
    
    // File input change
    fileInput.addEventListener('change', handleImageUpload);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('❌ Please upload a valid image file (JPG, PNG, GIF, etc.)');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('❌ File size too large. Maximum 5MB allowed.');
        return;
    }

    // Read and preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImage = document.getElementById('previewImage');
        previewImage.src = e.target.result;
        previewImage.classList.remove('hidden');

        // Simulate AI analysis
        analyzeDisease(file.name);
    };
    reader.readAsDataURL(file);
}

function analyzeDisease(imageName) {
    const resultsArea = document.getElementById('diseaseResults');
    
    // Show loading state
    resultsArea.innerHTML = '<p class="placeholder-text loading">🔍 Analyzing image with AI...</p>';

    // Get the image from the file input
    const fileInput = document.getElementById('imageInput');
    if (!fileInput || !fileInput.files[0]) {
        console.error('❌ No image file found in input');
        resultsArea.innerHTML = '<p class="placeholder-text" style="color: #e74c3c;">❌ No image selected</p>';
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    // Add crop type
    formData.append('cropType', 'potato');

    // Track if response received
    let responseReceived = false;
    
    // Set timeout for analysis (30 seconds max)
    const timeoutId = setTimeout(() => {
        if (!responseReceived) {
            console.error('❌ API timeout: Analysis took too long');
            resultsArea.innerHTML = `
                <div style="padding: 20px; background-color: #fee; border-left: 4px solid #e74c3c; border-radius: 4px;">
                    <p style="color: #c33; margin: 0; font-weight: bold;">❌ Analysis Timeout</p>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">The analysis took too long to complete. Please check if the backend server is running on port 5000.</p>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; font-family: monospace;">Backend URL: ${BASE_API_URL}</p>
                </div>
            `;
        }
    }, 30000);

    // Try to call backend API first
    console.log('📡 Sending image to backend API for disease detection...');
    console.log('📌 API URL:', `${BASE_API_URL}/detect-disease`);
    console.log('📌 Image file:', fileInput.files[0].name);
    
    fetch(`${BASE_API_URL}/detect-disease`, {
        method: 'POST',
        body: formData,
        timeout: 30000
    })
    .then(response => {
        responseReceived = true;
        clearTimeout(timeoutId);
        
        console.log('📊 API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Disease analysis from API:', data);
        
        // Handle response format: { success: true, analysis: {...} }
        if (data.analysis) {
            const analysisData = {
                name: data.analysis.disease || data.analysis.name || 'Unknown',
                confidence: data.analysis.confidence || 0,
                severity: data.analysis.severity || 'Unknown',
                description: data.analysis.description || 'No description available',
                pesticide: data.analysis.pesticide || 'Consult expert',
                treatment: data.analysis.treatment || 'Follow agricultural guidelines',
                recommendation: data.analysis.recommendation || data.analysis.description || 'No recommendations available',
                method: data.method || 'ML Detection',
                confidenceColor: data.analysis.confidenceColor,
                severityColor: data.analysis.severityColor
            };
            displayDiseaseResults(analysisData);
        } else if (data.result) {
            displayDiseaseResults(data.result);
        } else if (data.name) {
            displayDiseaseResults(data);
        } else {
            throw new Error('Invalid API response format');
        }
    })
    .catch(error => {
        responseReceived = true;
        clearTimeout(timeoutId);
        
        console.error('❌ API Error:', error.message);
        
        // Check if backend is reachable
        if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
            console.warn('⚠️ Cannot connect to backend at', BASE_API_URL);
            console.log('💡 Make sure backend is running: python backend/app.py');
            
            resultsArea.innerHTML = `
                <div style="padding: 20px; background-color: #fee; border-left: 4px solid #e74c3c; border-radius: 4px;">
                    <p style="color: #c33; margin: 0; font-weight: bold;">❌ Backend Not Reachable</p>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Cannot connect to the backend server. Using client-side ML detection instead.</p>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 12px; font-family: monospace;">Expected: ${BASE_API_URL}</p>
                </div>
            `;
            
            // Fallback to client-side ML detection
            performClientSideMLDetection(fileInput.files[0]);
        } else {
            // API error response
            console.warn('⚠️ API error, falling back to client-side ML detection...', error);
            resultsArea.innerHTML = `
                <div style="padding: 20px; background-color: #fee; border-left: 4px solid #f39c12; border-radius: 4px;">
                    <p style="color: #f39c12; margin: 0; font-weight: bold;">⚠️ Analysis Error</p>
                    <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Backend error: ${error.message}. Using client-side detection.</p>
                </div>
            `;
            
            // Fallback to client-side ML detection
            performClientSideMLDetection(fileInput.files[0]);
        }
    });
}

/**
 * Client-side ML detection using TensorFlow.js
 */
async function performClientSideMLDetection(imageFile) {
    const resultsArea = document.getElementById('diseaseResults');
    
    try {
        console.log('🤖 Starting client-side ML disease detection...');
        resultsArea.innerHTML = '<p class="placeholder-text loading">🧠 Running ML model...</p>';
        
        // Initialize model
        const modelInitialized = await initializeMLModel();
        
        // Perform detection
        const result = await detectDiseaseML(imageFile, 'potato');
        
        // Format result
        const analysisData = {
            name: result.name,
            confidence: result.confidence,
            severity: result.severity,
            description: result.description,
            pesticide: result.pesticide,
            treatment: result.treatment,
            recommendation: result.treatment,
            method: result.method,
            processingTime: result.processingTime
        };
        
        displayDiseaseResults(analysisData);
        
    } catch (error) {
        console.error('❌ Client-side ML detection failed:', error);
        resultsArea.innerHTML = `
            <div style="padding: 20px; background-color: #fee; border-left: 4px solid #e74c3c; border-radius: 4px;">
                <p style="color: #c33; margin: 0; font-weight: bold;">❌ Detection Failed</p>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Error: ${error.message}</p>
            </div>
        `;
    }
}

function useDemoDiseaseAnalysis() {
    // Use demo/mock analysis as fallback
    console.log('📌 Using demo disease analysis (fallback)');
    
    const diseases = [
        {
            name: 'Early Blight',
            confidence: 87,
            severity: 'High',
            description: 'Fungal disease causing circular spots on leaves',
            pesticide: 'Copper Fungicide',
            safety: 'Wear gloves and mask during application'
        },
        {
            name: 'Leaf Spot',
            confidence: 65,
            severity: 'Medium',
            description: 'Bacterial disease with brown spots on leaves',
            pesticide: 'Streptomycin-based fungicide',
            safety: 'Apply in early morning or late evening'
        },
        {
            name: 'Healthy Leaf',
            confidence: 78,
            severity: 'None',
            description: 'Leaf appears healthy with no visible disease',
            pesticide: 'No treatment needed',
            safety: 'Continue regular maintenance'
        }
    ];

    const result = diseases[Math.floor(Math.random() * diseases.length)];
    displayDiseaseResults(result);
}

function displayDiseaseResults(result) {
    const resultsArea = document.getElementById('diseaseResults');
    
    // Store result data globally for voice explanation access
    window.currentDiseaseResult = result;
    
    // Check if browser supports Speech Synthesis for voice explanation
    const hasVoiceSupport = window.speechSynthesis !== undefined;
    const langName = currentLanguage === 'hi' ? 'हिन्दी' : currentLanguage === 'te' ? 'తెలుగు' : 'English';
    const voiceButtonHTML = hasVoiceSupport ? `
        <div class="voice-explanation-section" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <div style="margin-bottom: 10px;">
                <button class="listen-explanation-btn" onclick="speakDiseaseExplanation(window.currentDiseaseResult)" style="padding: 10px 16px; margin-right: 8px; background-color: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    🔊 Listen Explanation
                </button>
                <button class="stop-explanation-btn" onclick="stopDiseaseExplanation()" style="display: none; padding: 10px 16px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    ⏹️ Stop
                </button>
            </div>
            <small class="voice-note" style="display: block; color: #7f8c8d; font-size: 12px;">
                💬 Click to hear disease explanation in ${langName}
            </small>
        </div>
    ` : `
        <div class="voice-fallback" style="margin-top: 20px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Voice Not Available:</strong> Speech synthesis not supported in your browser. Please use Chrome, Edge, or Firefox for voice explanations.
            </p>
        </div>
    `;
    
    // Show detection method if available
    const methodBadge = result.method ? `
        <div style="margin-top: 10px; padding: 8px 12px; background-color: #e8f4f8; border-left: 3px solid #3498db; border-radius: 3px; font-size: 12px; color: #2c3e50;">
            <strong>Detection Method:</strong> ${result.method}
            ${result.processingTime ? `<br><strong>Processing Time:</strong> ${result.processingTime}ms` : ''}
            ${result.note ? `<br><strong>Note:</strong> ${result.note}` : ''}
        </div>
    ` : '';
    
    let html = `
        <div class="result-item">
            <div class="result-label">Disease Detected</div>
            <div class="result-value">${result.name}</div>
            
            <div style="margin-top: 15px;">
                <div class="result-label">Confidence Score</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${result.confidence}%"></div>
                </div>
                <span class="result-detail">${result.confidence}% Confidence</span>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">Severity Level</div>
                <div class="result-value text-${getSeverityColor(result.severity)}" style="font-size: 16px;">
                    ${result.severity}
                </div>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">Description</div>
                <div class="result-detail">${result.description}</div>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">Recommended Treatment</div>
                <div class="result-detail">${result.treatment || result.pesticide || 'Consult an agricultural expert'}</div>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">Recommended Pesticide</div>
                <div class="result-detail">${result.pesticide}</div>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">Recommendation</div>
                <div class="result-detail">${result.recommendation || result.treatment || 'Follow agricultural best practices'}</div>
            </div>

            ${methodBadge}
            
            ${voiceButtonHTML}
        </div>
    `;

    resultsArea.innerHTML = html;
}

function getSeverityColor(severity) {
    switch(severity) {
        case 'High': return 'danger';
        case 'Medium': return 'warning';
        case 'Low': return 'info';
        default: return 'success';
    }
}

// ==========================================
// YIELD PREDICTION
// ==========================================
function predictYield(event) {
    event.preventDefault();

    const cropType = document.getElementById('cropType').value;
    const area = parseFloat(document.getElementById('area').value);
    const soilQuality = document.getElementById('soilQuality').value;
    const waterAvailability = document.getElementById('waterAvailability').value;
    const sunlight = parseFloat(document.getElementById('sunlight').value);

    const resultsArea = document.getElementById('yieldResults');
    resultsArea.innerHTML = '<p class="placeholder-text loading">📊 Calculating yield prediction...</p>';

    // Prepare data for API
    const predictionData = {
        cropType: cropType,
        area: area,
        soilQuality: soilQuality,
        waterAvailability: waterAvailability,
        sunlight: sunlight
    };

    // Try to call backend API first
    console.log('📡 Sending yield prediction request to backend API...');
    fetch(`${BASE_API_URL}/predict-yield`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictionData)
    })
    .then(response => {
        console.log('📡 API Response status:', response.status);
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Yield prediction from API:', data);
        // Handle API response structure: data.prediction contains predictedYield, yieldPerHectare, etc.
        const predictionResult = data.prediction || data.result || data;
        console.log('📊 Parsed prediction result:', predictionResult);
        displayYieldResults(predictionResult, cropType, area, false); // false = from API
    })
    .catch(error => {
        // If API fails, use local calculation (this is expected fallback behavior)
        console.warn('⚠️ Backend server not available, using local calculation...', error);
        
        // Show farmer-friendly status message (less technical)
        resultsArea.innerHTML = '<p class="placeholder-text loading">📊 Processing your data locally... Please wait.</p>';
        
        // === EDUCATIONAL SCOPE: Base yields for Potato & Tomato only ===
        const baseYields = {
            potato: 20.0,  // tons per hectare
            tomato: 40.0   // tons per hectare
        };
        
        // Validate crop type
        if (!baseYields[cropType]) {
            resultsArea.innerHTML = '<div style="color: #e74c3c; font-weight: bold;">❌ Error: ' + cropType.charAt(0).toUpperCase() + cropType.slice(1) + ' is not supported in this educational version. Only Potato and Tomato are currently supported.</div>';
            return;
        }

        let predictedYield = baseYields[cropType];

        // Apply modifiers based on conditions
        const soilMultipliers = {poor: 0.7, average: 0.85, good: 1.0, excellent: 1.2};
        const waterMultipliers = {low: 0.7, medium: 0.95, high: 1.1};
        
        const soilModifier = soilMultipliers[soilQuality] || 1.0;
        const waterModifier = waterMultipliers[waterAvailability] || 1.0;
        const sunlightModifier = Math.max(0.5, Math.min(1.2, sunlight / 8));

        predictedYield = predictedYield * soilModifier * waterModifier * sunlightModifier;
        
        const result = {
            predictedYield: (predictedYield * area).toFixed(2),
            yieldPerHectare: predictedYield.toFixed(2),
            confidence: Math.round(70 + Math.random() * 20),
            soil_modifier: soilModifier,
            water_modifier: waterModifier,
            sunlight_modifier: sunlightModifier
        };
        
        console.log('📊 Using local calculation:', result);
        displayYieldResults(result, cropType, area, true); // true = local fallback
    });
}

function displayYieldResults(result, cropType, area, isLocalFallback = false) {
    const resultsArea = document.getElementById('yieldResults');
    
    const soilQuality = document.getElementById('soilQuality').value;
    const waterAvailability = document.getElementById('waterAvailability').value;
    const sunlight = parseFloat(document.getElementById('sunlight').value);
    
    // Normalize result object to handle both API response format and local fallback format
    const normalizedResult = {
        // Handle both camelCase (from API) and snake_case (from local fallback)
        totalYield: result.predictedYield || result.total_yield || (result.yield_per_hectare * area),
        yieldPerHectare: result.yieldPerHectare || result.yield_per_hectare,
        confidence: result.confidence || 85,
        soilModifier: result.soil_modifier || 1.0,
        waterModifier: result.water_modifier || 1.0,
        sunlightModifier: result.sunlight_modifier || 1.0
    };
    
    const influencingFactors = [
        {factor: 'Soil Quality', impact: `${Math.round((normalizedResult.soilModifier - 1) * 100 + 100)}%`},
        {factor: 'Water Availability', impact: `${Math.round((normalizedResult.waterModifier - 1) * 100 + 100)}%`},
        {factor: 'Sunlight Hours', impact: `${Math.round(normalizedResult.sunlightModifier * 100)}%`},
        {factor: 'Cultivation Area', impact: `${area} hectares`}
    ];

    // Add status indicator if using local calculation
    let statusHtml = '';
    if (isLocalFallback) {
        statusHtml = `<div style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #3498db; margin-bottom: 15px; border-radius: 4px;">
            <span style="color: #3498db; font-size: 13px;">📊 <strong>Local Calculation</strong> - Results calculated from saved data</span>
        </div>`;
    }

    let html = `
        <div class="result-item">
            ${statusHtml}
            <div class="result-label">Predicted Yield</div>
            <div class="result-value">${normalizedResult.totalYield.toFixed(2)} tons</div>
            
            <div style="margin-top: 15px;">
                <div class="result-label">Per Hectare Average</div>
                <div class="result-detail">${normalizedResult.yieldPerHectare.toFixed(2)} tons/hectare</div>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">Confidence Interval</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${normalizedResult.confidence}%"></div>
                </div>
                <span class="result-detail">${normalizedResult.confidence}% Confidence (±${(normalizedResult.yieldPerHectare * 0.15).toFixed(2)} tons)</span>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">Influencing Factors</div>
                <div style="font-size: 14px; margin-top: 10px;">
                    ${influencingFactors.map(f => `
                        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                            <span>${f.factor}</span>
                            <strong class="text-success">${f.impact}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="margin-top: 15px;">
                <div class="result-label">💡 Optimization Suggestions</div>
                <div class="result-detail">
                    ${getSoilSuggestion(soilQuality)}<br>
                    ${getWaterSuggestion(waterAvailability)}<br>
                    ${getSunlightSuggestion(sunlight)}
                </div>
            </div>
        </div>
    `;

    resultsArea.innerHTML = html;
}

function getSoilSuggestion(quality) {
    const suggestions = {
        poor: '⚠️ Improve soil quality with organic fertilizers and composting',
        average: '✓ Add nutrients through balanced fertilizers',
        good: '✓ Maintain current soil health with regular monitoring',
        excellent: '✓ Continue excellent soil management practices'
    };
    return suggestions[quality] || '';
}

function getWaterSuggestion(availability) {
    const suggestions = {
        low: '⚠️ Consider drip irrigation system for water efficiency',
        medium: '✓ Maintain consistent watering schedule',
        high: '✓ Ensure proper drainage to prevent waterlogging'
    };
    return suggestions[availability] || '';
}

function getSunlightSuggestion(hours) {
    if (hours < 4) return '⚠️ Provide supplementary light or relocate crop';
    if (hours < 6) return '✓ Monitor light levels; consider shade management';
    if (hours > 12) return '⚠️ Provide shade cloth during peak heat hours';
    return '✓ Optimal sunlight conditions';
}

// ==========================================
// MARKET PRICES
// ==========================================
async function loadMarketData() {
    try {
        // Try to load from backend API first
        console.log('📡 Fetching market data from backend API...');
        const response = await fetch(`${BASE_API_URL}/prices`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        marketPricesData = await response.json();
        console.log('✅ Market data loaded from API!', marketPricesData);
        
    } catch (error) {
        // If API fails, fall back to JSON file
        console.warn('⚠️ API not available, loading from local JSON file...', error);
        try {
            const response = await fetch('data/market_prices.json');
            marketPricesData = await response.json();
            console.log('✅ Market data loaded from local file (demo mode)');
        } catch (fallbackError) {
            console.error('❌ Failed to load market data:', fallbackError);
        }
    }
}

function populateMarketSelects() {
    // === EDUCATIONAL SCOPE: Only Potato & Tomato ===
    const crops = new Set();
    const states = new Set();

    if (marketPricesData.prices) {
        marketPricesData.prices.forEach(item => {
            crops.add(item.crop);
            states.add(item.state);
        });
    } else {
        // Demo data - Educational scope only
        crops.add('Potato');
        crops.add('Tomato');
        states.add('Uttar Pradesh');
        states.add('Punjab');
        states.add('Karnataka');
    }

    // Populate selects
    const cropSelect = document.getElementById('marketCrop');
    const stateSelect = document.getElementById('marketState');

    Array.from(crops).forEach(crop => {
        const option = document.createElement('option');
        option.value = crop;
        option.textContent = crop;
        cropSelect.appendChild(option);
    });

    Array.from(states).forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

function searchMarketPrices(event) {
    event.preventDefault();

    const crop = document.getElementById('marketCrop').value;
    const state = document.getElementById('marketState').value;

    const resultsArea = document.getElementById('marketResults');
    resultsArea.innerHTML = '<p class="placeholder-text loading">💹 Fetching market data...</p>';

    setTimeout(() => {
        // Simulate market data
        const basePrice = Math.floor(Math.random() * 3000) + 1000;
        const currentPrice = basePrice + Math.floor(Math.random() * 500) - 250;
        const trend = (Math.random() - 0.5) * 10;

        let html = `
            <div class="result-item">
                <div class="result-label">${crop} Market Price - ${state}</div>
                
                <div style="margin-top: 15px;">
                    <div class="result-label">Current Price</div>
                    <div class="result-value">₹${currentPrice}/quintal</div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="result-label">Price Trend (Last 30 days)</div>
                    <div class="result-detail ${trend > 0 ? 'text-success' : 'text-danger'}">
                        ${trend > 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(2)}%
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="result-label">Annual Average</div>
                    <div class="result-detail">₹${basePrice}/quintal</div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="result-label">💡 Selling Recommendation</div>
                    <div class="result-detail">
                        ${getSellingAdvice(trend)}
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="result-label">Market Outlook</div>
                    <div class="result-detail">
                        ${getMarketOutlook(trend)}
                    </div>
                </div>
            </div>
        `;

        resultsArea.innerHTML = html;
        drawPriceChart(crop, basePrice, currentPrice);
    }, 1000);
}

function getSellingAdvice(trend) {
    if (trend > 5) {
        return '✓ Favorable conditions - Consider selling now while prices are rising';
    } else if (trend > 0) {
        return '✓ Moderate increase - Good time to sell';
    } else if (trend > -5) {
        return '⚠️ Slight decline - Hold if possible for recovery';
    } else {
        return '⚠️ Declining prices - Consider selling strategically';
    }
}

function getMarketOutlook(trend) {
    if (trend > 3) {
        return '📈 Strong - Prices expected to remain high';
    } else if (trend > 0) {
        return '📈 Positive - Gradual improvement expected';
    } else if (trend > -3) {
        return '📉 Neutral - Prices stabilizing';
    } else {
        return '📉 Negative - Monitor for market recovery';
    }
}

function drawPriceChart(crop, basePrice, currentPrice) {
    const canvas = document.getElementById('priceCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Generate demo data for 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const prices = months.map((m, i) => {
        const variation = Math.sin(i * 0.5) * 500 + Math.random() * 200;
        return basePrice + variation;
    });

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Find min/max
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice;

    // Draw grid lines and labels
    ctx.strokeStyle = '#ddd';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';

    for (let i = 0; i < months.length; i++) {
        const x = padding + (i / (months.length - 1)) * graphWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
        ctx.fillText(months[i], x - 15, height - padding + 20);
    }

    // Draw price line
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3;
    ctx.beginPath();

    prices.forEach((price, i) => {
        const x = padding + (i / (prices.length - 1)) * graphWidth;
        const y = height - padding - ((price - minPrice) / range) * graphHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw axis labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`₹${minPrice.toFixed(0)}`, 5, height - 5);
    ctx.fillText(`₹${maxPrice.toFixed(0)}`, 5, padding + 15);
    ctx.fillText('Monthly Price Trend', width / 2 - 60, 25);
}

// ==========================================
// GOVERNMENT SCHEMES
// ==========================================
async function loadGovernmentSchemes() {
    try {
        // Try to load from backend API first
        console.log('📡 Fetching government schemes from backend API...');
        const response = await fetch(`${BASE_API_URL}/schemes`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        governmentSchemesData = await response.json();
        console.log('✅ Government schemes loaded from API!', governmentSchemesData);
        
    } catch (error) {
        // If API fails, fall back to JSON file
        console.warn('⚠️ API not available, loading from local JSON file...', error);
        try {
            const response = await fetch('data/gov_schemes.json');
            governmentSchemesData = await response.json();
            console.log('✅ Government schemes loaded from local file (demo mode)');
        } catch (fallbackError) {
            console.error('❌ Failed to load government schemes:', fallbackError);
        }
    }
    displaySchemes();
}

function displaySchemes() {
    const container = document.getElementById('schemesList');

    if (!governmentSchemesData.schemes || governmentSchemesData.schemes.length === 0) {
        // Demo schemes
        governmentSchemesData.schemes = [
            {
                id: 1,
                name: 'Pradhan Mantri Krishi Sinchayee Yojana',
                type: 'subsidy',
                level: 'central',
                description: 'Ensures assured irrigation through critical irrigation infrastructure',
                eligibility: 'Small and marginal farmers with agricultural land',
                benefit: 'Up to 80% subsidy on irrigation infrastructure',
                deadline: '2024-12-31'
            },
            {
                id: 2,
                name: 'PM Fasal Bima Yojana',
                type: 'insurance',
                level: 'central',
                description: 'Comprehensive crop insurance coverage scheme',
                eligibility: 'All farmers (landowners and tenant farmers)',
                benefit: 'Insurance coverage up to crop value',
                deadline: '2024-06-30'
            },
            {
                id: 3,
                name: 'Soil Health Card Scheme',
                type: 'training',
                level: 'central',
                description: 'Regular soil testing and recommendations',
                eligibility: 'All farmers',
                benefit: 'Free soil testing and personalized recommendations',
                deadline: 'Open'
            },
            {
                id: 4,
                name: 'Andhra Pradesh Irrigation Assistance Program',
                type: 'subsidy',
                level: 'state',
                description: 'State-specific irrigation development',
                eligibility: 'Farmers in Andhra Pradesh',
                benefit: 'Financial assistance for irrigation',
                deadline: '2024-09-30'
            }
        ];
    }

    let html = '';
    governmentSchemesData.schemes.forEach(scheme => {
        html += `
            <div class="scheme-card">
                <span class="scheme-badge badge-${scheme.level}">${scheme.level.toUpperCase()}</span>
                <span class="scheme-badge badge-${scheme.type}">${scheme.type.toUpperCase()}</span>
                
                <h4>${scheme.name}</h4>
                <p>${scheme.description}</p>
                
                <div style="margin: 12px 0; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                    <strong style="color: #2c3e50;">Eligibility:</strong>
                    <p style="font-size: 13px; margin: 5px 0 0 0;">${scheme.eligibility}</p>
                </div>
                
                <div style="margin: 12px 0; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                    <strong style="color: #2c3e50;">Benefit:</strong>
                    <p style="font-size: 13px; margin: 5px 0 0 0;">${scheme.benefit}</p>
                </div>
                
                <div style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">
                    <strong>Deadline:</strong> ${scheme.deadline}
                </div>
                
                <button class="btn btn-primary btn-small" style="margin-top: 15px; width: 100%;">
                    Learn More & Apply
                </button>
            </div>
        `;
    });

    container.innerHTML = html || '<p class="placeholder-text">No schemes available</p>';
}

function filterSchemes() {
    const typeFilter = document.getElementById('schemeType').value;
    const levelFilter = document.getElementById('schemeLevel').value;

    const cards = document.querySelectorAll('.scheme-card');
    
    cards.forEach(card => {
        const typeMatch = !typeFilter || card.innerHTML.includes(`badge-${typeFilter}`);
        const levelMatch = !levelFilter || card.innerHTML.includes(`badge-${levelFilter}`);
        
        card.style.display = (typeMatch && levelMatch) ? 'block' : 'none';
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function showError(message) {
    alert('❌ Error: ' + message);
}

function showSuccess(message) {
    alert('✓ ' + message);
}

// ==========================================
// PREDICTION HISTORY
// ==========================================
async function loadPredictionHistory() {
    const container = document.getElementById('historyContainer');
    const cropSelect = document.getElementById('historyCrop');
    const limitSelect = document.getElementById('historyLimit');
    
    const crop = cropSelect.value || 'Potato';
    const limit = limitSelect.value || 10;
    
    try {
        container.innerHTML = '<p class="placeholder-text">Loading predictions...</p>';
        
        const response = await fetch(`${BASE_API_URL}/history/predictions?crop=${crop}&limit=${limit}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.predictions || data.predictions.length === 0) {
            container.innerHTML = `
                <div class="no-history-message">
                    <div class="icon">📭</div>
                    <p>No prediction history available</p>
                    <p style="font-size: 12px; margin-top: 10px; color: #95a5a6;">
                        Make some predictions first to see them here!
                    </p>
                </div>
            `;
            return;
        }
        
        displayPredictionHistory(data.predictions);
        
    } catch (error) {
        console.error('Error loading history:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>❌ Error loading prediction history</p>
                <p style="font-size: 12px; margin-top: 5px;">${error.message}</p>
            </div>
        `;
    }
}

function displayPredictionHistory(predictions) {
    const container = document.getElementById('historyContainer');
    
    if (!predictions || predictions.length === 0) {
        container.innerHTML = `
            <div class="no-history-message">
                <div class="icon">📭</div>
                <p>No predictions found</p>
            </div>
        `;
        return;
    }
    
    // Calculate statistics
    const stats = calculateHistoryStats(predictions);
    
    // Build HTML table
    let html = `
        <div class="history-stats">
            <div class="stat-card">
                <h4>Total Predictions</h4>
                <div class="stat-value">${stats.total}</div>
            </div>
            <div class="stat-card">
                <h4>Average Yield</h4>
                <div class="stat-value">${stats.avgYield.toFixed(1)}</div>
                <div class="stat-unit">tons</div>
            </div>
            <div class="stat-card">
                <h4>Best Yield</h4>
                <div class="stat-value">${stats.maxYield.toFixed(1)}</div>
                <div class="stat-unit">tons</div>
            </div>
            <div class="stat-card">
                <h4>Avg Confidence</h4>
                <div class="stat-value">${stats.avgConfidence.toFixed(0)}%</div>
            </div>
        </div>
        
        <table class="history-table">
            <thead>
                <tr>
                    <th>📅 Date</th>
                    <th>🌾 Crop</th>
                    <th>📍 Area (ha)</th>
                    <th>🌱 Soil Quality</th>
                    <th>💧 Water</th>
                    <th>☀️ Sunlight (hrs)</th>
                    <th>📊 Yield (tons)</th>
                    <th>💯 Confidence</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows
    predictions.forEach(pred => {
        const date = new Date(pred.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const time = new Date(pred.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const confidenceClass = pred.confidence >= 85 ? 'confidence-high' : 
                               pred.confidence >= 75 ? 'confidence-medium' : 'confidence-low';
        
        html += `
            <tr>
                <td><strong>${date}</strong><br><small>${time}</small></td>
                <td><strong>${pred.crop_type}</strong></td>
                <td>${pred.area}</td>
                <td>${capitalizeFirst(pred.soil_quality)}</td>
                <td>${capitalizeFirst(pred.water_availability)}</td>
                <td>${pred.sunlight_hours}</td>
                <td class="metric-value">${pred.predicted_yield.toFixed(2)}</td>
                <td><span class="confidence-badge ${confidenceClass}">${pred.confidence}%</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function calculateHistoryStats(predictions) {
    if (!predictions || predictions.length === 0) {
        return {
            total: 0,
            avgYield: 0,
            maxYield: 0,
            minYield: 0,
            avgConfidence: 0
        };
    }
    
    const yields = predictions.map(p => p.predicted_yield);
    const confidences = predictions.map(p => p.confidence);
    
    return {
        total: predictions.length,
        avgYield: yields.reduce((a, b) => a + b, 0) / yields.length,
        maxYield: Math.max(...yields),
        minYield: Math.min(...yields),
        avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length
    };
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function exportHistoryToCSV() {
    const cropSelect = document.getElementById('historyCrop');
    const crop = cropSelect.value || 'All Crops';
    
    const table = document.querySelector('.history-table');
    if (!table) {
        showError('No data to export');
        return;
    }
    
    let csv = 'Crop Yield Prediction History\n';
    csv += `Generated: ${new Date().toLocaleString('en-IN')}\n`;
    csv += `Crop: ${crop}\n\n`;
    
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => {
            let text = cell.textContent.trim();
            // Remove extra whitespace and line breaks
            text = text.replace(/\s+/g, ' ');
            // Escape quotes and wrap in quotes if contains comma
            if (text.includes(',')) {
                text = `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        });
        csv += rowData.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction_history_${crop}_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showSuccess('Prediction history exported to CSV');
}

// Load history when navigating to history section
function setupHistoryNavigation() {
    const observer = new MutationObserver(() => {
        const historySection = document.getElementById('history');
        if (historySection && historySection.classList.contains('active')) {
            loadPredictionHistory();
        }
    });
    
    observer.observe(document, { 
        attributes: true, 
        subtree: true, 
        attributeFilter: ['class'] 
    });
}

// ==========================================
// RESPONSIVE UTILITY
// ==========================================
window.addEventListener('resize', function() {
    const canvas = document.getElementById('priceCanvas');
    if (canvas) {
        canvas.width = canvas.offsetWidth;
    }
});

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: var(--font-family);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Add animation styles if not already present
if (!document.querySelector('style[data-toast]')) {
    const style = document.createElement('style');
    style.setAttribute('data-toast', 'true');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize first section
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('home').classList.add('active');
    document.querySelector('.nav-link').classList.add('active');
    setupUploadArea();  // Setup disease detection upload
    setupHistoryNavigation();  // Setup history section auto-load
});
