@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
    python serve.py
) else (
    py serve.py
)
pause
