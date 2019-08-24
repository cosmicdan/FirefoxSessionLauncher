# SessionLauncher

Session Manager for classic Firefox hasn't been properly replicated, 'Tab Session Manager' is close but has some serious issues - likely because the same capability simply cannot be done via WebExtensions.

So out of sheer frustration with Waterfox + Session Manager suffering from bitrot and performance issues, I decided to finally migrate to Firefox and just make myself the one thing that was missing - and so SessionLauncher was born.

Leveraging the awesome power of Windows Batch and Internet Explorer HTA's (*cough*), I have made this Windows-only launcher that, by hooking the Firefox (ESR recommended) config.js system, uses a GUI to manage and launch a session early in the Firefox profile loading process. This results in a single profile session, sharing all data, except for the "session" (current tabs) which are categorized and managed yourself.

TODO: Credits (icons8.com, the guys where I got the config.js stuff from - it's in one of my Waterfox tabs somewhere...)