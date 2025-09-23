# AI Models Deployment Guide for Render

## 🚀 Changes Made for Render Deployment

### 1. **Environment Configuration**
- ✅ Updated `AiModels.py` to use environment variables instead of local .env file
- ✅ Added dynamic port configuration for Render
- ✅ Created local `.env` file for development

### 2. **Dependencies**
- ✅ Added `gunicorn==21.2.0` to `requirements.txt`
- ✅ All dependencies are properly specified

### 3. **Configuration Files Created**
- ✅ `render.yaml` - Render deployment configuration
- ✅ `Procfile` - Alternative deployment method
- ✅ `.env` - Local development environment

### 4. **Backend Updates**
- ✅ Updated backend routes to use `AI_SERVICE_URL` environment variable
- ✅ Added fallback to localhost for local development

## 🔧 Deployment Steps

### Step 1: Prepare Your Repository
```bash
# Make sure your code is committed to Git
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `ai-candidate-assessment`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn AiModels:app`
   - **Plan**: Free (or choose paid plan)

### Step 3: Set Environment Variables
In Render dashboard, go to your service → Environment tab and add:
```
GOOGLE_API_KEY=your-actual-google-api-key
```

### Step 4: Update Backend Configuration
After deployment, update your backend's environment variables:
```
AI_SERVICE_URL=https://your-render-app-url.onrender.com
```

## 🔍 Important Notes

### **Memory Requirements**
- The AI models (sentence-transformers, torch) require significant memory
- Free tier has 512MB RAM limit
- Consider upgrading to paid plan if you encounter memory issues

### **Cold Start**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds to respond
- Consider upgrading to paid plan for always-on service

### **File Size Limits**
- Free tier has request size limits
- Large PDF files might need optimization

## 🧪 Testing Your Deployment

1. **Check if service is running:**
   ```bash
   curl https://your-app-url.onrender.com/
   ```

2. **Test resume scan endpoint:**
   ```bash
   curl -X POST https://your-app-url.onrender.com/resume-scan \
     -H "Content-Type: application/json" \
     -d '{"pdf":"base64-encoded-pdf","jobDescription":"test job"}'
   ```

## 🐛 Troubleshooting

### Common Issues:
1. **Memory errors**: Upgrade to paid plan
2. **Timeout errors**: Check if service is sleeping (free tier)
3. **Import errors**: Ensure all dependencies are in requirements.txt
4. **Environment variables**: Double-check all required env vars are set

### Logs:
- Check Render dashboard → Logs tab for error messages
- Monitor memory usage in dashboard

## 📝 Next Steps After Deployment

1. **Update your backend** with the new AI service URL
2. **Test all endpoints** thoroughly
3. **Monitor performance** and upgrade plan if needed
4. **Set up monitoring** for production use
