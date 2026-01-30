"""
Configuration settings for AI Agriculture Assistant Backend
"""

import os
from datetime import timedelta

# ==========================================
# FLASK CONFIGURATION
# ==========================================
class Config:
    """Base configuration"""
    
    # Flask Settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', False)
    TESTING = False
    
    # CORS Settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8000').split(',')
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    
    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # Session
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # API Settings
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = True
    
    # Rate Limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    
    # Pagination
    ITEMS_PER_PAGE = 20
    MAX_ITEMS_PER_PAGE = 100

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASES = {
    'development': {
        'default': 'sqlite:///agriculture_dev.db',
        'postgresql': 'postgresql://user:password@localhost/agriculture_db'
    },
    'production': {
        'postgresql': os.getenv('DATABASE_URL', 'postgresql://user:password@host/db'),
    },
    'testing': {
        'default': 'sqlite:///:memory:'
    }
}

# ==========================================
# ML MODEL CONFIGURATION
# ==========================================
MODEL_PATHS = {
    'disease_detection': 'models/disease_detection_model.h5',
    'yield_prediction': 'models/yield_prediction_model.pkl',
    'price_forecasting': 'models/price_forecast_model.pkl'
}

MODEL_SETTINGS = {
    'disease_detection': {
        'input_size': 224,
        'threshold': 0.7,
        'batch_size': 32
    },
    'yield_prediction': {
        'scaler_path': 'models/yield_scaler.pkl',
        'features': ['area', 'soilQuality', 'waterAvailability', 'sunlight']
    }
}

# ==========================================
# API CONFIGURATION
# ==========================================
API_CONFIG = {
    'version': 'v1',
    'base_url': '/api',
    'timeout': 30,
    'max_upload_size': 10 * 1024 * 1024  # 10MB
}

# ==========================================
# LOGGING CONFIGURATION
# ==========================================
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d %(funcName)s(): %(message)s'
        }
    },
    'handlers': {
        'default': {
            'level': 'INFO',
            'formatter': 'standard',
            'class': 'logging.StreamHandler'
        },
        'file': {
            'level': 'DEBUG',
            'formatter': 'detailed',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,
            'backupCount': 5
        }
    },
    'loggers': {
        '': {
            'handlers': ['default', 'file'],
            'level': 'DEBUG',
            'propagate': True
        }
    }
}

# ==========================================
# FEATURE FLAGS
# ==========================================
FEATURES = {
    'disease_detection_enabled': True,
    'yield_prediction_enabled': True,
    'price_forecasting_enabled': False,  # Coming soon
    'user_authentication': False,  # Coming soon
    'scheme_application': False,  # Coming soon
}

# ==========================================
# SELECT CONFIG BASED ON ENVIRONMENT
# ==========================================
config_name = os.getenv('FLASK_ENV', 'development')
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

CURRENT_CONFIG = config_map.get(config_name, DevelopmentConfig)
