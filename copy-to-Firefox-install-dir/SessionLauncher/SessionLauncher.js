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

window.onload = function() {
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
		guiSessionPrev.innerHTML += "<span name='sessionChoice' class='sessionChoice' onmouseover=\"sessionHover(this)\" onmouseout=\"sessionUnhover(this)\" onclick=\"selectSession('" + lastSessionName + "')\">" + lastSessionName + "</span>";
	}
	guiSessionPrev.innerHTML += "</div>";
	
	// add any other sessions
	// always add _Default to the top though
	addSessionButton(guiSessionList, defaultSessionName);
	var sessionEnumerator = new Enumerator(sessionLauncherStorageObj.SubFolders);
	for (; !sessionEnumerator.atEnd(); sessionEnumerator.moveNext()) {
		var sessionName = sessionEnumerator.item().Name;
		if (sessionName != defaultSessionName) {
			addSessionButton(guiSessionList, sessionName);
		}
	}
	
	// footer buttons
	var guiFooter = document.getElementById("sessionLauncherGuiFooter");
	guiFooter.innerHTML += "<div class='button' onmouseover=\"buttonHover(this)\" onmouseout=\"buttonUnhover(this)\" onclick='newSession()'>New...</div>";
	
	// make the scrollbar look thinner by extending the width a little
	var guiSessionListContainer = document.getElementById("sessionLauncherGuiSessionListContainer");
	guiSessionListContainer.style.width = guiWidth + 8;
	// also enlarge guiSessionPrev by same so they're aligned
	guiSessionPrev.style.width = guiWidth + 8;
	
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
	
	// finally, fixup the height on the scroll list div and align bottom fade
	var bodyHeight = document.body.offsetHeight;
	var percentageOfHeader = getElementHeight("sessionLauncherGuiHeader") / bodyHeight * 100;
	var percentageOfFooter = getElementHeight("sessionLauncherGuiFooter") / bodyHeight * 100;
	guiSessionListContainer.style.height = 100 - percentageOfHeader - percentageOfFooter + "%";
	var guiListFadeBottom = document.getElementById("sessionListFadeBottom");
	guiListFadeBottom.style.bottom = (guiFooter.clientHeight - 1);
}

function addSessionButton(guiSessionList, sessionName) {
	guiSessionList.innerHTML += "<div><span name='sessionChoice' class='sessionChoice' onmouseover=\"sessionHover(this)\" onmouseout=\"sessionUnhover(this)\" onclick=\"selectSession('" + sessionName + "')\">" + sessionName + "</span></div>"
}

function sessionHover(e) {
	e.className = "sessionChoice_hover";
}

function sessionUnhover(e) {
	e.className = "sessionChoice";
}

function buttonHover(e) {
	e.className = "button_hover";
}

function buttonUnhover(e) {
	e.className = "button";
}

function selectSession(sessionName) {
	fso.GetStandardStream(1).WriteLine(sessionName);
	window.close();
}

function newSession() {
	var newSessionName = prompt("Session name:", "");
	if (newSessionName == null || newSessionName === "") {
		// user cancelled or entered nothing
		return;
	}
	var newSessionPath = sessionLauncherStorageDir + "\\" + newSessionName;
	if (fso.FolderExists(newSessionPath)) {
		// session exists, cancel
		alert("Session '" + newSessionName + "' already exists. Cancelled.");
		return;
	}
	// try creating the folder
	try {
		fso.CreateFolder(newSessionPath);
	}
	catch (err) {
		alert("Error creating session folder. Either the folder name is" + "\n" + 
			"invalid (special characters) or a security exception occured.");
	}
	location.reload(true);
}

/*
function openSessionDirectory() {
	ws.run("Explorer /n, /e, " + sessionLauncherStorageDir);
}
*/

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