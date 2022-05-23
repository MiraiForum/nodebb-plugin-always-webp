'use strict';

/*
	This file is located in the "modules" block of plugin.json
	It is only loaded when the user navigates to /admin/plugins/quickstart page
	It is not bundled into the min file that is served on the first load of the page.
*/
define('admin/plugins/always-webp-settings', [
	'settings', 'uploader', 'alerts',
], function (settings, uploader, alerts) {
	var ACP = {};

	ACP.init = function () {
		settings.load('always-webp', $('.always-webp-settings'));
		$('#save').on('click', saveSettings);
	};

	function saveSettings() {
		settings.save('quickstart', $('.always-webp-settings'), function () {
			alerts.alert({
				type: 'success',
				alert_id: 'always-webp-saved',
				title: '配置已保存',
				message: '请重启',
				clickfn: function () {
					socket.emit('admin.reload');
				},
			});
		});
	}

	return ACP;
});
