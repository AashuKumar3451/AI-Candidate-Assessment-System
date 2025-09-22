# AI Candidate Assessment System

A comprehensive full-stack application for automated candidate assessment using AI-powered resume screening, test generation, and interview scheduling.

## 🏗️ System Architecture

The system consists of three main components:

1. **Frontend** - React + TypeScript + Vite (Port: 5173)
2. **Backend** - Node.js + Express + MongoDB (Port: 8080)
3. **AI Service** - Python Flask + AI Models (Port: 5000)

## 📋 Prerequisites

Before setting up the system, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v5.0 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AI-Candidate-Assessment-System/FYP-2
```

### 2. Environment Setup

Create environment files for each component:

#### Backend Environment (`.env` in `Backend/` directory)
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/ai-candidate-assessment
JWT_SECRET=your-super-secret-jwt-key-here
GOOGLE_API_KEY=your-google-generative-ai-api-key
```

#### Frontend Environment (`.env` in `Frontend/` directory)
```env
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
VITE_EMAILJS_TEMPLATE_ID=your-emailjs-template-id
```

#### AI Service Environment (`.env` in `Backend/Routes/` directory)
```env
GOOGLE_API_KEY=your-google-generative-ai-api-key
```

## 🔧 Installation & Setup

### Step 1: Backend Setup (Node.js + Express)

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Start the backend server
npm start
```

The backend server will start on `http://localhost:8080`

### Step 2: AI Service Setup (Python Flask)

```bash
# Navigate to AI models directory
cd Backend/Routes

# Create Python virtual environment
python -m venv ai_env

# Activate virtual environment
# On Windows:
ai_env\Scripts\activate
# On macOS/Linux:
source ai_env/bin/activate

# Install minimal requirements first (to avoid build issues)
pip install -r requirements_minimal.txt

# Install full requirements (if PyMuPDF installation fails, use minimal)
pip install -r requirements.txt

# Start the AI service
python AiModels.py
```

The AI service will start on `http://localhost:5000`

### Step 3: Frontend Setup (React + TypeScript)

```bash
# Navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🗄️ Database Setup

### MongoDB Configuration

1. **Install MongoDB**:
   - Download from [MongoDB Official Website](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB Service**:
   ```bash
   # On Windows (if installed as service)
   net start MongoDB
   
   # On macOS (using Homebrew)
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   ```

3. **Create Database**:
   The application will automatically create the database `ai-candidate-assessment` when first run.

## 🔑 API Keys Setup

### Google Generative AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your environment files:
   - `Backend/.env`
   - `Backend/Routes/.env`

### EmailJS Configuration

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create a service and template
3. Get your Public Key, Service ID, and Template ID
4. Add them to `Frontend/.env`

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start MongoDB** (if not running as service)
2. **Start Backend Server**:
   ```bash
   cd Backend
   npm start
   ```
3. **Start AI Service**:
   ```bash
   cd Backend/Routes
   python AiModels.py
   ```
4. **Start Frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```

### Production Mode

1. **Build Frontend**:
   ```bash
   cd Frontend
   npm run build
   ```

2. **Serve Frontend** (using a static server like nginx or serve):
   ```bash
   npx serve -s dist -l 3000
   ```

## 📁 Project Structure

```
FYP-2/
├── Backend/                    # Node.js Backend
│   ├── Routes/                 # API Routes
│   │   ├── AiModels.py        # Python AI Service
│   │   ├── Authorizations.js  # Auth Routes
│   │   ├── JobDescriptions.js # Job Management
│   │   ├── Test.js            # Test Management
│   │   └── Reports.js         # Reports & Analytics
│   ├── models/                # MongoDB Models
│   ├── server.js              # Main Server File
│   ├── db.js                  # Database Connection
│   └── package.json           # Backend Dependencies
├── Frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # React Components
│   │   ├── context/           # React Context
│   │   ├── pages/             # Page Components
│   │   ├── services/          # API Services
│   │   └── types/             # TypeScript Types
│   ├── package.json           # Frontend Dependencies
│   └── vite.config.ts         # Vite Configuration
└── README.md                  # This file
```

## 🔧 Configuration

### Port Configuration

- **Frontend**: 5173 (Vite default)
- **Backend**: 8080 (configurable via `PORT` env var)
- **AI Service**: 5000 (hardcoded in AiModels.py)

### Database Configuration

- **MongoDB**: Default port 27017
- **Database Name**: `ai-candidate-assessment`

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   ```
   Error: ssl3_read_bytes:tlsv1 alert internal error
   ```
   **Solution**: Check your MongoDB connection string and SSL settings

2. **PyMuPDF Installation Error**:
   ```
   error: subprocess-exited-with-error
   ```
   **Solution**: Use `requirements_minimal.txt` instead of `requirements.txt`

3. **Port Already in Use**:
   ```
   Error: listen EADDRINUSE :::8080
   ```
   **Solution**: Change the PORT in your `.env` file or kill the process using the port

4. **CORS Issues**:
   **Solution**: Ensure CORS is properly configured in both backend and AI service

### Environment Variables Check

Make sure all required environment variables are set:

```bash
# Backend
echo $PORT
echo $MONGODB_URI
echo $JWT_SECRET
echo $GOOGLE_API_KEY

# Frontend
echo $VITE_EMAILJS_PUBLIC_KEY
echo $VITE_EMAILJS_SERVICE_ID
echo $VITE_EMAILJS_TEMPLATE_ID
```

## 📊 Features

- **Resume Upload & Processing**: AI-powered resume analysis
- **Job Management**: Create and manage job postings
- **Candidate Assessment**: Automated test generation and scoring
- **Interview Scheduling**: Manage interview processes
- **Email Notifications**: Automated email system using EmailJS
- **Real-time Status Updates**: Track application progress
- **Responsive UI**: Modern, mobile-friendly interface

## 🔐 Security

- JWT-based authentication
- Environment variable protection
- CORS configuration
- Input validation and sanitization

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Job Management
- `GET /jd/getJD` - Get all jobs
- `POST /jd/createJD` - Create new job
- `POST /jd/apply/:JID` - Apply for job
- `GET /jd/check-application/:JID` - Check application status

### AI Services
- `POST /test-generate` - Generate test questions
- `POST /resume-analysis` - Analyze resume

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Ashesh Kumar** - Initial work

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Happy Coding! 🚀**
