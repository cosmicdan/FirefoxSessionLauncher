var ws = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");

var sessionLauncherStorageDir = ws.ExpandEnvironmentStrings("%SESSIONLAUNCHER_STORAGE%");
// sanity check - dont allow running manually
if (sessionLauncherStorageDir === "" || !fso.FolderExists(sessionLauncherStorageDir)) {
	alert("The SessionLauncher GUI cannot be run manually.");
	window.close();
}
var sessionLauncherStorageObj = fso.GetFolder(sessionLauncherStorageDir);
var defaultSessionName = ws.ExpandEnvironmentStrings("%DEFAULT_SESSION_NAME%");
var lastSessionName = ws.ExpandEnvironmentStrings("%LAST_SESSION_NAME%");
// session counter for hover/control stuff
var sessionRow = 0;

window.onload = function() {
	sessionRow = 0;
	
	// size and center the window
	var guiWidth = screen.width / 3.5;
	var guiHeight = screen.height / 1.4;
	window.resizeTo(guiWidth, guiHeight);
	window.moveTo(((screen.width - guiWidth) / 2), ((screen.height - guiHeight) / 2));
	
	var guiSessionList = document.getElementById("sessionLauncherGuiSessionList");
	
	// fade handling
	var guiListFadeTop = document.getElementById("sessionListFadeTop");
	guiSessionList.onscroll = function() {
		if (guiSessionList.scrollTop > 0) {
			guiListFadeTop.style.left = "0";
		} else {
			guiListFadeTop.style.left = "99999";
		}
	};
	
	// check if previous session still exists
	// set previous session display
	var guiSessionPrev = document.getElementById("sessionLauncherGuiSessionPrevious");
	guiSessionPrev.innerHTML = "<div>";
	if (lastSessionName === "[N\\\\A]" || !fso.FolderExists(sessionLauncherStorageDir + "\\" + lastSessionName)) {
		guiSessionPrev.innerHTML += "<span name='sessionChoice' class='sessionChoice' style=\"font-style:italic;cursor:default;\">None</span>";
	} else {
		addSessionRow(guiSessionPrev, lastSessionName);
	}
	guiSessionPrev.innerHTML += "</div>";
	
	// add all other sessions
	// always add _Default to the top though
	guiSessionList.innerHTML = "<div>";
	addSessionRow(guiSessionList, defaultSessionName);
	var sessionEnumerator = new Enumerator(sessionLauncherStorageObj.SubFolders);
	for (; !sessionEnumerator.atEnd(); sessionEnumerator.moveNext()) {
		var sessionName = sessionEnumerator.item().Name;
		if (sessionName != defaultSessionName) {
			addSessionRow(guiSessionList, sessionName);
		}
	}
	guiSessionPrev.innerHTML += "</div>";
	
	// footer buttons
	var guiFooterLeft = document.getElementById("sessionLauncherGuiFooterLeft");
	guiFooterLeft.innerHTML += "<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='newSessionDialog()'>New...</div>";
	var guiFooterRight = document.getElementById("sessionLauncherGuiFooterRight");
	guiFooterRight.innerHTML += "<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='aboutDialog()'>About</div>";
	
	// setup hover stuff
	var sessionChoiceButtons = document.getElementsByName('sessionChoice');
	for(var i = 0, j = sessionChoiceButtons.length; i < j; i++) {
		sessionChoiceButtons[i].onmouseover = function() {
			this.className = "sessionChoice_hover";
		};
		sessionChoiceButtons[i].onmouseout = function() {
			this.className = "sessionChoice";
		};
	}
	
	var guiSessionListContainer = document.getElementById("sessionLauncherGuiSessionListContainer");
	// finally, fixup the height on the scroll list div and align bottom fade
	var bodyHeight = document.body.offsetHeight;
	var percentageOfHeader = getElementHeight("sessionLauncherGuiHeader") / bodyHeight * 100;
	var percentageOfFooter = getElementHeight("sessionLauncherGuiFooter") / bodyHeight * 100;
	guiSessionListContainer.style.height = 100 - percentageOfHeader - percentageOfFooter + "%";
	var guiListFadeBottom = document.getElementById("sessionListFadeBottom");
	var guiFooter = document.getElementById("sessionLauncherGuiFooter");
	guiListFadeBottom.style.bottom = (guiFooter.clientHeight - 1);
	
	// make the scrollbar look thinner by extending the width a little
	guiSessionListContainer.style.width = guiWidth + 8;
	// also resize guiSessionPrev depending on if scroll bar is visible
	guiSessionPrev.style.width = guiWidth + (guiSessionList.scrollHeight > guiSessionList.offsetHeight ? -8 : 8);
	
	// DEBUG
	//newSessionDialog();
}

