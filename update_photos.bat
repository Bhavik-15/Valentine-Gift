@echo off
echo Updating photo lists...
powershell -ExecutionPolicy Bypass -File "%~dp0update_script.ps1"
echo Done! data.js has been perfectly updated with your latest photos.
pause
