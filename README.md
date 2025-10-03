# ![MediaElementJS](https://cloud.githubusercontent.com/assets/910829/22357262/e6cf32b4-e404-11e6-876b-59afa009f65c.png)

One file. Any browser. Same UI.

* Author: John Dyer [http://j.hn/](http://j.hn/)
* Website: [http://mediaelementjs.com/](http://mediaelementjs.com/)
* License: [MIT](http://mediaelement.mit-license.org/)
* Meaning: Use everywhere, keep copyright, it'd be swell if you'd link back here.
* Thanks: my employer, [Dallas Theological Seminary](http://www.dts.edu/)
* Contributors: [all contributors](https://github.com/mediaelement/mediaelement/graphs/contributors)

[![GitHub Version](https://img.shields.io/npm/v/mediaelement.svg)](https://github.com/mediaelement/mediaelement)
[![Build Status](https://img.shields.io/travis/mediaelement/mediaelement.svg)](https://travis-ci.org/mediaelement/mediaelement)
[![Coverage Status](https://img.shields.io/coveralls/mediaelement/mediaelement.svg)](https://coveralls.io/github/mediaelement/mediaelement)
[![MIT License](https://img.shields.io/npm/l/mediaelement.svg)](https://mediaelement.mit-license.org/)
[![CDNJS](https://img.shields.io/cdnjs/v/mediaelement.svg)](https://cdnjs.com/libraries/mediaelement)
[![jsDelivr Hits](https://data.jsdelivr.com/v1/package/npm/mediaelement/badge?style=rounded)](https://www.jsdelivr.com/package/npm/mediaelement)

# Table of Contents

* [Introduction](#intro)
* [Installation and Usage](#installation)
* [API and Configuration](#api)
* [Guidelines for Contributors](#guidelines)
* [Change Log](#changelog)
* [Migration](#migration)
* [TODO list](#todo)

<a id="intro"></a>
## Introduction

_MediaElementPlayer: HTML5 `<video>` and `<audio>` player_

A complete HTML/CSS audio/video player built on top `MediaElement.js`.

In general, `MediaElement.js` supports **IE11+, MS Edge, Chrome, Firefox, Safari, iOS 8+** and **Android 4.0+**.

**It is strongly recommended to read the entire documentation and check the `demo` folder to get the most out of this package**. Visit [here](docs) to start.

<a id="installation"></a>
## Installation and Usage

The full documentation on how to install `MediaElement.js` is available at [Installation](docs/installation.md).

A brief guide on how to create and use instances of `MediaElement` available at [Usage](docs/usage.md).

Additional features can be found at https://github.com/mediaelement/mediaelement-plugins.

## Development

- Build
  - `npm run build`: builds JS (esbuild), CSS (postcss + autoprefixer + cssnano), renderers, assets and demo
  - Partial: `build:js`, `build:js:min`, `build:css`, `build:css:min`, `build:renderers`, `build:renderers:min`, `build:assets`, `build:lang`, `clean`

- Testing & Coverage
  - `npm test`: mocha + c8 (ESM), jsdom-global bootstraps `window`/`document`

- Security
  - Production `npm audit` is clean; modern tooling replaces legacy request/istanbul trees

- Icon sprite (SVG)
  - The player loads icons from `mejs-controls.svg` located next to your bundle by default
  - If you serve bundles from a different base path/CDN, set the sprite explicitly before initializing players:
    ```html
    <script>
      window.mejs = window.mejs || {};
      window.mejs.MepDefaults = Object.assign({}, window.mejs.MepDefaults || {}, {
        iconSprite: '/assets/mejs/mejs-controls.svg'
      });
    </script>
    ```
  - Or pass `iconSprite` as an option to `MediaElementPlayer`

- Fullscreen API
  - Uses standards-first `requestFullscreen`/`exitFullscreen` with webkit/ms fallbacks

<a id="api"></a>
## API and Configuration

`MediaElement.js` has many options that you can take advantage from. Visit [API and Configuration](docs/api.md) for more details.

Also, a `Utilities/Features` guide is available for development. Visit [Utilities/Features](docs/utils.md) for more details.

<a id="guidelines"></a>
## Guidelines for Contributors

If you want to contribute to improve this package, please read [Guidelines](docs/guidelines.md).

<a id="sources"></a>
## Useful resources

A compilation of useful articles can be found [here](docs/resources.md).

<a id="changelog"></a>
## Change Log

Changes available at [Change Log](changelog.md).

<a id="migration"></a>
## Migration

For migrating mediaelement see [Migration guide](MIGRATION.md).

### Migrating to the modern build (no Grunt)

This package now ships an esbuild + PostCSS toolchain and ESM-by-default.

- Bundles
  - `build/mediaelement.js` and `build/mediaelement-and-player.js` (plus `.min.js`)
  - Individual renderers under `build/renderers/`
  - Styles: `build/mediaelementplayer.css` (and `.min.css`)

- Usage
  - Include the CSS and the JS bundle you need
  - Ensure the SVG sprite is served alongside your bundle, or set the path explicitly:
    ```html
    <link rel="stylesheet" href="/assets/mediaelementplayer.css">
    <script src="/assets/mediaelement-and-player.js"></script>
    <script>
      window.mejs = window.mejs || {};
      window.mejs.MepDefaults = Object.assign({}, window.mejs.MepDefaults || {}, {
        iconSprite: '/assets/mejs-controls.svg'
      });
    </script>
    ```

- Fullscreen API
  - Uses standards-first `requestFullscreen`/`exitFullscreen` with webkit/ms fallbacks; removed legacy `moz*` calls.


<a id="todo"></a>
## TODO list

**IMPORTANT:** Before posting an issue, it is strongly encouraged to read the whole documentation since it covers the majority of scenarios exposed in prior issues.

New features and pending bugs can be found at [TODO list](TODO.md).
