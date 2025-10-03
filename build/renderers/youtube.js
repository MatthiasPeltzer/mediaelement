"use strict";
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
  var hasClassMethod;
  var addClassMethod;
  var removeClassMethod;
  if ("classList" in document.documentElement) {
    hasClassMethod = (el, className) => el.classList !== void 0 && el.classList.contains(className);
    addClassMethod = (el, className) => el.classList.add(className);
    removeClassMethod = (el, className) => el.classList.remove(className);
  } else {
    hasClassMethod = (el, className) => new RegExp("\\b" + className + "\\b").test(el.className);
    addClassMethod = (el, className) => {
      if (!hasClass(el, className)) {
        el.className += " " + className;
      }
    };
    removeClassMethod = (el, className) => {
      el.className = el.className.replace(new RegExp("\\b" + className + "\\b", "g"), "");
    };
  }
  var hasClass = hasClassMethod;
  var addClass = addClassMethod;
  var removeClass = removeClassMethod;
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
    const xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
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
