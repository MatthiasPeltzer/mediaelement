'use strict';

// Use native window/document in modern environments
import mejs from '../core/mejs.js';

export const NAV = window.navigator;
export const UA = NAV.userAgent.toLowerCase();
export const IS_IPAD = /ipad/i.test(UA) && !window.MSStream;
export const IS_IPHONE = /iphone/i.test(UA) && !window.MSStream;
export const IS_IPOD = /ipod/i.test(UA) && !window.MSStream;
export const IS_IOS = /ipad|iphone|ipod/i.test(UA) && !window.MSStream;
export const IS_ANDROID = /android/i.test(UA);
// Drop IE-specific detection; legacy Edge detection removed
export const IS_CHROME = /chrome/i.test(UA);
export const IS_FIREFOX = /firefox/i.test(UA);
export const IS_SAFARI = /safari/i.test(UA) && !IS_CHROME;
export const IS_STOCK_ANDROID = /^mozilla\/\d+\.\d+\s\(linux;\su;/i.test(UA);
export const HAS_MSE = ('MediaSource' in window);
export const SUPPORT_POINTER_EVENTS = true; // Now supported by all browsers even IE11 (>98% of all global users), so no need to test anymore: https://caniuse.com/pointer-events

// Test via a getter in the options object to see if the passive property is accessed
export const SUPPORT_PASSIVE_EVENT = (() => {
	let supportsPassive = false;
	try {
		const opts = Object.defineProperty({}, 'passive', {
			get: function() {
				supportsPassive = true;
			}
		});
		window.addEventListener('test', null, opts);
	} catch (e) {}

	return supportsPassive;
})();

// Create a video element for fullscreen/hls checks
const video = document.createElement('video');

// Test if browsers support HLS natively (Safari primarily)
export const SUPPORTS_NATIVE_HLS = IS_SAFARI;

// Detect native JavaScript fullscreen (Safari/Firefox only, Chrome still fails)

// iOS
let hasiOSFullScreen = (video.webkitEnterFullscreen !== undefined);

// W3C
let hasNativeFullscreen = (video.requestFullscreen !== undefined);

// OS X 10.5 can't do this even if it says it can :(
if (hasiOSFullScreen && /mac os x 10_5/i.test(UA)) {
	hasNativeFullscreen = false;
	hasiOSFullScreen = false;
}

// webkit/firefox/IE11+
const hasWebkitNativeFullScreen = (video.requestFullscreen === undefined && video.webkitRequestFullscreen !== undefined);
const hasTrueNativeFullScreen = (video.requestFullscreen !== undefined || hasWebkitNativeFullScreen);
let nativeFullScreenEnabled = hasTrueNativeFullScreen;
let fullScreenEventName = '';
let isFullScreen, requestFullScreen, cancelFullScreen;

// Enabled? (MS-specific flag removed)

if (IS_CHROME) {
	hasiOSFullScreen = false;
}

if (hasTrueNativeFullScreen) {
    if (typeof document.onfullscreenchange !== 'undefined') {
        fullScreenEventName = 'fullscreenchange';
    } else if (hasWebkitNativeFullScreen) {
        fullScreenEventName = 'webkitfullscreenchange';
    }

    isFullScreen = () =>  {
        if (typeof document.fullscreenElement !== 'undefined') {
            return document.fullscreenElement !== null;
        } else if (hasWebkitNativeFullScreen) {
            return document.webkitIsFullScreen;
        }
    };

    requestFullScreen = (el) => {
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        }
    };

    cancelFullScreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    };
}

export const HAS_NATIVE_FULLSCREEN = hasNativeFullscreen;
export const HAS_WEBKIT_NATIVE_FULLSCREEN = hasWebkitNativeFullScreen;
export const HAS_IOS_FULLSCREEN = hasiOSFullScreen;
export const HAS_TRUE_NATIVE_FULLSCREEN = hasTrueNativeFullScreen;
export const HAS_NATIVE_FULLSCREEN_ENABLED = nativeFullScreenEnabled;
export const FULLSCREEN_EVENT_NAME = fullScreenEventName;
export {isFullScreen, requestFullScreen, cancelFullScreen};

mejs.Features = mejs.Features || {};
mejs.Features.isiPad = IS_IPAD;
mejs.Features.isiPod = IS_IPOD;
mejs.Features.isiPhone = IS_IPHONE;
mejs.Features.isiOS = mejs.Features.isiPhone || mejs.Features.isiPad;
mejs.Features.isAndroid = IS_ANDROID;
mejs.Features.isChrome = IS_CHROME;
mejs.Features.isFirefox = IS_FIREFOX;
mejs.Features.isSafari = IS_SAFARI;
mejs.Features.isStockAndroid = IS_STOCK_ANDROID;
mejs.Features.hasMSE = HAS_MSE;
mejs.Features.supportsNativeHLS = SUPPORTS_NATIVE_HLS;
mejs.Features.supportsPointerEvents = SUPPORT_POINTER_EVENTS;
mejs.Features.supportsPassiveEvent = SUPPORT_PASSIVE_EVENT;
mejs.Features.hasiOSFullScreen = HAS_IOS_FULLSCREEN;
mejs.Features.hasNativeFullscreen = HAS_NATIVE_FULLSCREEN;
mejs.Features.hasWebkitNativeFullScreen = HAS_WEBKIT_NATIVE_FULLSCREEN;
mejs.Features.hasTrueNativeFullScreen = HAS_TRUE_NATIVE_FULLSCREEN;
mejs.Features.nativeFullScreenEnabled = HAS_NATIVE_FULLSCREEN_ENABLED;
mejs.Features.fullScreenEventName = FULLSCREEN_EVENT_NAME;
mejs.Features.isFullScreen = isFullScreen;
mejs.Features.requestFullScreen = requestFullScreen;
mejs.Features.cancelFullScreen = cancelFullScreen;
