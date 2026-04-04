@echo off

echo =========================================
echo Starting Portfolio Web Site...
echo Close this window to stop the server.
echo =========================================

echo.
echo Opening browser...
start http://127.0.0.1:5001/

echo.
echo Starting Flask server...
python app.py

pause
