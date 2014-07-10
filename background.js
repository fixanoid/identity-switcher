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
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if (request.action == 'new-identity') {
				// Request to save identity
				getAllCookies();
			}
		});
}



function getAllCookies() {
	chrome.cookies.getAllCookieStores(function(stores) {
		for (var i = 0; i < stores.length; i++) {
			console.log(stores[i].id);
			chrome.cookies.getAll({storeId: stores[i].id}, function(cookies) {
				for (var j = 0; j < cookies.length; j++) {
					console.log(cookies[j].name + '|' + cookies[j].value);
				}
			});
		}
	});
}

init();