@echo off
set SRC="C:\Users\naoto\.gemini\antigravity\brain\cefb015b-4e18-4587-9b5e-7d40eb4b3867\media__1775172338418.jpg"
set DST="static\images\profile.jpg"
echo Copying %SRC% to %DST%
copy %SRC% %DST%
if %ERRORLEVEL% EQU 0 (echo SUCCESS) else (echo FAILURE)
dir %DST%
