@echo off
echo ================================
echo Avvio Backend e Frontend
echo ================================


REM --- Avvio backend ---
echo Avvio backend...
cd backend
start cmd /k "npm run dev"


REM --- Avvio frontend ---
cd ../frontend
echo Avvio frontend...
start cmd /k "npm run dev"


REM --- Torna alla root ---
cd ..

echo ================================
echo Tutto avviato!
echo ================================
pause