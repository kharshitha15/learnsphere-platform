# LearnSphere - Complete GitHub & Render Deployment Guide

This guide ensures zero-mistake deployment of the LearnSphere full-stack application (Spring Boot 4 + React 19 + MySQL) on **GitHub** and **Render**.

---

## 1. Push Code to GitHub

### Step A: Create a Repository on GitHub
1. Open [github.com/new](https://github.com/new).
2. Repository name: `LearnSphere` (or any name you prefer).
3. Set to **Public** or **Private**.
4. **DO NOT** check "Add a README", ".gitignore", or "License" (these are already configured locally).
5. Click **Create repository**.
6. Copy the repository URL (e.g., `https://github.com/<your-username>/LearnSphere.git`).

### Step B: Push from your Computer
In your terminal (or reply with your URL and I can execute it for you):
```powershell
cd d:\MITS_MCA\academic\LearnSphere
git remote add origin https://github.com/<your-username>/LearnSphere.git
git push -u origin main
```

---

## 2. Free Cloud MySQL Database Setup

Render provides PostgreSQL natively, but LearnSphere uses **MySQL 8.0**. You can get a free, persistent cloud MySQL database in 1 minute using **TiDB Cloud** (Serverless Free Tier) or **Aiven**:

### Option: TiDB Cloud (Free Forever, 100% MySQL Compatible)
1. Sign up for free at [tidbcloud.com](https://tidbcloud.com/).
2. Click **Create Cluster** -> select **Serverless (Free)**.
3. Once created, click **Connect**:
   - Choose connection method: **General / Java**.
   - Copy the Host, Port, Username, and Password.
4. Your connection details will look like:
   - `SPRING_DATASOURCE_URL`: `jdbc:mysql://gateway01.us-west-2.prod.aws.tidbcloud.com:4000/learnsphere?sslMode=VERIFY_IDENTITY`
   - `SPRING_DATASOURCE_USERNAME`: `<your-tidb-username>`
   - `SPRING_DATASOURCE_PASSWORD`: `<your-tidb-password>`

---

## 3. Deploying on Render

Once your repository is pushed to GitHub, you have **two easy methods** to deploy on Render:

### Method 1: Blueprint Deployment (Automatic 1-Click)
We have included a [`render.yaml`](./render.yaml) file in the repository.

1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> select **Blueprint**.
3. Connect your GitHub account and choose the `LearnSphere` repository.
4. Render will automatically detect `render.yaml` and configure both the backend and frontend!
5. In the environment variables screen, fill in your database credentials:
   - `SPRING_DATASOURCE_URL`
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`
6. Click **Apply**. Both services will build and deploy!

---

### Method 2: Manual Step-by-Step Services

#### 1. Backend Service (Spring Boot)
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository: `LearnSphere`.
3. Configure the service:
   - **Name**: `learnsphere-backend`
   - **Language / Environment**: `Docker`
   - **Docker Context Directory**: `learnsphere-backend`
   - **Dockerfile Path**: `learnsphere-backend/Dockerfile`
   - **Instance Type**: `Free`
4. Add **Environment Variables**:
   - `PORT`: `8080`
   - `SPRING_DATASOURCE_URL`: `<your-cloud-mysql-url>`
   - `SPRING_DATASOURCE_USERNAME`: `<your-cloud-mysql-username>`
   - `SPRING_DATASOURCE_PASSWORD`: `<your-cloud-mysql-password>`
5. Click **Create Web Service**. Wait for build to complete.
6. Copy your backend URL (e.g., `https://learnsphere-backend.onrender.com`).

#### 2. Frontend Service (React Static Site)
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect your GitHub repository: `LearnSphere`.
3. Configure the site:
   - **Name**: `learnsphere-frontend`
   - **Root Directory**: `learnsphere-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: `https://learnsphere-backend.onrender.com` *(paste your backend URL from above without trailing slash)*
5. Configure **Redirects / Rewrites** (crucial for React Router SPA):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## 4. Verification Checklist
- [x] Spring Boot dynamic port binding (`${PORT:8080}`) configured.
- [x] Spring Boot CORS mapped to wildcard patterns (`allowedOriginPatterns("*")`) with credentials enabled.
- [x] React frontend uses dynamic `VITE_API_URL` environment variable with fallback to `http://localhost:8080`.
- [x] React SPA client-side routing rewrite rule defined in `render.yaml`.
- [x] Multi-stage Dockerfile optimized with Eclipse Temurin 21 JRE for minimal footprint and fast startup.
