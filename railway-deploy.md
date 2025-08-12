# 🚀 Deploy Instructions for Railway

## 📋 Pre-Deploy Checklist

✅ **Sistema Testado**: Todos os testes passaram  
✅ **Commit Realizado**: Changes pushed to GitHub  
✅ **Railway CLI**: Disponível e configurado  
✅ **Dockerfile**: Configurado em `/apps/api/Dockerfile`  
✅ **Railway Config**: Configurado em `/apps/api/railway.json`  

## 🛠️ Deploy Steps

### 1. Configure Railway Project
```bash
# Navigate to API directory
cd apps/api

# Login to Railway (if not logged in)
railway login

# Link or create project
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set APP_PORT=3000
railway variables set EVOLUTION_API_URL=http://128.140.7.154:8080
railway variables set EVOLUTION_API_KEY=Imperio2024@EvolutionSecure
```

### 2. Deploy Backend
```bash
# Deploy API service
railway up
```

### 3. Configure Frontend (Vercel/Netlify)
```bash
# Navigate to dashboard
cd ../dashboard

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

## 🔧 Environment Variables for Railway

```env
NODE_ENV=production
APP_PORT=3000
EVOLUTION_API_URL=http://128.140.7.154:8080
EVOLUTION_API_KEY=Imperio2024@EvolutionSecure
LOG_LEVEL=warn
CORS_ORIGIN=https://your-frontend-domain.com
FEATURE_DASHBOARD=true
FEATURE_ANALYTICS=true
FEATURE_WEBHOOKS=true
FEATURE_BROADCAST=true
```

## 📊 Post-Deploy Verification

1. **Health Check**: https://your-railway-domain.up.railway.app/health
2. **API Status**: https://your-railway-domain.up.railway.app/api/management/dashboard
3. **Client APIs**: Test all endpoints
4. **Frontend Integration**: Verify frontend connects to production API

## 🌐 Production URLs

- **Backend API**: https://oraclewa-saas-production.up.railway.app
- **Frontend Dashboard**: https://oraclewa-dashboard.vercel.app
- **Health Check**: https://oraclewa-saas-production.up.railway.app/health

---

🎯 **Sistema OracleWA SaaS v3.1 - Ready for Production!**