/**
 * Prediction History Manager
 * Stores and manages user predictions using localStorage
 * Features: Save, retrieve, filter, and display prediction history
 */

// ==========================================
// PREDICTION HISTORY STORAGE
// ==========================================

const HISTORY_STORAGE_KEY = 'ai_agriculture_predictions';
const MAX_HISTORY_ITEMS = 100; // Maximum predictions to store

/**
 * Save a yield prediction to history
 * @param {Object} prediction - Prediction data object
 */
function savePredictionToHistory(prediction) {
    try {
        // Get existing history
        let history = getPredictionHistory();
        
        // Create prediction record with timestamp
        const record = {
            id: Date.now(), // Unique ID based on timestamp
            timestamp: new Date().toISOString(),
            cropType: prediction.cropType || 'Unknown',
            area: prediction.area || 0,
            soilQuality: prediction.soilQuality || 'Unknown',
            waterAvailability: prediction.waterAvailability || 'Unknown',
            sunlight: prediction.sunlight || 0,
            predictedYield: prediction.predictedYield || 0,
            yieldPerHectare: prediction.yieldPerHectare || 0,
            confidence: prediction.confidence || 0
        };
        
        // Add to beginning of history (most recent first)
        history.unshift(record);
        
        // Limit history size
        if (history.length > MAX_HISTORY_ITEMS) {
            history = history.slice(0, MAX_HISTORY_ITEMS);
        }
        
        // Save to localStorage
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        
        console.log('✅ Prediction saved to history:', record);
        return record;
    } catch (error) {
        console.error('❌ Error saving prediction to history:', error);
        return null;
    }
}

/**
 * Get all predictions from history
 * @returns {Array} Array of prediction records
 */
function getPredictionHistory() {
    try {
        const history = localStorage.getItem(HISTORY_STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('❌ Error retrieving prediction history:', error);
        return [];
    }
}

/**
 * Filter history by crop type
 * @param {String} cropType - Crop type to filter by
 * @returns {Array} Filtered prediction records
 */
function filterHistoryByCrop(cropType) {
    const history = getPredictionHistory();
    return history.filter(record => record.cropType.toLowerCase() === cropType.toLowerCase());
}

/**
 * Filter history by date range
 * @param {String} startDate - Start date (YYYY-MM-DD)
 * @param {String} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Filtered prediction records
 */
function filterHistoryByDate(startDate, endDate) {
    const history = getPredictionHistory();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000; // Include entire end day
    
    return history.filter(record => {
        const timestamp = new Date(record.timestamp).getTime();
        return timestamp >= start && timestamp <= end;
    });
}

/**
 * Get statistics from prediction history
 * @returns {Object} Statistics object
 */
function getPredictionStatistics() {
    const history = getPredictionHistory();
    
    if (history.length === 0) {
        return {
            totalPredictions: 0,
            averageConfidence: 0,
            averageYield: 0,
            cropBreakdown: {},
            dateRange: { first: null, last: null }
        };
    }
    
    const cropBreakdown = {};
    let totalConfidence = 0;
    let totalYield = 0;
    
    history.forEach(record => {
        // Aggregate crop data
        if (!cropBreakdown[record.cropType]) {
            cropBreakdown[record.cropType] = {
                count: 0,
                avgYield: 0,
                avgConfidence: 0,
                minYield: Infinity,
                maxYield: -Infinity
            };
        }
        
        const crop = cropBreakdown[record.cropType];
        crop.count++;
        crop.avgYield += record.predictedYield;
        crop.avgConfidence += record.confidence;
        crop.minYield = Math.min(crop.minYield, record.predictedYield);
        crop.maxYield = Math.max(crop.maxYield, record.predictedYield);
        
        totalConfidence += record.confidence;
        totalYield += record.predictedYield;
    });
    
    // Calculate averages
    Object.keys(cropBreakdown).forEach(crop => {
        const data = cropBreakdown[crop];
        data.avgYield = (data.avgYield / data.count).toFixed(2);
        data.avgConfidence = Math.round(data.avgConfidence / data.count);
        data.minYield = data.minYield.toFixed(2);
        data.maxYield = data.maxYield.toFixed(2);
    });
    
    return {
        totalPredictions: history.length,
        averageConfidence: Math.round(totalConfidence / history.length),
        averageYield: (totalYield / history.length).toFixed(2),
        cropBreakdown: cropBreakdown,
        dateRange: {
            first: history[history.length - 1].timestamp,
            last: history[0].timestamp
        }
    };
}

/**
 * Clear all prediction history
 * @returns {Boolean} Success status
 */
function clearPredictionHistory() {
    try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
        console.log('✅ Prediction history cleared');
        return true;
    } catch (error) {
        console.error('❌ Error clearing prediction history:', error);
        return false;
    }
}

/**
 * Export history as JSON
 * @returns {String} JSON string of prediction history
 */
