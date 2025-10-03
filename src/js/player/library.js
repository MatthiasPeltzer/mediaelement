'use strict';

// Use native window
import mejs from '../core/mejs.js';
import MediaElementPlayer from '../player.js';

if (typeof jQuery !== 'undefined') {
	mejs.$ = jQuery;
} else if (typeof Zepto !== 'undefined') {
	mejs.$ = Zepto;
} else if (typeof ender !== 'undefined') {
	mejs.$ = ender;
}

// turn into plugin
(($) => {
	if (typeof $ !== 'undefined') {
		$.fn.mediaelementplayer = function (options) {
			if (options === false) {
				this.each(function () {
					const player = $(this).data('mediaelementplayer');
					if (player) {
						player.remove();
					}
					$(this).removeData('mediaelementplayer');
				});
			} else {
				this.each(function () {
					$(this).data('mediaelementplayer', new MediaElementPlayer(this, options));
				});
			}
			return this;
		};

		$(document).ready(() => {
			// auto enable using JSON attribute
			$(`.${mejs.MepDefaults.classPrefix}player`).mediaelementplayer();
		});
	}
})(mejs.$);
