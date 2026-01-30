"""
AI Agriculture Assistant - Flask Backend
Main Application Entry Point

Educational Purpose Only
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv
from database import init_database, get_db
from ml_disease_detection import detect_disease_ml, detect_disease_mock, format_result

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Initialize database
@app.before_request
def before_request():
    """Initialize database before each request"""
    if not hasattr(app, 'db') or app.db is None:
        try:
            # Get database credentials from environment or use defaults
            db_host = os.getenv('DB_HOST', 'localhost')
            db_user = os.getenv('DB_USER', 'root')
            db_password = os.getenv('DB_PASSWORD', '')
            db_name = os.getenv('DB_NAME', 'ai_agriculture_assistant')
            
            if init_database(host=db_host, user=db_user, password=db_password, database=db_name):
                app.db = get_db()
                print("[OK] Database initialized for this request")
        except Exception as e:
            print(f"[WARNING] Database initialization warning: {e}")
            app.db = None

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:8000",
            "http://localhost:3000",
            "http://127.0.0.1:8000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ==========================================
# HEALTH CHECK ENDPOINT
# ==========================================
@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "AI Agriculture Assistant Backend",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }), 200

# ==========================================
# MARKET PRICES ENDPOINTS
# ==========================================
@app.route('/api/prices', methods=['GET'])
def get_prices():
    """Get market prices with optional filtering"""
    crop = request.args.get('crop')
    state = request.args.get('state')
    
    try:
        db = get_db()
        if db and db.connection:
            prices = db.get_market_prices(crop=crop)
            
            # Filter by state if provided
            if state:
                prices = [p for p in prices if p['state'].lower() == state.lower()]
            
            return jsonify({
                "data": prices,
                "filters": {
                    "crop": crop,
                    "state": state
                },
                "total": len(prices),
                "status": "success"
            }), 200
    except Exception as e:
        print(f"Error fetching prices: {e}")
    
    # Fallback response
    return jsonify({
        "data": [],
        "filters": {
            "crop": crop,
            "state": state
        },
        "message": "Database connection not available",
        "status": "fallback"
    }), 200

@app.route('/api/prices/search', methods=['POST'])
def search_prices():
    """Advanced price search with multiple criteria"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # TODO: Implement advanced search logic
    return jsonify({
        "message": "Search functionality under development",
        "received": data
    }), 200

# ==========================================
# YIELD PREDICTION ENDPOINTS
# ==========================================
@app.route('/api/predict-yield', methods=['POST'])
def predict_yield():
    """Predict crop yield based on parameters (Potato & Tomato only)"""
    data = request.get_json()
    
    # Validate input
    required_fields = ['cropType', 'area', 'soilQuality', 'waterAvailability', 'sunlight']
    if not all(field in data for field in required_fields):
        return jsonify({
            "error": "Missing required fields",
            "required": required_fields
        }), 400
    
    # === EDUCATIONAL SCOPE: Validate only Potato and Tomato ===
    crop = data.get('cropType', '').lower()
    if crop not in ['potato', 'tomato']:
        return jsonify({
            "error": "Crop not supported in this educational version",
            "supportedCrops": ["Potato", "Tomato"],
            "message": "This mini project is limited to Potato and Tomato. Other crops are future scope."
        }), 400
    
    # Extract parameters
    area = float(data.get('area', 1))
    soil_quality = data.get('soilQuality', 'moderate')
    water_availability = data.get('waterAvailability', 'moderate')
    sunlight_hours = float(data.get('sunlight', 6))
    
    # Simple prediction model (educational purposes)
    base_yield = {
        'potato': 20,
        'tomato': 15
    }
    
    # Calculate predicted yield with simple formula
    predicted_yield = base_yield[crop] * area
    
    # Adjust based on soil quality
    soil_multipliers = {'poor': 0.7, 'moderate': 1.0, 'good': 1.3}
    soil_multiplier = soil_multipliers.get(soil_quality.lower(), 1.0)
    predicted_yield *= soil_multiplier
    
    # Adjust based on water
    water_multipliers = {'low': 0.8, 'moderate': 1.0, 'high': 1.2}
    water_multiplier = water_multipliers.get(water_availability.lower(), 1.0)
    predicted_yield *= water_multiplier
    
    # Adjust based on sunlight
    sunlight_multiplier = min(sunlight_hours / 8, 1.2)  # Optimal at 8 hours
    predicted_yield *= sunlight_multiplier
    
    # Round to 2 decimal places
    predicted_yield = round(predicted_yield, 2)
    yield_per_hectare = round(predicted_yield / area, 2) if area > 0 else 0
    confidence = min(85 + int(sunlight_hours * 2), 95)
    
    # Try to save to database
    try:
        db = get_db()
        if db and db.connection:
            db.save_yield_prediction(
                crop_type=crop.capitalize(),
                area=area,
                soil_quality=soil_quality,
                water_availability=water_availability,
                sunlight_hours=sunlight_hours,
                predicted_yield=predicted_yield,
                yield_per_hectare=yield_per_hectare,
                confidence=confidence
            )
            # Log activity
            db.log_activity('predict_yield', crop_type=crop, details=data)
    except Exception as e:
        print(f"Database save warning: {e}")
    
    return jsonify({
        "success": True,
        "prediction": {
            "predictedYield": predicted_yield,
            "yieldPerHectare": yield_per_hectare,
            "unit": "tons",
            "confidence": confidence,
            "soil_modifier": soil_multiplier,
            "water_modifier": water_multiplier,
            "sunlight_modifier": sunlight_multiplier,
            "description": f"Estimated {predicted_yield} tons yield for {area} hectares of {crop}"
        },
        "input": data,
        "timestamp": datetime.now().isoformat(),
        "saved": True
    }), 200

