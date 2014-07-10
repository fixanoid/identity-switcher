
function init() {
	$('#add-new').click(function() {
		chrome.runtime.sendMessage(chrome.runtime.id, {'action': 'new-identity'}, null, function(response) {
			//nothing so far.
		});
	});
}

$(document).ready(function() {
	init();
});