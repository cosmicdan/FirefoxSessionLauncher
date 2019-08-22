@if (@X)==(@Y) @end /* Batch section [for JScript]

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: JavaScript utilities that are better or required to be in a second file (decoupled from the HTA gui)
::

@echo off 
setlocal

:: function entry points
IF "%~1"=="ACTIVATE" GOTO :ACTIVATE
GOTO :EOF

::::::::::::::::::::::
:: Functions
::::::::::::::::::::::

:ACTIVATE
ECHO [#] Waiting for Firefox [DO NOT CLOSE THIS WINDOW]...
:ACTIVATE_REPEAT
FOR /F "tokens=2" %%i IN ('tasklist /FI "WINDOWTITLE eq Mozilla Firefox*" ^| find /I "firefox.exe"') DO SET pid=%%i
IF NOT "%pid%" == "" (
	cscript //E:JScript //nologo "%~f0" "%~1"
	GOTO :EOF
)
:: tight loop for quick delay (should not get this far often)
FOR /L %%a in (1,1,100) DO ECHO.>nul
GOTO :ACTIVATE_REPEAT

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
@if (@X)==(@Y) @end JScript comment */ 

var sh=new ActiveXObject("WScript.Shell");
sh.AppActivate("Mozilla Firefox");

if (WScript.arguments(0) == "ACTIVATE")
	activate();

// Hack to bring Firefox window to the front, which is required for whatever reason [HTA window not only 
// steals focus but Firefox window goes to bottom of Z-order]. We start this async after everything is done.
function activate() {
	var sh=new ActiveXObject("WScript.Shell");
	sh.AppActivate("Mozilla Firefox");
}

