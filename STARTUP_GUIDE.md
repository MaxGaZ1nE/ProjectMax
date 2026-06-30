# ✅ Quick Startup Guide - QINO Delivery Registration System

## 🚀 Starting the System

### **Step 1: Start Backend Server**
Open **Command Prompt** or **PowerShell**:
```
cd C:\Users\palap\backend
npm start
```

Wait for message: `✅ Server running on port 3000`

### **Step 2: Start Frontend Server** (New Terminal/Tab)
Open another **Command Prompt** or **PowerShell**:
```
cd d:\mongkol\qino-template-fruit-store
npm run dev
```

Wait for message: `➜  local:   http://localhost:5173`

---

## 📍 Access URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Delivery Signup** | http://localhost:5173/delivery/register |
| **Backend API** | http://localhost:3000/api |
| **Admin Panel** | http://localhost:5173/admin/users |

---

## ❌ Troubleshooting

### Error: "Route not found: POST /api/delivery/register/step1"
- ✓ Backend server must be running on port 3000
- ✓ Check terminal for `Server running on port 3000` message
- ✓ If error persists, stop backend and restart: `npm start`

### Frontend loads but shows blank page
- ✓ Check frontend server is running (should show `http://localhost:5173`)
- ✓ Clear browser cache: `Ctrl+Shift+Delete` then reload

### Database connection error
- ✓ PostgreSQL must be running
- ✓ Database `qino_fruit_store` must exist
- ✓ Run migration: `node run-delivery-migration.js`

---

## 🧪 Testing the Delivery Registration

1. ✅ Go to http://localhost:5173
2. ✅ Login or create account
3. ✅ Navigate to http://localhost:5173/delivery/register
4. ✅ Fill **Step 1**: Name, Phone, Email
5. ✅ Click **ถัดไป** → Should proceed to Step 2
6. ✅ Fill **Step 2**: Documents and vehicle info
7. ✅ Click **ถัดไป** → Should proceed to Step 3
8. ✅ Review and click **ส่งคำขอ** → Should show pending approval message

---

## 🛑 Stopping the Servers

Press **Ctrl+C** in either terminal to stop the server.

---

*Last Updated: 2024*
