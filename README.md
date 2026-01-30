# AI Agriculture Assistant - Backend Setup Guide

This directory contains the backend infrastructure for the AI Agriculture Assistant.

## 📋 Overview

The backend provides:
- RESTful APIs for frontend consumption
- ML model integration (future)
- Database management
- User authentication
- Data persistence

## 🚀 Quick Start

### Prerequisites
```bash
Python 3.8+
pip (Python package manager)
Virtual environment (recommended)
```

### Installation

1. **Create virtual environment:**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Run development server:**
```bash
python app.py
```

4. **Access API:**
```
http://localhost:5000
```

## 📁 Backend Structure

```
backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── config.py             # Configuration settings
├── models/               # Database models
├── routes/               # API endpoints
├── services/             # Business logic
├── utils/                # Utility functions
├── data/                 # Database initialization
└── README.md            # This file
```

## 🔌 API Endpoints (Future Implementation)

### Prices
- `GET /api/prices` - Get all prices
- `GET /api/prices?crop=rice&state=punjab` - Filter prices
- `POST /api/prices` - Add new price data

### Yield Prediction
- `POST /api/predict-yield` - Predict crop yield
- `GET /api/crops` - Get supported crops

### Disease Detection
- `POST /api/detect-disease` - Analyze uploaded image
- `GET /api/diseases` - Get disease database

### Government Schemes
- `GET /api/schemes` - Get all schemes
- `GET /api/schemes?type=subsidy&level=central` - Filter schemes

## 📦 Dependencies

See `requirements.txt` for complete list:
- Flask - Web framework
- Flask-CORS - Cross-origin support
- pandas - Data analysis
- scikit-learn - ML algorithms
- numpy - Numerical computing
- python-dotenv - Environment variables

## 🔒 Security Considerations

- Use environment variables for secrets
- Implement API rate limiting
- Validate all user inputs
- Use HTTPS in production
- Implement authentication/authorization
- Sanitize database queries

## 🗄️ Database Setup

```bash
# Future: Initialize database
python -m flask db init
python -m flask db migrate
python -m flask db upgrade
```

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=.
```

## 📝 Environment Variables

Create `.env` file:
```
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///agriculture.db
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:8000
```

## 📚 Additional Resources

- Flask Documentation: https://flask.palletsprojects.com/
- Flask-CORS: https://flask-cors.readthedocs.io/
- RESTful API Design: https://restfulapi.net/

## 🤝 Contributing

See main repository CONTRIBUTING.md for guidelines.

## 📞 Support

For backend-specific issues:
- Create GitHub issue with `[backend]` prefix
- Include error logs and reproduction steps
- Email: backend@aiagritech.com

---

**Next Steps:**
1. Review `app.py` for Flask setup
2. Implement required endpoints
3. Integrate ML models
4. Set up database
5. Add authentication
