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

		window.onload = function() {
			// size and center the window
			var width = screen.width / 3.5;
			var height = screen.height / 1.6;
			window.resizeTo(width, height);
			window.moveTo(((screen.width - width) / 2), ((screen.height - height) / 2));
			
			// start building html
			var guiSessionList = document.getElementById("sessionSwapperGuiSessionList");
			
			// make the scrollbar look thinner by extending the width a little
			document.getElementById("sessionSwapperGuiSessionListContainer").style.width = width + 8;
			
			// always add _Default to the top
			addSessionButton(guiSessionList, defaultSessionName);
			
			// add any other sessions
			var sessionEnumerator = new Enumerator(sessionSwapperStorageObj.SubFolders);
			for (; !sessionEnumerator.atEnd(); sessionEnumerator.moveNext()) {
				var sessionName = sessionEnumerator.item().Name;
				if (sessionName != defaultSessionName) {
					addSessionButton(guiSessionList, sessionName);
				}
			}
			
			// footer
			var guiFooter = document.getElementById("sessionSwapperGuiFooter");
			guiFooter.innerHTML += "<div style='footerButton' onclick='openSessionDirectory()'>Open SessionSwapper dir</div>";
			
			// setup hover stuff
			var sessionChoiceButtons = document.getElementsByName('sessionChoice');
			for(var i = 0, j = sessionChoiceButtons.length; i < j; i++) {
				sessionChoiceButtons[i].onmouseover = function() {
					this.className = "sessionChoice_hover";
				}
				sessionChoiceButtons[i].onmouseout = function() {
					this.className = "sessionChoice";
				}
			}
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