function addSessionRow(guiSessionListIn, sessionNameIn) {
	// session name
	guiSessionListIn.innerHTML += 
		"<span id='sessionChoice_" + sessionRow + "' name='sessionChoice' class='sessionChoice' onmouseover=\"sessionHover(" + sessionRow + ")\" onmouseout=\"sessionUnhover(" + sessionRow + ")\" onclick=\"selectSession('" + sessionNameIn + "')\">" + sessionNameIn + "</span>"
	// copy button
	guiSessionListIn.innerHTML +=
		"<span id='sessionChoiceCopy_" + sessionRow + "' class='sessionChoiceBtnHidden' onmouseover=\"sessionChoiceCopyHover(this, " + sessionRow + ")\" onmouseout=\"sessionChoiceCopyUnhover(this, " + sessionRow + ")\" onclick=\"copySessionDialog('" + sessionNameIn + "')\"></span>"
	// rename and delete buttons
	if (sessionNameIn === defaultSessionName) {
		// don't show rename or delete for DEFAULT session
		guiSessionListIn.innerHTML +=
			"<span id='sessionChoiceRename_" + sessionRow + "' style=visibility:hidden;'></span>";
		guiSessionListIn.innerHTML +=
			"<span id='sessionChoiceDelete_" + sessionRow + "' style=visibility:hidden;'></span>";
	} else {
		// regular session
		guiSessionListIn.innerHTML +=
			"<span id='sessionChoiceRename_" + sessionRow + "' class='sessionChoiceBtnHidden' onmouseover=\"sessionChoiceRenameHover(this, " + sessionRow + ");\" onmouseout=\"sessionChoiceRenameUnhover(this, " + sessionRow + ")\" onclick=\"renameSessionDialog('" + sessionNameIn + "')\"></span>";
		guiSessionListIn.innerHTML +=
			"<span id='sessionChoiceDelete_" + sessionRow + "' class='sessionChoiceBtnHidden' onmouseover=\"sessionChoiceDeleteHover(this, " + sessionRow + ")\" onmouseout=\"sessionChoiceDeleteUnhover(this, " + sessionRow + ")\" onclick=\"deleteSessionDialog('" + sessionNameIn + "')\"></span>"
	}
	sessionRow += 1;
}

// all the hover stuff
function sessionHover(sessionRowIn) {
	document.getElementById("sessionChoice_" + sessionRowIn).className = "sessionChoice_hover";
	// show the buttons for this row
	document.getElementById("sessionChoiceRename_" + sessionRowIn).className = "sessionChoiceRename";
	document.getElementById("sessionChoiceCopy_" + sessionRowIn).className = "sessionChoiceCopy";
	document.getElementById("sessionChoiceDelete_" + sessionRowIn).className = "sessionChoiceDelete";
}
function sessionUnhover(sessionRowIn) {
	document.getElementById("sessionChoice_" + sessionRowIn).className = "sessionChoice";
	// hide the buttons for this row
	document.getElementById("sessionChoiceRename_" + sessionRowIn).className = "sessionChoiceBtnHidden";
	document.getElementById("sessionChoiceCopy_" + sessionRowIn).className = "sessionChoiceBtnHidden";
	document.getElementById("sessionChoiceDelete_" + sessionRowIn).className = "sessionChoiceBtnHidden";
}
function buttonHover(e) {e.className = "button_hover";}
function buttonUnhover(e) {e.className = "button";}
function sessionChoiceRenameHover(e, sessionRowIn) {sessionHover(sessionRowIn); e.className = "sessionChoiceRename_hover";}
function sessionChoiceRenameUnhover(e, sessionRowIn) {e.className = "sessionChoiceRename"; sessionUnhover(sessionRowIn);}
function sessionChoiceCopyHover(e, sessionRowIn) {sessionHover(sessionRowIn); e.className = "sessionChoiceCopy_hover";}
function sessionChoiceCopyUnhover(e, sessionRowIn) {e.className = "sessionChoiceCopy"; sessionUnhover(sessionRowIn);}
function sessionChoiceDeleteHover(e, sessionRowIn) {sessionHover(sessionRowIn); e.className = "sessionChoiceDelete_hover";}
function sessionChoiceDeleteUnhover(e, sessionRowIn) {e.className = "sessionChoiceDelete"; sessionUnhover(sessionRowIn);}

