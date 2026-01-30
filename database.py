"""
Database utility functions for MySQL integration
Handles all database operations for AI Agriculture Assistant
"""

import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime

class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self, host='localhost', user='root', password='', database='ai_agriculture_assistant'):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            print(f"[OK] Connected to MySQL database: {self.database}")
            return True
        except Error as e:
            print(f"[ERROR] Database connection error: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("[OK] Database connection closed")
    
    # ==================== YIELD PREDICTIONS ====================
    
    def save_yield_prediction(self, crop_type, area, soil_quality, water_availability, 
                             sunlight_hours, predicted_yield, yield_per_hectare, confidence):
        """Save yield prediction to database"""
        try:
            cursor = self.connection.cursor()
            query = """
            INSERT INTO yield_predictions 
            (crop_type, area, soil_quality, water_availability, sunlight_hours, 
             predicted_yield, yield_per_hectare, confidence)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (crop_type, area, soil_quality, water_availability, 
                     sunlight_hours, predicted_yield, yield_per_hectare, confidence)
            
            cursor.execute(query, values)
            self.connection.commit()
            
            print(f"[OK] Saved yield prediction for {crop_type}")
            return True
        except Error as e:
            print(f"[ERROR] Error saving yield prediction: {e}")
            return False
        finally:
            cursor.close()
    
    def get_yield_predictions(self, crop_type=None, limit=10):
        """Get yield predictions from database"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            if crop_type:
                query = "SELECT * FROM yield_predictions WHERE crop_type = %s ORDER BY created_at DESC LIMIT %s"
                cursor.execute(query, (crop_type, limit))
            else:
                query = "SELECT * FROM yield_predictions ORDER BY created_at DESC LIMIT %s"
                cursor.execute(query, (limit,))
            
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"[ERROR] Error fetching yield predictions: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== DISEASE DETECTIONS ====================
    
    def save_disease_detection(self, crop_type, disease_name, confidence, severity, pesticide, image_filename=None):
        """Save disease detection to database"""
        try:
            cursor = self.connection.cursor()
            query = """
            INSERT INTO disease_detections 
            (crop_type, disease_name, confidence, severity, pesticide, image_filename)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            values = (crop_type, disease_name, confidence, severity, pesticide, image_filename)
            
            cursor.execute(query, values)
            self.connection.commit()
            
            print(f"[OK] Saved disease detection: {disease_name}")
            return True
        except Error as e:
            print(f"[ERROR] Error saving disease detection: {e}")
            return False
        finally:
            cursor.close()
    
    def get_disease_detections(self, disease_name=None, limit=10):
        """Get disease detections from database"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            if disease_name:
                query = "SELECT * FROM disease_detections WHERE disease_name = %s ORDER BY created_at DESC LIMIT %s"
                cursor.execute(query, (disease_name, limit))
            else:
                query = "SELECT * FROM disease_detections ORDER BY created_at DESC LIMIT %s"
                cursor.execute(query, (limit,))
            
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"[ERROR] Error fetching disease detections: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== MARKET PRICES ====================
    
    def save_market_price(self, state, crop, price, unit='per quintal'):
        """Save market price to database"""
        try:
            cursor = self.connection.cursor()
            query = """
            INSERT INTO market_prices (state, crop, price, unit, recorded_date)
            VALUES (%s, %s, %s, %s, CURDATE())
            ON DUPLICATE KEY UPDATE price = %s, created_at = CURRENT_TIMESTAMP
            """
            values = (state, crop, price, unit, price)
            
            cursor.execute(query, values)
            self.connection.commit()
            
            return True
        except Error as e:
            print(f"[ERROR] Error saving market price: {e}")
            return False
        finally:
            cursor.close()
    
    def get_market_prices(self, crop=None):
        """Get market prices from database"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            if crop:
                query = "SELECT state, crop, price, unit FROM market_prices WHERE crop = %s ORDER BY state"
                cursor.execute(query, (crop,))
            else:
                query = "SELECT state, crop, price, unit FROM market_prices ORDER BY crop, state"
                cursor.execute(query)
            
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"[ERROR] Error fetching market prices: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== USER ACTIVITY ====================
    
    def log_activity(self, activity_type, crop_type=None, details=None):
        """Log user activity"""
        try:
            cursor = self.connection.cursor()
            query = """
            INSERT INTO user_activity (activity_type, crop_type, details)
            VALUES (%s, %s, %s)
            """
            details_json = json.dumps(details) if details else None
            values = (activity_type, crop_type, details_json)
            
            cursor.execute(query, values)
            self.connection.commit()
            
            return True
        except Error as e:
            print(f"[ERROR] Error logging activity: {e}")
            return False
        finally:
            cursor.close()
    
    def get_activity_log(self, activity_type=None, limit=20):
        """Get activity log"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            if activity_type:
                query = "SELECT * FROM user_activity WHERE activity_type = %s ORDER BY created_at DESC LIMIT %s"
                cursor.execute(query, (activity_type, limit))
            else:
                query = "SELECT * FROM user_activity ORDER BY created_at DESC LIMIT %s"
                cursor.execute(query, (limit,))
            
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"[ERROR] Error fetching activity log: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== DISEASES REFERENCE ====================
    
    def get_disease_info(self, crop_type, disease_name):
        """Get disease information from reference database"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            query = """
            SELECT * FROM diseases_reference 
            WHERE crop_type = %s AND disease_name = %s
            """
            cursor.execute(query, (crop_type, disease_name))
            
            result = cursor.fetchone()
            return result
        except Error as e:
            print(f"[ERROR] Error fetching disease info: {e}")
            return None
        finally:
            cursor.close()
    
    def get_all_diseases(self, crop_type=None):
        """Get all diseases for a crop"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            if crop_type:
                query = "SELECT * FROM diseases_reference WHERE crop_type = %s"
                cursor.execute(query, (crop_type,))
            else:
                query = "SELECT * FROM diseases_reference"
                cursor.execute(query)
            
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"[ERROR] Error fetching diseases: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== GOVERNMENT SCHEMES ====================
    
    def get_government_schemes(self, scheme_type=None, level=None):
        """Get government schemes"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            if scheme_type and level:
                query = "SELECT * FROM government_schemes WHERE scheme_type = %s AND level = %s"
                cursor.execute(query, (scheme_type, level))
            elif scheme_type:
                query = "SELECT * FROM government_schemes WHERE scheme_type = %s"
                cursor.execute(query, (scheme_type,))
            elif level:
                query = "SELECT * FROM government_schemes WHERE level = %s"
                cursor.execute(query, (level,))
            else:
                query = "SELECT * FROM government_schemes"
                cursor.execute(query)
            
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"[ERROR] Error fetching schemes: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== ANALYTICS ====================
    
    def get_yield_statistics(self, crop_type):
        """Get yield prediction statistics"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            query = """
            SELECT 
                COUNT(*) as total_predictions,
                AVG(predicted_yield) as avg_yield,
                MAX(predicted_yield) as max_yield,
                MIN(predicted_yield) as min_yield,
                AVG(confidence) as avg_confidence
            FROM yield_predictions
            WHERE crop_type = %s
            """
            cursor.execute(query, (crop_type,))
            
            result = cursor.fetchone()
            return result
        except Error as e:
            print(f"[ERROR] Error fetching yield statistics: {e}")
            return None
        finally:
            cursor.close()
    
    def get_common_diseases(self, crop_type, limit=5):
        """Get most common detected diseases"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            query = """
            SELECT disease_name, COUNT(*) as count, AVG(confidence) as avg_confidence
            FROM disease_detections
            WHERE crop_type = %s
            GROUP BY disease_name
            ORDER BY count DESC
            LIMIT %s
            """
            cursor.execute(query, (crop_type, limit))
            
            results = cursor.fetchall()
            return results
        except Error as e:
            print(f"[ERROR] Error fetching common diseases: {e}")
            return []
        finally:
            cursor.close()

# Global database manager instance
db_manager = None

def init_database(host='localhost', user='root', password=None, database='ai_agriculture_assistant'):
    """Initialize database manager"""
    global db_manager
    
    # If no password provided, try empty string first (most common for local dev)
    if password is None:
        password = ''
    
    db_manager = DatabaseManager(host, user, password, database)
    return db_manager.connect()

def get_db():
    """Get database manager instance"""
    global db_manager
    if db_manager is None:
        init_database()
    return db_manager
