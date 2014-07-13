
function init() {
	chrome.runtime.sendMessage(chrome.runtime.id, {'action': 'get-profiles'}, null, function(response) {
		for (var p in response) {
			$('#identities').append( '<li><a href="#" id="p-' + response[p].name + '">' + response[p].name + '</a></li>' );

			$('#p-' + response[p].name).click(function(e) {
				chrome.runtime.sendMessage(chrome.runtime.id, {'action': 'load-profile', 'profileName': e.target.innerHTML});

				window.close();
			});
		}
	});

	$('#add-new').click(function() {
		chrome.runtime.sendMessage(chrome.runtime.id, {'action': 'new-identity'});

		window.close();
	});

	$('#clear').click(function() {
		chrome.runtime.sendMessage(chrome.runtime.id, {'action': 'clear-identity'});

		window.close();
	});
}

$(document).ready(function() {
	init();
});