function selectSession(sessionName) {
	fso.GetStandardStream(1).WriteLine(sessionName);
	window.close();
}

function newSessionDialog() {
	showInputDialog("Create New Session", "Enter new session name", "Create", "newSessionConfirm()");
}

function newSessionConfirm() {
	var newSessionName = document.getElementById("promptinput").value;
	if (newSessionName == null || newSessionName === "") {
		// user cancelled or entered nothing
		alertDialog("Cancelled", "Cannot create a session with no name.", 3);
		return;
	}
	var newSessionPath = sessionLauncherStorageDir + "\\" + newSessionName;
	if (alertSessionPathExists(newSessionName, newSessionPath)) {
		return;
	}
	// try creating the folder
	try {
		fso.CreateFolder(newSessionPath);
		location.reload(true);
	}
	catch (err) {
		alertDialog("Error", "Error creating session folder. Either the folder name is invalid (special characters) or a security exception occured.");
	}
}

function deleteSessionDialog(sessionNameIn) {
	showInputDialog("Delete Session", "Are you sure? Type the session name <b>" + sessionNameIn + "</b> to confirm.", "Delete", "deleteSessionConfirm(\"" + sessionNameIn + "\")");
}

function deleteSessionConfirm(sessionNameIn) {
	var deleteConfirm = document.getElementById("promptinput").value;
	// this one doesn't like === for some reason (guessing input.value is not a string type)
	if (sessionNameIn == deleteConfirm) {
		fso.DeleteFolder(sessionLauncherStorageDir + "\\" + sessionNameIn);
		location.reload(true);
	} else {
		dialogCancel();
	}
}

function copySessionDialog(sessionNameIn) {
	showInputDialog("Copy Session", "Enter session name for copy of <b>" + sessionNameIn + "</b>", "Copy", "copySessionConfirm(\"" + sessionNameIn + "\")");
}

function copySessionConfirm(sessionNameIn) {
	var newSessionName = document.getElementById("promptinput").value;
	if (newSessionName == null || newSessionName === "") {
		// user cancelled or entered nothing
		dialogCancel();
		return;
	}
	var oldSessionPath = sessionLauncherStorageDir + "\\" + sessionNameIn;
	var newSessionPath = sessionLauncherStorageDir + "\\" + newSessionName;
	if (alertSessionPathExists(newSessionName, newSessionPath)) {
		return;
	}
	// try copying the folder
	try {
		fso.CopyFolder(oldSessionPath, newSessionPath);
		location.reload(true);
	}
	catch (err) {
		alertDialog("Error", "Error copying session folder. Either the folder name is invalid (special characters) or a security exception occured.");
	}
}

function renameSessionDialog(sessionNameIn) {
	showInputDialog("Rename Session", "Enter new session name for <b>" + sessionNameIn + "</b>", "Rename", "renameSessionConfirm(\"" + sessionNameIn + "\")");
}

function renameSessionConfirm(sessionNameIn) {
	var newSessionName = document.getElementById("promptinput").value;
	if (newSessionName == null || newSessionName === "") {
		// user cancelled or entered nothing
		dialogCancel();
		return;
	}
	var oldSessionPath = sessionLauncherStorageDir + "\\" + sessionNameIn;
	var newSessionPath = sessionLauncherStorageDir + "\\" + newSessionName;
	if (alertSessionPathExists(newSessionName, newSessionPath)) {
		return;
	}
	// try moving the folder
	try {
		fso.MoveFolder(oldSessionPath, newSessionPath);
		location.reload(true);
	}
	catch (err) {
		alertDialog("Error", "Error copying session folder. Either the folder name is invalid (special characters) or a security exception occured.");
	}
}

