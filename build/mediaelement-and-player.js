(() => {
  // src/js/core/mejs.js
  var mejs2 = {};
  mejs2.version = "7.0.8";
  mejs2.html5media = {
    /**
     * @type {String[]}
     */
    properties: [
      // GET/SET
      "volume",
      "src",
      "currentTime",
      "muted",
      // GET only
      "duration",
      "paused",
      "ended",
      "buffered",
      "error",
      "networkState",
      "readyState",
      "seeking",
      "seekable",
      // OTHERS
      "currentSrc",
      "preload",
      "bufferedBytes",
      "bufferedTime",
      "initialTime",
      "startOffsetTime",
      "defaultPlaybackRate",
      "playbackRate",
      "played",
      "autoplay",
      "loop",
      "controls"
    ],
    readOnlyProperties: [
      "duration",
      "paused",
      "ended",
      "buffered",
      "error",
      "networkState",
      "readyState",
      "seeking",
      "seekable"
    ],
    /**
     * @type {String[]}
     */
    methods: [
      "load",
      "play",
      "pause",
      "canPlayType"
    ],
    /**
     * @type {String[]}
     */
    events: [
      "loadstart",
      "durationchange",
      "loadedmetadata",
      "loadeddata",
      "progress",
      "canplay",
      "canplaythrough",
      "suspend",
      "abort",
      "error",
      "emptied",
      "stalled",
      "play",
      "playing",
      "pause",
      "waiting",
      "seeking",
      "seeked",
      "timeupdate",
      "ended",
      "ratechange",
      "volumechange"
    ],
    /**
     * @type {String[]}
     */
    mediaTypes: [
      "audio/mp3",
      "audio/ogg",
      "audio/oga",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/x-pn-wav",
      "audio/mpeg",
      "audio/mp4",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/ogv"
    ]
  };
  window.mejs = mejs2;
  var mejs_default = mejs2;

  // src/js/utils/general.js
  function escapeHTML(input) {
    if (typeof input !== "string") {
      throw new Error("Argument passed must be a string");
    }
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    return input.replace(/[&<>"]/g, (c) => {
      return map[c];
    });
  }
  function debounce(func, wait, immediate = false) {
    if (typeof func !== "function") {
      throw new Error("First argument must be a function");
    }
    if (typeof wait !== "number") {
      throw new Error("Second argument must be a numeric value");
    }
    let timeout;
    return () => {
      const context = this, args = arguments;
      const later = () => {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  }
  function isObjectEmpty(instance) {
    return Object.getOwnPropertyNames(instance).length <= 0;
  }
  function splitEvents(events, id) {
    const rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;
    const ret = { d: [], w: [] };
    (events || "").split(" ").forEach((v) => {
      const eventName = `${v}${id ? `.${id}` : ""}`;
      if (eventName.startsWith(".")) {
        ret.d.push(eventName);
        ret.w.push(eventName);
      } else {
        ret[rwindow.test(v) ? "w" : "d"].push(eventName);
      }
    });
    ret.d = ret.d.join(" ");
    ret.w = ret.w.join(" ");
    return ret;
  }
  function createEvent(eventName, target, isIframe) {
    if (typeof eventName !== "string") {
      throw new Error("Event name must be a string");
    }
    const eventFrags = eventName.match(/([a-z]+\.([a-z]+))/i), detail = {
      target,
      isIframe
    };
    if (eventFrags !== null) {
      eventName = eventFrags[1];
      detail.namespace = eventFrags[2];
    }
    return new window.CustomEvent(eventName, {
      detail
    });
  }
  function isNodeAfter(sourceNode, targetNode) {
    return !!(sourceNode && targetNode && sourceNode.compareDocumentPosition(targetNode) & 2);
  }
  function isString(value) {
    return typeof value === "string";
  }
  mejs_default.Utils = mejs_default.Utils || {};
  mejs_default.Utils.escapeHTML = escapeHTML;
  mejs_default.Utils.debounce = debounce;
  mejs_default.Utils.isObjectEmpty = isObjectEmpty;
  mejs_default.Utils.splitEvents = splitEvents;
  mejs_default.Utils.createEvent = createEvent;
  mejs_default.Utils.isNodeAfter = isNodeAfter;
  mejs_default.Utils.isString = isString;

  // src/js/utils/media.js
  var typeChecks = [];
  function absolutizeUrl(url) {
    if (typeof url !== "string") {
      throw new Error("`url` argument must be a string");
    }
    const el = document.createElement("div");
    el.innerHTML = `<a href="${escapeHTML(url)}">x</a>`;
    return el.firstChild.href;
  }
  function formatType(url, type = "") {
    return url && !type ? getTypeFromFile(url) : type;
  }
  function getMimeFromType(type) {
    if (typeof type !== "string") {
      throw new Error("`type` argument must be a string");
    }
    return type && type.indexOf(";") > -1 ? type.substr(0, type.indexOf(";")) : type;
  }
  function getTypeFromFile(url) {
    if (typeof url !== "string") {
      throw new Error("`url` argument must be a string");
    }
    for (let i = 0, total = typeChecks.length; i < total; i++) {
      const checker = typeChecks[i];
      if (typeof checker === "function") {
        const type = checker(url);
        if (type) {
          return type;
        }
      }
    }
    const ext = getExtension(url), normalizedExt = normalizeExtension(ext);
    let mime = "video/mp4";
    if (normalizedExt) {
      if (~["mp4", "m4v", "ogg", "ogv", "webm", "mpeg"].indexOf(normalizedExt)) {
        mime = `video/${normalizedExt}`;
      } else if ("mov" === normalizedExt) {
        mime = "video/quicktime";
      } else if (~["mp3", "oga", "wav", "mid", "midi"].indexOf(normalizedExt)) {
        mime = `audio/${normalizedExt}`;
      }
    }
    return mime;
  }
  function getExtension(url) {
    if (typeof url !== "string") {
      throw new Error("`url` argument must be a string");
    }
    const baseUrl = url.split("?")[0], baseName = baseUrl.split("\\").pop().split("/").pop();
    return ~baseName.indexOf(".") ? baseName.substring(baseName.lastIndexOf(".") + 1) : "";
  }
  function normalizeExtension(extension) {
    if (typeof extension !== "string") {
      throw new Error("`extension` argument must be a string");
    }
    switch (extension) {
      case "mp4":
      case "m4v":
        return "mp4";
      case "webm":
      case "webma":
      case "webmv":
        return "webm";
      case "ogg":
      case "oga":
      case "ogv":
        return "ogg";
      default:
        return extension;
    }
  }
  mejs_default.Utils = mejs_default.Utils || {};
  mejs_default.Utils.typeChecks = typeChecks;
  mejs_default.Utils.absolutizeUrl = absolutizeUrl;
  mejs_default.Utils.formatType = formatType;
  mejs_default.Utils.getMimeFromType = getMimeFromType;
  mejs_default.Utils.getTypeFromFile = getTypeFromFile;
  mejs_default.Utils.getExtension = getExtension;
  mejs_default.Utils.normalizeExtension = normalizeExtension;

  // src/js/core/renderer.js
  var Renderer = class {
    constructor() {
      this.renderers = {};
      this.order = [];
    }
    /**
     * Register a new renderer.
     *
     * @param {Object} renderer - An object with all the rendered information (name REQUIRED)
     * @method add
     */
    add(renderer2) {
      if (renderer2.name === void 0) {
        throw new TypeError("renderer must contain at least `name` property");
      }
      this.renderers[renderer2.name] = renderer2;
      this.order.push(renderer2.name);
    }
    /**
     * Iterate a list of renderers to determine which one should the player use.
     *
     * @param {Object[]} mediaFiles - A list of source and type obtained from video/audio/source tags: [{src:'',type:''}]
     * @param {?String[]} renderers - Optional list of pre-selected renderers
     * @return {?Object} The renderer's name and source selected
     * @method select
     */
    select(mediaFiles, renderers = []) {
      const renderersLength = renderers.length;
      renderers = renderers.length ? renderers : this.order;
      if (!renderersLength) {
        const rendererIndicator = [
          /^(html5|native)/i,
          /iframe$/i
        ], rendererRanking = (renderer2) => {
          for (let i = 0, total = rendererIndicator.length; i < total; i++) {
            if (rendererIndicator[i].test(renderer2)) {
              return i;
            }
          }
          return rendererIndicator.length;
        };
        renderers.sort((a, b) => {
          return rendererRanking(a) - rendererRanking(b);
        });
      }
      for (let i = 0, total = renderers.length; i < total; i++) {
        const key = renderers[i], renderer2 = this.renderers[key];
        if (renderer2 !== null && renderer2 !== void 0) {
          for (let j = 0, jl = mediaFiles.length; j < jl; j++) {
            if (typeof renderer2.canPlayType === "function" && typeof mediaFiles[j].type === "string" && renderer2.canPlayType(mediaFiles[j].type)) {
              return {
                rendererName: renderer2.name,
                src: mediaFiles[j].src
              };
            }
          }
        }
      }
      return null;
    }
    // Setters/getters
    set order(order) {
      if (!Array.isArray(order)) {
        throw new TypeError("order must be an array of strings.");
      }
      this._order = order;
    }
    set renderers(renderers) {
      if (renderers !== null && typeof renderers !== "object") {
        throw new TypeError("renderers must be an array of objects.");
      }
      this._renderers = renderers;
    }
    get renderers() {
      return this._renderers;
    }
    get order() {
      return this._order;
    }
  };
  var renderer = new Renderer();
  mejs_default.Renderers = renderer;

  // src/js/utils/constants.js
  var NAV = window.navigator;
  var UA = NAV.userAgent.toLowerCase();
  var IS_IPAD = /ipad/i.test(UA) && !window.MSStream;
  var IS_IPHONE = /iphone/i.test(UA) && !window.MSStream;
  var IS_IPOD = /ipod/i.test(UA) && !window.MSStream;
  var IS_IOS = /ipad|iphone|ipod/i.test(UA) && !window.MSStream;
  var IS_ANDROID = /android/i.test(UA);
  var IS_CHROME = /chrome/i.test(UA);
  var IS_FIREFOX = /firefox/i.test(UA);
  var IS_SAFARI = /safari/i.test(UA) && !IS_CHROME;
  var IS_STOCK_ANDROID = /^mozilla\/\d+\.\d+\s\(linux;\su;/i.test(UA);
  var HAS_MSE = "MediaSource" in window;
  var SUPPORT_POINTER_EVENTS = true;
  var SUPPORT_PASSIVE_EVENT = (() => {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, "passive", {
        get: function() {
          supportsPassive = true;
        }
      });
      window.addEventListener("test", null, opts);
    } catch (e) {
    }
    return supportsPassive;
  })();
  var video = document.createElement("video");
  var SUPPORTS_NATIVE_HLS = IS_SAFARI;
  var hasiOSFullScreen = video.webkitEnterFullscreen !== void 0;
  var hasNativeFullscreen = video.requestFullscreen !== void 0;
  if (hasiOSFullScreen && /mac os x 10_5/i.test(UA)) {
    hasNativeFullscreen = false;
    hasiOSFullScreen = false;
  }
  var hasWebkitNativeFullScreen = video.requestFullscreen === void 0 && video.webkitRequestFullscreen !== void 0;
  var hasTrueNativeFullScreen = video.requestFullscreen !== void 0 || hasWebkitNativeFullScreen;
  var nativeFullScreenEnabled = hasTrueNativeFullScreen;
  var fullScreenEventName = "";
  var isFullScreen;
  var requestFullScreen;
  var cancelFullScreen;
  if (IS_CHROME) {
    hasiOSFullScreen = false;
  }
  if (hasTrueNativeFullScreen) {
    if (typeof document.onfullscreenchange !== "undefined") {
      fullScreenEventName = "fullscreenchange";
    } else if (hasWebkitNativeFullScreen) {
      fullScreenEventName = "webkitfullscreenchange";
    }
    isFullScreen = () => {
      if (typeof document.fullscreenElement !== "undefined") {
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
  var HAS_NATIVE_FULLSCREEN = hasNativeFullscreen;
  var HAS_WEBKIT_NATIVE_FULLSCREEN = hasWebkitNativeFullScreen;
  var HAS_IOS_FULLSCREEN = hasiOSFullScreen;
  var HAS_TRUE_NATIVE_FULLSCREEN = hasTrueNativeFullScreen;
  var HAS_NATIVE_FULLSCREEN_ENABLED = nativeFullScreenEnabled;
  var FULLSCREEN_EVENT_NAME = fullScreenEventName;
  mejs_default.Features = mejs_default.Features || {};
  mejs_default.Features.isiPad = IS_IPAD;
  mejs_default.Features.isiPod = IS_IPOD;
  mejs_default.Features.isiPhone = IS_IPHONE;
  mejs_default.Features.isiOS = mejs_default.Features.isiPhone || mejs_default.Features.isiPad;
  mejs_default.Features.isAndroid = IS_ANDROID;
  mejs_default.Features.isChrome = IS_CHROME;
  mejs_default.Features.isFirefox = IS_FIREFOX;
  mejs_default.Features.isSafari = IS_SAFARI;
  mejs_default.Features.isStockAndroid = IS_STOCK_ANDROID;
  mejs_default.Features.hasMSE = HAS_MSE;
  mejs_default.Features.supportsNativeHLS = SUPPORTS_NATIVE_HLS;
  mejs_default.Features.supportsPointerEvents = SUPPORT_POINTER_EVENTS;
  mejs_default.Features.supportsPassiveEvent = SUPPORT_PASSIVE_EVENT;
  mejs_default.Features.hasiOSFullScreen = HAS_IOS_FULLSCREEN;
  mejs_default.Features.hasNativeFullscreen = HAS_NATIVE_FULLSCREEN;
  mejs_default.Features.hasWebkitNativeFullScreen = HAS_WEBKIT_NATIVE_FULLSCREEN;
  mejs_default.Features.hasTrueNativeFullScreen = HAS_TRUE_NATIVE_FULLSCREEN;
  mejs_default.Features.nativeFullScreenEnabled = HAS_NATIVE_FULLSCREEN_ENABLED;
  mejs_default.Features.fullScreenEventName = FULLSCREEN_EVENT_NAME;
  mejs_default.Features.isFullScreen = isFullScreen;
  mejs_default.Features.requestFullScreen = requestFullScreen;
  mejs_default.Features.cancelFullScreen = cancelFullScreen;

  // src/js/core/mediaelement.js
  var import_meta = {};
  var MediaElement = class {
    /**
     *
     * @param {String|Node} idOrNode
     * @param {Object} options
     * @param {Object[]} sources
     * @returns {Element|*}
     */
    constructor(idOrNode, options, sources) {
      const t = this;
      sources = Array.isArray(sources) ? sources : null;
      const detectIconSprite = () => {
        try {
          if (typeof window !== "undefined" && window.mejs && window.mejs.MepDefaults && typeof window.mejs.MepDefaults.iconSprite === "string" && window.mejs.MepDefaults.iconSprite) {
            return window.mejs.MepDefaults.iconSprite;
          }
          if (typeof import_meta !== "undefined" && import_meta.url) {
            const u = import_meta.url;
            const base = u.substring(0, u.lastIndexOf("/") + 1);
            return `${base}mejs-controls.svg`;
          }
          const scripts = document.getElementsByTagName("script");
          for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].getAttribute("src") || "";
            if (src && /(mediaelement(?:-and-player)?\.js)(\?|$)/.test(src)) {
              const base = src.substring(0, src.lastIndexOf("/") + 1);
              return `${base}mejs-controls.svg`;
            }
          }
          const links = document.getElementsByTagName("link");
          for (let j = 0; j < links.length; j++) {
            const href = links[j].getAttribute("href") || "";
            if (href && /mediaelementplayer\.css(\?|$)/.test(href)) {
              const base = href.substring(0, href.lastIndexOf("/") + 1);
              return `${base}mejs-controls.svg`;
            }
          }
        } catch (e) {
        }
        return "mejs-controls.svg";
      };
      t.defaults = {
        /**
         * List of the renderers to use
         * @type {String[]}
         */
        renderers: [],
        /**
         * Name of MediaElement container
         * @type {String}
         */
        fakeNodeName: "div",
        /**
         * The path where the icon sprite is located
         * @type {String}
         */
        iconSprite: detectIconSprite()
      };
      options = Object.assign(t.defaults, options);
      t.mediaElement = document.createElement(options.fakeNodeName);
      let id = idOrNode, error = false;
      if (typeof idOrNode === "string") {
        t.mediaElement.originalNode = document.getElementById(idOrNode);
      } else {
        t.mediaElement.originalNode = idOrNode;
        id = idOrNode.id;
      }
      if (t.mediaElement.originalNode === void 0 || t.mediaElement.originalNode === null) {
        return null;
      }
      t.mediaElement.options = options;
      id = id || `mejs_${Math.random().toString().slice(2)}`;
      t.mediaElement.originalNode.setAttribute("id", `${id}_from_mejs`);
      const tagName = t.mediaElement.originalNode.tagName.toLowerCase();
      if (["video", "audio"].indexOf(tagName) > -1 && !t.mediaElement.originalNode.getAttribute("preload")) {
        t.mediaElement.originalNode.setAttribute("preload", "none");
      }
      t.mediaElement.originalNode.setAttribute("tabindex", -1);
      t.mediaElement.originalNode.parentNode.insertBefore(t.mediaElement, t.mediaElement.originalNode);
      t.mediaElement.appendChild(t.mediaElement.originalNode);
      const processURL = (url, type) => {
        if (window.location.protocol === "https:" && url.indexOf("http:") === 0 && IS_IOS && mejs_default.html5media.mediaTypes.indexOf(type) > -1) {
          const xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
              const url2 = window.URL || window.webkitURL, blobUrl = url2.createObjectURL(this.response);
              t.mediaElement.originalNode.setAttribute("src", blobUrl);
              return blobUrl;
            }
            return url;
          };
          xhr.open("GET", url);
          xhr.responseType = "blob";
          xhr.send();
        }
        return url;
      };
      let mediaFiles;
      if (sources !== null) {
        mediaFiles = sources;
      } else if (t.mediaElement.originalNode !== null) {
        mediaFiles = [];
        switch (t.mediaElement.originalNode.nodeName.toLowerCase()) {
          case "iframe":
            mediaFiles.push({
              type: "",
              src: t.mediaElement.originalNode.getAttribute("src")
            });
            break;
          case "audio":
          case "video":
            const sources2 = t.mediaElement.originalNode.children.length, nodeSource = t.mediaElement.originalNode.getAttribute("src");
            if (nodeSource) {
              const node = t.mediaElement.originalNode, type = formatType(nodeSource, node.getAttribute("type"));
              mediaFiles.push({
                type,
                src: processURL(nodeSource, type)
              });
            }
            for (let i = 0; i < sources2; i++) {
              const n = t.mediaElement.originalNode.children[i];
              if (n.tagName.toLowerCase() === "source") {
                const src = n.getAttribute("src"), type = formatType(src, n.getAttribute("type"));
                mediaFiles.push({ type, src: processURL(src, type) });
              }
            }
            break;
        }
      }
      t.mediaElement.id = id;
      t.mediaElement.renderers = {};
      t.mediaElement.events = {};
      t.mediaElement.promises = [];
      t.mediaElement.renderer = null;
      t.mediaElement.rendererName = null;
      t.mediaElement.changeRenderer = (rendererName, mediaFiles2) => {
        const t2 = this, media = Object.keys(mediaFiles2[0]).length > 2 ? mediaFiles2[0] : mediaFiles2[0].src;
        if (t2.mediaElement.renderer !== void 0 && t2.mediaElement.renderer !== null && t2.mediaElement.renderer.name === rendererName) {
          t2.mediaElement.renderer.pause();
          t2.mediaElement.renderer.show();
          t2.mediaElement.renderer.setSrc(media);
          return true;
        }
        if (t2.mediaElement.renderer !== void 0 && t2.mediaElement.renderer !== null) {
          t2.mediaElement.renderer.pause();
          t2.mediaElement.renderer.hide();
        }
        let newRenderer = t2.mediaElement.renderers[rendererName], newRendererType = null;
        if (newRenderer !== void 0 && newRenderer !== null) {
          newRenderer.show();
          newRenderer.setSrc(media);
          t2.mediaElement.renderer = newRenderer;
          t2.mediaElement.rendererName = rendererName;
          return true;
        }
        const rendererArray = t2.mediaElement.options.renderers.length ? t2.mediaElement.options.renderers : renderer.order;
        for (let i = 0, total = rendererArray.length; i < total; i++) {
          const index = rendererArray[i];
          if (index === rendererName) {
            const rendererList = renderer.renderers;
            newRendererType = rendererList[index];
            const renderOptions = Object.assign(newRendererType.options, t2.mediaElement.options);
            newRenderer = newRendererType.create(t2.mediaElement, renderOptions, mediaFiles2);
            newRenderer.name = rendererName;
            t2.mediaElement.renderers[newRendererType.name] = newRenderer;
            t2.mediaElement.renderer = newRenderer;
            t2.mediaElement.rendererName = rendererName;
            newRenderer.show();
            return true;
          }
        }
        return false;
      };
      t.mediaElement.setSize = (width, height) => {
        if (t.mediaElement.renderer !== void 0 && t.mediaElement.renderer !== null) {
          t.mediaElement.renderer.setSize(width, height);
        }
      };
      t.mediaElement.generateError = (message, urlList) => {
        message = message || "";
        urlList = Array.isArray(urlList) ? urlList : [];
        const event = createEvent("error", t.mediaElement);
        event.message = message;
        event.urls = urlList;
        t.mediaElement.dispatchEvent(event);
        error = true;
      };
      const props = mejs_default.html5media.properties, methods = mejs_default.html5media.methods, addProperty = (obj, name, onGet, onSet) => {
        let oldValue = obj[name];
        const getFn = () => onGet.apply(obj, [oldValue]), setFn = (newValue) => {
          oldValue = onSet.apply(obj, [newValue]);
          return oldValue;
        };
        Object.defineProperty(obj, name, {
          get: getFn,
          set: setFn
        });
      }, assignGettersSetters = (propName) => {
        if (propName !== "src") {
          const capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`, getFn = () => t.mediaElement.renderer !== void 0 && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer[`get${capName}`] === "function" ? t.mediaElement.renderer[`get${capName}`]() : null, setFn = (value) => {
            if (t.mediaElement.renderer !== void 0 && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer[`set${capName}`] === "function") {
              t.mediaElement.renderer[`set${capName}`](value);
            }
          };
          addProperty(t.mediaElement, propName, getFn, setFn);
          t.mediaElement[`get${capName}`] = getFn;
          t.mediaElement[`set${capName}`] = setFn;
        }
      }, getSrc = () => t.mediaElement.renderer !== void 0 && t.mediaElement.renderer !== null ? t.mediaElement.renderer.getSrc() : null, setSrc = (value) => {
        const mediaFiles2 = [];
        if (typeof value === "string") {
          mediaFiles2.push({
            src: value,
            type: value ? getTypeFromFile(value) : ""
          });
        } else if (typeof value === "object" && value.src !== void 0) {
          const src = absolutizeUrl(value.src), type = value.type, media = Object.assign(value, {
            src,
            type: (type === "" || type === null || type === void 0) && src ? getTypeFromFile(src) : type
          });
          mediaFiles2.push(media);
        } else if (Array.isArray(value)) {
          for (let i = 0, total = value.length; i < total; i++) {
            const src = absolutizeUrl(value[i].src), type = value[i].type, media = Object.assign(value[i], {
              src,
              type: (type === "" || type === null || type === void 0) && src ? getTypeFromFile(src) : type
            });
            mediaFiles2.push(media);
          }
        }
        let renderInfo = renderer.select(
          mediaFiles2,
          t.mediaElement.options.renderers.length ? t.mediaElement.options.renderers : []
        ), event;
        if (!t.mediaElement.paused && !(t.mediaElement.src == null || t.mediaElement.src === "")) {
          t.mediaElement.pause();
          event = createEvent("pause", t.mediaElement);
          t.mediaElement.dispatchEvent(event);
        }
        t.mediaElement.originalNode.src = mediaFiles2[0].src || "";
        if (renderInfo === null && mediaFiles2[0].src) {
          t.mediaElement.generateError("No renderer found", mediaFiles2);
          return;
        }
        var shouldChangeRenderer = !(mediaFiles2[0].src == null || mediaFiles2[0].src === "");
        return shouldChangeRenderer ? t.mediaElement.changeRenderer(renderInfo.rendererName, mediaFiles2) : null;
      }, triggerAction = (methodName, args) => {
        try {
          if (methodName === "play" && (t.mediaElement.rendererName === "native_dash" || t.mediaElement.rendererName === "native_hls" || t.mediaElement.rendererName === "vimeo_iframe")) {
            const response = t.mediaElement.renderer[methodName](args);
            if (response && typeof response.then === "function") {
              response.catch(() => {
                if (t.mediaElement.paused) {
                  setTimeout(() => {
                    const tmpResponse = t.mediaElement.renderer.play();
                    if (tmpResponse !== void 0) {
                      tmpResponse.catch(() => {
                        if (!t.mediaElement.renderer.paused) {
                          t.mediaElement.renderer.pause();
                        }
                      });
                    }
                  }, 150);
                }
              });
            }
            return response;
          } else {
            return t.mediaElement.renderer[methodName](args);
          }
        } catch (e) {
          t.mediaElement.generateError(e, mediaFiles);
          throw e;
        }
      }, assignMethods = (methodName) => {
        t.mediaElement[methodName] = (...args) => {
          if (t.mediaElement.renderer !== void 0 && t.mediaElement.renderer !== null && typeof t.mediaElement.renderer[methodName] === "function") {
            if (t.mediaElement.promises.length) {
              return Promise.all(t.mediaElement.promises).then(() => {
                return triggerAction(methodName, args);
              }).catch((e) => {
                t.mediaElement.generateError(e, mediaFiles);
                return Promise.reject(e);
              });
            } else {
              return triggerAction(methodName, args);
            }
          }
          return null;
        };
      };
      addProperty(t.mediaElement, "src", getSrc, setSrc);
      t.mediaElement.getSrc = getSrc;
      t.mediaElement.setSrc = setSrc;
      for (let i = 0, total = props.length; i < total; i++) {
        assignGettersSetters(props[i]);
      }
      for (let i = 0, total = methods.length; i < total; i++) {
        assignMethods(methods[i]);
      }
      t.mediaElement.addEventListener = (eventName, callback) => {
        t.mediaElement.events[eventName] = t.mediaElement.events[eventName] || [];
        t.mediaElement.events[eventName].push(callback);
      };
      t.mediaElement.removeEventListener = (eventName, callback) => {
        if (!eventName) {
          t.mediaElement.events = {};
          return true;
        }
        const callbacks = t.mediaElement.events[eventName];
        if (!callbacks) {
          return true;
        }
        if (!callback) {
          t.mediaElement.events[eventName] = [];
          return true;
        }
        for (let i = 0; i < callbacks.length; i++) {
          if (callbacks[i] === callback) {
            t.mediaElement.events[eventName].splice(i, 1);
            return true;
          }
        }
        return false;
      };
      t.mediaElement.dispatchEvent = (event) => {
        const callbacks = t.mediaElement.events[event.type];
        if (callbacks) {
          for (let i = 0; i < callbacks.length; i++) {
            callbacks[i].apply(null, [event]);
          }
        }
      };
      t.mediaElement.destroy = () => {
        const mediaElement = t.mediaElement.originalNode.cloneNode(true);
        const wrapper = t.mediaElement.parentElement;
        mediaElement.removeAttribute("id");
        mediaElement.remove();
        t.mediaElement.remove();
        wrapper.appendChild(mediaElement);
      };
      if (mediaFiles.length) {
        t.mediaElement.src = mediaFiles;
      }
      if (t.mediaElement.promises.length) {
        Promise.all(t.mediaElement.promises).then(() => {
          if (t.mediaElement.options.success) {
            t.mediaElement.options.success(t.mediaElement, t.mediaElement.originalNode);
          }
        }).catch(() => {
          if (error && t.mediaElement.options.error) {
            t.mediaElement.options.error(t.mediaElement, t.mediaElement.originalNode);
          }
        });
      } else {
        if (t.mediaElement.options.success) {
          t.mediaElement.options.success(t.mediaElement, t.mediaElement.originalNode);
        }
        if (error && t.mediaElement.options.error) {
          t.mediaElement.options.error(t.mediaElement, t.mediaElement.originalNode);
        }
      }
      return t.mediaElement;
    }
  };
  window.MediaElement = MediaElement;
  mejs_default.MediaElement = MediaElement;
  var mediaelement_default = MediaElement;

  // src/js/languages/en.js
  var EN = {
    "mejs.plural-form": 1,
    // core/mediaelement.js
    "mejs.download-file": "Download File",
    // features/fullscreen.js
    "mejs.fullscreen": "Fullscreen",
    // features/playpause.js
    "mejs.play": "Play",
    "mejs.pause": "Pause",
    // features/progress.js
    "mejs.time-slider": "Time Slider",
    "mejs.time-help-text": "Use Left/Right Arrow keys to advance one second, Up/Down arrows to advance ten seconds.",
    "mejs.live-broadcast": "Live Broadcast",
    // features/time.js
    "mejs.current": "Current time",
    "mejs.duration": "Total duration",
    // features/volume.js
    "mejs.volume-help-text": "Use Up/Down Arrow keys to increase or decrease volume.",
    "mejs.unmute": "Unmute",
    "mejs.mute": "Mute",
    "mejs.volume-slider": "Volume Slider",
    // core/player.js
    "mejs.video-player": "Video Player",
    "mejs.audio-player": "Audio Player",
    // features/tracks.js
    "mejs.captions-subtitles": "Captions/Subtitles",
    "mejs.captions-chapters": "Chapters",
    "mejs.none": "None",
    "mejs.afrikaans": "Afrikaans",
    "mejs.albanian": "Albanian",
    "mejs.arabic": "Arabic",
    "mejs.belarusian": "Belarusian",
    "mejs.bulgarian": "Bulgarian",
    "mejs.catalan": "Catalan",
    "mejs.chinese": "Chinese",
    "mejs.chinese-simplified": "Chinese (Simplified)",
    "mejs.chinese-traditional": "Chinese (Traditional)",
    "mejs.croatian": "Croatian",
    "mejs.czech": "Czech",
    "mejs.danish": "Danish",
    "mejs.dutch": "Dutch",
    "mejs.english": "English",
    "mejs.estonian": "Estonian",
    "mejs.filipino": "Filipino",
    "mejs.finnish": "Finnish",
    "mejs.french": "French",
    "mejs.galician": "Galician",
    "mejs.german": "German",
    "mejs.greek": "Greek",
    "mejs.haitian-creole": "Haitian Creole",
    "mejs.hebrew": "Hebrew",
    "mejs.hindi": "Hindi",
    "mejs.hungarian": "Hungarian",
    "mejs.icelandic": "Icelandic",
    "mejs.indonesian": "Indonesian",
    "mejs.irish": "Irish",
    "mejs.italian": "Italian",
    "mejs.japanese": "Japanese",
    "mejs.korean": "Korean",
    "mejs.latvian": "Latvian",
    "mejs.lithuanian": "Lithuanian",
    "mejs.macedonian": "Macedonian",
    "mejs.malay": "Malay",
    "mejs.maltese": "Maltese",
    "mejs.norwegian": "Norwegian",
    "mejs.persian": "Persian",
    "mejs.polish": "Polish",
    "mejs.portuguese": "Portuguese",
    "mejs.romanian": "Romanian",
    "mejs.russian": "Russian",
    "mejs.serbian": "Serbian",
    "mejs.slovak": "Slovak",
    "mejs.slovenian": "Slovenian",
    "mejs.spanish": "Spanish",
    "mejs.swahili": "Swahili",
    "mejs.swedish": "Swedish",
    "mejs.tagalog": "Tagalog",
    "mejs.thai": "Thai",
    "mejs.turkish": "Turkish",
    "mejs.ukrainian": "Ukrainian",
    "mejs.vietnamese": "Vietnamese",
    "mejs.welsh": "Welsh",
    "mejs.yiddish": "Yiddish"
  };

  // src/js/core/i18n.js
  var i18n = { lang: "en", en: EN };
  i18n.language = (...args) => {
    if (args !== null && args !== void 0 && args.length) {
      if (typeof args[0] !== "string") {
        throw new TypeError("Language code must be a string value");
      }
      if (!/^[a-z]{2,3}((\-|_)[a-z]{2})?$/i.test(args[0])) {
        throw new TypeError("Language code must have format 2-3 letters and. optionally, hyphen, underscore followed by 2 more letters");
      }
      i18n.lang = args[0];
      if (i18n[args[0]] === void 0) {
        args[1] = args[1] !== null && args[1] !== void 0 && typeof args[1] === "object" ? args[1] : {};
        i18n[args[0]] = !isObjectEmpty(args[1]) ? args[1] : EN;
      } else if (args[1] !== null && args[1] !== void 0 && typeof args[1] === "object") {
        i18n[args[0]] = args[1];
      }
    }
    return i18n.lang;
  };
  i18n.t = (message, pluralParam = null) => {
    if (typeof message === "string" && message.length) {
      let str, pluralForm;
      const language = i18n.language();
      const _plural = (input, number, form) => {
        if (typeof input !== "object" || typeof number !== "number" || typeof form !== "number") {
          return input;
        }
        const _pluralForms = /* @__PURE__ */ (() => {
          return [
            // 0: Chinese, Japanese, Korean, Persian, Turkish, Thai, Lao, Aymará,
            // Tibetan, Chiga, Dzongkha, Indonesian, Lojban, Georgian, Kazakh, Khmer, Kyrgyz, Malay,
            // Burmese, Yakut, Sundanese, Tatar, Uyghur, Vietnamese, Wolof
            (...args) => args[1],
            // 1: Danish, Dutch, English, Faroese, Frisian, German, Norwegian, Swedish, Estonian, Finnish,
            // Hungarian, Basque, Greek, Hebrew, Italian, Portuguese, Spanish, Catalan, Afrikaans,
            // Angika, Assamese, Asturian, Azerbaijani, Bulgarian, Bengali, Bodo, Aragonese, Dogri,
            // Esperanto, Argentinean Spanish, Fulah, Friulian, Galician, Gujarati, Hausa,
            // Hindi, Chhattisgarhi, Armenian, Interlingua, Greenlandic, Kannada, Kurdish, Letzeburgesch,
            // Maithili, Malayalam, Mongolian, Manipuri, Marathi, Nahuatl, Neapolitan, Norwegian Bokmal,
            // Nepali, Norwegian Nynorsk, Norwegian (old code), Northern Sotho, Oriya, Punjabi, Papiamento,
            // Piemontese, Pashto, Romansh, Kinyarwanda, Santali, Scots, Sindhi, Northern Sami, Sinhala,
            // Somali, Songhay, Albanian, Swahili, Tamil, Telugu, Turkmen, Urdu, Yoruba
            (...args) => args[0] === 1 ? args[1] : args[2],
            // 2: French, Brazilian Portuguese, Acholi, Akan, Amharic, Mapudungun, Breton, Filipino,
            // Gun, Lingala, Mauritian Creole, Malagasy, Maori, Occitan, Tajik, Tigrinya, Uzbek, Walloon
            (...args) => args[0] === 0 || args[0] === 1 ? args[1] : args[2],
            // 3: Latvian
            (...args) => {
              if (args[0] % 10 === 1 && args[0] % 100 !== 11) {
                return args[1];
              } else if (args[0] !== 0) {
                return args[2];
              } else {
                return args[3];
              }
            },
            // 4: Scottish Gaelic
            (...args) => {
              if (args[0] === 1 || args[0] === 11) {
                return args[1];
              } else if (args[0] === 2 || args[0] === 12) {
                return args[2];
              } else if (args[0] > 2 && args[0] < 20) {
                return args[3];
              } else {
                return args[4];
              }
            },
            // 5:  Romanian
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] === 0 || args[0] % 100 > 0 && args[0] % 100 < 20) {
                return args[2];
              } else {
                return args[3];
              }
            },
            // 6: Lithuanian
            (...args) => {
              if (args[0] % 10 === 1 && args[0] % 100 !== 11) {
                return args[1];
              } else if (args[0] % 10 >= 2 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
                return args[2];
              } else {
                return [3];
              }
            },
            // 7: Belarusian, Bosnian, Croatian, Serbian, Russian, Ukrainian
            (...args) => {
              if (args[0] % 10 === 1 && args[0] % 100 !== 11) {
                return args[1];
              } else if (args[0] % 10 >= 2 && args[0] % 10 <= 4 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
                return args[2];
              } else {
                return args[3];
              }
            },
            // 8:  Slovak, Czech
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] >= 2 && args[0] <= 4) {
                return args[2];
              } else {
                return args[3];
              }
            },
            // 9: Polish
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] % 10 >= 2 && args[0] % 10 <= 4 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
                return args[2];
              } else {
                return args[3];
              }
            },
            // 10: Slovenian
            (...args) => {
              if (args[0] % 100 === 1) {
                return args[2];
              } else if (args[0] % 100 === 2) {
                return args[3];
              } else if (args[0] % 100 === 3 || args[0] % 100 === 4) {
                return args[4];
              } else {
                return args[1];
              }
            },
            // 11: Irish Gaelic
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] === 2) {
                return args[2];
              } else if (args[0] > 2 && args[0] < 7) {
                return args[3];
              } else if (args[0] > 6 && args[0] < 11) {
                return args[4];
              } else {
                return args[5];
              }
            },
            // 12: Arabic
            (...args) => {
              if (args[0] === 0) {
                return args[1];
              } else if (args[0] === 1) {
                return args[2];
              } else if (args[0] === 2) {
                return args[3];
              } else if (args[0] % 100 >= 3 && args[0] % 100 <= 10) {
                return args[4];
              } else if (args[0] % 100 >= 11) {
                return args[5];
              } else {
                return args[6];
              }
            },
            // 13: Maltese
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] === 0 || args[0] % 100 > 1 && args[0] % 100 < 11) {
                return args[2];
              } else if (args[0] % 100 > 10 && args[0] % 100 < 20) {
                return args[3];
              } else {
                return args[4];
              }
            },
            // 14: Macedonian
            (...args) => {
              if (args[0] % 10 === 1) {
                return args[1];
              } else if (args[0] % 10 === 2) {
                return args[2];
              } else {
                return args[3];
              }
            },
            // 15:  Icelandic
            (...args) => {
              return args[0] !== 11 && args[0] % 10 === 1 ? args[1] : args[2];
            },
            // New additions
            // 16:  Kashubian
            // In https://developer.mozilla.org/en-US/docs/Mozilla/Localization/Localization_and_Plurals#List_of__pluralRules
            // Breton is listed as #16 but in the Localization Guide it belongs to the group 2
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] % 10 >= 2 && args[0] % 10 <= 4 && (args[0] % 100 < 10 || args[0] % 100 >= 20)) {
                return args[2];
              } else {
                return args[3];
              }
            },
            // 17:  Welsh
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] === 2) {
                return args[2];
              } else if (args[0] !== 8 && args[0] !== 11) {
                return args[3];
              } else {
                return args[4];
              }
            },
            // 18:  Javanese
            (...args) => {
              return args[0] === 0 ? args[1] : args[2];
            },
            // 19:  Cornish
            (...args) => {
              if (args[0] === 1) {
                return args[1];
              } else if (args[0] === 2) {
                return args[2];
              } else if (args[0] === 3) {
                return args[3];
              } else {
                return args[4];
              }
            },
            // 20:  Mandinka
            (...args) => {
              if (args[0] === 0) {
                return args[1];
              } else if (args[0] === 1) {
                return args[2];
              } else {
                return args[3];
              }
            }
          ];
        })();
        return _pluralForms[form].apply(null, [number].concat(input));
      };
      if (i18n[language] !== void 0) {
        str = i18n[language][message];
        if (pluralParam !== null && typeof pluralParam === "number") {
          pluralForm = i18n[language]["mejs.plural-form"];
          str = _plural.apply(null, [str, pluralParam, pluralForm]);
        }
      }
      if (!str && i18n.en) {
        str = i18n.en[message];
        if (pluralParam !== null && typeof pluralParam === "number") {
          pluralForm = i18n.en["mejs.plural-form"];
          str = _plural.apply(null, [str, pluralParam, pluralForm]);
        }
      }
      str = str || message;
      if (pluralParam !== null && typeof pluralParam === "number") {
        str = str.replace("%1", pluralParam);
      }
      return escapeHTML(str);
    }
    return message;
  };
  mejs_default.i18n = i18n;
  if (typeof mejsL10n !== "undefined") {
    mejs_default.i18n.language(mejsL10n.language, mejsL10n.strings);
  }
  var i18n_default = i18n;

  // src/js/renderers/html5.js
  var HtmlMediaElement = {
    name: "html5",
    options: {
      prefix: "html5"
    },
    /**
     * Determine if a specific element type can be played with this render
     *
     * @param {String} type
     * @return {String}
     */
    canPlayType: (type) => {
      const mediaElement = document.createElement("video");
      if (IS_ANDROID && /\/mp(3|4)$/i.test(type) || ~[
        "application/x-mpegurl",
        "vnd.apple.mpegurl",
        "audio/mpegurl",
        "audio/hls",
        "video/hls"
      ].indexOf(type.toLowerCase()) && SUPPORTS_NATIVE_HLS) {
        return "yes";
      } else if (mediaElement.canPlayType) {
        return mediaElement.canPlayType(type.toLowerCase()).replace(/no/, "");
      } else {
        return "";
      }
    },
    /**
     * Create the player instance and add all native events/methods/properties as possible
     *
     * @param {MediaElement} mediaElement Instance of mejs.MediaElement already created
     * @param {Object} options All the player configuration options passed through constructor
     * @param {Object[]} mediaFiles List of sources with format: {src: url, type: x/y-z}
     * @return {Object}
     */
    create: (mediaElement, options, mediaFiles) => {
      const id = mediaElement.id + "_" + options.prefix;
      let isActive = false;
      let node = null;
      if (mediaElement.originalNode === void 0 || mediaElement.originalNode === null) {
        node = document.createElement("audio");
        mediaElement.appendChild(node);
      } else {
        node = mediaElement.originalNode;
      }
      node.setAttribute("id", id);
      const props = mejs_default.html5media.properties, assignGettersSetters = (propName) => {
        const capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;
        node[`get${capName}`] = () => node[propName];
        node[`set${capName}`] = (value) => {
          if (mejs_default.html5media.readOnlyProperties.indexOf(propName) === -1) {
            node[propName] = value;
          }
        };
      };
      for (let i = 0, total2 = props.length; i < total2; i++) {
        assignGettersSetters(props[i]);
      }
      const events = mejs_default.html5media.events.concat(["click", "mouseover", "mouseout"]).filter((e) => e !== "error"), assignEvents = (eventName) => {
        node.addEventListener(eventName, (e) => {
          if (isActive) {
            const event2 = createEvent(e.type, e.target);
            mediaElement.dispatchEvent(event2);
          }
        });
      };
      for (let i = 0, total2 = events.length; i < total2; i++) {
        assignEvents(events[i]);
      }
      node.setSize = (width, height) => {
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
        return node;
      };
      node.hide = () => {
        isActive = false;
        node.style.display = "none";
        return node;
      };
      node.show = () => {
        isActive = true;
        node.style.display = "";
        return node;
      };
      let index = 0, total = mediaFiles.length;
      if (total > 0) {
        for (; index < total; index++) {
          if (renderer.renderers[options.prefix].canPlayType(mediaFiles[index].type)) {
            node.setAttribute("src", mediaFiles[index].src);
            break;
          }
        }
      }
      node.addEventListener("error", function(e) {
        if (e && e.target && e.target.error && e.target.error.code === 4 && isActive) {
          if (index < total && mediaFiles[index + 1] !== void 0) {
            node.src = mediaFiles[index++].src;
            node.load();
            node.play();
          } else {
            mediaElement.generateError("Media error: Format(s) not supported or source(s) not found", mediaFiles);
          }
        }
      });
      const event = createEvent("rendererready", node, false);
      mediaElement.originalNode.dispatchEvent(event);
      return node;
    }
  };
  window.HtmlMediaElement = mejs_default.HtmlMediaElement = HtmlMediaElement;
  renderer.add(HtmlMediaElement);

  // src/js/utils/dom.js
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = () => {
        script.remove();
        resolve();
      };
      script.onerror = () => {
        script.remove();
        reject();
      };
      document.head.appendChild(script);
    });
  }
  function offset(el) {
    var rect = el.getBoundingClientRect(), scrollLeft = window.pageXOffset || document.documentElement.scrollLeft, scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }
  var hasClass = (el, className) => el.classList.contains(className);
  var addClass = (el, className) => el.classList.add(className);
  var removeClass = (el, className) => el.classList.remove(className);
  function toggleClass(el, className) {
    hasClass(el, className) ? removeClass(el, className) : addClass(el, className);
  }
  function fadeOut(el, duration = 400, callback) {
    if (!el.style.opacity) {
      el.style.opacity = 1;
    }
    let start = null;
    window.requestAnimationFrame(function animate(timestamp) {
      start = start || timestamp;
      const progress = timestamp - start;
      const opacity = parseFloat(1 - progress / duration, 2);
      el.style.opacity = opacity < 0 ? 0 : opacity;
      if (progress > duration) {
        if (callback && typeof callback === "function") {
          callback();
        }
      } else {
        window.requestAnimationFrame(animate);
      }
    });
  }
  function fadeIn(el, duration = 400, callback) {
    if (!el.style.opacity) {
      el.style.opacity = 0;
    }
    let start = null;
    window.requestAnimationFrame(function animate(timestamp) {
      start = start || timestamp;
      const progress = timestamp - start;
      const opacity = parseFloat(progress / duration, 2);
      el.style.opacity = opacity > 1 ? 1 : opacity;
      if (progress > duration) {
        if (callback && typeof callback === "function") {
          callback();
        }
      } else {
        window.requestAnimationFrame(animate);
      }
    });
  }
  function siblings(el, filter) {
    const siblings2 = [];
    el = el.parentNode.firstChild;
    do {
      if (!filter || filter(el)) {
        siblings2.push(el);
      }
    } while (el = el.nextSibling);
    return siblings2;
  }
  function visible(elem) {
    if (elem.getClientRects !== void 0 && elem.getClientRects === "function") {
      return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    }
    return !!(elem.offsetWidth || elem.offsetHeight);
  }
  function ajax(url, dataType, success, error) {
    const xhr = new XMLHttpRequest();
    let type = "application/x-www-form-urlencoded; charset=UTF-8", completed = false, accept = "*/".concat("*");
    switch (dataType) {
      case "text":
        type = "text/plain";
        break;
      case "json":
        type = "application/json, text/javascript";
        break;
      case "html":
        type = "text/html";
        break;
      case "xml":
        type = "application/xml, text/xml";
        break;
    }
    if (type !== "application/x-www-form-urlencoded") {
      accept = `${type}, */*; q=0.01`;
    }
    if (xhr) {
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Accept", accept);
      xhr.onreadystatechange = function() {
        if (completed) {
          return;
        }
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            completed = true;
            let data;
            switch (dataType) {
              case "json":
                data = JSON.parse(xhr.responseText);
                break;
              case "xml":
                data = xhr.responseXML;
                break;
              default:
                data = xhr.responseText;
                break;
            }
            success(data);
          } else if (typeof error === "function") {
            error(xhr.status);
          }
        }
      };
      xhr.send();
    }
  }
  mejs_default.Utils = mejs_default.Utils || {};
  mejs_default.Utils.offset = offset;
  mejs_default.Utils.hasClass = hasClass;
  mejs_default.Utils.addClass = addClass;
  mejs_default.Utils.removeClass = removeClass;
  mejs_default.Utils.toggleClass = toggleClass;
  mejs_default.Utils.fadeIn = fadeIn;
  mejs_default.Utils.fadeOut = fadeOut;
  mejs_default.Utils.siblings = siblings;
  mejs_default.Utils.visible = visible;
  mejs_default.Utils.ajax = ajax;
  mejs_default.Utils.loadScript = loadScript;

  // src/js/renderers/dash.js
  var NativeDash = {
    promise: null,
    /**
     * Create a queue to prepare the loading of an DASH source
     *
     * @param {Object} settings - an object with settings needed to load an DASH player instance
     */
    load: (settings) => {
      if (typeof dashjs !== "undefined") {
        NativeDash.promise = new Promise((resolve) => {
          resolve();
        }).then(() => {
          NativeDash._createPlayer(settings);
        });
      } else {
        settings.options.path = typeof settings.options.path === "string" ? settings.options.path : "https://cdn.dashjs.org/latest/dash.all.min.js";
        NativeDash.promise = NativeDash.promise || loadScript(settings.options.path);
        NativeDash.promise.then(() => {
          NativeDash._createPlayer(settings);
        });
      }
      return NativeDash.promise;
    },
    /**
     * Create a new instance of DASH player and trigger a custom event to initialize it
     *
     * @param {Object} settings - an object with settings needed to instantiate DASH object
     */
    _createPlayer: (settings) => {
      const player = dashjs.MediaPlayer().create();
      window[`__ready__${settings.id}`](player);
      return player;
    }
  };
  var DashNativeRenderer = {
    name: "native_dash",
    options: {
      prefix: "native_dash",
      dash: {
        // Special config: used to set the local path/URL of dash.js player library
        path: "https://cdn.dashjs.org/latest/dash.all.min.js",
        debug: false,
        drm: {},
        // Robustness level for video and audio capabilities.
        // Possible values: SW_SECURE_CRYPTO, SW_SECURE_DECODE, HW_SECURE_CRYPTO, HW_SECURE_CRYPTO, HW_SECURE_DECODE, HW_SECURE_ALL
        robustnessLevel: ""
      }
    },
    /**
     * Determine if a specific element type can be played with this render
     *
     * @param {String} type
     * @return {Boolean}
     */
    canPlayType: (type) => HAS_MSE && ["application/dash+xml"].indexOf(type.toLowerCase()) > -1,
    /**
     * Create the player instance and add all native events/methods/properties as possible
     *
     * @param {MediaElement} mediaElement Instance of mejs.MediaElement already created
     * @param {Object} options All the player configuration options passed through constructor
     * @param {Object[]} mediaFiles List of sources with format: {src: url, type: x/y-z}
     * @return {Object}
     */
    create: (mediaElement, options, mediaFiles) => {
      const originalNode = mediaElement.originalNode, id = mediaElement.id + "_" + options.prefix, autoplay = originalNode.autoplay, children = originalNode.children;
      let node = null, dashPlayer = null;
      originalNode.removeAttribute("type");
      for (let i = 0, total = children.length; i < total; i++) {
        children[i].removeAttribute("type");
      }
      node = originalNode.cloneNode(true);
      options = Object.assign(options, mediaElement.options);
      const props = mejs_default.html5media.properties, events = mejs_default.html5media.events.concat(["click", "mouseover", "mouseout"]).filter((e) => e !== "error"), attachNativeEvents = (e) => {
        const event2 = createEvent(e.type, mediaElement);
        mediaElement.dispatchEvent(event2);
      }, assignGettersSetters = (propName) => {
        const capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;
        node[`get${capName}`] = () => dashPlayer !== null ? node[propName] : null;
        node[`set${capName}`] = (value) => {
          if (mejs_default.html5media.readOnlyProperties.indexOf(propName) === -1) {
            if (propName === "src") {
              const source = typeof value === "object" && value.src ? value.src : value;
              node[propName] = source;
              if (dashPlayer !== null) {
                dashPlayer.reset();
                for (let i = 0, total = events.length; i < total; i++) {
                  node.removeEventListener(events[i], attachNativeEvents);
                }
                dashPlayer = NativeDash._createPlayer({
                  options: options.dash,
                  id
                });
                if (value && typeof value === "object" && typeof value.drm === "object") {
                  dashPlayer.setProtectionData(value.drm);
                  if (isString(options.dash.robustnessLevel) && options.dash.robustnessLevel) {
                    dashPlayer.getProtectionController().setRobustnessLevel(options.dash.robustnessLevel);
                  }
                }
                dashPlayer.attachSource(source);
                if (autoplay) {
                  dashPlayer.play();
                }
              }
            } else {
              node[propName] = value;
            }
          }
        };
      };
      for (let i = 0, total = props.length; i < total; i++) {
        assignGettersSetters(props[i]);
      }
      window["__ready__" + id] = (_dashPlayer) => {
        mediaElement.dashPlayer = dashPlayer = _dashPlayer;
        const dashEvents = dashjs.MediaPlayer.events, assignEvents = (eventName) => {
          if (eventName === "loadedmetadata") {
            dashPlayer.initialize();
            dashPlayer.attachView(node);
            dashPlayer.setAutoPlay(false);
            if (typeof options.dash.drm === "object" && !mejs_default.Utils.isObjectEmpty(options.dash.drm)) {
              dashPlayer.setProtectionData(options.dash.drm);
              if (isString(options.dash.robustnessLevel) && options.dash.robustnessLevel) {
                dashPlayer.getProtectionController().setRobustnessLevel(options.dash.robustnessLevel);
              }
            }
            dashPlayer.attachSource(node.getSrc());
          }
          node.addEventListener(eventName, attachNativeEvents);
        };
        for (let i = 0, total = events.length; i < total; i++) {
          assignEvents(events[i]);
        }
        const assignMdashEvents = (e) => {
          if (e.type.toLowerCase() === "error") {
            mediaElement.generateError(e.message, node.src);
            console.error(e);
          } else {
            const event2 = createEvent(e.type, mediaElement);
            event2.data = e;
            mediaElement.dispatchEvent(event2);
          }
        };
        for (const eventType in dashEvents) {
          if (dashEvents.hasOwnProperty(eventType)) {
            dashPlayer.on(dashEvents[eventType], (e) => assignMdashEvents(e));
          }
        }
      };
      if (mediaFiles && mediaFiles.length > 0) {
        for (let i = 0, total = mediaFiles.length; i < total; i++) {
          if (renderer.renderers[options.prefix].canPlayType(mediaFiles[i].type)) {
            node.setAttribute("src", mediaFiles[i].src);
            if (typeof mediaFiles[i].drm !== "undefined") {
              options.dash.drm = mediaFiles[i].drm;
            }
            break;
          }
        }
      }
      node.setAttribute("id", id);
      originalNode.parentNode.insertBefore(node, originalNode);
      originalNode.autoplay = false;
      originalNode.style.display = "none";
      node.setSize = (width, height) => {
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
        return node;
      };
      node.hide = () => {
        node.pause();
        node.style.display = "none";
        return node;
      };
      node.show = () => {
        node.style.display = "";
        return node;
      };
      node.destroy = () => {
        if (dashPlayer !== null) {
          dashPlayer.reset();
        }
      };
      const event = createEvent("rendererready", node, false);
      mediaElement.originalNode.dispatchEvent(event);
      mediaElement.promises.push(NativeDash.load({
        options: options.dash,
        id
      }));
      return node;
    }
  };
  typeChecks.push((url) => ~url.toLowerCase().indexOf(".mpd") ? "application/dash+xml" : null);
  renderer.add(DashNativeRenderer);

  // src/js/renderers/hls.js
  var NativeHls = {
    promise: null,
    /**
     * Create a queue to prepare the loading of an HLS source
     *
     * @param {Object} settings - an object with settings needed to load an HLS player instance
     */
    load: (settings) => {
      if (typeof Hls !== "undefined") {
        NativeHls.promise = new Promise((resolve) => {
          resolve();
        }).then(() => {
          NativeHls._createPlayer(settings);
        });
      } else {
        settings.options.path = typeof settings.options.path === "string" ? settings.options.path : "https://cdn.jsdelivr.net/npm/hls.js@latest";
        NativeHls.promise = NativeHls.promise || loadScript(settings.options.path);
        NativeHls.promise.then(() => {
          NativeHls._createPlayer(settings);
        });
      }
      return NativeHls.promise;
    },
    /**
     * Create a new instance of HLS player and trigger a custom event to initialize it
     *
     * @param {Object} settings - an object with settings needed to instantiate HLS object
     * @return {Hls}
     */
    _createPlayer: (settings) => {
      const player = new Hls(settings.options);
      window[`__ready__${settings.id}`](player);
      return player;
    }
  };
  var HlsNativeRenderer = {
    name: "native_hls",
    options: {
      prefix: "native_hls",
      hls: {
        // Special config: used to set the local path/URL of hls.js library
        path: "https://cdn.jsdelivr.net/npm/hls.js@latest",
        // To modify more elements from hls.js,
        // see https://github.com/video-dev/hls.js/blob/master/doc/API.md#fine-tuning
        autoStartLoad: false,
        debug: false
      }
    },
    /**
     * Determine if a specific element type can be played with this render
     *
     * @param {String} type
     * @return {Boolean}
     */
    canPlayType: (type) => HAS_MSE && [
      "application/x-mpegurl",
      "application/vnd.apple.mpegurl",
      "audio/mpegurl",
      "audio/hls",
      "video/hls"
    ].indexOf(type.toLowerCase()) > -1,
    /**
     * Create the player instance and add all native events/methods/properties as possible
     *
     * @param {MediaElement} mediaElement Instance of mejs.MediaElement already created
     * @param {Object} options All the player configuration options passed through constructor
     * @param {Object[]} mediaFiles List of sources with format: {src: url, type: x/y-z}
     * @return {Object}
     */
    create: (mediaElement, options, mediaFiles) => {
      const originalNode = mediaElement.originalNode, id = mediaElement.id + "_" + options.prefix, preload = originalNode.getAttribute("preload"), autoplay = originalNode.autoplay;
      let hlsPlayer = null, node = null, index = 0, total = mediaFiles.length;
      node = originalNode.cloneNode(true);
      options = Object.assign(options, mediaElement.options);
      options.hls.autoStartLoad = preload && preload !== "none" || autoplay;
      const props = mejs_default.html5media.properties, events = mejs_default.html5media.events.concat(["click", "mouseover", "mouseout"]).filter((e) => e !== "error"), attachNativeEvents = (e) => {
        const event2 = createEvent(e.type, mediaElement);
        mediaElement.dispatchEvent(event2);
      }, assignGettersSetters = (propName) => {
        const capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;
        node[`get${capName}`] = () => hlsPlayer !== null ? node[propName] : null;
        node[`set${capName}`] = (value) => {
          if (mejs_default.html5media.readOnlyProperties.indexOf(propName) === -1) {
            if (propName === "src") {
              node[propName] = typeof value === "object" && value.src ? value.src : value;
              if (hlsPlayer !== null) {
                hlsPlayer.destroy();
                for (let i = 0, total2 = events.length; i < total2; i++) {
                  node.removeEventListener(events[i], attachNativeEvents);
                }
                hlsPlayer = NativeHls._createPlayer({
                  options: options.hls,
                  id
                });
                hlsPlayer.loadSource(value);
                hlsPlayer.attachMedia(node);
              }
            } else {
              node[propName] = value;
            }
          }
        };
      };
      for (let i = 0, total2 = props.length; i < total2; i++) {
        assignGettersSetters(props[i]);
      }
      window["__ready__" + id] = (_hlsPlayer) => {
        mediaElement.hlsPlayer = hlsPlayer = _hlsPlayer;
        const hlsEvents = Hls.Events, assignEvents = (eventName) => {
          if (eventName === "loadedmetadata") {
            const url = mediaElement.originalNode.src;
            hlsPlayer.detachMedia();
            hlsPlayer.loadSource(url);
            hlsPlayer.attachMedia(node);
          }
          node.addEventListener(eventName, attachNativeEvents);
        };
        for (let i = 0, total2 = events.length; i < total2; i++) {
          assignEvents(events[i]);
        }
        let recoverDecodingErrorDate, recoverSwapAudioCodecDate;
        const assignHlsEvents = function(name, data) {
          if (name === "hlsError") {
            console.warn(data);
            data = data[1];
            if (data.fatal) {
              switch (data.type) {
                case "mediaError":
                  const now = (/* @__PURE__ */ new Date()).getTime();
                  if (!recoverDecodingErrorDate || now - recoverDecodingErrorDate > 3e3) {
                    recoverDecodingErrorDate = (/* @__PURE__ */ new Date()).getTime();
                    hlsPlayer.recoverMediaError();
                  } else if (!recoverSwapAudioCodecDate || now - recoverSwapAudioCodecDate > 3e3) {
                    recoverSwapAudioCodecDate = (/* @__PURE__ */ new Date()).getTime();
                    console.warn("Attempting to swap Audio Codec and recover from media error");
                    hlsPlayer.swapAudioCodec();
                    hlsPlayer.recoverMediaError();
                  } else {
                    const message = "Cannot recover, last media error recovery failed";
                    mediaElement.generateError(message, node.src);
                    console.error(message);
                  }
                  break;
                case "networkError":
                  if (data.details === "manifestLoadError") {
                    if (index < total && mediaFiles[index + 1] !== void 0) {
                      node.setSrc(mediaFiles[index++].src);
                      node.load();
                      node.play();
                    } else {
                      const message = "Network error";
                      mediaElement.generateError(message, mediaFiles);
                      console.error(message);
                    }
                  } else {
                    const message = "Network error";
                    mediaElement.generateError(message, mediaFiles);
                    console.error(message);
                  }
                  break;
                default:
                  hlsPlayer.destroy();
                  break;
              }
              return;
            }
          }
          const event2 = createEvent(name, mediaElement);
          event2.data = data;
          mediaElement.dispatchEvent(event2);
        };
        for (const eventType in hlsEvents) {
          if (hlsEvents.hasOwnProperty(eventType)) {
            hlsPlayer.on(hlsEvents[eventType], (...args) => assignHlsEvents(hlsEvents[eventType], args));
          }
        }
      };
      if (total > 0) {
        for (; index < total; index++) {
          if (renderer.renderers[options.prefix].canPlayType(mediaFiles[index].type)) {
            node.setAttribute("src", mediaFiles[index].src);
            break;
          }
        }
      }
      if (preload !== "auto" && !autoplay) {
        node.addEventListener("play", () => {
          if (hlsPlayer !== null) {
            hlsPlayer.startLoad();
          }
        });
        node.addEventListener("pause", () => {
          if (hlsPlayer !== null) {
            hlsPlayer.stopLoad();
          }
        });
      }
      node.setAttribute("id", id);
      originalNode.parentNode.insertBefore(node, originalNode);
      originalNode.autoplay = false;
      originalNode.style.display = "none";
      node.setSize = (width, height) => {
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
        return node;
      };
      node.hide = () => {
        node.pause();
        node.style.display = "none";
        return node;
      };
      node.show = () => {
        node.style.display = "";
        return node;
      };
      node.destroy = () => {
        if (hlsPlayer !== null) {
          hlsPlayer.stopLoad();
          hlsPlayer.destroy();
        }
      };
      const event = createEvent("rendererready", node, false);
      mediaElement.originalNode.dispatchEvent(event);
      mediaElement.promises.push(NativeHls.load({
        options: options.hls,
        id
      }));
      return node;
    }
  };
  typeChecks.push((url) => ~url.toLowerCase().indexOf(".m3u8") ? "application/x-mpegURL" : null);
  renderer.add(HlsNativeRenderer);

  // src/js/renderers/youtube.js
  var YouTubeApi = {
    /**
     * @type {Boolean}
     */
    isIframeStarted: false,
    /**
     * @type {Boolean}
     */
    isIframeLoaded: false,
    /**
     * @type {Array}
     */
    iframeQueue: [],
    /**
     * Create a queue to prepare the creation of <iframe>
     *
     * @param {Object} settings - an object with settings needed to create <iframe>
     */
    enqueueIframe: (settings) => {
      YouTubeApi.isLoaded = typeof YT !== "undefined" && YT.loaded;
      if (YouTubeApi.isLoaded) {
        YouTubeApi.createIframe(settings);
      } else {
        YouTubeApi.loadIframeApi();
        YouTubeApi.iframeQueue.push(settings);
      }
    },
    /**
     * Load YouTube API script on the header of the document
     *
     */
    loadIframeApi: () => {
      if (!YouTubeApi.isIframeStarted) {
        loadScript("https://www.youtube.com/player_api");
        YouTubeApi.isIframeStarted = true;
      }
    },
    /**
     * Process queue of YouTube <iframe> element creation
     *
     */
    iFrameReady: () => {
      YouTubeApi.isLoaded = true;
      YouTubeApi.isIframeLoaded = true;
      while (YouTubeApi.iframeQueue.length > 0) {
        const settings = YouTubeApi.iframeQueue.pop();
        YouTubeApi.createIframe(settings);
      }
    },
    /**
     * Create a new instance of YouTube API player and trigger a custom event to initialize it
     *
     * @param {Object} settings - an object with settings needed to create <iframe>
     */
    createIframe: (settings) => {
      return new YT.Player(settings.containerId, settings);
    },
    /**
     * Extract ID from YouTube's URL to be loaded through API
     * Valid URL format(s):
     * - http://www.youtube.com/watch?feature=player_embedded&v=yyWWXSwtPP0
     * - http://www.youtube.com/v/VIDEO_ID?version=3
     * - http://youtu.be/Djd6tPrxc08
     * - http://www.youtube-nocookie.com/watch?feature=player_embedded&v=yyWWXSwtPP0
     * - https://youtube.com/watch?v=1XwU8H6e8Ts
     *
     * @param {String} url
     * @return {string}
     */
    getYouTubeId: (url) => {
      let youTubeId = "";
      if (url.indexOf("?") > 0) {
        youTubeId = YouTubeApi.getYouTubeIdFromParam(url);
        if (youTubeId === "") {
          youTubeId = YouTubeApi.getYouTubeIdFromUrl(url);
        }
      } else {
        youTubeId = YouTubeApi.getYouTubeIdFromUrl(url);
      }
      const id = youTubeId.substring(youTubeId.lastIndexOf("/") + 1);
      youTubeId = id.split("?");
      return youTubeId[0];
    },
    /**
     * Get ID from URL with format: http://www.youtube.com/watch?feature=player_embedded&v=yyWWXSwtPP0
     *
     * @param {String} url
     * @returns {string}
     */
    getYouTubeIdFromParam: (url) => {
      if (url === void 0 || url === null || !url.trim().length) {
        return null;
      }
      const parts = url.split("?"), parameters = parts[1].split("&");
      let youTubeId = "";
      for (let i = 0, total = parameters.length; i < total; i++) {
        const paramParts = parameters[i].split("=");
        if (paramParts[0] === "v") {
          youTubeId = paramParts[1];
          break;
        }
      }
      return youTubeId;
    },
    /**
     * Get ID from URL with formats
     *  - http://www.youtube.com/v/VIDEO_ID?version=3
     *  - http://youtu.be/Djd6tPrxc08
     * @param {String} url
     * @return {?String}
     */
    getYouTubeIdFromUrl: (url) => {
      if (url === void 0 || url === null || !url.trim().length) {
        return null;
      }
      const parts = url.split("?");
      url = parts[0];
      return url.substring(url.lastIndexOf("/") + 1);
    },
    /**
     * Inject `no-cookie` element to URL. Only works with format: http://www.youtube.com/v/VIDEO_ID?version=3
     * @param {String} url
     * @return {?String}
     */
    getYouTubeNoCookieUrl: (url) => {
      if (url === void 0 || url === null || !url.trim().length || url.indexOf("//www.youtube") === -1) {
        return url;
      }
      const parts = url.split("/");
      parts[2] = parts[2].replace(".com", "-nocookie.com");
      return parts.join("/");
    }
  };
  var YouTubeIframeRenderer = {
    name: "youtube_iframe",
    options: {
      prefix: "youtube_iframe",
      /**
       * Custom configuration for YouTube player
       *
       * @see https://developers.google.com/youtube/player_parameters#Parameters
       * @type {Object}
       */
      youtube: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        end: 0,
        loop: 0,
        modestbranding: 0,
        playsinline: 0,
        rel: 0,
        showinfo: 0,
        start: 0,
        iv_load_policy: 3,
        // custom to inject `-nocookie` element in URL
        nocookie: false,
        // accepts: `default`, `hqdefault`, `mqdefault`, `sddefault` and `maxresdefault`
        imageQuality: null
      }
    },
    /**
     * Determine if a specific element type can be played with this render
     *
     * @param {String} type
     * @return {Boolean}
     */
    canPlayType: (type) => ~["video/youtube", "video/x-youtube"].indexOf(type.toLowerCase()),
    /**
     * Create the player instance and add all native events/methods/properties as possible
     *
     * @param {MediaElement} mediaElement Instance of mejs.MediaElement already created
     * @param {Object} options All the player configuration options passed through constructor
     * @param {Object[]} mediaFiles List of sources with format: {src: url, type: x/y-z}
     * @return {Object}
     */
    create: (mediaElement, options, mediaFiles) => {
      const youtube = {}, apiStack = [], readyState = 4;
      let youTubeApi = null, paused = true, ended = false, youTubeIframe = null, volume = 1;
      youtube.options = options;
      youtube.id = mediaElement.id + "_" + options.prefix;
      youtube.mediaElement = mediaElement;
      const props = mejs_default.html5media.properties, assignGettersSetters = (propName) => {
        const capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;
        youtube[`get${capName}`] = () => {
          if (youTubeApi !== null) {
            const value = null;
            switch (propName) {
              case "currentTime":
                return youTubeApi.getCurrentTime();
              case "duration":
                return youTubeApi.getDuration();
              case "volume":
                volume = youTubeApi.getVolume() / 100;
                return volume;
              case "playbackRate":
                return youTubeApi.getPlaybackRate();
              case "paused":
                return paused;
              case "ended":
                return ended;
              case "muted":
                return youTubeApi.isMuted();
              case "buffered":
                const percentLoaded = youTubeApi.getVideoLoadedFraction(), duration = youTubeApi.getDuration();
                return {
                  start: () => {
                    return 0;
                  },
                  end: () => {
                    return percentLoaded * duration;
                  },
                  length: 1
                };
              case "src":
                return youTubeApi.getVideoUrl();
              case "readyState":
                return readyState;
            }
            return value;
          } else {
            return null;
          }
        };
        youtube[`set${capName}`] = (value) => {
          if (youTubeApi !== null) {
            switch (propName) {
              case "src":
                const url = typeof value === "string" ? value : value[0].src, videoId2 = YouTubeApi.getYouTubeId(url);
                if (mediaElement.originalNode.autoplay) {
                  youTubeApi.loadVideoById(videoId2);
                } else {
                  youTubeApi.cueVideoById(videoId2);
                }
                break;
              case "currentTime":
                youTubeApi.seekTo(value);
                break;
              case "muted":
                if (value) {
                  youTubeApi.mute();
                } else {
                  youTubeApi.unMute();
                }
                setTimeout(() => {
                  const event2 = createEvent("volumechange", youtube);
                  mediaElement.dispatchEvent(event2);
                }, 50);
                break;
              case "volume":
                volume = value;
                youTubeApi.setVolume(value * 100);
                setTimeout(() => {
                  const event2 = createEvent("volumechange", youtube);
                  mediaElement.dispatchEvent(event2);
                }, 50);
                break;
              case "playbackRate":
                youTubeApi.setPlaybackRate(value);
                setTimeout(() => {
                  const event2 = createEvent("ratechange", youtube);
                  mediaElement.dispatchEvent(event2);
                }, 50);
                break;
              case "readyState":
                const event = createEvent("canplay", youtube);
                mediaElement.dispatchEvent(event);
                break;
              default:
                console.log("youtube " + youtube.id, propName, "UNSUPPORTED property");
                break;
            }
          } else {
            apiStack.push({ type: "set", propName, value });
          }
        };
      };
      for (let i = 0, total = props.length; i < total; i++) {
        assignGettersSetters(props[i]);
      }
      const methods = mejs_default.html5media.methods, assignMethods = (methodName) => {
        youtube[methodName] = () => {
          if (youTubeApi !== null) {
            switch (methodName) {
              case "play":
                paused = false;
                return youTubeApi.playVideo();
              case "pause":
                paused = true;
                return youTubeApi.pauseVideo();
              case "load":
                return null;
            }
          } else {
            apiStack.push({ type: "call", methodName });
          }
        };
      };
      for (let i = 0, total = methods.length; i < total; i++) {
        assignMethods(methods[i]);
      }
      const errorHandler = (error) => {
        let message = "";
        switch (error.data) {
          case 2:
            message = "The request contains an invalid parameter value. Verify that video ID has 11 characters and that contains no invalid characters, such as exclamation points or asterisks.";
            break;
          case 5:
            message = "The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.";
            break;
          case 100:
            message = "The video requested was not found. Either video has been removed or has been marked as private.";
            break;
          case 101:
          case 105:
            message = "The owner of the requested video does not allow it to be played in embedded players.";
            break;
          default:
            message = "Unknown error.";
            break;
        }
        mediaElement.generateError(`Code ${error.data}: ${message}`, mediaFiles);
      };
      const youtubeContainer = document.createElement("div");
      youtubeContainer.id = youtube.id;
      if (youtube.options.youtube.nocookie) {
        mediaElement.originalNode.src = YouTubeApi.getYouTubeNoCookieUrl(mediaFiles[0].src);
      }
      mediaElement.originalNode.parentNode.insertBefore(youtubeContainer, mediaElement.originalNode);
      mediaElement.originalNode.style.display = "none";
      const isAudio = mediaElement.originalNode.tagName.toLowerCase() === "audio", height = isAudio ? "1" : mediaElement.originalNode.height, width = isAudio ? "1" : mediaElement.originalNode.width, videoId = YouTubeApi.getYouTubeId(mediaFiles[0].src), youtubeSettings = {
        id: youtube.id,
        containerId: youtubeContainer.id,
        videoId,
        height,
        width,
        host: youtube.options.youtube && youtube.options.youtube.nocookie ? "https://www.youtube-nocookie.com" : void 0,
        playerVars: Object.assign({
          controls: 0,
          rel: 0,
          disablekb: 1,
          showinfo: 0,
          modestbranding: 0,
          html5: 1,
          iv_load_policy: 3
        }, youtube.options.youtube),
        origin: window.location.host,
        events: {
          onReady: (e) => {
            mediaElement.youTubeApi = youTubeApi = e.target;
            mediaElement.youTubeState = {
              paused: true,
              ended: false
            };
            if (apiStack.length) {
              for (let i = 0, total = apiStack.length; i < total; i++) {
                const stackItem = apiStack[i];
                if (stackItem.type === "set") {
                  const propName = stackItem.propName, capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;
                  youtube[`set${capName}`](stackItem.value);
                } else if (stackItem.type === "call") {
                  youtube[stackItem.methodName]();
                }
              }
            }
            youTubeIframe = youTubeApi.getIframe();
            if (mediaElement.originalNode.muted) {
              youTubeApi.mute();
            }
            const events = ["mouseover", "mouseout"], assignEvents = (e2) => {
              const newEvent = createEvent(e2.type, youtube);
              mediaElement.dispatchEvent(newEvent);
            };
            for (let i = 0, total = events.length; i < total; i++) {
              youTubeIframe.addEventListener(events[i], assignEvents, false);
            }
            const initEvents = ["rendererready", "loadedmetadata", "loadeddata", "canplay"];
            for (let i = 0, total = initEvents.length; i < total; i++) {
              const event = createEvent(initEvents[i], youtube, true);
              mediaElement.dispatchEvent(event);
            }
          },
          onStateChange: (e) => {
            let events = [];
            switch (e.data) {
              case -1:
                events = ["loadedmetadata"];
                paused = true;
                ended = false;
                break;
              case 0:
                events = ["ended"];
                paused = false;
                ended = !youtube.options.youtube.loop;
                if (!youtube.options.youtube.loop) {
                  youtube.stopInterval();
                }
                break;
              case 1:
                events = ["play", "playing"];
                paused = false;
                ended = false;
                youtube.startInterval();
                break;
              case 2:
                events = ["pause"];
                paused = true;
                ended = false;
                youtube.stopInterval();
                break;
              case 3:
                events = ["progress"];
                ended = false;
                break;
              case 5:
                events = ["loadeddata", "loadedmetadata", "canplay"];
                paused = true;
                ended = false;
                break;
            }
            for (let i = 0, total = events.length; i < total; i++) {
              const event = createEvent(events[i], youtube);
              mediaElement.dispatchEvent(event);
            }
          },
          onError: (e) => errorHandler(e)
        }
      };
      if (isAudio || mediaElement.originalNode.hasAttribute("playsinline")) {
        youtubeSettings.playerVars.playsinline = 1;
      }
      if (mediaElement.originalNode.controls) {
        youtubeSettings.playerVars.controls = 1;
      }
      if (mediaElement.originalNode.autoplay) {
        youtubeSettings.playerVars.autoplay = 1;
      }
      if (mediaElement.originalNode.loop) {
        youtubeSettings.playerVars.loop = 1;
      }
      if ((youtubeSettings.playerVars.loop && parseInt(youtubeSettings.playerVars.loop, 10) === 1 || mediaElement.originalNode.src.indexOf("loop=") > -1) && !youtubeSettings.playerVars.playlist && mediaElement.originalNode.src.indexOf("playlist=") === -1) {
        youtubeSettings.playerVars.playlist = YouTubeApi.getYouTubeId(mediaElement.originalNode.src);
      }
      YouTubeApi.enqueueIframe(youtubeSettings);
      youtube.onEvent = (eventName, player, _youTubeState) => {
        if (_youTubeState !== null && _youTubeState !== void 0) {
          mediaElement.youTubeState = _youTubeState;
        }
      };
      youtube.setSize = (width2, height2) => {
        if (youTubeApi !== null) {
          youTubeApi.setSize(width2, height2);
        }
      };
      youtube.hide = () => {
        youtube.stopInterval();
        youtube.pause();
        if (youTubeIframe) {
          youTubeIframe.style.display = "none";
        }
      };
      youtube.show = () => {
        if (youTubeIframe) {
          youTubeIframe.style.display = "";
        }
      };
      youtube.destroy = () => {
        youTubeApi.destroy();
      };
      youtube.interval = null;
      youtube.startInterval = () => {
        youtube.interval = setInterval(() => {
          const event = createEvent("timeupdate", youtube);
          mediaElement.dispatchEvent(event);
        }, 250);
      };
      youtube.stopInterval = () => {
        if (youtube.interval) {
          clearInterval(youtube.interval);
        }
      };
      youtube.getPosterUrl = () => {
        const quality = options.youtube.imageQuality, resolutions = ["default", "hqdefault", "mqdefault", "sddefault", "maxresdefault"], id = YouTubeApi.getYouTubeId(mediaElement.originalNode.src);
        return quality && resolutions.indexOf(quality) > -1 && id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : "";
      };
      return youtube;
    }
  };
  window.onYouTubePlayerAPIReady = () => {
    YouTubeApi.iFrameReady();
  };
  typeChecks.push((url) => /\/\/(www\.youtube|youtu\.?be)/i.test(url) ? "video/x-youtube" : null);
  renderer.add(YouTubeIframeRenderer);

  // src/js/player/default.js
  var DefaultPlayer = class {
    /**
     *
     * @param {MediaElementPlayer} player
     */
    constructor(player) {
      this.media = player.media;
      this.isVideo = player.isVideo;
      this.classPrefix = player.options.classPrefix;
      this.createIframeLayer = () => player.createIframeLayer();
      this.setPoster = (url) => player.setPoster(url);
      return this;
    }
    get paused() {
      return this.media.paused;
    }
    set muted(muted) {
      this.setMuted(muted);
    }
    get muted() {
      return this.media.muted;
    }
    get ended() {
      return this.media.ended;
    }
    get readyState() {
      return this.media.readyState;
    }
    set currentTime(time) {
      this.setCurrentTime(time);
    }
    get currentTime() {
      return this.getCurrentTime();
    }
    get duration() {
      return this.getDuration();
    }
    get remainingTime() {
      return this.getDuration() - this.currentTime();
    }
    set volume(volume) {
      this.setVolume(volume);
    }
    get volume() {
      return this.getVolume();
    }
    set src(src) {
      this.setSrc(src);
    }
    get src() {
      return this.getSrc();
    }
    play() {
      return this.media.play();
    }
    pause() {
      return this.media.pause();
    }
    load() {
      const t = this;
      if (!t.isLoaded) {
        t.media.load();
      }
      t.isLoaded = true;
    }
    setCurrentTime(time) {
      this.media.setCurrentTime(time);
    }
    getCurrentTime() {
      return this.media.currentTime;
    }
    getDuration() {
      let duration = this.media.getDuration();
      if (duration === Infinity && this.media.seekable && this.media.seekable.length) {
        duration = this.media.seekable.end(0);
      }
      return duration;
    }
    setVolume(volume) {
      this.media.setVolume(volume);
    }
    getVolume() {
      return this.media.getVolume();
    }
    setMuted(value) {
      this.media.setMuted(value);
    }
    setSrc(src) {
      const t = this, layer = document.getElementById(`${t.media.id}-iframe-overlay`);
      if (layer) {
        layer.remove();
      }
      t.media.setSrc(src);
      t.createIframeLayer();
      if (t.media.renderer !== null && typeof t.media.renderer.getPosterUrl === "function") {
        t.setPoster(t.media.renderer.getPosterUrl());
      }
    }
    getSrc() {
      return this.media.getSrc();
    }
    canPlayType(type) {
      return this.media.canPlayType(type);
    }
  };
  window.DefaultPlayer = DefaultPlayer;

  // src/js/utils/time.js
  function isDropFrame(fps = 25) {
    return !(fps % 1 === 0);
  }
  function secondsToTimeCode(time, forceHours = false, showFrameCount = false, fps = 25, secondsDecimalLength = 0, timeFormat = "hh:mm:ss") {
    time = !time || typeof time !== "number" || time < 0 ? 0 : time;
    let dropFrames = Math.round(fps * 0.066666), timeBase = Math.round(fps), framesPer24Hours = Math.round(fps * 3600) * 24, framesPer10Minutes = Math.round(fps * 600), frameSep = isDropFrame(fps) ? ";" : ":", hours, minutes, seconds, frames, f = Math.round(time * fps);
    if (isDropFrame(fps)) {
      if (f < 0) {
        f = framesPer24Hours + f;
      }
      f = f % framesPer24Hours;
      const d = Math.floor(f / framesPer10Minutes);
      const m = f % framesPer10Minutes;
      f = f + dropFrames * 9 * d;
      if (m > dropFrames) {
        f = f + dropFrames * Math.floor((m - dropFrames) / Math.round(timeBase * 60 - dropFrames));
      }
      const timeBaseDivision = Math.floor(f / timeBase);
      hours = Math.floor(Math.floor(timeBaseDivision / 60) / 60);
      minutes = Math.floor(timeBaseDivision / 60) % 60;
      if (showFrameCount) {
        seconds = timeBaseDivision % 60;
      } else {
        seconds = Math.floor(f / timeBase % 60).toFixed(secondsDecimalLength);
      }
    } else {
      hours = Math.floor(time / 3600) % 24;
      minutes = Math.floor(time / 60) % 60;
      if (showFrameCount) {
        seconds = Math.floor(time % 60);
      } else {
        seconds = Math.floor(time % 60).toFixed(secondsDecimalLength);
      }
    }
    hours = hours <= 0 ? 0 : hours;
    minutes = minutes <= 0 ? 0 : minutes;
    seconds = seconds <= 0 ? 0 : seconds;
    seconds = seconds === 60 ? 0 : seconds;
    minutes = minutes === 60 ? 0 : minutes;
    const timeFormatFrags = timeFormat.split(":");
    const timeFormatSettings = {};
    for (let i = 0, total = timeFormatFrags.length; i < total; ++i) {
      let unique = "";
      for (let j = 0, t = timeFormatFrags[i].length; j < t; j++) {
        if (unique.indexOf(timeFormatFrags[i][j]) < 0) {
          unique += timeFormatFrags[i][j];
        }
      }
      if (~["f", "s", "m", "h"].indexOf(unique)) {
        timeFormatSettings[unique] = timeFormatFrags[i].length;
      }
    }
    let result = forceHours || hours > 0 ? `${hours < 10 && timeFormatSettings.h > 1 ? `0${hours}` : hours}:` : "";
    result += `${minutes < 10 && timeFormatSettings.m > 1 ? `0${minutes}` : minutes}:`;
    result += `${seconds < 10 && timeFormatSettings.s > 1 ? `0${seconds}` : seconds}`;
    if (showFrameCount) {
      frames = (f % timeBase).toFixed(0);
      frames = frames <= 0 ? 0 : frames;
      result += frames < 10 && timeFormatSettings.f ? `${frameSep}0${frames}` : `${frameSep}${frames}`;
    }
    return result;
  }
  function timeCodeToSeconds(time, fps = 25) {
    if (typeof time !== "string") {
      throw new TypeError("Time must be a string");
    }
    if (time.indexOf(";") > 0) {
      time = time.replace(";", ":");
    }
    if (!/\d{2}(\:\d{2}){0,3}/i.test(time)) {
      throw new TypeError("Time code must have the format `00:00:00`");
    }
    const parts = time.split(":");
    let output, hours = 0, minutes = 0, seconds = 0, frames = 0, totalMinutes = 0, dropFrames = Math.round(fps * 0.066666), timeBase = Math.round(fps), hFrames = timeBase * 3600, mFrames = timeBase * 60;
    switch (parts.length) {
      default:
      case 1:
        seconds = parseInt(parts[0], 10);
        break;
      case 2:
        minutes = parseInt(parts[0], 10);
        seconds = parseInt(parts[1], 10);
        break;
      case 3:
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        seconds = parseInt(parts[2], 10);
        break;
      case 4:
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        seconds = parseInt(parts[2], 10);
        frames = parseInt(parts[3], 10);
        break;
    }
    if (isDropFrame(fps)) {
      totalMinutes = 60 * hours + minutes;
      output = hFrames * hours + mFrames * minutes + timeBase * seconds + frames - dropFrames * (totalMinutes - Math.floor(totalMinutes / 10));
    } else {
      output = (hFrames * hours + mFrames * minutes + fps * seconds + frames) / fps;
    }
    return parseFloat(output.toFixed(3));
  }
  function calculateTimeFormat(time, options, fps = 25) {
    time = !time || typeof time !== "number" || time < 0 ? 0 : time;
    const hours = Math.floor(time / 3600) % 24, minutes = Math.floor(time / 60) % 60, seconds = Math.floor(time % 60), frames = Math.floor((time % 1 * fps).toFixed(3)), lis = [
      [frames, "f"],
      [seconds, "s"],
      [minutes, "m"],
      [hours, "h"]
    ];
    let format = options.timeFormat, firstTwoPlaces = format[1] === format[0], separatorIndex = firstTwoPlaces ? 2 : 1, separator = format.length < separatorIndex ? format[separatorIndex] : ":", firstChar = format[0], required = false;
    for (let i = 0, len = lis.length; i < len; i++) {
      if (~format.indexOf(lis[i][1])) {
        required = true;
      } else if (required) {
        let hasNextValue = false;
        for (let j = i; j < len; j++) {
          if (lis[j][0] > 0) {
            hasNextValue = true;
            break;
          }
        }
        if (!hasNextValue) {
          break;
        }
        if (!firstTwoPlaces) {
          format = firstChar + format;
        }
        format = lis[i][1] + separator + format;
        if (firstTwoPlaces) {
          format = lis[i][1] + format;
        }
        firstChar = lis[i][1];
      }
    }
    options.timeFormat = format;
  }
  function convertSMPTEtoSeconds(SMPTE) {
    if (typeof SMPTE !== "string") {
      throw new TypeError("Argument must be a string value");
    }
    SMPTE = SMPTE.replace(",", ".");
    const decimalLen = ~SMPTE.indexOf(".") ? SMPTE.split(".")[1].length : 0;
    let secs = 0, multiplier = 1;
    SMPTE = SMPTE.split(":").reverse();
    for (let i = 0, total = SMPTE.length; i < total; i++) {
      multiplier = 1;
      if (i > 0) {
        multiplier = Math.pow(60, i);
      }
      secs += Number(SMPTE[i]) * multiplier;
    }
    return Number(secs.toFixed(decimalLen));
  }
  mejs_default.Utils = mejs_default.Utils || {};
  mejs_default.Utils.secondsToTimeCode = secondsToTimeCode;
  mejs_default.Utils.timeCodeToSeconds = timeCodeToSeconds;
  mejs_default.Utils.calculateTimeFormat = calculateTimeFormat;
  mejs_default.Utils.convertSMPTEtoSeconds = convertSMPTEtoSeconds;

  // src/js/utils/generate.js
  function generateControlButton(playerId, ariaLabel, title, iconSprite, icons, classPrefix, buttonClass = null, ariaDescribedby = "", ariaPressed = null) {
    if (typeof playerId !== "string") {
      throw new Error("`ariaControls` argument must be a string");
    }
    if (typeof ariaLabel !== "string") {
      throw new Error("`ariaLabel` argument must be a string");
    }
    if (typeof title !== "string") {
      throw new Error("`title` argument must be a string");
    }
    if (typeof iconSprite !== "string") {
      throw new Error("`iconSprite` argument must be a string");
    }
    if (typeof ariaDescribedby !== "string") {
      throw new Error("`ariaDescribedby` argument must be a string");
    }
    if (!Array.isArray(icons)) {
      throw new Error("`icons` argument must be an array");
    }
    if (typeof classPrefix !== "string") {
      throw new Error("`classPrefix` argument must be a string");
    }
    const className = buttonClass ? `class="${buttonClass}" ` : "";
    const ariaDescribedbyAttr = ariaDescribedby !== "" ? `aria-describedby="${ariaDescribedby}" ` : "";
    const ariaPressedAttr = ariaPressed !== null ? `aria-pressed="${ariaPressed}"` : "";
    const iconHtml = icons.map((icon) => {
      return `<svg xmlns="http://www.w3.org/2000/svg" id="${playerId}-${icon}" class="${classPrefix}${icon}" aria-hidden="true" focusable="false">
				<use xlink:href="${iconSprite}#${icon}"></use>
			</svg>
`;
    });
    return `<button ${className} type="button" aria-controls="${playerId}" title="${title}" aria-label="${ariaLabel}" ${ariaDescribedbyAttr} ${ariaPressedAttr}>
			${iconHtml.join("")}
		</button>`;
  }
  mejs_default.Utils = mejs_default.Utils || {};
  mejs_default.Utils.generateControlButton = generateControlButton;

  // src/js/player.js
  mejs_default.mepIndex = 0;
  mejs_default.players = {};
  var config = {
    // url to poster (to fix iOS 3.x)
    poster: "",
    // When the video is ended, show the poster.
    showPosterWhenEnded: false,
    // When the video is paused, show the poster.
    showPosterWhenPaused: false,
    // Default if the <video width> is not specified
    defaultVideoWidth: 480,
    // Default if the <video height> is not specified
    defaultVideoHeight: 270,
    // If set, overrides <video width>
    videoWidth: -1,
    // If set, overrides <video height>
    videoHeight: -1,
    // Default if the user doesn't specify
    defaultAudioWidth: 400,
    // Default if the user doesn't specify
    defaultAudioHeight: 40,
    // Default amount to move back when back key is pressed
    defaultSeekBackwardInterval: (media) => media.getDuration() * 0.05,
    // Default amount to move forward when forward key is pressed
    defaultSeekForwardInterval: (media) => media.getDuration() * 0.05,
    // Set dimensions via JS instead of CSS
    setDimensions: true,
    // Width of audio player
    audioWidth: -1,
    // Height of audio player
    audioHeight: -1,
    // Useful for <audio> player loops
    loop: false,
    // Rewind to beginning when media ends
    autoRewind: true,
    // Resize to media dimensions
    enableAutosize: true,
    /*
     * Time format to use. Default: 'mm:ss'
     * Supported units:
     *   h: hour
     *   m: minute
     *   s: second
     *   f: frame count
     * When using 'hh', 'mm', 'ss' or 'ff' we always display 2 digits.
     * If you use 'h', 'm', 's' or 'f' we display 1 digit if possible.
     *
     * Example to display 75 seconds:
     * Format 'mm:ss': 01:15
     * Format 'm:ss': 1:15
     * Format 'm:s': 1:15
     */
    timeFormat: "",
    // Force the hour marker (##:00:00)
    alwaysShowHours: false,
    // Show framecount in timecode (##:00:00:00)
    showTimecodeFrameCount: false,
    // Used when showTimecodeFrameCount is set to true
    framesPerSecond: 25,
    // Hide controls when playing and mouse is not over the video
    alwaysShowControls: false,
    // Display the video control when media is loading
    hideVideoControlsOnLoad: false,
    // Display the video controls when media is paused
    hideVideoControlsOnPause: false,
    // Enable click video element to toggle play/pause
    clickToPlayPause: true,
    // Time in ms to hide controls
    controlsTimeoutDefault: 1500,
    // Time in ms to trigger the timer when mouse moves
    controlsTimeoutMouseEnter: 2500,
    // Time in ms to trigger the timer when mouse leaves
    controlsTimeoutMouseLeave: 1e3,
    // Force iPad's native controls
    iPadUseNativeControls: false,
    // Force iPhone's native controls
    iPhoneUseNativeControls: false,
    // Force Android's native controls
    AndroidUseNativeControls: false,
    // Features to show
    features: ["playpause", "current", "progress", "duration", "tracks", "volume", "fullscreen"],
    // If set to `true`, all the default control elements listed in features above will be used, and the features will
    // add other features
    useDefaultControls: false,
    // Only for dynamic
    isVideo: true,
    // Stretching modes (auto, fill, responsive, none)
    stretching: "auto",
    // Prefix class names on elements
    classPrefix: "mejs__",
    // Turn keyboard support on and off for this instance
    enableKeyboard: true,
    // When this player starts, it will pause other players
    pauseOtherPlayers: true,
    // Number of decimal places to show if frames are shown
    secondsDecimalLength: 0,
    // If error happens, set up HTML message via string or function
    customError: null,
    // Array of keyboard actions such as play/pause
    keyActions: [],
    // Hide WAI-ARIA video player title so it can be added externally on the website
    hideScreenReaderTitle: false
  };
  mejs_default.MepDefaults = config;
  var MediaElementPlayer = class _MediaElementPlayer {
    constructor(node, o) {
      const t = this, element = typeof node === "string" ? document.getElementById(node) : node;
      if (!(t instanceof _MediaElementPlayer)) {
        return new _MediaElementPlayer(element, o);
      }
      t.node = t.media = element;
      if (!t.node) {
        return;
      }
      if (t.media.player) {
        return t.media.player;
      }
      t.hasFocus = false;
      t.controlsAreVisible = true;
      t.controlsEnabled = true;
      t.controlsTimer = null;
      t.currentMediaTime = 0;
      t.proxy = null;
      if (o === void 0) {
        const options = t.node.getAttribute("data-mejsoptions");
        o = options ? JSON.parse(options) : {};
      }
      t.options = Object.assign({}, config, o);
      if (t.options.loop && !t.media.getAttribute("loop")) {
        t.media.loop = true;
        t.node.loop = true;
      } else if (t.media.loop) {
        t.options.loop = true;
      }
      if (!t.options.timeFormat) {
        t.options.timeFormat = "mm:ss";
        if (t.options.alwaysShowHours) {
          t.options.timeFormat = "hh:mm:ss";
        }
        if (t.options.showTimecodeFrameCount) {
          t.options.timeFormat += ":ff";
        }
      }
      calculateTimeFormat(0, t.options, t.options.framesPerSecond || 25);
      t.id = `mep_${mejs_default.mepIndex++}`;
      mejs_default.players[t.id] = t;
      t.init();
      return t;
    }
    getElement(element) {
      return element;
    }
    // Added method for WP compatibility
    init() {
      const t = this, playerOptions = Object.assign({}, t.options, {
        success: (media, domNode) => {
          t._meReady(media, domNode);
        },
        error: (e) => {
          t._handleError(e);
        }
      }), tagName = t.node.tagName.toLowerCase();
      t.isDynamic = tagName !== "audio" && tagName !== "video" && tagName !== "iframe";
      t.isVideo = t.isDynamic ? t.options.isVideo : tagName !== "audio" && t.options.isVideo;
      t.mediaFiles = null;
      t.trackFiles = null;
      t.media.addEventListener("rendererready", this.updateNode.bind(this));
      if (IS_IPAD && t.options.iPadUseNativeControls || IS_IPHONE && t.options.iPhoneUseNativeControls) {
        t.node.setAttribute("controls", true);
        if (IS_IPAD && t.node.getAttribute("autoplay")) {
          t.play();
        }
      } else if ((t.isVideo || !t.isVideo && (t.options.features.length || t.options.useDefaultControls)) && !(IS_ANDROID && t.options.AndroidUseNativeControls)) {
        t.node.removeAttribute("controls");
        const videoPlayerTitle = t.isVideo ? i18n_default.t("mejs.video-player") : i18n_default.t("mejs.audio-player");
        if (!t.options.hideScreenReaderTitle) {
          const offscreen = document.createElement("span");
          offscreen.className = `${t.options.classPrefix}offscreen`;
          offscreen.innerText = videoPlayerTitle;
          t.media.parentNode.insertBefore(offscreen, t.media);
        }
        t.container = document.createElement("div");
        t.getElement(t.container).id = t.id;
        t.getElement(t.container).className = `${t.options.classPrefix}container ${t.options.classPrefix}container-keyboard-inactive ${t.media.className}`;
        t.getElement(t.container).tabIndex = 0;
        t.getElement(t.container).setAttribute("role", "application");
        t.getElement(t.container).setAttribute("aria-label", videoPlayerTitle);
        t.getElement(t.container).innerHTML = `<div class="${t.options.classPrefix}inner"><div class="${t.options.classPrefix}mediaelement"></div><div class="${t.options.classPrefix}layers"></div><div class="${t.options.classPrefix}controls"></div></div>`;
        t.getElement(t.container).addEventListener("focus", (e) => {
          if (!t.controlsAreVisible && !t.hasFocus && t.controlsEnabled) {
            t.showControls(true);
            const btnSelector = isNodeAfter(e.relatedTarget, t.getElement(t.container)) ? `.${t.options.classPrefix}controls .${t.options.classPrefix}button:last-child > button` : `.${t.options.classPrefix}playpause-button > button`, button = t.getElement(t.container).querySelector(btnSelector);
            button.focus();
          }
        });
        t.node.parentNode.insertBefore(t.getElement(t.container), t.node);
        if (!t.options.features.length && !t.options.useDefaultControls) {
          t.getElement(t.container).style.background = "transparent";
          t.getElement(t.container).querySelector(`.${t.options.classPrefix}controls`).style.display = "none";
        }
        if (t.isVideo && t.options.stretching === "fill" && !hasClass(t.getElement(t.container).parentNode, `${t.options.classPrefix}fill-container`)) {
          t.outerContainer = t.media.parentNode;
          const wrapper = document.createElement("div");
          wrapper.className = `${t.options.classPrefix}fill-container`;
          t.getElement(t.container).parentNode.insertBefore(wrapper, t.getElement(t.container));
          wrapper.appendChild(t.getElement(t.container));
        }
        if (IS_ANDROID) {
          addClass(t.getElement(t.container), `${t.options.classPrefix}android`);
        }
        if (IS_IOS) {
          addClass(t.getElement(t.container), `${t.options.classPrefix}ios`);
        }
        if (IS_IPAD) {
          addClass(t.getElement(t.container), `${t.options.classPrefix}ipad`);
        }
        if (IS_IPHONE) {
          addClass(t.getElement(t.container), `${t.options.classPrefix}iphone`);
        }
        addClass(t.getElement(t.container), t.isVideo ? `${t.options.classPrefix}video` : `${t.options.classPrefix}audio`);
        t.getElement(t.container).querySelector(`.${t.options.classPrefix}mediaelement`).appendChild(t.node);
        t.media.player = t;
        t.controls = t.getElement(t.container).querySelector(`.${t.options.classPrefix}controls`);
        t.layers = t.getElement(t.container).querySelector(`.${t.options.classPrefix}layers`);
        const tagType = t.isVideo ? "video" : "audio", capsTagName = tagType.substring(0, 1).toUpperCase() + tagType.substring(1);
        if (t.options[tagType + "Width"] > 0 || t.options[tagType + "Width"].toString().indexOf("%") > -1) {
          t.width = t.options[tagType + "Width"];
        } else if (t.node.style.width !== "" && t.node.style.width !== null) {
          t.width = t.node.style.width;
        } else if (t.node.getAttribute("width")) {
          t.width = t.node.getAttribute("width");
        } else {
          t.width = t.options["default" + capsTagName + "Width"];
        }
        if (t.options[tagType + "Height"] > 0 || t.options[tagType + "Height"].toString().indexOf("%") > -1) {
          t.height = t.options[tagType + "Height"];
        } else if (t.node.style.height !== "" && t.node.style.height !== null) {
          t.height = t.node.style.height;
        } else if (t.node.getAttribute("height")) {
          t.height = t.node.getAttribute("height");
        } else {
          t.height = t.options["default" + capsTagName + "Height"];
        }
        t.initialAspectRatio = t.height >= t.width ? t.width / t.height : t.height / t.width;
        t.setPlayerSize(t.width, t.height);
      } else if (!t.isVideo && !t.options.features.length && !t.options.useDefaultControls) {
        t.node.style.display = "none";
      }
      playerOptions.pluginWidth = t.width;
      playerOptions.pluginHeight = t.height;
      mejs_default.MepDefaults = playerOptions;
      new mediaelement_default(t.media, playerOptions, t.mediaFiles);
      if (t.getElement(t.container) !== void 0 && t.options.features.length && t.controlsAreVisible && !t.options.hideVideoControlsOnLoad) {
        const event = createEvent("controlsshown", t.getElement(t.container));
        t.getElement(t.container).dispatchEvent(event);
      }
    }
    /**
     * Update the node references when a renderer was created, so features like tracks
     * are querying the correct node. Otherwise for example the track files can't be found.
     *
     * TODO: The features should look for the current active renderer instead of the node.
     * This current way has still a bug, when we switch between renderers that are already created.
     *
     * @param event event with renderer node as detail when renderer was created
     */
    updateNode(event) {
      let node, iframeId;
      const mediaElement = event.detail.target.hasOwnProperty("mediaElement") ? event.detail.target.mediaElement : event.detail.target;
      const originalNode = mediaElement.originalNode;
      if (event.detail.isIframe) {
        iframeId = mediaElement.renderer.id;
        node = mediaElement.querySelector(`#${iframeId}`);
        node.style.position = "absolute";
        if (originalNode.style.maxWidth) {
          node.style.maxWidth = originalNode.style.maxWidth;
        }
      } else {
        node = event.detail.target;
      }
      this.domNode = node;
      this.node = node;
    }
    showControls(doAnimation) {
      const t = this;
      doAnimation = doAnimation === void 0 || doAnimation;
      if (t.controlsAreVisible || !t.isVideo) {
        return;
      }
      if (doAnimation) {
        fadeIn(t.getElement(t.controls), 200, () => {
          removeClass(t.getElement(t.controls), `${t.options.classPrefix}offscreen`);
          const event = createEvent("controlsshown", t.getElement(t.container));
          t.getElement(t.container).dispatchEvent(event);
        });
        const controls = t.getElement(t.container).querySelectorAll(`.${t.options.classPrefix}control`);
        for (let i = 0, total = controls.length; i < total; i++) {
          fadeIn(controls[i], 200, () => {
            removeClass(controls[i], `${t.options.classPrefix}offscreen`);
          });
        }
      } else {
        removeClass(t.getElement(t.controls), `${t.options.classPrefix}offscreen`);
        t.getElement(t.controls).style.display = "";
        t.getElement(t.controls).style.opacity = 1;
        const controls = t.getElement(t.container).querySelectorAll(`.${t.options.classPrefix}control`);
        for (let i = 0, total = controls.length; i < total; i++) {
          removeClass(controls[i], `${t.options.classPrefix}offscreen`);
          controls[i].style.display = "";
        }
        const event = createEvent("controlsshown", t.getElement(t.container));
        t.getElement(t.container).dispatchEvent(event);
      }
      t.controlsAreVisible = true;
      t.setControlsSize();
    }
    hideControls(doAnimation, forceHide) {
      const t = this;
      doAnimation = doAnimation === void 0 || doAnimation;
      if (forceHide !== true && (!t.controlsAreVisible || t.options.alwaysShowControls || t.paused && t.readyState === 4 && (!t.options.hideVideoControlsOnLoad && t.currentTime <= 0 || !t.options.hideVideoControlsOnPause && t.currentTime > 0) || t.isVideo && !t.options.hideVideoControlsOnLoad && !t.readyState || t.ended)) {
        return;
      }
      if (doAnimation) {
        fadeOut(t.getElement(t.controls), 200, () => {
          addClass(t.getElement(t.controls), `${t.options.classPrefix}offscreen`);
          t.getElement(t.controls).style.display = "";
          const event = createEvent("controlshidden", t.getElement(t.container));
          t.getElement(t.container).dispatchEvent(event);
        });
        const controls = t.getElement(t.container).querySelectorAll(`.${t.options.classPrefix}control`);
        for (let i = 0, total = controls.length; i < total; i++) {
          fadeOut(controls[i], 200, () => {
            addClass(controls[i], `${t.options.classPrefix}offscreen`);
            controls[i].style.display = "";
          });
        }
      } else {
        addClass(t.getElement(t.controls), `${t.options.classPrefix}offscreen`);
        t.getElement(t.controls).style.display = "";
        t.getElement(t.controls).style.opacity = 0;
        const controls = t.getElement(t.container).querySelectorAll(`.${t.options.classPrefix}control`);
        for (let i = 0, total = controls.length; i < total; i++) {
          addClass(controls[i], `${t.options.classPrefix}offscreen`);
          controls[i].style.display = "";
        }
        const event = createEvent("controlshidden", t.getElement(t.container));
        t.getElement(t.container).dispatchEvent(event);
      }
      t.controlsAreVisible = false;
    }
    startControlsTimer(timeout) {
      const t = this;
      timeout = typeof timeout !== "undefined" ? timeout : t.options.controlsTimeoutDefault;
      t.killControlsTimer("start");
      t.controlsTimer = setTimeout(() => {
        t.hideControls();
        t.killControlsTimer("hide");
      }, timeout);
    }
    killControlsTimer() {
      const t = this;
      if (t.controlsTimer !== null) {
        clearTimeout(t.controlsTimer);
        delete t.controlsTimer;
        t.controlsTimer = null;
      }
    }
    disableControls() {
      const t = this;
      t.killControlsTimer();
      t.controlsEnabled = false;
      t.hideControls(false, true);
    }
    enableControls() {
      const t = this;
      t.controlsEnabled = true;
      t.showControls(false);
    }
    _setDefaultPlayer() {
      const t = this;
      if (t.proxy) {
        t.proxy.pause();
      }
      t.proxy = new DefaultPlayer(t);
      t.media.addEventListener("loadedmetadata", () => {
        if (t.getCurrentTime() > 0 && t.currentMediaTime > 0) {
          t.setCurrentTime(t.currentMediaTime);
          if (!IS_IOS && !IS_ANDROID) {
            t.play();
          }
        }
      });
    }
    /**
     * Set up all controls and events
     *
     * @param media
     * @param domNode
     * @private
     */
    _meReady(media, domNode) {
      const t = this, autoplayAttr = domNode.getAttribute("autoplay"), autoplay = !(autoplayAttr === void 0 || autoplayAttr === null || autoplayAttr === "false"), isNative = media.rendererName !== null && /(native|html5)/i.test(media.rendererName);
      if (t.getElement(t.controls)) {
        t.enableControls();
      }
      if (t.getElement(t.container) && t.getElement(t.container).querySelector(`.${t.options.classPrefix}overlay-play`)) {
        t.getElement(t.container).querySelector(`.${t.options.classPrefix}overlay-play`).style.display = "";
      }
      if (t.created) {
        return;
      }
      t.created = true;
      t.media = media;
      t.domNode = domNode;
      if (!(IS_ANDROID && t.options.AndroidUseNativeControls) && !(IS_IPAD && t.options.iPadUseNativeControls) && !(IS_IPHONE && t.options.iPhoneUseNativeControls)) {
        if (!t.isVideo && !t.options.features.length && !t.options.useDefaultControls) {
          if (autoplay && isNative) {
            t.play();
          }
          if (t.options.success) {
            if (typeof t.options.success === "string") {
              window[t.options.success](t.media, t.domNode, t);
            } else {
              t.options.success(t.media, t.domNode, t);
            }
          }
          return;
        }
        t.featurePosition = {};
        t._setDefaultPlayer();
        t.buildposter(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
        t.buildkeyboard(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
        t.buildoverlays(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
        if (t.options.useDefaultControls) {
          const defaultControls = ["playpause", "current", "progress", "duration", "tracks", "volume", "fullscreen"];
          t.options.features = defaultControls.concat(t.options.features.filter((item) => defaultControls.indexOf(item) === -1));
        }
        t.buildfeatures(t, t.getElement(t.controls), t.getElement(t.layers), t.media);
        const event = createEvent("controlsready", t.getElement(t.container));
        t.getElement(t.container).dispatchEvent(event);
        t.setPlayerSize(t.width, t.height);
        t.setControlsSize();
        if (t.isVideo) {
          t.clickToPlayPauseCallback = () => {
            if (t.options.clickToPlayPause) {
              const button = t.getElement(t.container).querySelector(`.${t.options.classPrefix}overlay-button`), pressed = button.getAttribute("aria-pressed");
              if (t.paused && pressed) {
                t.pause();
              } else if (t.paused) {
                t.play();
              } else {
                t.pause();
              }
              button.setAttribute("aria-pressed", !pressed);
              t.getElement(t.container).focus();
            }
          };
          t.createIframeLayer();
          t.media.addEventListener("click", t.clickToPlayPauseCallback);
          if ((IS_ANDROID || IS_IOS) && !t.options.alwaysShowControls) {
            t.node.addEventListener("touchstart", () => {
              if (t.controlsAreVisible) {
                t.hideControls(false);
              } else {
                if (t.controlsEnabled) {
                  t.showControls(false);
                }
              }
            }, SUPPORT_PASSIVE_EVENT ? { passive: true } : false);
          } else {
            t.getElement(t.container).addEventListener("mouseenter", () => {
              if (t.controlsEnabled) {
                if (!t.options.alwaysShowControls) {
                  t.killControlsTimer("enter");
                  t.showControls();
                  t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
                }
              }
            });
            t.getElement(t.container).addEventListener("mousemove", () => {
              if (t.controlsEnabled) {
                if (!t.controlsAreVisible) {
                  t.showControls();
                }
                if (!t.options.alwaysShowControls) {
                  t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
                }
              }
            });
            t.getElement(t.container).addEventListener("mouseleave", () => {
              if (t.controlsEnabled) {
                if (!t.paused && !t.options.alwaysShowControls) {
                  t.startControlsTimer(t.options.controlsTimeoutMouseLeave);
                }
              }
            });
          }
          if (t.options.hideVideoControlsOnLoad) {
            t.hideControls(false);
          }
          if (t.options.enableAutosize) {
            t.media.addEventListener("loadedmetadata", (e) => {
              const target = e !== void 0 ? e.detail.target || e.target : t.media;
              if (t.options.videoHeight <= 0 && !t.domNode.getAttribute("height") && !t.domNode.style.height && target !== null && !isNaN(target.videoHeight)) {
                t.setPlayerSize(target.videoWidth, target.videoHeight);
                t.setControlsSize();
                t.media.setSize(target.videoWidth, target.videoHeight);
              }
            });
          }
        }
        t.media.addEventListener("play", () => {
          t.hasFocus = true;
          for (const playerIndex in mejs_default.players) {
            if (mejs_default.players.hasOwnProperty(playerIndex)) {
              const p = mejs_default.players[playerIndex];
              if (p.id !== t.id && t.options.pauseOtherPlayers && !p.paused && !p.ended && p.options.ignorePauseOtherPlayersOption !== true) {
                p.pause();
                p.hasFocus = false;
              }
            }
          }
          if (!(IS_ANDROID || IS_IOS) && !t.options.alwaysShowControls && t.isVideo) {
            t.hideControls();
          }
        });
        t.media.addEventListener("ended", () => {
          if (t.options.autoRewind) {
            try {
              t.setCurrentTime(0);
              setTimeout(() => {
                const loadingElement = t.getElement(t.container).querySelector(`.${t.options.classPrefix}overlay-loading`);
                if (loadingElement && loadingElement.parentNode) {
                  loadingElement.parentNode.style.display = "none";
                }
              }, 20);
            } catch (exp) {
              console.log(exp);
            }
          }
          t.pause();
          if (t.setProgressRail) {
            t.setProgressRail();
          }
          if (t.setCurrentRail) {
            t.setCurrentRail();
          }
          if (t.options.loop) {
            t.play();
          } else if (!t.options.alwaysShowControls && t.controlsEnabled) {
            t.showControls();
          }
        });
        t.media.addEventListener("loadedmetadata", () => {
          calculateTimeFormat(t.getDuration(), t.options, t.options.framesPerSecond || 25);
          if (t.updateDuration) {
            t.updateDuration();
          }
          if (t.updateCurrent) {
            t.updateCurrent();
          }
          if (!t.isFullScreen) {
            t.setPlayerSize(t.width, t.height);
            t.setControlsSize();
          }
        });
        let duration = null;
        t.media.addEventListener("timeupdate", () => {
          if (!isNaN(t.getDuration()) && duration !== t.getDuration()) {
            duration = t.getDuration();
            calculateTimeFormat(duration, t.options, t.options.framesPerSecond || 25);
            if (t.updateDuration) {
              t.updateDuration();
            }
            if (t.updateCurrent) {
              t.updateCurrent();
            }
            t.setControlsSize();
          }
        });
        if (t.options.enableKeyboard) {
          t.getElement(t.container).addEventListener("keydown", function(e) {
            const keyCode = e.keyCode || e.which || 0;
            if (e.target === t.container && keyCode === 13) {
              if (t.paused) {
                t.play();
              } else {
                t.pause();
              }
            }
          });
        }
        t.getElement(t.container).addEventListener("click", function(e) {
          addClass(e.currentTarget, `${t.options.classPrefix}container-keyboard-inactive`);
        });
        t.getElement(t.container).addEventListener("focusin", function(e) {
          removeClass(e.currentTarget, `${t.options.classPrefix}container-keyboard-inactive`);
          if (t.isVideo && !IS_ANDROID && !IS_IOS && t.controlsEnabled && !t.options.alwaysShowControls) {
            t.killControlsTimer("enter");
            t.showControls();
            t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
          }
        });
        t.getElement(t.container).addEventListener("focusout", (e) => {
          setTimeout(() => {
            if (e.relatedTarget) {
              if (t.keyboardAction && !e.relatedTarget.closest(`.${t.options.classPrefix}container`)) {
                t.keyboardAction = false;
                if (t.isVideo && !t.options.alwaysShowControls && !t.paused) {
                  t.startControlsTimer(t.options.controlsTimeoutMouseLeave);
                }
              }
            }
          }, 0);
        });
        setTimeout(() => {
          t.setPlayerSize(t.width, t.height);
          t.setControlsSize();
        }, 0);
        t.globalResizeCallback = () => {
          if (!(t.isFullScreen || HAS_TRUE_NATIVE_FULLSCREEN && document.webkitIsFullScreen)) {
            t.setPlayerSize(t.width, t.height);
          }
          t.setControlsSize();
        };
        t.globalBind("resize", t.globalResizeCallback);
      }
      if (autoplay && isNative) {
        t.play();
      }
      if (t.options.success) {
        if (typeof t.options.success === "string") {
          window[t.options.success](t.media, t.domNode, t);
        } else {
          t.options.success(t.media, t.domNode, t);
        }
      }
    }
    /**
     *
     * @param {CustomEvent} e
     * @param {MediaElement} media
     * @param {HTMLElement} node
     * @private
     */
    _handleError(e, media, node) {
      const t = this, play = t.getElement(t.layers).querySelector(`.${t.options.classPrefix}overlay-play`);
      if (play) {
        play.style.display = "none";
      }
      if (t.options.error) {
        t.options.error(e, media, node);
      }
      if (t.getElement(t.container).querySelector(`.${t.options.classPrefix}cannotplay`)) {
        t.getElement(t.container).querySelector(`.${t.options.classPrefix}cannotplay`).remove();
      }
      const errorContainer = document.createElement("div");
      errorContainer.className = `${t.options.classPrefix}cannotplay`;
      errorContainer.style.width = "100%";
      errorContainer.style.height = "100%";
      let errorContent = typeof t.options.customError === "function" ? t.options.customError(t.media, t.media.originalNode) : t.options.customError, imgError = "";
      if (!errorContent) {
        const poster = t.media.originalNode.getAttribute("poster");
        if (poster) {
          imgError = `<img src="${poster}" alt="${mejs_default.i18n.t("mejs.download-file")}">`;
        }
        if (e.message) {
          errorContent = `<p>${e.message}</p>`;
        }
        if (e.urls) {
          for (let i = 0, total = e.urls.length; i < total; i++) {
            const url = e.urls[i];
            errorContent += `<a href="${url.src}" data-type="${url.type}"><span>${mejs_default.i18n.t("mejs.download-file")}: ${url.src}</span></a>`;
          }
        }
      }
      if (errorContent && t.getElement(t.layers).querySelector(`.${t.options.classPrefix}overlay-error`)) {
        errorContainer.innerHTML = errorContent;
        t.getElement(t.layers).querySelector(`.${t.options.classPrefix}overlay-error`).innerHTML = `${imgError}${errorContainer.outerHTML}`;
        t.getElement(t.layers).querySelector(`.${t.options.classPrefix}overlay-error`).parentNode.style.display = "block";
      }
      if (t.controlsEnabled) {
        t.disableControls();
      }
    }
    setPlayerSize(width, height) {
      const t = this;
      if (!t.options.setDimensions) {
        return false;
      }
      if (typeof width !== "undefined") {
        t.width = width;
      }
      if (typeof height !== "undefined") {
        t.height = height;
      }
      switch (t.options.stretching) {
        case "fill":
          if (t.isVideo) {
            t.setFillMode();
          } else {
            t.setDimensions(t.width, t.height);
          }
          break;
        case "responsive":
          t.setResponsiveMode();
          break;
        case "none":
          t.setDimensions(t.width, t.height);
          break;
        // This is the 'auto' mode
        default:
          if (t.hasFluidMode() === true) {
            t.setResponsiveMode();
          } else {
            t.setDimensions(t.width, t.height);
          }
          break;
      }
    }
    hasFluidMode() {
      const t = this;
      return t.height.toString().indexOf("%") !== -1 || t.node && t.node.style.maxWidth && t.node.style.maxWidth !== "none" && t.node.style.maxWidth !== t.width || t.node && t.node.currentStyle && t.node.currentStyle.maxWidth === "100%";
    }
    setResponsiveMode() {
      const t = this, parent = (() => {
        let parentEl, el = t.getElement(t.container);
        while (el) {
          try {
            if (IS_FIREFOX && el.tagName.toLowerCase() === "html" && window.self !== window.top && window.frameElement !== null) {
              return window.frameElement;
            } else {
              parentEl = el.parentElement;
            }
          } catch (e) {
            parentEl = el.parentElement;
          }
          if (parentEl && visible(parentEl)) {
            return parentEl;
          }
          el = parentEl;
        }
        return null;
      })(), parentStyles = parent ? getComputedStyle(parent, null) : getComputedStyle(document.body, null), nativeWidth = (() => {
        if (t.isVideo) {
          if (t.node.videoWidth && t.node.videoWidth > 0) {
            return t.node.videoWidth;
          } else if (t.node.getAttribute("width")) {
            return t.node.getAttribute("width");
          } else {
            return t.options.defaultVideoWidth;
          }
        } else {
          return t.options.defaultAudioWidth;
        }
      })(), nativeHeight = (() => {
        if (t.isVideo) {
          if (t.node.videoHeight && t.node.videoHeight > 0) {
            return t.node.videoHeight;
          } else if (t.node.getAttribute("height")) {
            return t.node.getAttribute("height");
          } else {
            return t.options.defaultVideoHeight;
          }
        } else {
          return t.options.defaultAudioHeight;
        }
      })(), aspectRatio = (() => {
        if (!t.options.enableAutosize) {
          return t.initialAspectRatio;
        }
        let ratio = 1;
        if (!t.isVideo) {
          return ratio;
        }
        if (t.node.videoWidth && t.node.videoWidth > 0 && t.node.videoHeight && t.node.videoHeight > 0) {
          ratio = t.height >= t.width ? t.node.videoWidth / t.node.videoHeight : t.node.videoHeight / t.node.videoWidth;
        } else {
          ratio = t.initialAspectRatio;
        }
        if (isNaN(ratio) || ratio < 0.01 || ratio > 100) {
          ratio = 1;
        }
        return ratio;
      })(), parentHeight = parseFloat(parentStyles.height);
      let newHeight, parentWidth = parseFloat(parentStyles.width);
      if (t.isVideo) {
        if (t.height === "100%" && t.width === "100%") {
          newHeight = parentHeight;
        } else if (t.height === "100%") {
          newHeight = parseFloat(parentWidth * nativeHeight / nativeWidth, 10);
        } else {
          newHeight = t.height >= t.width ? parseFloat(parentWidth / aspectRatio, 10) : parseFloat(parentWidth * aspectRatio, 10);
        }
      } else {
        newHeight = nativeHeight;
      }
      if (newHeight <= t.container.querySelector(`.${t.options.classPrefix}inner`).offsetHeight) {
        newHeight = t.container.querySelector(`.${t.options.classPrefix}inner`).offsetHeight;
      }
      if (isNaN(newHeight)) {
        newHeight = parentHeight;
      }
      if (t.getElement(t.container).parentNode.length > 0 && t.getElement(t.container).parentNode.tagName.toLowerCase() === "body") {
        parentWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        newHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      }
      if (newHeight && parentWidth) {
        t.getElement(t.container).style.width = `${parentWidth}px`;
        t.getElement(t.container).style.height = `${newHeight}px`;
        t.node.style.width = "100%";
        t.node.style.height = "100%";
        if (t.isVideo && t.media.setSize) {
          t.media.setSize(parentWidth, newHeight);
        }
        if (newHeight <= t.container.querySelector(`.${t.options.classPrefix}inner`).offsetHeight) {
          t.node.style.width = "auto";
          t.node.style.height = "auto";
        }
        const layerChildren = t.getElement(t.layers).children;
        for (let i = 0, total = layerChildren.length; i < total; i++) {
          layerChildren[i].style.width = "100%";
          layerChildren[i].style.height = "100%";
        }
      }
    }
    setFillMode() {
      const t = this;
      const isIframe = window.self !== window.top && window.frameElement !== null;
      const parent = (() => {
        let parentEl, el = t.getElement(t.container);
        while (el) {
          try {
            if (IS_FIREFOX && el.tagName.toLowerCase() === "html" && window.self !== window.top && window.frameElement !== null) {
              return window.frameElement;
            } else {
              parentEl = el.parentElement;
            }
          } catch (e) {
            parentEl = el.parentElement;
          }
          if (parentEl && visible(parentEl)) {
            return parentEl;
          }
          el = parentEl;
        }
        return null;
      })();
      let parentStyles = parent ? getComputedStyle(parent, null) : getComputedStyle(document.body, null);
      if (t.node.style.height !== "none" && t.node.style.height !== t.height) {
        t.node.style.height = "auto";
      }
      if (t.node.style.maxWidth !== "none" && t.node.style.maxWidth !== t.width) {
        t.node.style.maxWidth = "none";
      }
      if (t.node.style.maxHeight !== "none" && t.node.style.maxHeight !== t.height) {
        t.node.style.maxHeight = "none";
      }
      if (t.node.currentStyle) {
        if (t.node.currentStyle.height === "100%") {
          t.node.currentStyle.height = "auto";
        }
        if (t.node.currentStyle.maxWidth === "100%") {
          t.node.currentStyle.maxWidth = "none";
        }
        if (t.node.currentStyle.maxHeight === "100%") {
          t.node.currentStyle.maxHeight = "none";
        }
      }
      if (!isIframe && !parseFloat(parentStyles.width)) {
        parent.style.width = `${t.media.offsetWidth}px`;
      }
      if (!isIframe && !parseFloat(parentStyles.height)) {
        parent.style.height = `${t.media.offsetHeight}px`;
      }
      parentStyles = getComputedStyle(parent);
      const parentWidth = parseFloat(parentStyles.width), parentHeight = parseFloat(parentStyles.height);
      t.setDimensions("100%", "100%");
      const poster = t.getElement(t.container).querySelector(`.${t.options.classPrefix}poster>img`);
      if (poster) {
        poster.style.display = "";
      }
      const targetElement = t.getElement(t.container).querySelectorAll("object, embed, iframe, video"), initHeight = parseFloat(t.height, 10), initWidth = parseFloat(t.width, 10), scaleX1 = parentWidth, scaleY1 = initHeight * parentWidth / initWidth, scaleX2 = initWidth * parentHeight / initHeight, scaleY2 = parentHeight, bScaleOnWidth = scaleX2 > parentWidth === false, finalWidth = bScaleOnWidth ? Math.floor(scaleX1) : Math.floor(scaleX2), finalHeight = bScaleOnWidth ? Math.floor(scaleY1) : Math.floor(scaleY2), width = bScaleOnWidth ? `${parentWidth}px` : `${finalWidth}px`, height = bScaleOnWidth ? `${finalHeight}px` : `${parentHeight}px`;
      for (let i = 0, total = targetElement.length; i < total; i++) {
        targetElement[i].style.height = height;
        targetElement[i].style.width = width;
        if (t.media.setSize) {
          t.media.setSize(width, height);
        }
        targetElement[i].style.marginLeft = `${Math.floor((parentWidth - finalWidth) / 2)}px`;
        targetElement[i].style.marginTop = 0;
      }
    }
    setDimensions(width, height) {
      const t = this;
      width = isString(width) && width.indexOf("%") > -1 ? width : `${parseFloat(width)}px`;
      height = isString(height) && height.indexOf("%") > -1 ? height : `${parseFloat(height)}px`;
      t.getElement(t.container).style.width = width;
      t.getElement(t.container).style.height = height;
      const layers = t.getElement(t.layers).children;
      for (let i = 0, total = layers.length; i < total; i++) {
        layers[i].style.width = width;
        layers[i].style.height = height;
      }
    }
    setControlsSize() {
      const t = this;
      if (!visible(t.getElement(t.container))) {
        return;
      }
      if (!(t.rail && visible(t.rail))) {
        const children = t.getElement(t.controls).children;
        let minWidth = 0;
        for (let i = 0, total = children.length; i < total; i++) {
          minWidth += children[i].offsetWidth;
        }
        t.getElement(t.container).style.minWidth = `${minWidth}px`;
      }
    }
    /**
     * Add featured control element and cache its position in case features are reset
     *
     * @param {HTMLElement} element
     * @param {String} key
     */
    addControlElement(element, key) {
      const t = this;
      if (t.featurePosition[key] !== void 0) {
        const child = t.getElement(t.controls).children[t.featurePosition[key] - 1];
        child.parentNode.insertBefore(element, child.nextSibling);
      } else {
        t.getElement(t.controls).appendChild(element);
        const children = t.getElement(t.controls).children;
        for (let i = 0, total = children.length; i < total; i++) {
          if (element === children[i]) {
            t.featurePosition[key] = i;
            break;
          }
        }
      }
    }
    /**
     * Append layer to manipulate `<iframe>` elements safely.
     *
     * This allows the user to trigger events properly given that mouse/click don't get lost in the `<iframe>`.
     */
    createIframeLayer() {
      const t = this;
      if (t.isVideo && t.media.rendererName !== null && t.media.rendererName.indexOf("iframe") > -1 && !document.getElementById(`${t.media.id}-iframe-overlay`)) {
        const layer = document.createElement("div"), target = document.getElementById(`${t.media.id}_${t.media.rendererName}`);
        layer.id = `${t.media.id}-iframe-overlay`;
        layer.className = `${t.options.classPrefix}iframe-overlay`;
        layer.addEventListener("click", (e) => {
          if (t.options.clickToPlayPause) {
            if (t.paused) {
              t.play();
            } else {
              t.pause();
            }
            e.preventDefault();
            e.stopPropagation();
          }
        });
        target.parentNode.insertBefore(layer, target);
      }
    }
    resetSize() {
      const t = this;
      setTimeout(() => {
        t.setPlayerSize(t.width, t.height);
        t.setControlsSize();
      }, 50);
    }
    setPoster(url) {
      const t = this;
      if (t.getElement(t.container)) {
        let posterDiv = t.getElement(t.container).querySelector(`.${t.options.classPrefix}poster`);
        if (!posterDiv) {
          posterDiv = document.createElement("div");
          posterDiv.className = `${t.options.classPrefix}poster ${t.options.classPrefix}layer`;
          t.getElement(t.layers).appendChild(posterDiv);
        }
        let posterImg = posterDiv.querySelector("img");
        if (!posterImg && url) {
          posterImg = document.createElement("img");
          posterImg.alt = "";
          posterImg.className = `${t.options.classPrefix}poster-img`;
          posterImg.width = "100%";
          posterImg.height = "100%";
          posterDiv.style.display = "";
          posterDiv.appendChild(posterImg);
        }
        if (url) {
          posterImg.setAttribute("src", url);
          posterDiv.style.backgroundImage = `url("${url}")`;
          posterDiv.style.display = "";
        } else if (posterImg) {
          posterDiv.style.backgroundImage = "none";
          posterDiv.style.display = "none";
          posterImg.remove();
        } else {
          posterDiv.style.display = "none";
        }
      } else if (IS_IPAD && t.options.iPadUseNativeControls || IS_IPHONE && t.options.iPhoneUseNativeControls || IS_ANDROID && t.options.AndroidUseNativeControls) {
        t.media.originalNode.poster = url;
      }
    }
    changeSkin(className) {
      const t = this;
      t.getElement(t.container).className = `${t.options.classPrefix}container ${className}`;
      t.setPlayerSize(t.width, t.height);
      t.setControlsSize();
    }
    globalBind(events, callback) {
      const t = this, doc = t.node ? t.node.ownerDocument : document;
      events = splitEvents(events, t.id);
      if (events.d) {
        const eventList = events.d.split(" ");
        for (let i = 0, total = eventList.length; i < total; i++) {
          eventList[i].split(".").reduce(function(part, e) {
            doc.addEventListener(e, callback, false);
            return e;
          }, "");
        }
      }
      if (events.w) {
        const eventList = events.w.split(" ");
        for (let i = 0, total = eventList.length; i < total; i++) {
          eventList[i].split(".").reduce(function(part, e) {
            window.addEventListener(e, callback, false);
            return e;
          }, "");
        }
      }
    }
    globalUnbind(events, callback) {
      const t = this, doc = t.node ? t.node.ownerDocument : document;
      events = splitEvents(events, t.id);
      if (events.d) {
        const eventList = events.d.split(" ");
        for (let i = 0, total = eventList.length; i < total; i++) {
          eventList[i].split(".").reduce(function(part, e) {
            doc.removeEventListener(e, callback, false);
            return e;
          }, "");
        }
      }
      if (events.w) {
        const eventList = events.w.split(" ");
        for (let i = 0, total = eventList.length; i < total; i++) {
          eventList[i].split(".").reduce(function(part, e) {
            window.removeEventListener(e, callback, false);
            return e;
          }, "");
        }
      }
    }
    buildfeatures(player, controls, layers, media) {
      const t = this;
      for (let i = 0, total = t.options.features.length; i < total; i++) {
        const feature = t.options.features[i];
        if (t[`build${feature}`]) {
          try {
            t[`build${feature}`](player, controls, layers, media);
          } catch (e) {
            console.error(`error building ${feature}`, e);
          }
        }
      }
    }
    buildposter(player, controls, layers, media) {
      const t = this, poster = document.createElement("div");
      poster.className = `${t.options.classPrefix}poster ${t.options.classPrefix}layer`;
      layers.appendChild(poster);
      let posterUrl = media.originalNode.getAttribute("poster");
      if (player.options.poster !== "") {
        if (posterUrl && IS_IOS) {
          media.originalNode.removeAttribute("poster");
        }
        posterUrl = player.options.poster;
      }
      if (posterUrl) {
        t.setPoster(posterUrl);
      } else if (t.media.renderer !== null && typeof t.media.renderer.getPosterUrl === "function") {
        t.setPoster(t.media.renderer.getPosterUrl());
      } else {
        poster.style.display = "none";
      }
      media.addEventListener("play", () => {
        poster.style.display = "none";
      });
      media.addEventListener("playing", () => {
        poster.style.display = "none";
      });
      if (player.options.showPosterWhenEnded && player.options.autoRewind) {
        media.addEventListener("ended", () => {
          poster.style.display = "";
        });
      }
      media.addEventListener("error", () => {
        poster.style.display = "none";
      });
      if (player.options.showPosterWhenPaused) {
        media.addEventListener("pause", () => {
          if (!player.ended) {
            poster.style.display = "";
          }
        });
      }
    }
    buildoverlays(player, controls, layers, media) {
      if (!player.isVideo) {
        return;
      }
      const t = this, loading = document.createElement("div"), error = document.createElement("div"), bigPlay = document.createElement("div");
      loading.style.display = "none";
      loading.className = `${t.options.classPrefix}overlay ${t.options.classPrefix}layer`;
      loading.innerHTML = `<div class="${t.options.classPrefix}overlay-loading"><div class="${t.options.classPrefix}overlay-loading-bg-img">
					<svg xmlns="http://www.w3.org/2000/svg">
						<use xlink:href="${t.media.options.iconSprite}#icon-loading-spinner"></use>
					</svg>
				</div></div>`;
      layers.appendChild(loading);
      error.style.display = "none";
      error.className = `${t.options.classPrefix}overlay ${t.options.classPrefix}layer`;
      error.innerHTML = `<div class="${t.options.classPrefix}overlay-error"></div>`;
      layers.appendChild(error);
      bigPlay.className = `${t.options.classPrefix}overlay ${t.options.classPrefix}layer ${t.options.classPrefix}overlay-play`;
      bigPlay.innerHTML = generateControlButton(t.id, i18n_default.t("mejs.play"), i18n_default.t("mejs.play"), `${t.media.options.iconSprite}`, ["icon-overlay-play"], `${t.options.classPrefix}`, `${t.options.classPrefix}overlay-button`, "", false);
      bigPlay.addEventListener("click", () => {
        if (t.options.clickToPlayPause) {
          const button = t.getElement(t.container).querySelector(`.${t.options.classPrefix}overlay-button`), pressed = button.getAttribute("aria-pressed");
          if (t.paused) {
            t.play();
          } else {
            t.pause();
          }
          button.setAttribute("aria-pressed", !!pressed);
          t.getElement(t.container).focus();
        }
      });
      layers.appendChild(bigPlay);
      if (t.media.rendererName !== null && (/(youtube|facebook)/i.test(t.media.rendererName) && !(t.media.originalNode.getAttribute("poster") || player.options.poster || typeof t.media.renderer.getPosterUrl === "function" && t.media.renderer.getPosterUrl()) || IS_STOCK_ANDROID || t.media.originalNode.getAttribute("autoplay"))) {
        bigPlay.style.display = "none";
      }
      let hasError = false;
      media.addEventListener("play", () => {
        bigPlay.style.display = "none";
        loading.style.display = "none";
        error.style.display = "none";
        hasError = false;
      });
      media.addEventListener("playing", () => {
        bigPlay.style.display = "none";
        loading.style.display = "none";
        error.style.display = "none";
        hasError = false;
      });
      media.addEventListener("seeking", () => {
        bigPlay.style.display = "none";
        loading.style.display = "";
        hasError = false;
      });
      media.addEventListener("seeked", () => {
        bigPlay.style.display = t.paused && !IS_STOCK_ANDROID ? "" : "none";
        loading.style.display = "none";
        hasError = false;
      });
      media.addEventListener("pause", () => {
        loading.style.display = "none";
        if (!IS_STOCK_ANDROID && !hasError) {
          bigPlay.style.display = "";
        }
        hasError = false;
      });
      media.addEventListener("waiting", () => {
        loading.style.display = "";
        hasError = false;
      });
      media.addEventListener("loadeddata", () => {
        loading.style.display = "";
        if (IS_ANDROID) {
          media.canplayTimeout = setTimeout(() => {
            if (document.createEvent) {
              const evt = document.createEvent("HTMLEvents");
              evt.initEvent("canplay", true, true);
              return media.dispatchEvent(evt);
            }
          }, 300);
        }
        hasError = false;
      });
      media.addEventListener("canplay", () => {
        loading.style.display = "none";
        clearTimeout(media.canplayTimeout);
        hasError = false;
      });
      media.addEventListener("error", (e) => {
        t._handleError(e, t.media, t.node);
        loading.style.display = "none";
        bigPlay.style.display = "none";
        hasError = true;
      });
      media.addEventListener("loadedmetadata", () => {
        if (!t.controlsEnabled) {
          t.enableControls();
        }
      });
      media.addEventListener("keydown", (e) => {
        t.onkeydown(player, media, e);
        hasError = false;
      });
    }
    buildkeyboard(player, controls, layers, media) {
      const t = this;
      t.getElement(t.container).addEventListener("keydown", () => {
        t.keyboardAction = true;
      });
      t.globalKeydownCallback = (event) => {
        if (!document.activeElement) {
          return true;
        }
        const container = document.activeElement.closest(`.${t.options.classPrefix}container`), target = t.media.closest(`.${t.options.classPrefix}container`);
        t.hasFocus = !!(container && target && container.id === target.id);
        return t.onkeydown(player, media, event);
      };
      t.globalClickCallback = (event) => {
        t.hasFocus = !!event.target.closest(`.${t.options.classPrefix}container`);
      };
      t.globalBind("keydown", t.globalKeydownCallback);
      t.globalBind("click", t.globalClickCallback);
    }
    onkeydown(player, media, e) {
      if (player.hasFocus && player.options.enableKeyboard) {
        for (let i = 0, total = player.options.keyActions.length; i < total; i++) {
          const keyAction = player.options.keyActions[i];
          for (let j = 0, jl = keyAction.keys.length; j < jl; j++) {
            if (e.keyCode === keyAction.keys[j]) {
              keyAction.action(player, media, e.keyCode, e);
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
        }
      }
      return true;
    }
    get paused() {
      return this.proxy.paused;
    }
    get muted() {
      return this.proxy.muted;
    }
    set muted(muted) {
      this.setMuted(muted);
    }
    get ended() {
      return this.proxy.ended;
    }
    get readyState() {
      return this.proxy.readyState;
    }
    set currentTime(time) {
      this.setCurrentTime(time);
    }
    get currentTime() {
      return this.getCurrentTime();
    }
    get duration() {
      return this.getDuration();
    }
    set volume(volume) {
      this.setVolume(volume);
    }
    get volume() {
      return this.getVolume();
    }
    set src(src) {
      this.setSrc(src);
    }
    get src() {
      return this.getSrc();
    }
    play() {
      return this.proxy.play();
    }
    pause() {
      return this.proxy.pause();
    }
    load() {
      return this.proxy.load();
    }
    setCurrentTime(time, userInteraction = false) {
      this.seekUserInteraction = userInteraction;
      this.proxy.setCurrentTime(time);
    }
    getCurrentTime() {
      return this.proxy.currentTime;
    }
    getDuration() {
      return this.proxy.duration;
    }
    setVolume(volume) {
      this.proxy.volume = volume;
    }
    getVolume() {
      return this.proxy.getVolume();
    }
    setMuted(value) {
      this.proxy.setMuted(value);
    }
    setSrc(src) {
      if (!this.controlsEnabled) {
        this.enableControls();
      }
      this.proxy.setSrc(src);
    }
    getSrc() {
      return this.proxy.getSrc();
    }
    canPlayType(type) {
      return this.proxy.canPlayType(type);
    }
    remove() {
      const t = this, rendererName = t.media.rendererName, src = t.media.originalNode.src;
      for (const featureIndex in t.options.features) {
        const feature = t.options.features[featureIndex];
        if (t[`clean${feature}`]) {
          try {
            t[`clean${feature}`](t, t.getElement(t.layers), t.getElement(t.controls), t.media);
          } catch (e) {
            console.error(`error cleaning ${feature}`, e);
          }
        }
      }
      let nativeWidth = t.node.getAttribute("width"), nativeHeight = t.node.getAttribute("height");
      if (nativeWidth) {
        if (nativeWidth.indexOf("%") === -1) {
          nativeWidth = `${nativeWidth}px`;
        }
      } else {
        nativeWidth = "auto";
      }
      if (nativeHeight) {
        if (nativeHeight.indexOf("%") === -1) {
          nativeHeight = `${nativeHeight}px`;
        }
      } else {
        nativeHeight = "auto";
      }
      t.node.style.width = nativeWidth;
      t.node.style.height = nativeHeight;
      t.setPlayerSize(0, 0);
      if (!t.isDynamic) {
        t.node.setAttribute("controls", true);
        t.node.setAttribute("id", t.node.getAttribute("id").replace(`_${rendererName}`, "").replace("_from_mejs", ""));
        const poster = t.getElement(t.container).querySelector(`.${t.options.classPrefix}poster>img`);
        if (poster) {
          t.node.setAttribute("poster", poster.src);
        }
        delete t.node.autoplay;
        t.node.setAttribute("src", "");
        if (t.media.canPlayType(getTypeFromFile(src)) !== "") {
          t.node.setAttribute("src", src);
        }
        if (rendererName && rendererName.indexOf("iframe") > -1) {
          const layer = document.getElementById(`${t.media.id}-iframe-overlay`);
          layer.remove();
        }
        const node = t.node.cloneNode();
        node.style.display = "";
        t.getElement(t.container).parentNode.insertBefore(node, t.getElement(t.container));
        t.node.remove();
        if (t.mediaFiles) {
          for (let i = 0, total = t.mediaFiles.length; i < total; i++) {
            const source = document.createElement("source");
            source.setAttribute("src", t.mediaFiles[i].src);
            source.setAttribute("type", t.mediaFiles[i].type);
            node.appendChild(source);
          }
        }
        if (t.trackFiles) {
          for (let i = 0, total = t.trackFiles.length; i < total; i++) {
            const track = t.trackFiles[i];
            const newTrack = document.createElement("track");
            newTrack.kind = track.kind;
            newTrack.label = track.label;
            newTrack.srclang = track.srclang;
            newTrack.src = track.src;
            node.appendChild(newTrack);
            newTrack.addEventListener("load", function() {
              this.mode = "showing";
              node.textTracks[i].mode = "showing";
            });
          }
        }
        delete t.node;
        delete t.mediaFiles;
        delete t.trackFiles;
      } else {
        t.getElement(t.container).parentNode.insertBefore(t.node, t.getElement(t.container));
      }
      if (t.media.renderer && typeof t.media.renderer.destroy === "function") {
        t.media.renderer.destroy();
      }
      if (typeof t.getElement(t.container) === "object") {
        const offscreen = t.getElement(t.container).parentNode.querySelector(`.${t.options.classPrefix}offscreen`);
        if (offscreen) {
          offscreen.remove();
        }
        t.getElement(t.container).remove();
      }
      t.globalUnbind("resize", t.globalResizeCallback);
      t.globalUnbind("keydown", t.globalKeydownCallback);
      t.globalUnbind("click", t.globalClickCallback);
      delete t.media.player;
    }
  };
  window.MediaElementPlayer = MediaElementPlayer;
  mejs_default.MediaElementPlayer = MediaElementPlayer;
  var player_default = MediaElementPlayer;

  // src/js/player/library.js
  if (typeof jQuery !== "undefined") {
    mejs_default.$ = jQuery;
  } else if (typeof Zepto !== "undefined") {
    mejs_default.$ = Zepto;
  } else if (typeof ender !== "undefined") {
    mejs_default.$ = ender;
  }
  (($) => {
    if (typeof $ !== "undefined") {
      $.fn.mediaelementplayer = function(options) {
        if (options === false) {
          this.each(function() {
            const player = $(this).data("mediaelementplayer");
            if (player) {
              player.remove();
            }
            $(this).removeData("mediaelementplayer");
          });
        } else {
          this.each(function() {
            $(this).data("mediaelementplayer", new player_default(this, options));
          });
        }
        return this;
      };
      $(document).ready(() => {
        $(`.${mejs_default.MepDefaults.classPrefix}player`).mediaelementplayer();
      });
    }
  })(mejs_default.$);

  // src/js/features/fullscreen.js
  Object.assign(config, {
    /**
     * @type {Boolean}
     */
    usePluginFullScreen: true,
    /**
     * @type {?String}
     */
    fullscreenText: null,
    /**
     * @type {Boolean}
     */
    useFakeFullscreen: false
  });
  Object.assign(player_default.prototype, {
    /**
     * @type {Boolean}
     */
    isFullScreen: false,
    /**
     * @type {Boolean}
     */
    isNativeFullScreen: false,
    /**
     * @type {Boolean}
     */
    isInIframe: false,
    /**
     * @type {Boolean}
     */
    isPluginClickThroughCreated: false,
    /**
     * Possible modes
     * (1) 'native-native'  HTML5 video  + browser fullscreen (IE10+, etc.)
     * (2) 'plugin-native'  plugin video + browser fullscreen (fails in some versions of Firefox)
     * (3) 'fullwindow'     Full window (retains all UI)
     *
     * @type {String}
     */
    fullscreenMode: "",
    /**
     *
     */
    containerSizeTimeout: null,
    /**
     * Feature constructor.
     *
     * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     */
    buildfullscreen(player) {
      if (!player.isVideo) {
        return;
      }
      player.isInIframe = window.location !== window.parent.location;
      player.detectFullscreenMode();
      const t = this, fullscreenTitle = isString(t.options.fullscreenText) ? t.options.fullscreenText : i18n_default.t("mejs.fullscreen"), fullscreenBtn = document.createElement("div");
      fullscreenBtn.className = `${t.options.classPrefix}button ${t.options.classPrefix}fullscreen-button`;
      fullscreenBtn.innerHTML = generateControlButton(t.id, fullscreenTitle, fullscreenTitle, `${t.media.options.iconSprite}`, ["icon-fullscreen", "icon-unfullscreen"], `${t.options.classPrefix}`);
      t.addControlElement(fullscreenBtn, "fullscreen");
      fullscreenBtn.addEventListener("click", () => {
        const isFullScreen2 = HAS_TRUE_NATIVE_FULLSCREEN && isFullScreen() || player.isFullScreen;
        if (isFullScreen2) {
          player.exitFullScreen();
        } else {
          player.enterFullScreen();
        }
      });
      player.fullscreenBtn = fullscreenBtn;
      t.options.keyActions.push({
        keys: [70],
        // F
        action: (player2, media, key, event) => {
          if (!event.ctrlKey) {
            if (typeof player2.enterFullScreen !== "undefined") {
              if (player2.isFullScreen) {
                player2.exitFullScreen();
              } else {
                player2.enterFullScreen();
              }
            }
          }
        }
      });
      t.exitFullscreenCallback = (e) => {
        const key = e.which || e.keyCode || 0;
        if (t.options.enableKeyboard && key === 27 && (HAS_TRUE_NATIVE_FULLSCREEN && isFullScreen() || t.isFullScreen)) {
          player.exitFullScreen();
        }
      };
      t.globalBind("keydown", t.exitFullscreenCallback);
      t.normalHeight = 0;
      t.normalWidth = 0;
      if (HAS_TRUE_NATIVE_FULLSCREEN) {
        const fullscreenChanged = () => {
          if (player.isFullScreen) {
            if (isFullScreen()) {
              player.isNativeFullScreen = true;
              player.setControlsSize();
            } else {
              player.isNativeFullScreen = false;
              player.exitFullScreen();
            }
          }
        };
        player.globalBind(FULLSCREEN_EVENT_NAME, fullscreenChanged);
      }
    },
    cleanfullscreen(player) {
      player.exitFullScreen();
      player.globalUnbind("keydown", player.exitFullscreenCallback);
    },
    /**
     * Detect the type of fullscreen based on browser's capabilities
     *
     * @return {String}
     */
    detectFullscreenMode() {
      const t = this, isNative = t.media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);
      let mode = "";
      if (HAS_TRUE_NATIVE_FULLSCREEN && isNative) {
        mode = "native-native";
      } else if (HAS_TRUE_NATIVE_FULLSCREEN && !isNative) {
        mode = "plugin-native";
      } else if (t.usePluginFullScreen && SUPPORT_POINTER_EVENTS) {
        mode = "plugin-click";
      }
      t.fullscreenMode = mode;
      return mode;
    },
    /**
     *
     */
    enterFullScreen() {
      const t = this, isNative = t.media.rendererName !== null && /(html5|native)/i.test(t.media.rendererName), containerStyles = getComputedStyle(t.getElement(t.container));
      if (!t.isVideo) {
        return;
      }
      if (t.options.useFakeFullscreen === false && (IS_IOS || IS_SAFARI) && HAS_IOS_FULLSCREEN && typeof t.media.originalNode.webkitEnterFullscreen === "function" && t.media.originalNode.canPlayType(getTypeFromFile(t.media.getSrc()))) {
        t.media.originalNode.webkitEnterFullscreen();
        return;
      }
      addClass(document.documentElement, `${t.options.classPrefix}fullscreen`);
      addClass(t.getElement(t.container), `${t.options.classPrefix}container-fullscreen`);
      t.normalHeight = parseFloat(containerStyles.height);
      t.normalWidth = parseFloat(containerStyles.width);
      if (t.fullscreenMode === "native-native" || t.fullscreenMode === "plugin-native") {
        requestFullScreen(t.getElement(t.container));
        if (t.isInIframe) {
          setTimeout(function checkFullscreen() {
            if (t.isNativeFullScreen) {
              let percentErrorMargin = 2e-3, windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth, screenWidth = screen.width, absDiff = Math.abs(screenWidth - windowWidth), marginError = screenWidth * percentErrorMargin;
              if (absDiff > marginError) {
                t.exitFullScreen();
              } else {
                setTimeout(checkFullscreen, 500);
              }
            }
          }, 1e3);
        }
      }
      t.getElement(t.container).style.width = "100%";
      t.getElement(t.container).style.height = "100%";
      t.containerSizeTimeout = setTimeout(() => {
        t.getElement(t.container).style.width = "100%";
        t.getElement(t.container).style.height = "100%";
        t.setControlsSize();
      }, 500);
      if (isNative) {
        t.node.style.width = "100%";
        t.node.style.height = "100%";
      } else {
        const elements = t.getElement(t.container).querySelectorAll("embed, object, video"), total2 = elements.length;
        for (let i = 0; i < total2; i++) {
          elements[i].style.width = "100%";
          elements[i].style.height = "100%";
        }
      }
      if (t.options.setDimensions && typeof t.media.setSize === "function") {
        t.media.setSize(screen.width, screen.height);
      }
      const layers = t.getElement(t.layers).children, total = layers.length;
      for (let i = 0; i < total; i++) {
        layers[i].style.width = "100%";
        layers[i].style.height = "100%";
      }
      if (t.fullscreenBtn) {
        removeClass(t.fullscreenBtn, `${t.options.classPrefix}fullscreen`);
        addClass(t.fullscreenBtn, `${t.options.classPrefix}unfullscreen`);
      }
      t.setControlsSize();
      t.isFullScreen = true;
      const zoomFactor = Math.min(screen.width / t.width, screen.height / t.height), captionText = t.getElement(t.container).querySelector(`.${t.options.classPrefix}captions-text`);
      if (captionText) {
        captionText.style.fontSize = `${zoomFactor * 100}%`;
        captionText.style.lineHeight = "normal";
        t.getElement(t.container).querySelector(`.${t.options.classPrefix}captions-position`).style.bottom = `${(screen.height - t.normalHeight) / 2 - t.getElement(t.controls).offsetHeight / 2 + zoomFactor + 15}px`;
      }
      const event = createEvent("enteredfullscreen", t.getElement(t.container));
      t.getElement(t.container).dispatchEvent(event);
    },
    /**
     *
     */
    exitFullScreen() {
      const t = this, isNative = t.media.rendererName !== null && /(native|html5)/i.test(t.media.rendererName);
      if (!t.isVideo) {
        return;
      }
      clearTimeout(t.containerSizeTimeout);
      if (HAS_TRUE_NATIVE_FULLSCREEN && (isFullScreen() || t.isFullScreen)) {
        cancelFullScreen();
      }
      removeClass(document.documentElement, `${t.options.classPrefix}fullscreen`);
      removeClass(t.getElement(t.container), `${t.options.classPrefix}container-fullscreen`);
      if (t.options.setDimensions) {
        t.getElement(t.container).style.width = `${t.normalWidth}px`;
        t.getElement(t.container).style.height = `${t.normalHeight}px`;
        if (isNative) {
          t.node.style.width = `${t.normalWidth}px`;
          t.node.style.height = `${t.normalHeight}px`;
        } else {
          const elements = t.getElement(t.container).querySelectorAll("embed, object, video"), total2 = elements.length;
          for (let i = 0; i < total2; i++) {
            elements[i].style.width = `${t.normalWidth}px`;
            elements[i].style.height = `${t.normalHeight}px`;
          }
        }
        if (typeof t.media.setSize === "function") {
          t.media.setSize(t.normalWidth, t.normalHeight);
        }
        const layers = t.getElement(t.layers).children, total = layers.length;
        for (let i = 0; i < total; i++) {
          layers[i].style.width = `${t.normalWidth}px`;
          layers[i].style.height = `${t.normalHeight}px`;
        }
      }
      if (t.fullscreenBtn) {
        removeClass(t.fullscreenBtn, `${t.options.classPrefix}unfullscreen`);
        addClass(t.fullscreenBtn, `${t.options.classPrefix}fullscreen`);
      }
      t.setControlsSize();
      t.isFullScreen = false;
      const captionText = t.getElement(t.container).querySelector(`.${t.options.classPrefix}captions-text`);
      if (captionText) {
        captionText.style.fontSize = "";
        captionText.style.lineHeight = "";
        t.getElement(t.container).querySelector(`.${t.options.classPrefix}captions-position`).style.bottom = "";
      }
      const event = createEvent("exitedfullscreen", t.getElement(t.container));
      t.getElement(t.container).dispatchEvent(event);
    }
  });

  // src/js/features/playpause.js
  Object.assign(config, {
    /**
     * @type {?String}
     */
    playText: null,
    /**
     * @type {?String}
     */
    pauseText: null
  });
  Object.assign(player_default.prototype, {
    /**
     * Feature constructor.
     *
     * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     * @param {HTMLElement} controls
     * @param {HTMLElement} layers
     * @param {HTMLElement} media
     * @public
     */
    buildplaypause(player, controls, layers, media) {
      const t = this, op = t.options, playTitle = isString(op.playText) ? op.playText : i18n_default.t("mejs.play"), pauseTitle = isString(op.pauseText) ? op.pauseText : i18n_default.t("mejs.pause"), play = document.createElement("div");
      play.className = `${t.options.classPrefix}button ${t.options.classPrefix}playpause-button ${t.options.classPrefix}play`;
      play.innerHTML = generateControlButton(t.id, pauseTitle, playTitle, `${t.media.options.iconSprite}`, ["icon-play", "icon-pause", "icon-replay"], `${t.options.classPrefix}`);
      play.addEventListener("click", () => {
        if (t.paused) {
          t.play();
        } else {
          t.pause();
        }
      });
      const playBtn = play.querySelector("button");
      t.addControlElement(play, "playpause");
      function togglePlayPause(which) {
        removeClass(play, `${t.options.classPrefix}play`);
        removeClass(play, `${t.options.classPrefix}replay`);
        removeClass(play, `${t.options.classPrefix}pause`);
        if ("play" === which) {
          addClass(play, `${t.options.classPrefix}pause`);
          playBtn.setAttribute("title", pauseTitle);
          playBtn.setAttribute("aria-label", pauseTitle);
        } else if ("pse" === which) {
          addClass(play, `${t.options.classPrefix}play`);
          playBtn.setAttribute("title", playTitle);
          playBtn.setAttribute("aria-label", playTitle);
        } else {
          addClass(play, `${t.options.classPrefix}replay`);
          playBtn.setAttribute("title", playTitle);
          playBtn.setAttribute("aria-label", playTitle);
        }
      }
      togglePlayPause("pse");
      media.addEventListener("loadedmetadata", () => {
        togglePlayPause("pse");
      });
      media.addEventListener("play", () => {
        togglePlayPause("play");
      });
      media.addEventListener("playing", () => {
        togglePlayPause("play");
      });
      media.addEventListener("pause", () => {
        togglePlayPause("pse");
      });
      media.addEventListener("ended", () => {
        if (!player.options.loop) {
          setTimeout(() => {
            togglePlayPause("replay");
          }, 0);
        }
      });
    }
  });

  // src/js/features/progress.js
  Object.assign(config, {
    /**
     * Enable tooltip that shows time in progress bar
     * @type {Boolean}
     */
    enableProgressTooltip: true,
    /**
     * Enable smooth behavior when hovering progress bar
     * @type {Boolean}
     */
    useSmoothHover: true,
    /**
     * If set to `true`, the `Live Broadcast` message will be displayed no matter if `duration` is a valid number
     */
    forceLive: false
  });
  Object.assign(player_default.prototype, {
    /**
     * Feature constructor.
     *
     * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     * @param {HTMLElement} controls
     * @param {HTMLElement} layers
     * @param {HTMLElement} media
     */
    buildprogress(player, controls, layers, media) {
      let lastKeyPressTime = 0, mouseIsDown = false, startedPaused = false;
      const t = this, autoRewindInitial = player.options.autoRewind, tooltip = player.options.enableProgressTooltip ? `<span class="${t.options.classPrefix}time-float"><span class="${t.options.classPrefix}time-float-current">00:00</span><span class="${t.options.classPrefix}time-float-corner"></span></span>` : "", rail = document.createElement("div");
      rail.className = `${t.options.classPrefix}time-rail`;
      rail.innerHTML = `<span class="${t.options.classPrefix}time-total ${t.options.classPrefix}time-slider"><span class="${t.options.classPrefix}time-buffering"></span><span class="${t.options.classPrefix}time-loaded"></span><span class="${t.options.classPrefix}time-current"></span><span class="${t.options.classPrefix}time-hovered no-hover"></span><span class="${t.options.classPrefix}time-handle"><span class="${t.options.classPrefix}time-handle-content"></span></span>${tooltip}</span>`;
      t.addControlElement(rail, "progress");
      t.options.keyActions.push(
        {
          keys: [
            37,
            // LEFT
            227
            // Google TV rewind
          ],
          action: (player2) => {
            if (!isNaN(player2.duration) && player2.duration > 0) {
              if (player2.isVideo) {
                player2.showControls();
                player2.startControlsTimer();
              }
              var timeSlider = player2.getElement(player2.container).querySelector(`.${t.options.classPrefix}time-total`);
              if (timeSlider) {
                timeSlider.focus();
              }
              const newTime = Math.max(player2.currentTime - player2.options.defaultSeekBackwardInterval(player2), 0);
              if (!player2.paused) {
                player2.pause();
              }
              setTimeout(function() {
                player2.setCurrentTime(newTime, true);
              }, 0);
              setTimeout(function() {
                player2.play();
              }, 0);
            }
          }
        },
        {
          keys: [
            39,
            // RIGHT
            228
            // Google TV forward
          ],
          action: (player2) => {
            if (!isNaN(player2.duration) && player2.duration > 0) {
              if (player2.isVideo) {
                player2.showControls();
                player2.startControlsTimer();
              }
              var timeSlider = player2.getElement(player2.container).querySelector(`.${t.options.classPrefix}time-total`);
              if (timeSlider) {
                timeSlider.focus();
              }
              const newTime = Math.min(player2.currentTime + player2.options.defaultSeekForwardInterval(player2), player2.duration);
              if (!player2.paused) {
                player2.pause();
              }
              setTimeout(function() {
                player2.setCurrentTime(newTime, true);
              }, 0);
              setTimeout(function() {
                player2.play();
              }, 0);
            }
          }
        }
      );
      t.rail = controls.querySelector(`.${t.options.classPrefix}time-rail`);
      t.total = controls.querySelector(`.${t.options.classPrefix}time-total`);
      t.loaded = controls.querySelector(`.${t.options.classPrefix}time-loaded`);
      t.current = controls.querySelector(`.${t.options.classPrefix}time-current`);
      t.handle = controls.querySelector(`.${t.options.classPrefix}time-handle`);
      t.timefloat = controls.querySelector(`.${t.options.classPrefix}time-float`);
      t.timefloatcurrent = controls.querySelector(`.${t.options.classPrefix}time-float-current`);
      t.slider = controls.querySelector(`.${t.options.classPrefix}time-slider`);
      t.hovered = controls.querySelector(`.${t.options.classPrefix}time-hovered`);
      t.buffer = controls.querySelector(`.${t.options.classPrefix}time-buffering`);
      t.newTime = 0;
      t.forcedHandlePause = false;
      t.setTransformStyle = (element, value) => {
        element.style.transform = value;
      };
      t.buffer.style.display = "none";
      let handleMouseMove = (e) => {
        const offsetStyles = offset(t.total), width = t.total.clientWidth;
        let percentage = 0, leftPos = 0, pos = 0, x;
        if (e.originalEvent && e.originalEvent.changedTouches) {
          x = e.originalEvent.changedTouches[0].pageX;
        } else if (e.changedTouches) {
          x = e.changedTouches[0].pageX;
        } else {
          x = e.pageX;
        }
        if (t.getDuration()) {
          if (x < offsetStyles.left) {
            x = offsetStyles.left;
          } else if (x > width + offsetStyles.left) {
            x = width + offsetStyles.left;
          }
          pos = x - offsetStyles.left;
          percentage = pos / width;
          t.newTime = percentage * t.getDuration();
          if (mouseIsDown && t.getCurrentTime() !== null && t.newTime.toFixed(4) !== t.getCurrentTime().toFixed(4)) {
            t.setCurrentRailHandle(t.newTime);
            t.updateCurrent(t.newTime);
          }
          if (!IS_IOS && !IS_ANDROID) {
            if (pos < 0) {
              pos = 0;
            }
            if (t.options.useSmoothHover) {
              const totalWidth = t.total.clientWidth;
              const handleMatrix = new DOMMatrixReadOnly(getComputedStyle(t.handle).transform);
              const handleLocation = handleMatrix.m41;
              const hoverScaleX = pos / totalWidth - handleLocation / totalWidth;
              t.hovered.style.left = `${handleLocation}px`;
              t.setTransformStyle(t.hovered, `scaleX(${hoverScaleX})`);
              t.hovered.setAttribute("pos", pos);
              if (hoverScaleX >= 0) {
                removeClass(t.hovered, "negative");
              } else {
                addClass(t.hovered, "negative");
              }
            }
            if (t.timefloat) {
              const half = t.timefloat.offsetWidth / 2, offsetContainer = mejs.Utils.offset(t.getElement(t.container)), tooltipStyles = getComputedStyle(t.timefloat);
              if (x - offsetContainer.left < t.timefloat.offsetWidth) {
                leftPos = half;
              } else if (x - offsetContainer.left >= t.getElement(t.container).offsetWidth - half) {
                leftPos = t.total.offsetWidth - half;
              } else {
                leftPos = pos;
              }
              if (hasClass(t.getElement(t.container), `${t.options.classPrefix}long-video`)) {
                leftPos += parseFloat(tooltipStyles.marginLeft) / 2 + t.timefloat.offsetWidth / 2;
              }
              t.timefloat.style.left = `${leftPos}px`;
              t.timefloatcurrent.innerHTML = secondsToTimeCode(t.newTime, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat);
              t.timefloat.style.display = "block";
            }
          }
        } else if (!IS_IOS && !IS_ANDROID && t.timefloat) {
          leftPos = t.timefloat.offsetWidth + width >= t.getElement(t.container).offsetWidth ? t.timefloat.offsetWidth / 2 : 0;
          t.timefloat.style.left = `${leftPos}px`;
          t.timefloat.style.display = "block";
        }
      }, updateSlider = () => {
        const seconds = t.getCurrentTime(), timeSliderText = i18n_default.t("mejs.time-slider"), time = secondsToTimeCode(seconds, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat), duration = t.getDuration();
        t.slider.setAttribute("role", "slider");
        t.slider.tabIndex = 0;
        if (media.paused) {
          t.slider.setAttribute("aria-label", timeSliderText);
          t.slider.setAttribute("aria-valuemin", 0);
          t.slider.setAttribute("aria-valuemax", isNaN(duration) ? 0 : duration);
          t.slider.setAttribute("aria-valuenow", seconds);
          t.slider.setAttribute("aria-valuetext", time);
        } else {
          t.slider.removeAttribute("aria-label");
          t.slider.removeAttribute("aria-valuemin");
          t.slider.removeAttribute("aria-valuemax");
          t.slider.removeAttribute("aria-valuenow");
          t.slider.removeAttribute("aria-valuetext");
        }
      }, restartPlayer = () => {
        if (/* @__PURE__ */ new Date() - lastKeyPressTime >= 1e3) {
          t.play();
        }
      }, handleMouseup = () => {
        if (mouseIsDown && t.getCurrentTime() !== null && t.newTime.toFixed(4) !== t.getCurrentTime().toFixed(4)) {
          t.setCurrentTime(t.newTime, true);
          t.setCurrentRailHandle(t.newTime);
          t.updateCurrent(t.newTime);
        }
        if (t.forcedHandlePause) {
          t.slider.focus();
          t.play();
        }
        t.forcedHandlePause = false;
      };
      t.slider.addEventListener("focus", () => {
        player.options.autoRewind = false;
      });
      t.slider.addEventListener("blur", () => {
        player.options.autoRewind = autoRewindInitial;
      });
      t.slider.addEventListener("keydown", (e) => {
        if (/* @__PURE__ */ new Date() - lastKeyPressTime >= 1e3) {
          startedPaused = t.paused;
        }
        if (t.options.enableKeyboard && t.options.keyActions.length) {
          const keyCode = e.which || e.keyCode || 0, duration = t.getDuration(), seekForward = player.options.defaultSeekForwardInterval(media), seekBackward = player.options.defaultSeekBackwardInterval(media);
          let seekTime = t.getCurrentTime();
          const volume = t.getElement(t.container).querySelector(`.${t.options.classPrefix}volume-slider`);
          if (keyCode === 38 || keyCode === 40) {
            if (volume) {
              volume.style.display = "block";
            }
            if (t.isVideo) {
              t.showControls();
              t.startControlsTimer();
            }
            const newVolume = keyCode === 38 ? Math.min(t.volume + 0.1, 1) : Math.max(t.volume - 0.1, 0), mutePlayer = newVolume <= 0;
            t.setVolume(newVolume);
            t.setMuted(mutePlayer);
            return;
          } else {
            if (volume) {
              volume.style.display = "none";
            }
          }
          switch (keyCode) {
            case 37:
              if (t.getDuration() !== Infinity) {
                seekTime -= seekBackward;
              }
              break;
            case 39:
              if (t.getDuration() !== Infinity) {
                seekTime += seekForward;
              }
              break;
            case 36:
              seekTime = 0;
              break;
            case 35:
              seekTime = duration;
              break;
            case 13:
              if (t.paused) {
                t.play();
              } else {
                t.pause();
              }
              return;
            default:
              return;
          }
          seekTime = seekTime < 0 || isNaN(seekTime) ? 0 : seekTime >= duration ? duration : Math.floor(seekTime);
          lastKeyPressTime = /* @__PURE__ */ new Date();
          if (!startedPaused) {
            player.pause();
          }
          setTimeout(function() {
            t.setCurrentTime(seekTime, true);
          }, 0);
          if (seekTime < t.getDuration() && !startedPaused) {
            setTimeout(restartPlayer, 1100);
          }
          player.showControls();
          e.preventDefault();
          e.stopPropagation();
        }
      });
      const events = ["mousedown", "touchstart"];
      t.slider.addEventListener("dragstart", () => false);
      for (let i = 0, total = events.length; i < total; i++) {
        t.slider.addEventListener(events[i], (e) => {
          t.forcedHandlePause = false;
          if (t.getDuration() !== Infinity) {
            if (e.which === 1 || e.which === 0) {
              if (!t.paused) {
                t.pause();
                t.forcedHandlePause = true;
              }
              mouseIsDown = true;
              handleMouseMove(e);
              const endEvents = ["mouseup", "touchend"];
              for (let j = 0, totalEvents = endEvents.length; j < totalEvents; j++) {
                t.getElement(t.container).addEventListener(endEvents[j], (event) => {
                  const target = event.target;
                  if (target === t.slider || target.closest(`.${t.options.classPrefix}time-slider`)) {
                    handleMouseMove(event);
                  }
                });
              }
              t.globalBind("mouseup.dur touchend.dur", () => {
                handleMouseup();
                mouseIsDown = false;
                if (t.timefloat) {
                  t.timefloat.style.display = "none";
                }
              });
            }
          }
        }, SUPPORT_PASSIVE_EVENT && events[i] === "touchstart" ? { passive: true } : false);
      }
      t.slider.addEventListener("mouseenter", (e) => {
        if (e.target === t.slider && t.getDuration() !== Infinity) {
          t.getElement(t.container).addEventListener("mousemove", (event) => {
            const target = event.target;
            if (target === t.slider || target.closest(`.${t.options.classPrefix}time-slider`)) {
              handleMouseMove(event);
            }
          });
          if (t.timefloat && !IS_IOS && !IS_ANDROID) {
            t.timefloat.style.display = "block";
          }
          if (t.hovered && !IS_IOS && !IS_ANDROID && t.options.useSmoothHover) {
            removeClass(t.hovered, "no-hover");
          }
        }
      });
      t.slider.addEventListener("mouseleave", () => {
        if (t.getDuration() !== Infinity) {
          if (!mouseIsDown) {
            if (t.timefloat) {
              t.timefloat.style.display = "none";
            }
            if (t.hovered && t.options.useSmoothHover) {
              addClass(t.hovered, "no-hover");
            }
          }
        }
      });
      t.broadcastCallback = (e) => {
        const broadcast = controls.querySelector(`.${t.options.classPrefix}broadcast`);
        if (!t.options.forceLive && t.getDuration() !== Infinity) {
          if (broadcast) {
            t.slider.style.display = "";
            broadcast.remove();
          }
          player.setProgressRail(e);
          if (!t.forcedHandlePause) {
            player.setCurrentRail(e);
          }
          updateSlider();
        } else if (!broadcast && t.options.forceLive) {
          const label = document.createElement("span");
          label.className = `${t.options.classPrefix}broadcast`;
          label.innerText = i18n_default.t("mejs.live-broadcast");
          t.slider.style.display = "none";
          t.rail.appendChild(label);
        }
      };
      media.addEventListener("progress", t.broadcastCallback);
      media.addEventListener("timeupdate", t.broadcastCallback);
      media.addEventListener("play", () => {
        t.buffer.style.display = "none";
      });
      media.addEventListener("playing", () => {
        t.buffer.style.display = "none";
      });
      media.addEventListener("seeking", () => {
        t.buffer.style.display = "";
      });
      media.addEventListener("seeked", () => {
        t.buffer.style.display = "none";
      });
      media.addEventListener("pause", () => {
        t.buffer.style.display = "none";
      });
      media.addEventListener("waiting", () => {
        t.buffer.style.display = "";
      });
      media.addEventListener("loadeddata", () => {
        t.buffer.style.display = "";
      });
      media.addEventListener("canplay", () => {
        t.buffer.style.display = "none";
      });
      media.addEventListener("error", () => {
        t.buffer.style.display = "none";
      });
      t.getElement(t.container).addEventListener("controlsresize", (e) => {
        if (t.getDuration() !== Infinity) {
          player.setProgressRail(e);
          if (!t.forcedHandlePause) {
            player.setCurrentRail(e);
          }
        }
      });
    },
    cleanprogress(player, controls, layers, media) {
      media.removeEventListener("progress", player.broadcastCallback);
      media.removeEventListener("timeupdate", player.broadcastCallback);
      if (player.rail) {
        player.rail.remove();
      }
    },
    /**
     * Calculate the progress on the media and update progress bar's width
     *
     * @param {Event} e
     */
    setProgressRail(e) {
      const t = this, target = e !== void 0 ? e.detail.target || e.target : t.media;
      let percent = null;
      if (target && target.buffered && target.buffered.length > 0 && target.buffered.end && t.getDuration()) {
        percent = target.buffered.end(target.buffered.length - 1) / t.getDuration();
      } else if (target && target.bytesTotal !== void 0 && target.bytesTotal > 0 && target.bufferedBytes !== void 0) {
        percent = target.bufferedBytes / target.bytesTotal;
      } else if (e && e.lengthComputable && e.total !== 0) {
        percent = e.loaded / e.total;
      }
      if (percent !== null) {
        percent = Math.min(1, Math.max(0, percent));
        if (t.loaded) {
          t.setTransformStyle(t.loaded, `scaleX(${percent})`);
        }
      }
    },
    /**
     * Update the slider's width depending on the time assigned
     *
     * @param {Number} fakeTime
     */
    setCurrentRailHandle(fakeTime) {
      const t = this;
      t.setCurrentRailMain(t, fakeTime);
    },
    /**
     * Update the slider's width depending on the current time
     *
     */
    setCurrentRail() {
      const t = this;
      t.setCurrentRailMain(t);
    },
    /**
     * Method that handles the calculation of the width of the rail.
     *
     * @param {MediaElementPlayer} t
     * @param {?Number} fakeTime
     */
    setCurrentRailMain(t, fakeTime) {
      if (t.getCurrentTime() !== void 0 && t.getDuration()) {
        const nTime = typeof fakeTime === "undefined" ? t.getCurrentTime() : fakeTime;
        if (t.total && t.handle) {
          const tW = parseFloat(getComputedStyle(t.total).width);
          let newWidth = Math.round(tW * nTime / t.getDuration()), handlePos = newWidth - Math.round(t.handle.offsetWidth / 2);
          handlePos = handlePos < 0 ? 0 : handlePos;
          t.setTransformStyle(t.current, `scaleX(${newWidth / tW})`);
          t.setTransformStyle(t.handle, `translateX(${handlePos}px)`);
          if (t.options.useSmoothHover && !hasClass(t.hovered, "no-hover")) {
            let pos = parseInt(t.hovered.getAttribute("pos"), 10);
            pos = isNaN(pos) ? 0 : pos;
            const hoverScaleX = pos / tW - handlePos / tW;
            t.hovered.style.left = `${handlePos}px`;
            t.setTransformStyle(t.hovered, `scaleX(${hoverScaleX})`);
            if (hoverScaleX >= 0) {
              removeClass(t.hovered, "negative");
            } else {
              addClass(t.hovered, "negative");
            }
          }
        }
      }
    }
  });

  // src/js/features/time.js
  Object.assign(config, {
    /**
     * The initial duration
     * @type {Number}
     */
    duration: 0,
    /**
     * @type {String}
     */
    timeAndDurationSeparator: "<span> | </span>"
  });
  Object.assign(player_default.prototype, {
    /**
     * Current time constructor.
     *
     * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     * @param {HTMLElement} controls
     * @param {HTMLElement} layers
     * @param {HTMLElement} media
     */
    buildcurrent(player, controls, layers, media) {
      const t = this, time = document.createElement("div");
      time.className = `${t.options.classPrefix}time`;
      time.setAttribute("role", "timer");
      time.setAttribute("aria-live", "off");
      time.innerHTML = `<span class="mejs__offscreen">${i18n_default.t("mejs.current")}</span><span class="${t.options.classPrefix}currenttime">${secondsToTimeCode(0, player.options.alwaysShowHours, player.options.showTimecodeFrameCount, player.options.framesPerSecond, player.options.secondsDecimalLength, player.options.timeFormat)}</span>`;
      t.addControlElement(time, "current");
      player.updateCurrent();
      t.updateTimeCallback = () => {
        if (t.controlsAreVisible) {
          player.updateCurrent();
        }
      };
      media.addEventListener("timeupdate", t.updateTimeCallback);
    },
    cleancurrent(player, controls, layers, media) {
      media.removeEventListener("timeupdate", player.updateTimeCallback);
    },
    /**
     * Duration time constructor.
     *
     * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     * @param {HTMLElement} controls
     * @param {HTMLElement} layers
     * @param {HTMLElement} media
     */
    buildduration(player, controls, layers, media) {
      const t = this, currTime = controls.lastChild.querySelector("." + t.options.classPrefix + "currenttime");
      if (currTime) {
        controls.querySelector(`.${t.options.classPrefix}time`).innerHTML += `${t.options.timeAndDurationSeparator}<span class="mejs__offscreen">${i18n_default.t("mejs.duration")}</span><span class="${t.options.classPrefix}duration">${secondsToTimeCode(t.options.duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat)}</span>`;
      } else {
        if (controls.querySelector(`.${t.options.classPrefix}currenttime`)) {
          addClass(controls.querySelector(`.${t.options.classPrefix}currenttime`).parentNode, `${t.options.classPrefix}currenttime-container`);
        }
        const duration = document.createElement("div");
        duration.className = `${t.options.classPrefix}time ${t.options.classPrefix}duration-container`;
        duration.innerHTML = `<span class="mejs__offscreen">${i18n_default.t("mejs.duration")}</span><span class="${t.options.classPrefix}duration">${secondsToTimeCode(t.options.duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat)}</span>`;
        t.addControlElement(duration, "duration");
      }
      t.updateDurationCallback = () => {
        if (t.controlsAreVisible) {
          player.updateDuration();
        }
      };
      media.addEventListener("timeupdate", t.updateDurationCallback);
    },
    cleanduration(player, controls, layers, media) {
      media.removeEventListener("timeupdate", player.updateDurationCallback);
    },
    /**
     * Update the current time and output it in format 00:00
     *
     */
    updateCurrent() {
      const t = this;
      let currentTime = t.getCurrentTime();
      if (isNaN(currentTime)) {
        currentTime = 0;
      }
      const timecode = secondsToTimeCode(currentTime, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat);
      if (timecode.length > 5) {
        addClass(t.getElement(t.container), `${t.options.classPrefix}long-video`);
      } else {
        removeClass(t.getElement(t.container), `${t.options.classPrefix}long-video`);
      }
      if (t.getElement(t.controls).querySelector(`.${t.options.classPrefix}currenttime`)) {
        t.getElement(t.controls).querySelector(`.${t.options.classPrefix}currenttime`).innerText = timecode;
      }
    },
    /**
     * Update the duration time and output it in format 00:00
     *
     */
    updateDuration() {
      const t = this;
      let duration = t.getDuration();
      if (t.media !== void 0 && (isNaN(duration) || duration === Infinity || duration < 0)) {
        t.media.duration = t.options.duration = duration = 0;
      }
      if (t.options.duration > 0) {
        duration = t.options.duration;
      }
      const timecode = secondsToTimeCode(duration, t.options.alwaysShowHours, t.options.showTimecodeFrameCount, t.options.framesPerSecond, t.options.secondsDecimalLength, t.options.timeFormat);
      if (timecode.length > 5) {
        addClass(t.getElement(t.container), `${t.options.classPrefix}long-video`);
      } else {
        removeClass(t.getElement(t.container), `${t.options.classPrefix}long-video`);
      }
      if (t.getElement(t.controls).querySelector(`.${t.options.classPrefix}duration`) && duration > 0) {
        t.getElement(t.controls).querySelector(`.${t.options.classPrefix}duration`).innerHTML = timecode;
      }
    }
  });

  // src/js/features/tracks.js
  Object.assign(config, {
    /**
     * Default language to start media using ISO 639-2 Language Code List (en, es, it, etc.)
     * If there are multiple tracks for one language, the last track node loaded is activated
     * @see https://www.loc.gov/standards/iso639-2/php/code_list.php
     * @type {?String}
     */
    autoplayCaptionLanguage: null,
    /**
     * Default cue line in which to display cues if the cue is set to "auto" (no line entry in VTT). The default of -3 is
     * positioned slightly above the player controls.
     * @type {?(Number|Boolean)}
     */
    defaultTrackLine: -3,
    /**
     * @type {?String}
     */
    tracksText: null,
    /**
     * @type {?String}
     */
    chaptersText: null,
    /**
     * Language to use if multiple chapter tracks are present. If not set, the first available chapter will be used.
     * ISO 639-2 Language Code (en, es, it, etc.)
     * @type {?String}
     */
    chaptersLanguage: null,
    /**
     * Remove the [cc] button when no track nodes are present
     * @type {Boolean}
     */
    hideCaptionsButtonWhenEmpty: true,
    /**
     * Change captions to pop-up if true and only one track node is found
     * @type {Boolean}
     */
    toggleCaptionsButtonWhenOnlyOne: false
  });
  Object.assign(player_default.prototype, {
    /**
     * @type {Boolean}
     */
    hasChapters: false,
    /**
     * Feature constructor.
     *
     * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     * @param {HTMLElement} controls
     */
    buildtracks(player, controls) {
      this.initTracks(player);
      if (!player.tracks.length && (!player.trackFiles || !(player.trackFiles.length === 0))) {
        return;
      }
      const t = this, tracksTitle = isString(t.options.tracksText) ? t.options.tracksText : i18n_default.t("mejs.captions-subtitles"), chaptersTitle = isString(t.options.chaptersText) ? t.options.chaptersText : i18n_default.t("mejs.captions-chapters");
      t.hideAllTracks();
      t.clearTrackHtml(player);
      player.captionsButton = document.createElement("div");
      player.captionsButton.className = `${t.options.classPrefix}button ${t.options.classPrefix}captions-button`;
      player.captionsButton.innerHTML = generateControlButton(t.id, tracksTitle, tracksTitle, `${t.media.options.iconSprite}`, ["icon-captions"], `${t.options.classPrefix}`) + `<div class="${t.options.classPrefix}captions-selector ${t.options.classPrefix}offscreen"><ul class="${t.options.classPrefix}captions-selector-list"><li class="${t.options.classPrefix}captions-selector-list-item"><input type="radio" class="${t.options.classPrefix}captions-selector-input" name="${player.id}_captions" id="${player.id}_captions_none" value="none" checked disabled><label class="${t.options.classPrefix}captions-selector-label ${t.options.classPrefix}captions-selected" for="${player.id}_captions_none">${i18n_default.t("mejs.none")}</label></li></ul></div>`;
      t.addControlElement(player.captionsButton, "tracks");
      player.captionsButton.querySelector(`.${t.options.classPrefix}captions-selector-input`).disabled = false;
      player.chaptersButton = document.createElement("div");
      player.chaptersButton.className = `${t.options.classPrefix}button ${t.options.classPrefix}chapters-button`;
      player.chaptersButton.innerHTML = generateControlButton(t.id, chaptersTitle, chaptersTitle, `${t.media.options.iconSprite}`, ["icon-chapters"], `${t.options.classPrefix}`) + `<div class="${t.options.classPrefix}chapters-selector ${t.options.classPrefix}offscreen"><ul class="${t.options.classPrefix}chapters-selector-list"></ul></div>`;
      const subtitles = t.getSubtitles();
      const chapters = t.getChapters();
      if (chapters.length > 0 && !controls.querySelector(`.${t.options.classPrefix}chapter-selector`)) {
        player.captionsButton.parentNode.insertBefore(player.chaptersButton, player.captionsButton);
      }
      for (let i = 0; i < subtitles.length; i++) {
        player.addTrackButton(subtitles[i]);
        if (subtitles[i].isLoaded) {
          t.enableTrackButton(subtitles[i]);
        }
      }
      player.trackToLoad = -1;
      player.selectedTrack = null;
      player.isLoadingTrack = false;
      const inEvents = ["mouseenter", "focusin"], outEvents = ["mouseleave", "focusout"];
      if (t.options.toggleCaptionsButtonWhenOnlyOne && subtitles.length === 1) {
        player.captionsButton.classList.add(`${t.options.classPrefix}captions-button-toggle`);
        player.captionsButton.addEventListener("click", () => {
          let trackId = "none";
          if (player.selectedTrack === null) {
            trackId = player.getSubtitles()[0].trackId;
          }
          player.setTrack(trackId);
        });
      } else {
        const labels = player.captionsButton.querySelectorAll(`.${t.options.classPrefix}captions-selector-label`), captions = player.captionsButton.querySelectorAll("input[type=radio]");
        for (let i = 0; i < inEvents.length; i++) {
          player.captionsButton.addEventListener(inEvents[i], function() {
            removeClass(this.querySelector(`.${t.options.classPrefix}captions-selector`), `${t.options.classPrefix}offscreen`);
          });
        }
        for (let i = 0; i < outEvents.length; i++) {
          player.captionsButton.addEventListener(outEvents[i], function() {
            setTimeout(() => {
              addClass(this.querySelector(`.${t.options.classPrefix}captions-selector`), `${t.options.classPrefix}offscreen`);
            }, 0);
          });
        }
        for (let i = 0; i < captions.length; i++) {
          captions[i].addEventListener("click", function(e) {
            if (!e.target.disabled) {
              player.setTrack(this.value);
            }
          });
        }
        for (let i = 0; i < labels.length; i++) {
          labels[i].addEventListener("click", function(e) {
            const radio = siblings(this, (el) => el.tagName === "INPUT")[0], event = createEvent("click", radio);
            radio.dispatchEvent(event);
            e.preventDefault();
          });
        }
        player.captionsButton.addEventListener("keydown", (e) => {
          e.stopPropagation();
        });
      }
      for (let i = 0; i < inEvents.length; i++) {
        player.chaptersButton.addEventListener(inEvents[i], function() {
          if (this.querySelector(`.${t.options.classPrefix}chapters-selector-list`).children.length) {
            removeClass(this.querySelector(`.${t.options.classPrefix}chapters-selector`), `${t.options.classPrefix}offscreen`);
          }
        });
      }
      for (let i = 0; i < outEvents.length; i++) {
        player.chaptersButton.addEventListener(outEvents[i], function() {
          setTimeout(() => {
            addClass(this.querySelector(`.${t.options.classPrefix}chapters-selector`), `${t.options.classPrefix}offscreen`);
          }, 0);
        });
      }
      player.chaptersButton.addEventListener("keydown", (e) => {
        e.stopPropagation();
      });
      t.checkAllCaptionsLoadedOrError();
      t.checkAllChaptersLoadedOrError();
    },
    /**
     * Feature destructor.
     *
     * Always has to be prefixed with `clean` and the name that was used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     */
    clearTrackHtml(player) {
      if (player) {
        if (player.captionsButton) {
          player.captionsButton.remove();
        }
        if (player.chaptersButton) {
          player.chaptersButton.remove();
        }
      }
    },
    /**
     * Check for track files and setup event handlers and local track data.
     * @param {MediaElementPlayer} player
     */
    initTracks(player) {
      const t = this, trackFiles = t.trackFiles === null ? t.node.querySelectorAll("track") : t.trackFiles;
      t.tracks = [];
      if (trackFiles) {
        player.trackFiles = trackFiles;
        for (let i = 0; i < trackFiles.length; i++) {
          const track = trackFiles[i], srclang = track.getAttribute("srclang").toLowerCase() || "", trackId = track.getAttribute("id") || `${t.id}_track_${i}_${track.getAttribute("kind")}_${srclang}`;
          track.setAttribute("id", trackId);
          const trackData = {
            trackId,
            srclang,
            src: track.getAttribute("src"),
            kind: track.getAttribute("kind"),
            label: track.getAttribute("label") || "",
            entries: [],
            isDefault: track.hasAttribute("default"),
            isError: false,
            isLoaded: false
          };
          t.tracks.push(trackData);
          if (track.getAttribute("kind") === "captions" || track.getAttribute("kind") === "subtitles") {
            switch (track.readyState) {
              case 2:
                t.handleCaptionsLoaded(track);
                break;
              case 3:
                t.handleCaptionsError(track);
                break;
              default:
                track.addEventListener("load", (event) => {
                  t.handleCaptionsLoaded(event.target);
                });
                track.addEventListener("error", (event) => {
                  t.handleCaptionsError(event.target);
                });
                break;
            }
          } else if (track.getAttribute("kind") === "chapters") {
            switch (track.readyState) {
              case 2:
                t.handleChaptersLoaded(track);
                break;
              case 3:
                t.handleChaptersError(track);
                break;
              default:
                track.addEventListener("load", (event) => {
                  t.handleChaptersLoaded(event.target);
                });
                track.addEventListener("error", (event) => {
                  t.handleChaptersError(event.target);
                });
                break;
            }
          }
        }
      }
    },
    /**
     * Load handler for captions and subtitles. Change cue lines if set to auto.
     * @param {Element} target Video track element
     */
    handleCaptionsLoaded(target) {
      const textTracks = this.node.textTracks, playerTrack = this.getTrackById(target.getAttribute("id"));
      if (Number.isInteger(this.options.defaultTrackLine)) {
        for (let i = 0; i < textTracks.length; i++) {
          if (target.getAttribute("srclang") === textTracks[i].language && target.getAttribute("kind") === textTracks[i].kind) {
            const cues = textTracks[i].cues;
            for (let c = 0; c < cues.length; c++) {
              if (cues[c].line === "auto" || cues[c].line === void 0 || cues[c].line === null) {
                cues[c].line = this.options.defaultTrackLine;
              }
            }
            break;
          }
        }
      }
      playerTrack.isLoaded = true;
      this.enableTrackButton(playerTrack);
      this.checkAllCaptionsLoadedOrError();
    },
    /**
     * Error handler for captions and subtitles. Removs the captions button for erroneous tracks.
     * @param {Element} target Video track element
     */
    handleCaptionsError(target) {
      const playerTrack = this.getTrackById(target.getAttribute("id"));
      playerTrack.isError = true;
      this.removeTrackButton(playerTrack);
      this.checkAllCaptionsLoadedOrError();
    },
    /**
     * Load handler for chapters tracks.
     * @param {Element} target Video track element
     */
    handleChaptersLoaded(target) {
      const playerTrack = this.getTrackById(target.getAttribute("id"));
      this.hasChapters = true;
      playerTrack.isLoaded = true;
      this.checkAllChaptersLoadedOrError();
    },
    /**
     * Error handler for chapters tracks.
     * @param {Element} target Video track element
     */
    handleChaptersError(target) {
      const playerTrack = this.getTrackById(target.getAttribute("id"));
      playerTrack.isError = true;
      this.checkAllChaptersLoadedOrError();
    },
    /**
     * Once all captions/subtitles are loaded, check if we need to autoplay one of them.
     */
    checkAllCaptionsLoadedOrError() {
      const subtitles = this.getSubtitles();
      if (subtitles.length === subtitles.filter(({ isLoaded, isError }) => isLoaded || isError).length) {
        this.removeCaptionsIfEmpty();
        this.checkForAutoPlay();
      }
    },
    /**
     * Once all chapters are loaded, determine which chapter file should be displayed as the chapters menu.
     */
    checkAllChaptersLoadedOrError() {
      const chapters = this.getChapters(), readyChapters = chapters.filter(({ isLoaded }) => isLoaded);
      if (chapters.length === chapters.filter(({ isLoaded, isError }) => isLoaded || isError).length) {
        if (readyChapters.length === 0) {
          this.chaptersButton.remove();
        } else {
          let langChapter = readyChapters.find(({ srclang }) => srclang === this.options.chaptersLanguage);
          langChapter = langChapter || readyChapters.find(({ srclang }) => srclang === i18n_default.lang);
          if (readyChapters.length === 1 || !langChapter) {
            this.drawChapters(readyChapters[0].trackId);
          } else {
            this.drawChapters(langChapter.trackId);
          }
        }
      }
    },
    /**
     *
     * @param {String} trackId, or "none" to disable captions
     */
    setTrack(trackId) {
      const t = this, radios = t.captionsButton.querySelectorAll('input[type="radio"]'), captions = t.captionsButton.querySelectorAll(`.${t.options.classPrefix}captions-selected`), track = t.captionsButton.querySelector(`input[value="${trackId}"]`);
      for (let i = 0; i < radios.length; i++) {
        radios[i].checked = false;
      }
      for (let i = 0; i < captions.length; i++) {
        removeClass(captions[i], `${t.options.classPrefix}captions-selected`);
      }
      track.checked = true;
      const labels = siblings(track, (el) => hasClass(el, `${t.options.classPrefix}captions-selector-label`));
      for (let i = 0; i < labels.length; i++) {
        addClass(labels[i], `${t.options.classPrefix}captions-selected`);
      }
      if (trackId === "none") {
        t.selectedTrack = null;
        removeClass(t.captionsButton, `${t.options.classPrefix}captions-enabled`);
        t.deactivateVideoTracks();
      } else {
        const track2 = t.getTrackById(trackId);
        if (track2) {
          if (t.selectedTrack === null) {
            addClass(t.captionsButton, `${t.options.classPrefix}captions-enabled`);
          }
          t.selectedTrack = track2;
          t.activateVideoTrack(t.selectedTrack.srclang);
        }
      }
      const event = createEvent("captionschange", t.media);
      event.detail.caption = t.selectedTrack;
      t.media.dispatchEvent(event);
    },
    /**
     * Set mode for all tracks to 'hidden' (causes player to load them).
     */
    hideAllTracks() {
      if (this.node.textTracks) {
        for (let i = 0; i < this.node.textTracks.length; i++) {
          this.node.textTracks[i].mode = "hidden";
        }
      }
    },
    /**
     * Hide all subtitles/captions.
     */
    deactivateVideoTracks() {
      if (this.node.textTracks) {
        for (let i = 0; i < this.node.textTracks.length; i++) {
          const track = this.node.textTracks[i];
          if (track.kind === "subtitles" || track.kind === "captions") {
            track.mode = "hidden";
          }
        }
      }
      if (this.options.toggleCaptionsButtonWhenOnlyOne && this.getSubtitles().length === 1) {
        this.captionsButton.classList.remove(`${this.options.classPrefix}captions-button-toggle-on`);
      }
    },
    /**
     * Display a specific language and hide all other subtitles/captions.
     * @param {string} srclang Language code of the subtitles to display
     */
    activateVideoTrack(srclang) {
      for (let i = 0; i < this.node.textTracks.length; i++) {
        const track = this.node.textTracks[i];
        if (track.kind === "subtitles" || track.kind === "captions") {
          if (track.language === srclang) {
            track.mode = "showing";
            if (this.options.toggleCaptionsButtonWhenOnlyOne && this.getSubtitles().length === 1) {
              this.captionsButton.classList.add(`${this.options.classPrefix}captions-button-toggle-on`);
            }
          } else {
            track.mode = "hidden";
          }
        }
      }
    },
    /**
     * Check if we need to start playing any subtitle track.
     */
    checkForAutoPlay() {
      const readySubtitles = this.getSubtitles().filter(({ isError }) => !isError), autoplayTrack = readySubtitles.find(({ srclang }) => this.options.autoplayCaptionLanguage === srclang) || readySubtitles.find(({ isDefault }) => isDefault);
      if (autoplayTrack) {
        if (this.options.toggleCaptionsButtonWhenOnlyOne && readySubtitles.length === 1 && this.captionsButton) {
          this.captionsButton.dispatchEvent(createEvent("click", this.captionsButton));
        } else {
          const target = document.getElementById(`${autoplayTrack.trackId}-btn`);
          if (target) {
            target.checked = true;
            target.dispatchEvent(createEvent("click", target));
          }
        }
      }
    },
    /**
     * Enable the input for the caption/subtitle and remove the "loading" notification from the label.
     * @param {object} track
     */
    enableTrackButton(track) {
      const t = this, lang = track.srclang, target = document.getElementById(`${track.trackId}-btn`);
      if (!target) {
        return;
      }
      let label = track.label;
      if (label === "") {
        label = i18n_default.t(mejs_default.language.codes[lang]) || lang;
      }
      target.disabled = false;
      const targetSiblings = siblings(target, (el) => hasClass(el, `${t.options.classPrefix}captions-selector-label`));
      for (let i = 0; i < targetSiblings.length; i++) {
        targetSiblings[i].innerHTML = label;
      }
    },
    /**
     * Removes a track button.
     * @param {object} track
     */
    removeTrackButton(track) {
      const element = document.getElementById(`${track.trackId}-btn`);
      if (element) {
        const button = element.closest("li");
        if (button) {
          button.remove();
        }
      }
    },
    /**
     * Adds a new track button.
     * @param {object} track
     */
    addTrackButton(track) {
      const t = this, label = track.label || i18n_default.t(mejs_default.language.codes[track.srclang]) || track.srclang;
      t.captionsButton.querySelector("ul").innerHTML += `<li class="${t.options.classPrefix}captions-selector-list-item"><input type="radio" class="${t.options.classPrefix}captions-selector-input" name="${t.id}_captions" id="${track.trackId}-btn" value="${track.trackId}" disabled><label class="${t.options.classPrefix}captions-selector-label"for="${track.trackId}">${label} (loading)</label></li>`;
    },
    /**
     * If no captions exist, remove the button.
     */
    removeCaptionsIfEmpty() {
      if (this.captionsButton && this.options.hideCaptionsButtonWhenEmpty) {
        const subtitleCount = this.getSubtitles().filter(({ isError }) => !isError).length;
        this.captionsButton.style.display = subtitleCount > 0 ? "" : "none";
        this.setControlsSize();
      }
    },
    /**
     * Draw the chapters menu.
     */
    drawChapters(chapterTrackId) {
      const t = this, chapter = this.node.textTracks.getTrackById(chapterTrackId), numberOfChapters = chapter.cues.length;
      if (!numberOfChapters) {
        return;
      }
      t.chaptersButton.querySelector("ul").innerHTML = "";
      for (let i = 0; i < numberOfChapters; i++) {
        t.chaptersButton.querySelector("ul").innerHTML += `<li class="${t.options.classPrefix}chapters-selector-list-item" role="menuitemcheckbox" aria-live="polite" aria-disabled="false" aria-checked="false"><input type="radio" class="${t.options.classPrefix}captions-selector-input" name="${t.id}_chapters" id="${t.id}_chapters_${i}" value="${chapter.cues[i].startTime}" disabled><label class="${t.options.classPrefix}chapters-selector-label"for="${t.id}_chapters_${i}">${chapter.cues[i].text}</label></li>`;
      }
      const radios = t.chaptersButton.querySelectorAll('input[type="radio"]'), labels = t.chaptersButton.querySelectorAll(`.${t.options.classPrefix}chapters-selector-label`);
      for (let i = 0; i < radios.length; i++) {
        radios[i].disabled = false;
        radios[i].checked = false;
        radios[i].addEventListener("click", function(e) {
          const self = this, listItems = t.chaptersButton.querySelectorAll("li"), label = siblings(self, (el) => hasClass(el, `${t.options.classPrefix}chapters-selector-label`))[0];
          self.checked = true;
          self.parentNode.setAttribute("aria-checked", true);
          addClass(label, `${t.options.classPrefix}chapters-selected`);
          removeClass(t.chaptersButton.querySelector(`.${t.options.classPrefix}chapters-selected`), `${t.options.classPrefix}chapters-selected`);
          for (let i2 = 0; i2 < listItems.length; i2++) {
            listItems[i2].setAttribute("aria-checked", false);
          }
          const keyboard = e.keyCode || e.which;
          if (typeof keyboard === "undefined") {
            setTimeout(function() {
              t.getElement(t.container).focus();
            }, 500);
          }
          t.media.setCurrentTime(parseFloat(self.value));
          if (t.media.paused) {
            t.media.play();
          }
        });
      }
      for (let i = 0; i < labels.length; i++) {
        labels[i].addEventListener("click", function(e) {
          const radio = siblings(this, (el) => el.tagName === "INPUT")[0], event = createEvent("click", radio);
          radio.dispatchEvent(event);
          e.preventDefault();
        });
      }
    },
    /**
     * Get a track object using its id.
     * @param {string} trackId
     * @returns {object|undefined} The track object with the given id or undefined if it doesn't exist.
     */
    getTrackById(trackId) {
      return this.tracks.find((track) => track.trackId === trackId);
    },
    /**
     * Fetch all chapter tracks.
     * @returns {object[]} Array containing all track of type "chapters"
     */
    getChapters() {
      return this.tracks.filter(({ kind }) => kind === "chapters");
    },
    /**
     * Fetch all subtitle/captions tracks.
     * @returns {object[]} Array containing all track of type "subtitles"/"captions".
     */
    getSubtitles() {
      return this.tracks.filter(({ kind }) => kind === "subtitles" || kind === "captions");
    },
    /**
     * Perform binary search to look for proper track index
     *
     * @param {Object[]} tracks
     * @param {Number} currentTime
     * @return {Number}
     */
    searchTrackPosition(tracks, currentTime) {
      let lo = 0, hi = tracks.length - 1, mid, start, stop;
      while (lo <= hi) {
        mid = lo + hi >> 1;
        start = tracks[mid].start;
        stop = tracks[mid].stop;
        if (currentTime >= start && currentTime < stop) {
          return mid;
        } else if (start < currentTime) {
          lo = mid + 1;
        } else if (start > currentTime) {
          hi = mid - 1;
        }
      }
      return -1;
    }
  });
  mejs_default.language = {
    codes: {
      af: "mejs.afrikaans",
      sq: "mejs.albanian",
      ar: "mejs.arabic",
      be: "mejs.belarusian",
      bg: "mejs.bulgarian",
      ca: "mejs.catalan",
      zh: "mejs.chinese",
      "zh-cn": "mejs.chinese-simplified",
      "zh-tw": "mejs.chines-traditional",
      hr: "mejs.croatian",
      cs: "mejs.czech",
      da: "mejs.danish",
      nl: "mejs.dutch",
      en: "mejs.english",
      et: "mejs.estonian",
      fl: "mejs.filipino",
      fi: "mejs.finnish",
      fr: "mejs.french",
      gl: "mejs.galician",
      de: "mejs.german",
      el: "mejs.greek",
      ht: "mejs.haitian-creole",
      iw: "mejs.hebrew",
      hi: "mejs.hindi",
      hu: "mejs.hungarian",
      is: "mejs.icelandic",
      id: "mejs.indonesian",
      ga: "mejs.irish",
      it: "mejs.italian",
      ja: "mejs.japanese",
      ko: "mejs.korean",
      lv: "mejs.latvian",
      lt: "mejs.lithuanian",
      mk: "mejs.macedonian",
      ms: "mejs.malay",
      mt: "mejs.maltese",
      no: "mejs.norwegian",
      fa: "mejs.persian",
      pl: "mejs.polish",
      pt: "mejs.portuguese",
      ro: "mejs.romanian",
      ru: "mejs.russian",
      sr: "mejs.serbian",
      sk: "mejs.slovak",
      sl: "mejs.slovenian",
      es: "mejs.spanish",
      sw: "mejs.swahili",
      sv: "mejs.swedish",
      tl: "mejs.tagalog",
      th: "mejs.thai",
      tr: "mejs.turkish",
      uk: "mejs.ukrainian",
      vi: "mejs.vietnamese",
      cy: "mejs.welsh",
      yi: "mejs.yiddish"
    }
  };

  // src/js/features/volume.js
  Object.assign(config, {
    /**
     * @type {?String}
     */
    muteText: null,
    /**
     * @type {?String}
     */
    unmuteText: null,
    /**
     * @type {?String}
     */
    allyVolumeControlText: null,
    /**
     * @type {Boolean}
     */
    hideVolumeOnTouchDevices: true,
    /**
     * @type {String}
     */
    audioVolume: "horizontal",
    /**
     * @type {String}
     */
    videoVolume: "vertical",
    /**
     * Initial volume when the player starts (overridden by user cookie)
     * @type {Number}
     */
    startVolume: 0.8
  });
  Object.assign(player_default.prototype, {
    /**
     * Feature constructor.
     *
     * Always has to be prefixed with `build` and the name that will be used in MepDefaults.features list
     * @param {MediaElementPlayer} player
     * @param {HTMLElement} controls
     * @param {HTMLElement} layers
     * @param {HTMLElement} media
     */
    buildvolume(player, controls, layers, media) {
      if ((IS_ANDROID || IS_IOS) && this.options.hideVolumeOnTouchDevices) {
        return;
      }
      const t = this, mode = t.isVideo ? t.options.videoVolume : t.options.audioVolume, muteText = isString(t.options.muteText) ? t.options.muteText : i18n_default.t("mejs.mute"), unmuteText = isString(t.options.unmuteText) ? t.options.unmuteText : i18n_default.t("mejs.unmute"), volumeControlText = isString(t.options.allyVolumeControlText) ? t.options.allyVolumeControlText : i18n_default.t("mejs.volume-help-text"), mute = document.createElement("div");
      mute.className = `${t.options.classPrefix}button ${t.options.classPrefix}volume-button ${t.options.classPrefix}mute`;
      mute.innerHTML = mode === "horizontal" ? generateControlButton(t.id, muteText, muteText, `${t.media.options.iconSprite}`, ["icon-mute", "icon-unmute"], `${t.options.classPrefix}`, "", `${t.options.classPrefix}horizontal-volume-slider`) : generateControlButton(t.id, muteText, muteText, `${t.media.options.iconSprite}`, ["icon-mute", "icon-unmute"], `${t.options.classPrefix}`, "", `${t.options.classPrefix}volume-slider`) + `<a class="${t.options.classPrefix}volume-slider" aria-label="${i18n_default.t("mejs.volume-slider")}" aria-valuemin="0" aria-valuemax="100" role="slider" aria-orientation="vertical"><span class="${t.options.classPrefix}offscreen" id="${t.options.classPrefix}volume-slider">${volumeControlText}</span><div class="${t.options.classPrefix}volume-total"><div class="${t.options.classPrefix}volume-current"></div><div class="${t.options.classPrefix}volume-handle"></div></div></a>`;
      t.addControlElement(mute, "volume");
      t.options.keyActions.push(
        {
          keys: [38],
          // UP
          action: (player2) => {
            const volumeSlider2 = player2.getElement(player2.container).querySelector(`.${t.options.classPrefix}volume-slider`);
            if (volumeSlider2 && volumeSlider2.matches(":focus")) {
              volumeSlider2.style.display = "block";
            }
            if (player2.isVideo) {
              player2.showControls();
              player2.startControlsTimer();
            }
            const newVolume = Math.min(player2.volume + 0.1, 1);
            player2.setVolume(newVolume);
            if (newVolume > 0) {
              player2.setMuted(false);
            }
          }
        },
        {
          keys: [40],
          // DOWN
          action: (player2) => {
            const volumeSlider2 = player2.getElement(player2.container).querySelector(`.${t.options.classPrefix}volume-slider`);
            if (volumeSlider2) {
              volumeSlider2.style.display = "block";
            }
            if (player2.isVideo) {
              player2.showControls();
              player2.startControlsTimer();
            }
            const newVolume = Math.max(player2.volume - 0.1, 0);
            player2.setVolume(newVolume);
            if (newVolume <= 0.1) {
              player2.setMuted(true);
            }
          }
        },
        {
          keys: [77],
          // M
          action: (player2) => {
            const volumeSlider2 = player2.getElement(player2.container).querySelector(`.${t.options.classPrefix}volume-slider`);
            if (volumeSlider2) {
              volumeSlider2.style.display = "block";
            }
            if (player2.isVideo) {
              player2.showControls();
              player2.startControlsTimer();
            }
            if (player2.media.muted) {
              player2.setMuted(false);
            } else {
              player2.setMuted(true);
            }
          }
        }
      );
      if (mode === "horizontal") {
        const anchor = document.createElement("a");
        anchor.className = `${t.options.classPrefix}horizontal-volume-slider`;
        anchor.setAttribute("aria-label", i18n_default.t("mejs.volume-slider"));
        anchor.setAttribute("aria-valuemin", 0);
        anchor.setAttribute("aria-valuemax", 100);
        anchor.setAttribute("aria-valuenow", 100);
        anchor.setAttribute("role", "slider");
        anchor.innerHTML += `<span class="${t.options.classPrefix}offscreen" id="${t.options.classPrefix}horizontal-volume-slider">${volumeControlText}</span><div class="${t.options.classPrefix}horizontal-volume-total"><div class="${t.options.classPrefix}horizontal-volume-current"></div><div class="${t.options.classPrefix}horizontal-volume-handle"></div></div>`;
        mute.parentNode.insertBefore(anchor, mute.nextSibling);
      }
      let mouseIsDown = false, mouseIsOver = false, modified = false, updateVolumeSlider = () => {
        const volume = Math.floor(media.volume * 100);
        volumeSlider.setAttribute("aria-valuenow", volume);
        volumeSlider.setAttribute("aria-valuetext", `${volume}%`);
      };
      const volumeSlider = mode === "vertical" ? t.getElement(t.container).querySelector(`.${t.options.classPrefix}volume-slider`) : t.getElement(t.container).querySelector(`.${t.options.classPrefix}horizontal-volume-slider`), volumeTotal = mode === "vertical" ? t.getElement(t.container).querySelector(`.${t.options.classPrefix}volume-total`) : t.getElement(t.container).querySelector(`.${t.options.classPrefix}horizontal-volume-total`), volumeCurrent = mode === "vertical" ? t.getElement(t.container).querySelector(`.${t.options.classPrefix}volume-current`) : t.getElement(t.container).querySelector(`.${t.options.classPrefix}horizontal-volume-current`), volumeHandle = mode === "vertical" ? t.getElement(t.container).querySelector(`.${t.options.classPrefix}volume-handle`) : t.getElement(t.container).querySelector(`.${t.options.classPrefix}horizontal-volume-handle`), positionVolumeHandle = (volume) => {
        if (volume === null || isNaN(volume) || volume === void 0) {
          return;
        }
        volume = Math.max(0, volume);
        volume = Math.min(volume, 1);
        if (volume === 0) {
          removeClass(mute, `${t.options.classPrefix}mute`);
          addClass(mute, `${t.options.classPrefix}unmute`);
          const button = mute.firstElementChild;
          button.setAttribute("title", unmuteText);
          button.setAttribute("aria-label", unmuteText);
        } else {
          removeClass(mute, `${t.options.classPrefix}unmute`);
          addClass(mute, `${t.options.classPrefix}mute`);
          const button = mute.firstElementChild;
          button.setAttribute("title", muteText);
          button.setAttribute("aria-label", muteText);
        }
        const volumePercentage = `${volume * 100}%`, volumeStyles = getComputedStyle(volumeHandle);
        if (mode === "vertical") {
          volumeCurrent.style.bottom = 0;
          volumeCurrent.style.height = volumePercentage;
          volumeHandle.style.bottom = volumePercentage;
          volumeHandle.style.marginBottom = `${-parseFloat(volumeStyles.height) / 2}px`;
        } else {
          volumeCurrent.style.left = 0;
          volumeCurrent.style.width = volumePercentage;
          volumeHandle.style.left = volumePercentage;
          volumeHandle.style.marginLeft = `${-parseFloat(volumeStyles.width) / 2}px`;
        }
      }, handleVolumeMove = (e) => {
        const totalOffset = offset(volumeTotal), volumeStyles = getComputedStyle(volumeTotal);
        modified = true;
        let volume = null;
        if (mode === "vertical") {
          const railHeight = parseFloat(volumeStyles.height), newY = e.pageY - totalOffset.top;
          volume = (railHeight - newY) / railHeight;
          if (totalOffset.top === 0 || totalOffset.left === 0) {
            return;
          }
        } else {
          const railWidth = parseFloat(volumeStyles.width), newX = e.pageX - totalOffset.left;
          volume = newX / railWidth;
        }
        volume = Math.max(0, volume);
        volume = Math.min(volume, 1);
        positionVolumeHandle(volume);
        t.setMuted(volume === 0);
        t.setVolume(volume);
        e.preventDefault();
        e.stopPropagation();
      }, toggleMute = () => {
        if (t.muted) {
          positionVolumeHandle(0);
          removeClass(mute, `${t.options.classPrefix}mute`);
          addClass(mute, `${t.options.classPrefix}unmute`);
        } else {
          positionVolumeHandle(media.volume);
          removeClass(mute, `${t.options.classPrefix}unmute`);
          addClass(mute, `${t.options.classPrefix}mute`);
        }
      };
      player.getElement(player.container).addEventListener("keydown", (e) => {
        const hasFocus = !!e.target.closest(`.${t.options.classPrefix}container`);
        if (!hasFocus && mode === "vertical") {
          volumeSlider.style.display = "none";
        }
      });
      mute.addEventListener("mouseenter", (e) => {
        if (e.target === mute) {
          volumeSlider.style.display = "block";
          mouseIsOver = true;
          e.preventDefault();
          e.stopPropagation();
        }
      });
      mute.addEventListener("focusin", () => {
        volumeSlider.style.display = "block";
        mouseIsOver = true;
      });
      mute.addEventListener("focusout", (e) => {
        if ((!e.relatedTarget || e.relatedTarget && !e.relatedTarget.matches(`.${t.options.classPrefix}volume-slider`)) && mode === "vertical") {
          volumeSlider.style.display = "none";
        }
      });
      mute.addEventListener("mouseleave", () => {
        mouseIsOver = false;
        if (!mouseIsDown && mode === "vertical") {
          volumeSlider.style.display = "none";
        }
      });
      mute.addEventListener("focusout", () => {
        mouseIsOver = false;
      });
      mute.addEventListener("keydown", (e) => {
        if (t.options.enableKeyboard && t.options.keyActions.length) {
          let keyCode = e.which || e.keyCode || 0, volume = media.volume;
          switch (keyCode) {
            case 38:
              volume = Math.min(volume + 0.1, 1);
              break;
            case 40:
              volume = Math.max(0, volume - 0.1);
              break;
            default:
              return true;
          }
          mouseIsDown = false;
          positionVolumeHandle(volume);
          media.setVolume(volume);
          e.preventDefault();
          e.stopPropagation();
        }
      });
      mute.querySelector("button").addEventListener("click", () => {
        media.setMuted(!media.muted);
        const event = createEvent("volumechange", media);
        media.dispatchEvent(event);
      });
      volumeSlider.addEventListener("dragstart", () => false);
      volumeSlider.addEventListener("mouseover", () => {
        mouseIsOver = true;
      });
      volumeSlider.addEventListener("focusin", () => {
        volumeSlider.style.display = "block";
        mouseIsOver = true;
      });
      volumeSlider.addEventListener("focusout", () => {
        mouseIsOver = false;
        if (!mouseIsDown && mode === "vertical") {
          volumeSlider.style.display = "none";
        }
      });
      volumeSlider.addEventListener("mousedown", (e) => {
        handleVolumeMove(e);
        t.globalBind("mousemove.vol", (event) => {
          const target = event.target;
          const targetHasClosest = typeof target.closest == "function";
          const targetSliderElement = target.closest(
            mode === "vertical" ? `.${t.options.classPrefix}volume-slider` : `.${t.options.classPrefix}horizontal-volume-slider`
          );
          if (mouseIsDown && (target === volumeSlider || targetHasClosest && targetSliderElement)) {
            handleVolumeMove(event);
          }
        });
        t.globalBind("mouseup.vol", () => {
          mouseIsDown = false;
          if (!mouseIsOver && mode === "vertical") {
            volumeSlider.style.display = "none";
          }
        });
        mouseIsDown = true;
        e.preventDefault();
        e.stopPropagation();
      });
      media.addEventListener("volumechange", (e) => {
        if (!mouseIsDown) {
          toggleMute();
        }
        updateVolumeSlider(e);
      });
      let rendered = false;
      media.addEventListener("rendererready", function() {
        if (!modified) {
          setTimeout(() => {
            rendered = true;
            if (player.options.startVolume === 0 || media.originalNode.muted) {
              media.setMuted(true);
            }
            media.setVolume(player.options.startVolume);
            t.setControlsSize();
          }, 250);
        }
      });
      media.addEventListener("loadedmetadata", function() {
        setTimeout(() => {
          if (!modified && !rendered) {
            if (player.options.startVolume === 0 || media.originalNode.muted) {
              media.setMuted(true);
            }
            if (player.options.startVolume === 0) {
              player.options.startVolume = 0;
            }
            media.setVolume(player.options.startVolume);
            t.setControlsSize();
          }
          rendered = false;
        }, 250);
      });
      if (player.options.startVolume === 0 || media.originalNode.muted) {
        media.setMuted(true);
        if (player.options.startVolume === 0) {
          player.options.startVolume = 0;
        }
        toggleMute();
      }
      t.getElement(t.container).addEventListener("controlsresize", () => {
        toggleMute();
      });
    }
  });
})();