@app.route('/api/crops', methods=['GET'])
def get_supported_crops():
    """
    Get list of supported crops
    
    EDUCATIONAL/MINI PROJECT SCOPE:
    This backend currently supports only Potato and Tomato.
    Other crops are marked as future scope for production.
    """
    crops = [
        "Potato",
        "Tomato"
    ]
    
    return jsonify({
        "crops": crops,
        "total": len(crops),
        "scope": "Educational Mini Project - Potato & Tomato Only",
        "futureScope": ["Rice", "Wheat", "Corn", "Cotton", "Sugarcane", "Onion"]
    }), 200

# ==========================================
# DISEASE DETECTION ENDPOINTS
# ==========================================
@app.route('/api/detect-disease', methods=['POST'])
def detect_disease():
    """Analyze leaf image for disease detection using ML"""
    
    try:
        # Check if image file is provided
        if 'image' not in request.files:
            print("❌ [detect-disease] No image file in request")
            return jsonify({
                "error": "No image provided",
                "success": False
            }), 400
        
        file = request.files['image']
        
        if file.filename == '':
            print("❌ [detect-disease] Empty filename")
            return jsonify({
                "error": "No selected file",
                "success": False
            }), 400
        
        # Get crop type from form data
        crop_type = request.form.get('cropType', 'potato').lower()
        
        print(f"📌 [detect-disease] Received file: {file.filename}, Crop: {crop_type}")
        
        # Validate crop type (educational scope: Potato & Tomato only)
        if crop_type not in ['potato', 'tomato']:
            print(f"⚠️  [detect-disease] Unsupported crop type: {crop_type}. Using 'potato' as default")
            crop_type = 'potato'
        
        # Use ML-based detection
        print("🤖 [detect-disease] Starting ML disease detection...")
        detection_result = detect_disease_ml(file, crop_type)
        
        # Format result for API response
        response = format_result(detection_result, filename=file.filename)
        
        # Try to save to database
        try:
            db = get_db()
            if db and db.connection:
                db.save_disease_detection(
                    crop_type=crop_type.capitalize(),
                    disease_name=detection_result['name'],
                    confidence=detection_result['confidence'],
                    severity=detection_result['severity'],
                    pesticide=detection_result['pesticide'],
                    image_filename=file.filename
                )
                # Log activity
                db.log_activity('detect_disease', crop_type=crop_type, details={
                    'disease': detection_result['name'],
                    'confidence': detection_result['confidence'],
                    'method': detection_result.get('method', 'Unknown')
                })
                print(f"📊 [detect-disease] Saved to database")
        except Exception as e:
            print(f"⚠️  [detect-disease] Database save warning: {e}")
        
        print(f"📤 [detect-disease] Sending response with detection method: {detection_result.get('method', 'Unknown')}")
        return jsonify(response), 200
        
    except Exception as e:
        # Catch any unexpected errors and return proper error response
        error_msg = str(e)
        print(f"❌ [detect-disease] Unexpected error: {error_msg}")
        return jsonify({
            "error": f"Unexpected error: {error_msg}",
            "success": False
        }), 500

