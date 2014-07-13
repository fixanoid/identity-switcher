// Copyright (c) 2014 soft_reseller.
// Use of this source code is governed by a license that can be
// found in the LICENSE file.

/*
1. Serialize all cookies
2. Serialize all bookmarks
3. Serialize all open tab urls and tab id
4. Save to storage

5. Reset cookie store to nothing
6. Empty out bookmarks
7. Close all tabs and open new home tab
8. Update popup with previous identity to switch back to
*/


function init() {
	// ProfileManager.init();

	// load profiles.
	ProfileManager.load();

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if (request.action == 'new-identity') {
				// Request to save identity
				ProfileManager.collect();
			} else if (request.action == 'get-profiles') {
				// popup needs all profiles

				// TODO: probably should only send names/ids
				sendResponse(ProfileManager.profiles);
			} else if (request.action == 'load-profile') {
				ProfileManager.restore(request.profileName);
			} else if (request.action == 'clear-identity') {
				// reset browsers cookies and tabs
				ProfileManager.current = null;

				ProfileManager.clear();
			}
		});
}

var storage = chrome.storage.local;
var ProfileManager = {
	current: null,
	profiles: {},

	/*

	init: function() {
		$(this).bind( 'cookies-complete', function(e, o) {
			if (o) {
				o.cookiesComplete = true;
			}

			e.stopPropagation();
		} );

		$(this).bind( 'tabs-complete', function(e, o) {
			if (o) {
				current.tabsComplete = true;
			}

			e.stopPropagation();
		} );

		$(this).bind( 'tabs-close', function(e, o) {
			if (o) {
				current.tabsClosed = true;
			}

			e.stopPropagation();
		} );

		$(this).bind( 'cookie-nuke', function(e, o) {
			if (o) {
				current.cookiesNuked = true;
			}

			e.stopPropagation();
		} );

		$(this).bind( 'cookie-restore', function(e, o) {
			e.stopPropagation();
		} );
	},

	*/

	clear: function() {
		// nukes the browsers cookies and tabs
		CookieManager.nuke();

		chrome.tabs.create({}, function(tab) {
			TabsManager.close(tab.id);
		});
	},

	restore: function(profileName) {
		// check if requested profile name exists in profiles
		if (!(profileName in this.profiles)) {
			return;
		}

		// reset everything before loading cookies and tabs
		this.clear();

		this.current = this.profiles[profileName];

		// load cookies and tabs
		// CookieManager.restore(this.profiles[profileName].cookies);
		// TabsManager.restore(this.profiles[profileName].tabs);
	},

	collect: function() {
		var profile = {};
		profile.name = 'current';
		profile.cookies = {};
		profile.tabs = {};

		this.current = profile;

		this.add(profile);

		CookieManager.getAllCookies();
		TabsManager.getAllTabs();
	},

	load: function() {
		storage.get('profiles', function(o) {
			if (!o.profiles) {
				return;
			}

			ProfileManager.profiles = o.profiles;
		});

		if (this.profiles == undefined) {
			this.profiles = {};
		}
	},

	add: function(p) {
		this.profiles[p.name] = p;
	},

	store: function() {
		if (!this.profiles) {
			return;
		}

		storage.set({'profiles': this.profiles});
	},

	listen: function(e) {
		if (!this.current) {
			return;
		}

		if (e == 'cookiesComplete') {
			this.currentcurrent.cookiesComplete = true;
		} else if (e == 'tabsComplete') {
			this.current.tabsComplete = true;
		} else if (e == 'tabsClose') {
			this.current.tabsClosed = true;
		} else if (e == 'cookiesNuke') {
			this.current.cookiesNuked = true;
		} else if (e == 'cookiesRestored') {
			TabsManager.restore(this.current.tabs);
		}

		if (this.current.tabsComplete && this.current.cookiesComplete) {
			delete this.current.tabsComplete;
			delete this.current.cookiesComplete;

			this.store();
		}

		if (this.current.tabsClosed && this.current.cookiesNuked) {
			delete this.current.tabsClosed;
			delete this.current.cookiesNuked;

			CookieManager.restore(this.current.cookies);
		}
	}
};

var CookieManager = {
	complete: function(e) {
		if (e == 'cookie-get-all') {
			ProfileManager.listen('cookiesComplete');
		} else if (e == 'cookie-nuke') {
			ProfileManager.listen('cookiesNuke');
		}
	},

	restore: function(cookies) {
		for (var cookie in cookies) {
			var c = JSON.parse(cookies[cookie]);

			var url = c.domain + c.path;
			if (url.charAt(0) == '.') {
				url = url.substring(1);
			}

			url = 'http://' + url;

			chrome.cookies.set({ url: url, name: c.name, value: c.value, domain: c.domain, path: c.path, 
				secure: c.secure, httpOnly: c.httpOnly, expirationDate: c.expirationDate });
		}

		ProfileManager.listen('cookiesRestored');
	},

	getAllCookies: function() {
		chrome.cookies.getAllCookieStores(function(stores) {
			for (var i = 0; i < stores.length; i++) {
				(function(store) {
					chrome.cookies.getAll({storeId: store}, function(cookies) {
						for (var j = 0; j < cookies.length; j++) {
							var jc = JSON.stringify(cookies[j]);
							ProfileManager.current.cookies[cookies[j].storeId + '|' + j] = jc;
						}

						CookieManager.complete('cookie-get-all');
					});
				})(stores[i].id);
			}
		});
	},

	nuke: function() {
		chrome.cookies.getAllCookieStores(function(stores) {
			for (var i = 0; i < stores.length; i++) {
				(function(store) {
					chrome.cookies.getAll({storeId: store}, function(cookies) {
						for (var j = 0; j < cookies.length; j++) {
							chrome.cookies.remove({url: ('http://' + cookies[j].domain + cookies[j].path), name: cookies[j].name, storeId: cookies[j].sotreId });
						}

						CookieManager.complete('cookie-nuke');
					});
				})(stores[i].id);
			}
		});
	}
};

var TabsManager = {
	empty: null,

	complete: function(e) {
		if (e == 'tab-get-all') {
			ProfileManager.listen('tabsComplete');
		} else if (e == 'tab-close') {
			ProfileManager.listen('tabsClose');
		}
	},

	restore: function(tabs) {
		for (var tab in tabs) {
			var t = JSON.parse(tabs[tab]);
			chrome.tabs.create({index: t.index, url: t.url, active: t.active, pinned: t.pinned});
		}

		chrome.tabs.remove(this.empty);
	},

	close: function(except) {
		this.empty = except;
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				if (tabs[i].id == except) {
					continue;
				}

				chrome.tabs.remove(tabs[i].id);
			}

			TabsManager.complete('tab-close');
		});
	},

	getAllTabs: function() {
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				var t = JSON.stringify(tabs[i]);
				ProfileManager.current.tabs[tabs[i].id] = t;
			}

			TabsManager.complete('tab-get-all');
		});
	}
};

init();