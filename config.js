// config.js

const Cu = Components.utils;
const debugMode = true;

try {
	Cu.import("resource://gre/modules/Services.jsm");
	Cu.import("resource://gre/modules/FileUtils.jsm");

	if (!Services.appinfo.inSafeMode) {
		var env = Components.classes["@mozilla.org/process/environment;1"].getService(Components.interfaces.nsIEnvironment);
		var shell = new FileUtils.File(env.get("COMSPEC"));
		var args = ["/c", "%CD%\\SessionLauncher\\SessionLauncher.cmd", debugMode ? "debugMode" : ""];

		var process = Components.classes["@mozilla.org/process/util;1"]
								.createInstance(Components.interfaces.nsIProcess);
		process.init(shell);
		if (!debugMode)
			process.startHidden = true;
		process.run(true, args, args.length);
	};
} catch(e) {};
