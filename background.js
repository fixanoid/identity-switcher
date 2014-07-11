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
				getAllCookies();
			}
		});
}


var c = {};
function getAllCookies() {
	c = {};
	chrome.cookies.getAllCookieStores(function(stores) {
		for (var i = 0; i < stores.length; i++) {
			(function(store) {
				chrome.cookies.getAll({storeId: store}, function(cookies) {
					for (var j = 0; j < cookies.length; j++) {
						var jc = JSON.stringify(cookies[j]);
						c[cookies[j].storeId + '|' + j] = jc;
					}

					CookieManager.complete();
				});
			})(stores[i].id);
		}
	});
}

var storage = chrome.storage.local;
var ProfileManager = {
	profiles: {},
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
	}
};

var CookieManager = {
	complete: function() {
		var profile = {
			'name': '',
			'cookies': c
		}

		profile.name = 'temp';

		ProfileManager.add(profile);

		ProfileManager.store();
	}
};

init();