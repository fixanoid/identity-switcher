
function init() {
	chrome.runtime.sendMessage(chrome.runtime.id, {'action': 'get-profiles'}, null, function(response) {
		for (var p in response) {
			$('#identities').append( '<li><a href="#">' + response[p].name + '</a></li>' );
		}
	});

	$('#add-new').click(function() {
		chrome.runtime.sendMessage(chrome.runtime.id, {'action': 'new-identity'}, null, function(response) {
			//nothing so far.
		});

		window.close();
	});
}

$(document).ready(function() {
	init();
});