@ECHO OFF
CD /D "C:\Apps\Internet\Firefox\SessionLauncher"
xcopy . "%~dp0\copy-to-Firefox-install-dir\SessionLauncher\" /S /E /Y
pause