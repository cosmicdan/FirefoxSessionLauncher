var ws = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");

var sessionSwapperStorageDir = ws.ExpandEnvironmentStrings("%SESSIONSWAPPER_STORAGE%");
// sanity check - dont allow running manually
if (sessionSwapperStorageDir === "" || !fso.FolderExists(sessionSwapperStorageDir)) {
	alert("The SessionSwapper GUI cannot be run manually.");
	window.close();
}
var sessionSwapperStorageObj = fso.GetFolder(sessionSwapperStorageDir);
var defaultSessionName = ws.ExpandEnvironmentStrings("%DEFAULT_SESSION_NAME%");
var lastSessionName = ws.ExpandEnvironmentStrings("%LAST_SESSION_NAME%");

window.onload = function() {
	// size and center the window
	var guiWidth = screen.width / 3.5;
	var guiHeight = screen.height / 1.6;
	window.resizeTo(guiWidth, guiHeight);
	window.moveTo(((screen.width - guiWidth) / 2), ((screen.height - guiHeight) / 2));
	
	var guiSessionList = document.getElementById("sessionSwapperGuiSessionList");
	
	// make the scrollbar look thinner by extending the width a little
	var guiSessionListContainer = document.getElementById("sessionSwapperGuiSessionListContainer");
	guiSessionListContainer.style.width = guiWidth + 8;
	
	// fade handling
	var guiListFadeTop = document.getElementById("sessionListFadeTop");
	guiSessionList.onscroll = function() {
		if (guiSessionList.scrollTop > 0) {
			guiListFadeTop.style.left = "0";
		} else {
			guiListFadeTop.style.left = "99999";
		}
	};
	
	// set previous session
	var guiSessionPrev = document.getElementById("sessionSwapperGuiSessionPrevious");
	if (lastSessionName === "[N\\\\A]") {
		guiSessionPrev.innerHTML = "<div name='sessionChoice' class='sessionChoice' style=\"font-style:italic;cursor:default;\">None</div>";
	} else {
		guiSessionPrev.innerHTML = "<div name='sessionChoice' class='sessionChoice' onmouseover=\"sessionHover(this)\" onmouseout=\"sessionUnhover(this)\" onclick=\"selectSession('" + lastSessionName + "')\">" + lastSessionName + "</div>";
	}
	
	// add any other sessions
	// always add _Default to the top though
	addSessionButton(guiSessionList, defaultSessionName);
	var sessionEnumerator = new Enumerator(sessionSwapperStorageObj.SubFolders);
	for (; !sessionEnumerator.atEnd(); sessionEnumerator.moveNext()) {
		var sessionName = sessionEnumerator.item().Name;
		if (sessionName != defaultSessionName) {
			addSessionButton(guiSessionList, sessionName);
		}
	}
	
	// footer
	var guiFooter = document.getElementById("sessionSwapperGuiFooter");
	guiFooter.innerHTML += "<div class='footerButton' onclick='openSessionDirectory()'>Open SessionSwapper dir</div>";
	
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
	var percentageOfHeader = getElementHeight("sessionSwapperGuiHeader") / bodyHeight * 100;
	var percentageOfFooter = getElementHeight("sessionSwapperGuiFooter") / bodyHeight * 100;
	guiSessionListContainer.style.height = 100 - percentageOfHeader - percentageOfFooter + "%";
	var guiListFadeBottom = document.getElementById("sessionListFadeBottom");
	guiListFadeBottom.style.bottom = (guiFooter.clientHeight - 1);
}

function addSessionButton(guiSessionList, sessionName) {
	guiSessionList.innerHTML += "<div name='sessionChoice' class='sessionChoice' onmouseover=\"sessionHover(this)\" onmouseout=\"sessionUnhover(this)\" onclick=\"selectSession('" + sessionName + "')\">" + sessionName + "</div>";
}

function sessionHover(e) {
	e.className = "sessionChoice_hover";
}

function sessionUnhover(e) {
	e.className = "sessionChoice";
}

function selectSession(sessionName) {
	fso.GetStandardStream(1).WriteLine(sessionName);
	window.close();
}

function openSessionDirectory() {
	ws.run("Explorer /n, /e, " + sessionSwapperStorageDir);
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