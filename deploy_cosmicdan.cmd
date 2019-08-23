@ECHO OFF
CD "%~dp0\copy-to-Firefox-install-dir"
xcopy . "C:\Apps\Internet\Firefox" /S /E /Y
START "" "C:\Apps\Internet\Firefox\firefox.exe"