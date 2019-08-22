<!-- :: Batch section [for HTA/JavaScript]
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

:: Get profile path
SET MOZ_PROFILE_PATH=%MOZ_CRASHREPORTER_EVENTS_DIRECTORY:\crashes\events=%
::SET MOZ_PROFILE_PATH=C:\Users\CosmicDan\AppData\Roaming\Mozilla\Firefox\Profiles\a80gphfl.default-esr
SET SESSIONSWAPPER_DIR=%MOZ_PROFILE_PATH%\SessionSwapper
SET SESSIONSWAPPER_STORAGE=%SESSIONSWAPPER_DIR%\sessions

:: Logging
SET LOGFILE=%SESSIONSWAPPER_DIR%\last.log
DEL /F /Q "%LOGFILE%">nul 2>&1

:: Check debug mode
SET DEBUG_ENABLED=FALSE
IF "%~1"=="debugMode" (
	SET DEBUG_ENABLED=TRUE
	CALL :LOG "[X] Debug mode enabled - console visible."
)

:: Create SessionSwapper folder[s] if required
IF NOT EXIST "%SESSIONSWAPPER_STORAGE%\" (
	MKDIR "%SESSIONSWAPPER_STORAGE%\"
	CALL :LOG "[i] Created directory- %SESSIONSWAPPER_STORAGE%\"
)

SET DEFAULT_SESSION_NAME=_Default
CALL :LOG "[i] Default session name- %DEFAULT_SESSION_NAME%"

:: Create default session if required [we need at least one session]

IF NOT EXIST "%SESSIONSWAPPER_STORAGE%\%DEFAULT_SESSION_NAME%" (
	MKDIR "%SESSIONSWAPPER_STORAGE%\%DEFAULT_SESSION_NAME%"
	CALL :LOG "[i] Created directory- %SESSIONSWAPPER_STORAGE%\%DEFAULT_SESSION_NAME%\"
)



:: Check for previous session files and store them back to their right location, if possible
IF EXIST "%SESSIONSWAPPER_DIR%\current_session" (
	:: First check if current_session exists [flag written by previous run of SessionSwapper]
	FOR /F "delims=" %%x IN (%SESSIONSWAPPER_DIR%\current_session) DO SET LAST_SESSION=%%x
	CALL :LOG "[i] Previous session found: !LAST_SESSION!"
	IF EXIST "%SESSIONSWAPPER_STORAGE%\!LAST_SESSION!\" (
		:: Move the current sessionstore back to the last-active session folder. TODO: Only automatically overwrite if newer, otherwise prompt
		MOVE /Y "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4" "%SESSIONSWAPPER_STORAGE%\!LAST_SESSION!\">nul
		CALL :LOG "    [i] sessionstore.jsonlz4 transferred back to !LAST_SESSION!"
	) ELSE (
		:: Assume stale session
		DEL /F /Q "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4">nul
		CALL :LOG "    [i] current_session points to a session that no longer exists. Assuming stale and deleting."
	)
	:: Also check the sessionstore-backups directory
	FOR %%i IN (%MOZ_PROFILE_PATH%\sessionstore-backups) DO SET ss_attribs=%%~ai
	IF "!ss_attribs:~-3,1!" == "l" (
		:: sessionstore-backups is a symlink, as it should be - so just delete it
		RD "%MOZ_PROFILE_PATH%\sessionstore-backups">nul
		CALL :LOG "    [i] Last sessionstore-backups symlink removed"
	) ELSE (
		::TODO: Untracked session handling
		CALL :LOG "    [i] current_session is populated but sessionstore-backups is not a symlink. Assuming Firefox derped symlinks so manually moving back."
		RD /S /Q "%SESSIONSWAPPER_STORAGE%\!LAST_SESSION!\sessionstore-backups">nul
		MOVE "%MOZ_PROFILE_PATH%\sessionstore-backups" "%SESSIONSWAPPER_STORAGE%\!LAST_SESSION!\sessionstore-backups">nul
	)
) ELSE (
	:: No last session, so just erase the current session
	CALL :LOG "[i] No previous session found."
	IF EXIST "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4" (
		DEL /F /Q "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4"
		CALL :LOG "    [i] Deleted stale sessionstore.jsonlz4"
	)
	IF EXIST "%MOZ_PROFILE_PATH%\sessionstore-backups\" (
		RD /S /Q "%MOZ_PROFILE_PATH%\sessionstore-backups"
		CALL :LOG "    [i] Deleted stale sessionstore-backups\"
	)
)

:: Load the menu
CALL :LOG "[#] Loading session menu ..."
for /F "delims=" %%a in ('mshta.exe "%~F0"') DO SET "sessionChoice=%%a"

:: Process menu result
IF "!sessionChoice!"=="" (
	CALL :LOG "[X] User aborted, changing to %DEFAULT_SESSION_NAME%"
	SET sessionChoice=%DEFAULT_SESSION_NAME%
) ELSE (
	CALL :LOG "[i] Loading !sessionChoice! ..."
)
SET SESSION_SELECTED_DIR=%SESSIONSWAPPER_STORAGE%\!sessionChoice!
IF NOT EXIST "%SESSION_SELECTED_DIR%\" (
	:: TODO: show a serious error. Somehow the menu showed a session folder that doesn't exist on disk.
	CALL :LOG "ERROR - todo [should not happen]"
)

