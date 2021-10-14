// config.js
const debugMode = false;

try {
	var proc = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);	
	var env = Components.classes["@mozilla.org/process/environment;1"].getService(Components.interfaces.nsIEnvironment);
	
	file.initWithPath(env.get("COMSPEC"));
	proc.init(file);
	var args = ["/c", "SessionLauncher\\SessionLauncher.cmd", debugMode ? "debugMode" : ""];
	if (!debugMode)
			proc.startHidden = true;
	proc.run(true,args,args.length);
} catch(e) {};
