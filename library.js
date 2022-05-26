'use strict';

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const controllers = require('./lib/controllers');
const fs = require('fs');
const os = require('os');
const node_image = require.main.require('./src/image');
const uploadsController = require.main.require('./src/controllers/uploads.js');
const routeHelpers = require.main.require('./src/routes/helpers');
const settings = require.main.require('./src/meta/settings');

const plugin = {};
let plugin_settings = {};

function requireSharp() {
		const sharp = require('sharp');
		if (os.platform() === 'win32') {
				// https://github.com/lovell/sharp/issues/1259
				sharp.cache(false);
		}
		return sharp;
}


plugin.init = async (params) => {
		const {
				router,
				middleware/* , controllers */
		} = params;

		routeHelpers.setupAdminPageRoute(router, '/admin/plugins/always-webp', middleware, [], controllers.renderAdminPage);

		plugin_settings = await settings.get('always-webp');
		if (!plugin_settings.hasOwnProperty('quality')) {
				plugin_settings['quality'] = 80;
				settings.set('always-webp', plugin_settings);
		}
		plugin_settings['quality'] = Number(plugin_settings['quality']);
};


plugin.addAdminNavigation = (header) => {
		header.plugins.push({
				route: '/plugins/always-webp',
				icon: 'fa-tint',
				name: 'AlwaysWebp',
		});

		return header;
};

plugin.uploadImgHook = async function (data) {
		let {
				image,
				uid,
				folder
		} = data;


		await node_image.isFileTypeAllowed(image.path);
		// sharp can't save svgs skip resize for them
		const isSVG = image.type === 'image/svg+xml';
		if (isSVG) {
				return await uploadsController.uploadFile(uid, image);
		}
		const sharp = requireSharp();
		const buffer = await fs.promises.readFile(image.path);
		const sharpImage = sharp(buffer, {
				failOnError: true,
				animated: image.path.endsWith('gif'),
		});

		sharpImage.rotate(); // auto-orients based on exif data
		sharpImage.webp({ quality: plugin_settings.quality });
		await sharpImage.toFile(image.path);
		let fileObj = await uploadsController.uploadFile(uid, image);
		return {
				url: fileObj.url,
				path: fileObj.path,
				name: fileObj.name,
		};

};

module.exports = plugin;
