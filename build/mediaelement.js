(() => {
  // src/js/core/mejs.js
  var mejs = {};
  mejs.version = "7.0.8";
  mejs.html5media = {
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
  window.mejs = mejs;
  var mejs_default = mejs;

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
  mejs_default.Features.hasMsNativeFullScreen = HAS_MS_NATIVE_FULLSCREEN;
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
})();
