# How to Run Paperboy 🗞️🎙️

Follow these quick commands to start both the backend server and the mobile app.

---

## 1. Start the Backend API

Navigate to the `backend/` directory and start the TSX development watcher:

```bash
# Go to backend folder
cd backend

# Install dependencies (first-time setup)
npm install

# Start the development API server
npm run dev
```

*The backend will boot up at `http://localhost:3001`.*

---

## 2. Start the Frontend App (iOS Simulator)

Navigate to the root directory of the project and run the Expo build command:

```bash
# Go to project root (if inside backend)
cd ..

# Install dependencies (first-time setup)
npm install

# Build and run the app on the iOS Simulator
npx expo run:ios
```

---

## 3. Daily Development Workflow

Keep two terminal windows open:

- **Terminal 1 (Backend)**: `cd backend && npm run dev`
- **Terminal 2 (App Packager)**: `npx expo run:ios` (or press `r` to reload, `j` to open debugger).

---

## 🛠️ Cleaning & Rebuilding (Troubleshooting)

If you change native config plugins (under `/plugins`) or Swift widgets (under `/ios-native`), run a clean prebuild before compiling:

```bash
npx expo prebuild --clean && npx expo run:ios
```

---

## 💡 Alternative Commands

You can run these alternative commands depending on what you want to achieve:

### 1. Daily Startup (Skip compiling Xcode every time)
If you already compiled the native app once and haven't changed any config plugins or native Swift code, you can start the bundler instantly without building the app binary again:
```bash
# Start the Metro bundler server
npx expo start

# OR using the npm shortcut defined in package.json
npm start
```
*Once Metro starts, press `i` to open in the simulator, or press `r` to reload.*

### 2. Standard Scripts (via npm)
Your `package.json` defines these easy-to-use npm shortcuts:
```bash
# Compile and run on iOS Simulator (equivalent to npx expo run:ios)
npm run ios

# Compile and run on Android Emulator
npm run android

# Start the Expo developer interface
npm start
```

