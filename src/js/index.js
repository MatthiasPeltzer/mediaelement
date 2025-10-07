// Public ESM entry to enable tree-shaking for modern bundlers
export { default as MediaElementPlayer } from './player.js';
export { default as i18n } from './core/i18n.js';
export * as Renderers from './core/renderer.js';
export * as Utils from './utils/dom.js';
export * as TimeUtils from './utils/time.js';
export * as GeneralUtils from './utils/general.js';

