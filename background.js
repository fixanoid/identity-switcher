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
			}
		});
}

var current;

var storage = chrome.storage.local;
var ProfileManager = {
	profiles: {},

	clear: function() {
		// nukes the browsers cookies and tabs
		CookieManager.nuke();

		chrome.tabs.create({}, function(tab) {
			TabsManager.close(tab.id);
		});
	},

	restore: function(profileName) {
		// check if requested profile name exists in profiles
		if (!(profileName in profiles)) {
			return;
		}

		// reset everything before loading cookies and tabs
		this.clear();

		// load cookies and tabs
		CookieManager.restore(profiles[profileName].cookies);
		TabsManager.restore(profiles[profileName].tabs);
	},

	collect: function() {
		var profile = {};
		profile.name = 'temp';
		profile.cookies = {};
		profile.tabs = {};

		current = profile;

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
		if (e == 'cookiesComplete') {
			current.cookiesComplete = true;
		} else if (e == 'tabsComplete') {
			current.tabsComplete = true;
		}

		if (current.tabsComplete && current.cookiesComplete) {
			delete current.tabsComplete;
			delete current.cookiesComplete;

			this.store();
		}
	}
};

var CookieManager = {
	complete: function() {
		ProfileManager.listen('cookiesComplete');
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
	},

	getAllCookies: function() {
		chrome.cookies.getAllCookieStores(function(stores) {
			for (var i = 0; i < stores.length; i++) {
				(function(store) {
					chrome.cookies.getAll({storeId: store}, function(cookies) {
						for (var j = 0; j < cookies.length; j++) {
							var jc = JSON.stringify(cookies[j]);
							current.cookies[cookies[j].storeId + '|' + j] = jc;
						}

						CookieManager.complete();
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
					});
				})(stores[i].id);
			}
		});
	}
};

var TabsManager = {
	complete: function() {
		ProfileManager.listen('tabsComplete');
	},

	restore: function(tabs) {
		for (var tab in tabs) {
			var t = JSON.parse(tabs[tab]);
			chrome.tabs.create({index: t.index, url: t.url, active: t.active, pinned: t.pinned});
		}
	},

	close: function(except) {
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				if (tabs[i].id == except) {
					continue;
				}

				chrome.tabs.remove(tabs[i].id);
			}
		});
	},

	getAllTabs: function() {
		chrome.tabs.query({}, function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				var t = JSON.stringify(tabs[i]);
				current.tabs[tabs[i].id] = t;
			}

			TabsManager.complete();
		});
	}
};

init();