function exportHistoryAsJSON() {
    try {
        const history = getPredictionHistory();
        const dataStr = JSON.stringify(history, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        // Create download link
        const exportFileDefaultName = `predictions_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('✅ History exported as JSON');
        return true;
    } catch (error) {
        console.error('❌ Error exporting history:', error);
        return false;
    }
}

/**
 * Export history as CSV
 * @returns {String} CSV content
 */
function exportHistoryAsCSV() {
    try {
        const history = getPredictionHistory();
        
        if (history.length === 0) {
            console.warn('⚠️ No history to export');
            return '';
        }
        
        // Create CSV header
        const headers = ['Date', 'Crop Type', 'Area (ha)', 'Soil Quality', 'Water', 'Sunlight (h)', 'Predicted Yield (tons)', 'Per Hectare (tons)', 'Confidence (%)'];
        
        // Create CSV rows
        const rows = history.map(record => [
            new Date(record.timestamp).toLocaleDateString(),
            record.cropType,
            record.area,
            record.soilQuality,
            record.waterAvailability,
            record.sunlight,
            record.predictedYield,
            record.yieldPerHectare,
            record.confidence
        ]);
        
        // Combine header and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const exportFileDefaultName = `predictions_${new Date().toISOString().split('T')[0]}.csv`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        console.log('✅ History exported as CSV');
        return true;
    } catch (error) {
        console.error('❌ Error exporting history as CSV:', error);
        return false;
    }
}

// ==========================================
// UI RENDERING FUNCTIONS
// ==========================================

/**
 * Display prediction history in the history section
 */
function displayPredictionHistory() {
    const historyContainer = document.getElementById('historyTable');
    if (!historyContainer) {
        console.warn('⚠️ History container not found');
        return;
    }
    
    const history = getPredictionHistory();
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="placeholder-text">📋 No predictions yet. Make your first yield prediction to see it here!</p>';
        return;
    }
    
    // Create table HTML
    let tableHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Crop</th>
                    <th>Area (ha)</th>
                    <th>Soil Quality</th>
                    <th>Water</th>
                    <th>Sunlight</th>
                    <th>Predicted Yield</th>
                    <th>Per Hectare</th>
                    <th>Confidence</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    history.forEach(record => {
        const date = new Date(record.timestamp).toLocaleDateString();
        const time = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        tableHTML += `
            <tr class="history-row">
                <td><small>${date}<br><span style="color: #7f8c8d;">${time}</span></small></td>
                <td><strong>${record.cropType}</strong></td>
                <td>${record.area}</td>
                <td>${record.soilQuality}</td>
                <td>${record.waterAvailability}</td>
                <td>${record.sunlight}h</td>
                <td><strong>${record.predictedYield} tons</strong></td>
                <td>${record.yieldPerHectare} tons</td>
                <td>
                    <div class="confidence-indicator">
                        <div style="width: ${record.confidence}%; height: 100%; background: #27ae60; border-radius: 3px;"></div>
                    </div>
                    <span>${record.confidence}%</span>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    historyContainer.innerHTML = tableHTML;
}

/**
 * Display prediction statistics
 */
function displayPredictionStatistics() {
    const statsContainer = document.getElementById('historyStats');
    if (!statsContainer) {
        console.warn('⚠️ Stats container not found');
        return;
    }
    
    const stats = getPredictionStatistics();
    
    if (stats.totalPredictions === 0) {
        statsContainer.innerHTML = '<p class="placeholder-text">📊 Statistics will appear after you make predictions</p>';
        return;
    }
    
    let statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Predictions</div>
                <div class="stat-value">${stats.totalPredictions}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Confidence</div>
                <div class="stat-value">${stats.averageConfidence}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Yield</div>
                <div class="stat-value">${stats.averageYield} tons</div>
            </div>
    `;
    
    // Add crop breakdown
    if (Object.keys(stats.cropBreakdown).length > 0) {
        statsHTML += '<div class="stat-full-width"><div class="stat-label">Crop Breakdown</div><div class="crop-breakdown">';
        
        Object.keys(stats.cropBreakdown).forEach(cropName => {
            const crop = stats.cropBreakdown[cropName];
            statsHTML += `
                <div class="crop-stat">
                    <div class="crop-name">${cropName}</div>
                    <div class="crop-data">
                        <span class="data-item">Count: ${crop.count}</span>
                        <span class="data-item">Avg: ${crop.avgYield} tons</span>
                        <span class="data-item">Range: ${crop.minYield}-${crop.maxYield}</span>
                    </div>
                </div>
            `;
        });
        
        statsHTML += '</div></div>';
    }
    
    statsHTML += '</div>';
    statsContainer.innerHTML = statsHTML;
}

/**
 * Initialize history section (call this when history section is opened)
 */
function initializeHistorySection() {
    displayPredictionHistory();
    displayPredictionStatistics();
}

/**
 * Delete a specific prediction from history
 * @param {Number} predictionId - ID of prediction to delete
 */
function deletePredictionFromHistory(predictionId) {
    try {
        let history = getPredictionHistory();
        history = history.filter(record => record.id !== predictionId);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        
        console.log('✅ Prediction deleted from history');
        displayPredictionHistory();
        displayPredictionStatistics();
        return true;
    } catch (error) {
        console.error('❌ Error deleting prediction:', error);
        return false;
    }
}