@app.route('/api/diseases', methods=['GET'])
def get_disease_database():
    """Get disease database - Potato & Tomato only"""
    # === EDUCATIONAL SCOPE: Only diseases affecting Potato & Tomato ===
    diseases = [
        {
            "id": 1,
            "name": "Early Blight",
            "crops": ["Tomato", "Potato"],
            "description": "Fungal disease with circular spots and yellow halos on leaves"
        },
        {
            "id": 2,
            "name": "Late Blight",
            "crops": ["Potato", "Tomato"],
            "description": "Serious fungal disease causing dark water-soaked spots"
        },
        {
            "id": 3,
            "name": "Septoria Leaf Spot",
            "crops": ["Tomato"],
            "description": "Fungal disease affecting tomato leaves with circular lesions"
        },
        {
            "id": 4,
            "name": "Bacterial Wilt",
            "crops": ["Potato"],
            "description": "Bacterial disease causing wilting of potato plants"
        }
    ]
    
    return jsonify({
        "diseases": diseases,
        "total": len(diseases),
        "scope": "Educational Mini Project - Potato & Tomato Diseases Only",
        "lastUpdated": datetime.now().isoformat()
    }), 200

# ==========================================
# GOVERNMENT SCHEMES ENDPOINTS
# ==========================================
@app.route('/api/schemes', methods=['GET'])
def get_schemes():
    """Get government schemes with optional filtering"""
    scheme_type = request.args.get('type')
    level = request.args.get('level')
    
    try:
        db = get_db()
        if db and db.connection:
            schemes = db.get_government_schemes(scheme_type=scheme_type, level=level)
            
            return jsonify({
                "schemes": schemes,
                "filters": {
                    "type": scheme_type,
                    "level": level
                },
                "total": len(schemes),
                "status": "success"
            }), 200
    except Exception as e:
        print(f"Error fetching schemes: {e}")
    
    # Fallback response
    return jsonify({
        "schemes": [],
        "filters": {
            "type": scheme_type,
            "level": level
        },
        "message": "Database connection not available",
        "status": "fallback"
    }), 200

@app.route('/api/schemes/<int:scheme_id>', methods=['GET'])
def get_scheme_details(scheme_id):
    """Get detailed information for a specific scheme"""
    
    try:
        db = get_db()
        if db and db.connection:
            schemes = db.get_government_schemes()
            for scheme in schemes:
                if scheme['id'] == scheme_id:
                    return jsonify({
                        "success": True,
                        "scheme": scheme
                    }), 200
    except Exception as e:
        print(f"Error fetching scheme details: {e}")
    
    return jsonify({
        "error": "Scheme not found",
        "scheme_id": scheme_id
    }), 404

# ==========================================
# HISTORY & ANALYTICS ENDPOINTS
# ==========================================
@app.route('/api/history/predictions', methods=['GET'])
def get_prediction_history():
    """Get yield prediction history"""
    crop_type = request.args.get('crop')
    limit = int(request.args.get('limit', 10))
    
    try:
        db = get_db()
        if db and db.connection:
            predictions = db.get_yield_predictions(crop_type=crop_type, limit=limit)
            return jsonify({
                "success": True,
                "predictions": predictions,
                "crop": crop_type,
                "total": len(predictions)
            }), 200
    except Exception as e:
        print(f"Error fetching prediction history: {e}")
    
    return jsonify({
        "success": False,
        "predictions": [],
        "message": "Could not fetch prediction history"
    }), 200

@app.route('/api/history/detections', methods=['GET'])
def get_detection_history():
    """Get disease detection history"""
    disease_name = request.args.get('disease')
    limit = int(request.args.get('limit', 10))
    
    try:
        db = get_db()
        if db and db.connection:
            detections = db.get_disease_detections(disease_name=disease_name, limit=limit)
            return jsonify({
                "success": True,
                "detections": detections,
                "disease": disease_name,
                "total": len(detections)
            }), 200
    except Exception as e:
        print(f"Error fetching detection history: {e}")
    
    return jsonify({
        "success": False,
        "detections": [],
        "message": "Could not fetch detection history"
    }), 200