function showInputDialog(title, text, okButtonText, okFunctionName) {
	var promptOverlay = document.getElementById("promptOverlay");
	var promptBox = document.getElementById("promptBox");
	promptOverlay.style.width = document.body.offsetWidth;
	promptOverlay.style.height = document.body.offsetHeight;
	promptBox.style.visibility = "visible";
	promptBox.innerHTML =
	"<h1>" + title + "</h1>" +
	"<h3>" + text + "</h3>" +
	"<input type='text' id='promptinput'/>" +
	"<div id='promptButtonRow'>" +
		//"<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='" + okFunctionName + "()'>" + okButtonText + "</div>" +
		"<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='" + okFunctionName + "'>" + okButtonText + "</div>" +
		"<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='dialogCancel()'>Cancel</div>" +
	"</div>";
}

function aboutDialog() {
	var promptOverlay = document.getElementById("promptOverlay");
	var promptBox = document.getElementById("promptBox");
	promptOverlay.style.width = document.body.offsetWidth;
	promptOverlay.style.height = document.body.offsetHeight;
	promptBox.style.visibility = "visible";
	promptBox.innerHTML =
	"<h1>SessionLauncher</h1>" +
	"<h3>By Daniel 'CosmicDan' Connolly</h3>" +
	"<span id='aboutLink' onclick='new ActiveXObject(\"WScript.Shell\").run(\"https://www.github.com/cosmicdan/FirefoxSessionLauncher\")'>Visit github.com/cosmicdan/FirefoxSessionLauncher</span>" +
	"<h3 style='padding-top: 2em;'>Icons thanks to <span id='icons8link' onclick='new ActiveXObject(\"WScript.Shell\").run(\"https://icons8.com\")'>Icons8.com</span></h3>" +
	"<div id='promptButtonRow'>" +
		"<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='dialogCancel()'>OK</div>" +
	"</div>";
}

function alertDialog(alertTitle, alertText) {
	alertDialog(alertTitle, alertText, 0);
}

var timeoutToGo;

function alertDialog(alertTitle, alertText, timeout) {
	var promptOverlay = document.getElementById("promptOverlay");
	var promptBox = document.getElementById("promptBox");
	promptOverlay.style.width = document.body.offsetWidth;
	promptOverlay.style.height = document.body.offsetHeight;
	promptBox.style.visibility = "visible";
	promptBox.innerHTML =
	"<h1>" + alertTitle + "</h1>" +
	"<h3>" + alertText + "</h3>";
	if (timeout > 0) {
		promptBox.innerHTML += "<div id='promptButtonRow'>" +
			"<h3 id='returnCountdown'>...<h3>" +
		"</div>";
		timeoutToGo = timeout;
		window.setInterval(updateReturnCountdown, 1000);
		updateReturnCountdown();
		window.setTimeout(dialogCancel, timeout * 1000);
	} else {
		promptBox.innerHTML += "<div id='promptButtonRow'>" +
			"<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='dialogCancel()'>OK</div>" +
		"</div>";
	}
}

function updateReturnCountdown() {
	var returnCountdown = document.getElementById("returnCountdown");
	if (returnCountdown != null) {
		document.getElementById("returnCountdown").innerHTML = "Returning in " + timeoutToGo + " seconds..."
		timeoutToGo--;
	} else {
		timeoutToGo = 0;
		window.clearInterval();
	}
}

function dialogCancel() {
	window.clearTimeout();
	window.clearInterval();
	var promptOverlay = document.getElementById("promptOverlay");
	var promptBox = document.getElementById("promptBox");
	promptBox.innerHTML = "";
	promptBox.style.visibility = "hidden";
	promptOverlay.style.width = 0;
	promptOverlay.style.height = 0;
}

function alertSessionPathExists(newSessionNameIn, pathIn) {
	if (fso.FolderExists(pathIn)) {
		// session exists, cancel
		alertDialog("Cancelled", "Session '" + newSessionNameIn + "' already exists. Cancelled.");
		return true;
	}
}

/* offsetHeight doesn't include margins so we need this */
function getElementHeight(eId) {
	var e = document.getElementById(eId);
	var style = e.currentStyle
	
	var marginTop = 0;
	var marginBottom = 0;
	
	if (style.marginTop != "") {
		marginTop = parseInt(style.marginTop, 10);
	}

	if (style.marginBottom != "") {
		marginBottom = parseInt(style.marginBottom, 10);
	}
	return e.offsetHeight + marginTop + marginBottom;
}