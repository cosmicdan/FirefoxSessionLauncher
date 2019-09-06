@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

:: Get profile path
SET MOZ_PROFILE_PATH=%MOZ_CRASHREPORTER_EVENTS_DIRECTORY:\crashes\events=%
::SET MOZ_PROFILE_PATH=C:\Users\CosmicDan\AppData\Roaming\Mozilla\Firefox\Profiles\a80gphfl.default-esr
SET SESSIONLAUNCHER_DIR=%MOZ_PROFILE_PATH%\sessionlauncher
SET SESSIONLAUNCHER_STORAGE=%SESSIONLAUNCHER_DIR%\sessions

:: Logging
SET LOGFILE=%SESSIONLAUNCHER_DIR%\last.log
DEL /F /Q "%LOGFILE%">nul 2>&1

:: Check debug mode
SET DEBUG_ENABLED=FALSE
IF "%~1"=="debugMode" (
	SET DEBUG_ENABLED=TRUE
	CALL :LOG "[X] Debug mode enabled - console visible."
)

:: Create SessionLauncher folder[s] if required
IF NOT EXIST "%SESSIONLAUNCHER_STORAGE%\" (
	MKDIR "%SESSIONLAUNCHER_STORAGE%\"
	CALL :LOG "[i] Created directory- %SESSIONLAUNCHER_STORAGE%\"
)

:: Create default session if required [we need at least one session]
SET DEFAULT_SESSION_NAME=_Default
CALL :LOG "[i] Default session name- %DEFAULT_SESSION_NAME%"
IF NOT EXIST "%SESSIONLAUNCHER_STORAGE%\%DEFAULT_SESSION_NAME%" (
	MKDIR "%SESSIONLAUNCHER_STORAGE%\%DEFAULT_SESSION_NAME%"
	CALL :LOG "[i] Created directory- %SESSIONLAUNCHER_STORAGE%\%DEFAULT_SESSION_NAME%\"
)

SET LAST_SESSION_NAME=[N\\A]

:: Check for previous session files and store them back to their right location, if possible
IF EXIST "%SESSIONLAUNCHER_DIR%\current_session" (
	:: First check if current_session exists [flag written by previous run of SessionLauncher]
	FOR /F "delims=" %%x IN (%SESSIONLAUNCHER_DIR%\current_session) DO SET LAST_SESSION=%%x
	SET LAST_SESSION_NAME=!LAST_SESSION!
	CALL :LOG "[i] Previous session found: !LAST_SESSION!"
	IF EXIST "%SESSIONLAUNCHER_STORAGE%\!LAST_SESSION!\" (
		:: Move the current sessionstore back to the last-active session folder. TODO: Only automatically overwrite if newer, otherwise prompt
		MOVE /Y "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4" "%SESSIONLAUNCHER_STORAGE%\!LAST_SESSION!\">nul
		:: Also move places.sqlite
		MOVE /Y "%MOZ_PROFILE_PATH%\places.sqlite" "%SESSIONLAUNCHER_STORAGE%\!LAST_SESSION!\">nul
		:: Delete lingering places.sqlite*
		PUSHD "%MOZ_PROFILE_PATH%">nul
		DEL /F /Q places.sqlite*>nul 2>&1
		POPD>nul
		CALL :LOG "    [i] sessionstore.jsonlz4 and places.sqlite transferred back to !LAST_SESSION!"
	) ELSE (
		:: Assume stale session
		DEL /F /Q "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4">nul
		DEL /F /Q "%MOZ_PROFILE_PATH%\places.sqlite">nul
		:: Delete lingering places.sqlite*
		PUSHD "%MOZ_PROFILE_PATH%">nul
		DEL /F /Q places.sqlite*>nul 2>&1
		POPD>nul
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
		RD /S /Q "%SESSIONLAUNCHER_STORAGE%\!LAST_SESSION!\sessionstore-backups">nul
		MOVE "%MOZ_PROFILE_PATH%\sessionstore-backups" "%SESSIONLAUNCHER_STORAGE%\!LAST_SESSION!\sessionstore-backups">nul
	)
) ELSE (
	:: No last session, so just erase the current session
	CALL :LOG "[i] No previous session found."
	IF EXIST "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4" (
		DEL /F /Q "%MOZ_PROFILE_PATH%\sessionstore.jsonlz4"
		CALL :LOG "    [i] Deleted stale sessionstore.jsonlz4"
	)
	IF EXIST "%MOZ_PROFILE_PATH%\places.sqlite" (
		DEL /F /Q "%MOZ_PROFILE_PATH%\places.sqlite"
		CALL :LOG "    [i] Deleted stale places.sqlite"
	)
	IF EXIST "%MOZ_PROFILE_PATH%\sessionstore-backups\" (
		RD /S /Q "%MOZ_PROFILE_PATH%\sessionstore-backups"
		CALL :LOG "    [i] Deleted stale sessionstore-backups\"
	)
	:: Delete lingering places.sqlite*
	PUSHD "%MOZ_PROFILE_PATH%">nul
	DEL /F /Q places.sqlite*>nul 2>&1
	POPD>nul
)

:: Load the menu
CALL :LOG "[#] Loading session menu ..."
for /F "delims=" %%a in ('mshta.exe "%~dp0\SessionLauncherGUI.hta"') DO SET "sessionChoice=%%a"

:: Process menu result
IF "!sessionChoice!"=="" (
	CALL :LOG "[X] User aborted, changing to %DEFAULT_SESSION_NAME%"
	SET sessionChoice=%DEFAULT_SESSION_NAME%
) ELSE (
	CALL :LOG "[i] Loading !sessionChoice! ..."
)
SET SESSION_SELECTED_DIR=%SESSIONLAUNCHER_STORAGE%\!sessionChoice!
IF NOT EXIST "%SESSION_SELECTED_DIR%\" (
	:: TODO: show a serious error. Somehow the menu showed a session folder that doesn't exist on disk.
	CALL :LOG "ERROR - todo [should not happen]"
)

:: Copy session file, if it exists
IF EXIST "%SESSION_SELECTED_DIR%\sessionstore.jsonlz4" (
	COPY /Y "%SESSION_SELECTED_DIR%\sessionstore.jsonlz4" "%MOZ_PROFILE_PATH%\"
	CALL :LOG "    [i] Copied sessionstore.jsonlz4 to current profile directory"
) ELSE (
	CALL :LOG "    [i] No sessionstore.jsonlz4 exists - assuming new session and continuing normally."
)
:: Copy places database, if it exists
IF EXIST "%SESSION_SELECTED_DIR%\places.sqlite" (
	COPY /Y "%SESSION_SELECTED_DIR%\places.sqlite" "%MOZ_PROFILE_PATH%\"
	CALL :LOG "    [i] Copied places.sqlite to current profile directory"
) ELSE (
	CALL :LOG "    [i] No places.sqlite exists - assuming new session and continuing normally."
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
ECHO !sessionChoice!> "%SESSIONLAUNCHER_DIR%\current_session"


::IF "%DEBUG_ENABLED%"=="TRUE" (
::	CALL :LOG "[X] Calling ACTIVATE via CALL first because DEBUG_ENABLED=TRUE..."
::	CALL :LOG "    Use CTRL+C to break if all is well and continue normally."
::	CALL "%~dp0\Utils.js.cmd" "ACTIVATE"
::)

CALL :LOG "[#] Starting ACTIVATE helper in background..."
START "" "%comspec%" /c "%~dp0\Utils.js.cmd ACTIVATE"


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
	:: Must quote this, otherwise stuff breaks if variable contains parenthesis or other batch special characters
	echo "%~1"
)
GOTO :EOF