:: Copy session file, if it exists
IF EXIST "%SESSION_SELECTED_DIR%\sessionstore.jsonlz4" (
	COPY /Y "%SESSION_SELECTED_DIR%\sessionstore.jsonlz4" "%MOZ_PROFILE_PATH%\"
	CALL :LOG "    [i] Copied sessionstore.jsonlz to current profile directory"
) ELSE (
	CALL :LOG "    [i] No sessionstore.jsonlz exists - assuming new session and continuing normally."
)

:: Create and/or link sessionstore-backups
IF NOT EXIST "%SESSION_SELECTED_DIR%\sessionstore-backups\" (
	MKDIR "%SESSION_SELECTED_DIR%\sessionstore-backups\"
	CALL :LOG "    [i] No sessionstore-backups\ existed - assuming new session and created new folder"
)
RD /S /Q "%MOZ_PROFILE_PATH%\sessionstore-backups">nul 2>&1
MKLINK /D "%MOZ_PROFILE_PATH%\sessionstore-backups" "%SESSION_SELECTED_DIR%\sessionstore-backups"
CALL :LOG "    [i] Created sessionstore-backups\ symbolic link"

:: Write-out current_session
ECHO !sessionChoice!> "%SESSIONSWAPPER_DIR%\current_session"


::IF "%DEBUG_ENABLED%"=="TRUE" (
::	CALL :LOG "[X] Calling ACTIVATE via CALL first because DEBUG_ENABLED=TRUE..."
::	CALL :LOG "    Use CTRL+C to break if all is well and continue normally."
::	CALL "%~dp0\SessionSwapperUtils.js.cmd" "ACTIVATE"
::)

CALL :LOG "[#] Starting ACTIVATE helper in background..."
START "" "%comspec%" /c "%~dp0\SessionSwapperUtils.js.cmd ACTIVATE"


:: manual debug (breaks activation script obviously)
::IF "%DEBUG_ENABLED%"=="TRUE" (
::	CALL :LOG "[?] Pausing before close for debug"
::	pause
::)

CALL :LOG "[i] All done! See you next time!"
GOTO :EOF

:LOG
echo %~1 >> "%LOGFILE%"
IF "%DEBUG_ENABLED%"=="TRUE" (
	echo %~1
)
GOTO :EOF

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

-->
<!DOCTYPE html>
<HTML>
<HEAD>
<HTA:APPLICATION 
	APPLICATIONNAME="Firefox SessionSwapper"
	VERSION="1.0.0"
	icon="..\firefox.exe"
	SCROLLFLAT="yes"
	SCROLL="yes"
	SYSMENU="no"
	CAPTION="no"
	BORDER="none"
	SYSMENU="no"
	SINGLEINSTANCE="yes"
	SELECTION="no"
	CONTEXTMENU="no"
	INNERBORDER="no"
>
<meta http-equiv="x-ua-compatible" content="ie=9">

<title>Firefox SessionSwapper</title>
<script language="JavaScript">

var ws = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");

var sessionSwapperStorageDir = ws.ExpandEnvironmentStrings("%SESSIONSWAPPER_STORAGE%");
var sessionSwapperStorageObj = fso.GetFolder(sessionSwapperStorageDir);
var defaultSessionName = ws.ExpandEnvironmentStrings("%DEFAULT_SESSION_NAME%");

window.onload = function() {
	var width = screen.width / 3.5;
    var height = screen.height / 1.6;
    window.resizeTo(width, height);
    window.moveTo(((screen.width - width) / 2), ((screen.height - height) / 2));
	// start building html
	var menuHtml = document.getElementById("SessionSwapperMenu");
	
	// always add _Default to the top
	addSessionButton(menuHtml, defaultSessionName);
	
	// add any other sessions
	var sessionEnumerator = new Enumerator(sessionSwapperStorageObj.SubFolders);
	for (; !sessionEnumerator.atEnd(); sessionEnumerator.moveNext()) {
		var sessionName = sessionEnumerator.item().Name;
		if (sessionName != defaultSessionName) {
			addSessionButton(menuHtml, sessionName);
		}
	}
	
	// footer stuff
	menuHtml.innerHTML += "<hr></hr><button style='footerButton' onclick='openSessionDirectory()'>Open SessionSwapper dir</button>";
	
	// setup hover stuff
	var sessionChoiceButtons = document.getElementsByName('sessionChoice');
	for(var i = 0, j = sessionChoiceButtons.length; i < j; i++) {
		// "Scales" them when hovered
		sessionChoiceButtons[i].onmouseover = function() {
			this.className = "sessionChoice_hover";
		}
		sessionChoiceButtons[i].onmouseout = function() {
			this.className = "sessionChoice";
		}
	}
}

function addSessionButton(menuHtml, sessionName) {
	menuHtml.innerHTML += "<button name='sessionChoice' class='sessionChoice' onclick=\"selectSession('" + sessionName + "')\">" + sessionName + "</button>";
}

function selectSession(sessionName) {
	fso.GetStandardStream(1).WriteLine(sessionName)
	window.close()
}

function openSessionDirectory() {
	ws.run("Explorer /n, /e, " + sessionSwapperStorageDir);
}
	
	
	
</script>
<link rel="stylesheet" type="text/css" href="SessionSwapper.css" />
</HEAD>
<BODY>
<center><table><tr align="center"><td valign="top">
	<div id="SessionSwapperMenu"></div>
</td></tr></table></center>
</BODY>
</HTML>

