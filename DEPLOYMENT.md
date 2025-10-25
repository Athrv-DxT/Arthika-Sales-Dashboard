# Deployment Guide

## 🚀 Railway Deployment

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

### Step 2: Deploy on Railway

1. **Go to Railway**:
   - Visit [railway.app](https://railway.app)
   - Sign up/Login with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Deployment**:
   - Railway will automatically detect Python
   - It will use the `Procfile` and `requirements.txt`
   - No additional configuration needed

4. **Environment Variables** (Optional):
   - `FLASK_ENV=production`
   - `PORT=5000` (automatically set)

### Step 3: Access Your Dashboard

- Railway will provide a URL like: `https://your-app-name.railway.app`
- Your dashboard will be live and accessible worldwide

## 🔧 Local Development Setup

### Prerequisites
- Python 3.11+
- pip

### Installation

1. **Clone Repository**:
   ```bash
   git clone <your-repo-url>
   cd Sales-Dashboard
   ```

2. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Application**:
   ```bash
   python app.py
   ```

5. **Access Dashboard**:
   - Open browser to `http://localhost:5000`

## 📁 File Structure

```
Sales-Dashboard/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Procfile              # Railway deployment command
├── railway.json          # Railway configuration
├── runtime.txt           # Python version specification
├── .gitignore            # Git ignore patterns
├── README.md             # Project documentation
├── DEPLOYMENT.md         # This deployment guide
├── static/
│   ├── app.js            # Frontend JavaScript
│   └── style.css         # Styling and themes
└── templates/
    └── index.html        # Dashboard template
```

## 🌐 Production Considerations

### Security
- The app is configured for production with proper host binding
- No sensitive data is hardcoded
- API endpoints are properly secured

### Performance
- Uses Gunicorn for production WSGI server
- Optimized for Railway's infrastructure
- Efficient data processing with pandas

### Monitoring
- Railway provides built-in monitoring
- Application logs are available in Railway dashboard
- Health checks are configured

## 🔄 Updates and Maintenance

### Updating the Application
1. Make changes to your code
2. Commit and push to GitHub
3. Railway will automatically redeploy

### Monitoring
- Check Railway dashboard for logs
- Monitor application performance
- Set up alerts if needed

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check `requirements.txt` for correct dependencies
   - Ensure Python version compatibility

2. **Runtime Errors**:
   - Check Railway logs
   - Verify environment variables

3. **API Issues**:
   - Ensure external API is accessible
   - Check network connectivity

### Support
- Check Railway documentation
- Review application logs
- Open GitHub issues for bugs