@app.route('/api/analytics/yield/<crop>', methods=['GET'])
def get_yield_analytics(crop):
    """Get yield prediction analytics for a crop"""
    try:
        db = get_db()
        if db and db.connection:
            stats = db.get_yield_statistics(crop)
            if stats:
                return jsonify({
                    "success": True,
                    "crop": crop,
                    "statistics": stats
                }), 200
    except Exception as e:
        print(f"Error fetching yield analytics: {e}")
    
    return jsonify({
        "success": False,
        "message": "Could not fetch analytics"
    }), 200

@app.route('/api/analytics/diseases/<crop>', methods=['GET'])
def get_disease_analytics(crop):
    """Get common diseases for a crop"""
    limit = int(request.args.get('limit', 5))
    
    try:
        db = get_db()
        if db and db.connection:
            diseases = db.get_common_diseases(crop, limit=limit)
            return jsonify({
                "success": True,
                "crop": crop,
                "diseases": diseases,
                "total": len(diseases)
            }), 200
    except Exception as e:
        print(f"Error fetching disease analytics: {e}")
    
    return jsonify({
        "success": False,
        "diseases": [],
        "message": "Could not fetch disease analytics"
    }), 200

@app.route('/api/activity', methods=['GET'])
def get_activity():
    """Get user activity log"""
    activity_type = request.args.get('type')
    limit = int(request.args.get('limit', 20))
    
    try:
        db = get_db()
        if db and db.connection:
            logs = db.get_activity_log(activity_type=activity_type, limit=limit)
            return jsonify({
                "success": True,
                "activity": logs,
                "type": activity_type,
                "total": len(logs)
            }), 200
    except Exception as e:
        print(f"Error fetching activity log: {e}")
    
    return jsonify({
        "success": False,
        "activity": [],
        "message": "Could not fetch activity log"
    }), 200

# ==========================================
# ERROR HANDLERS
# ==========================================
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found",
        "message": "The requested resource does not exist",
        "status": 404
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error",
        "message": str(error),
        "status": 500
    }), 500

@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({
        "error": "Method not allowed",
        "status": 405
    }), 405

# ==========================================
# UTILITY ENDPOINTS
# ==========================================
@app.route('/api/info', methods=['GET'])
def api_info():
    """API information and available endpoints"""
    endpoints = {
        "Health": {
            "GET /api/health": "Server health check"
        },
        "Market Prices": {
            "GET /api/prices": "Get market prices",
            "POST /api/prices/search": "Advanced price search"
        },
        "Yield Prediction": {
            "POST /api/predict-yield": "Predict crop yield",
            "GET /api/crops": "Get supported crops"
        },
        "Disease Detection": {
            "POST /api/detect-disease": "Analyze leaf image",
            "GET /api/diseases": "Get disease database"
        },
        "Government Schemes": {
            "GET /api/schemes": "Get schemes",
            "GET /api/schemes/<id>": "Get scheme details"
        }
    }
    
    return jsonify({
        "apiName": "AI Agriculture Assistant",
        "version": "1.0.0",
        "status": "Development",
        "disclaimer": "Educational and demonstration purposes only",
        "endpoints": endpoints,
        "baseUrl": "http://localhost:5000/api"
    }), 200

# ==========================================
# MAIN ENTRY POINT
# ==========================================
if __name__ == '__main__':
    # Development server
    debug_mode = os.getenv('FLASK_DEBUG', 'False') == 'True'
    port = int(os.getenv('PORT', 5000))
    
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║     AI Agriculture Assistant - Backend Server             ║
    ║                                                            ║
    ║  📍 Server URL: http://localhost:5000                     ║
    ║  📚 API Docs:   http://localhost:5000/api/info           ║
    ║  🔍 Health:     http://localhost:5000/api/health         ║
    ║                                                            ║
    ║  ⚠️  Educational & Demonstration Purpose Only             ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode,
        use_reloader=debug_mode
    )
