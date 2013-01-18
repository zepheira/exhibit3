/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery", "base"], function($, Exhibit) {
/**
 * Retrieve an Exhibit-specific attribute from an element.
 *
 * @static
 * @param {jQuery|Element} elmt
 * @param {String} name Full attribute name or Exhibit attribute (without any
 *    prefix), e.g., "id" or "itemTypes".  "item-types" or "data-ex-item-types"
 *    are equivalent to "itemTypes", but "itemTypes" is the preferred form.
 * @param {String} splitOn Separator character to split a string
 *    representation into several values.  Returns an array if used.
 * @returns {String|Array}
 */
Exhibit.getAttribute = function(elmt, name, splitOn) {
    var value, i, values;

    try {
        value = $(elmt).attr(name);
        if (typeof value === "undefined" || value === null || value.length === 0) {
            value = $(elmt).data("ex-"+name);
            if (typeof value === "undefined" || value === null || value.length === 0) {
                return null;
            }
        }
        if (typeof value.toString !== "undefined") {
            value = value.toString();
        }
        if (typeof splitOn === "undefined" || splitOn === null) {
            return value;
        }
        values = value.split(splitOn);
        for (i = 0; i < values.length; i++) {
            values[i] = values[i].trim();
        }
        return values;
    } catch(e) {
        return null;
    }
};

/**
 * @static
 * @param {Element} elmt
 * @returns {String}
 */
Exhibit.getRoleAttribute = function(elmt) {
    var role = Exhibit.getAttribute(elmt, "role") || "";
    if (typeof role === "object") {
        role = role[0];
    }
    role = role.replace(/^exhibit-/, "");
    return role;
};

/**
 * Process a DOM element's attribute name to see if it is an Exhibit
 * attribute.
 * @static
 * @param {String} name
 * @returns {Boolean}
 */
Exhibit.isExhibitAttribute = function(name) {
    return name.length > "data-ex-".length
        && name.startsWith("data-ex-");
};

/**
 * Process a DOM element's attribute and convert it into the name Exhibit
 * uses internally.
 * @static
 * @param {String} name
 * @returns {String}
 */
Exhibit.extractAttributeName = function(name) {
    return name.substr("data-ex-".length);
};

/**
 * Turn an internal attribute name into something that can be inserted into
 * the DOM and correctly re-extracted later as an Exhibit attribute.
 * @static
 * @param {String} name
 */
Exhibit.makeExhibitAttribute = function(name) {
    var exname;
    switch (name) {
        case "itemID":
            exname = "itemid";
            break;
        default:
            exname = "data-ex-" + name.replace(/([A-Z])/g, "-$1").toLowerCase();
            break;
    }
    return exname;
};

/**
 * @static
 * @param {Element} elmt
 * @returns {Object}
 */
Exhibit.getConfigurationFromDOM = function(elmt) {
    var c, o;
    c = Exhibit.getAttribute(elmt, "configuration");
    if (typeof c !== "undefined" && c !== null && c.length > 0) {
        try{
            o = eval(c);
            if (typeof o === "object") {
                return o;
            }
        } catch (e) {}
    }
    return {};
};

/**
 * This method is not commonly used.  Consider using Exhibit.SettingsUtilties.
 * @deprecated
 * @static
 * @param {Element} elmt
 * @returns {Object}
 */
Exhibit.extractOptionsFromElement = function(elmt) {
    var opts, dataset, i;
    opts = {};
    dataset = $(elmt).data();
    for (i in dataset) {
        if (dataset.hasOwnProperty(i)) {
            if (i.startsWith("ex")) {
                opts[i.substring(2)] = dataset[i];
            } else {
                opts[i] = dataset[i];
            }
        }
    }
    return opts;
};

// @@@ from exhibit-api.js, here to bottom
// most of this is obsolete with RequireJS

/**
 * @static
 * @param {String} url
 * @param {Object} to
 * @param {Object} types
 * @returns {Object}
 */
Exhibit.parseURLParameters = function(url, to, types) {
    var q, param, parsed, params, decode, i, eq, name, old, replacement, type, data;
    to = to || {};
    types = types || {};

    if (typeof url === "undefined") {
        url = document.location.href;
    }

    q = url.indexOf("?");
    if (q < 0) {
        return to;
    }

    url = (url+"#").slice(q+1, url.indexOf("#")); // remove URL fragment
    params = url.split("&");
    parsed = {};
    decode = window.decodeURIComponent || unescape;
    for (i = 0; i < params.length; i++) {
        param = params[i];
        eq = param.indexOf("=");
        name = decode(param.slice(0, eq));
        old = parsed[name];
        replacement = decode(param.slice(eq+1));
 
        if (typeof old === "undefined") {
            old = [];
        } else if (!(old instanceof Array)) {
            old = [old];
        }
        parsed[name] = old.concat(replacement);
    }

    for (i in parsed) {
        if (parsed.hasOwnProperty(i)) {
            type = types[i] || String;
            data = parsed[i];
            if (!(data instanceof Array)) {
                data = [data];
            }
            if (type === Boolean && data[0] === "false") {
                to[i] = false;
            } else {
                to[i] = type.apply(this, data);
            }
        }
    }

    return to;
};

/**
 * Locate the script tag that called for a component and return its src.
 *
 * @param {Document} doc
 * @param {String} frag
 * @returns {String}
 */
Exhibit.findScript = function(doc, frag) {
    var script, scripts, i, url;
    scripts = doc.getElementsByTagName("script");
    for (i = 0; i < scripts.length; i++) {
        script = scripts[i];
        url = script.getAttribute("src");
        if (url !== null) {
            if (url.indexOf(frag) >= 0) {
                return url;
            }
        }
    }
    return null;
};

/**
 * Append into urls each string in suffixes after prefixing it with urlPrefix.
 * @static
 * @param {Array} urls
 * @param {String} urlPrefix
 * @param {Array} suffixes
 */
Exhibit.prefixURLs = function(urls, urlPrefix, suffixes) {
    // no op
};

/**
 * @static
 * @param {Document} doc
 * @param {String} url
 */
Exhibit.includeCssFile = function(doc, url) {
    var link;
    if (doc.body === null) {
        try {
            doc.write('<link rel="stylesheet" href="' + url + '" type="text/css"/>');
            return;
        } catch (e) {
                // fall through
        }
    }
        
    link = doc.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", url);
    doc.getElementsByTagName("head")[0].appendChild(link);
};

/**
 * @static
 * @param {Document} doc
 * @param {String} urlPrefix Path prefix to add to the list of filenames; use
 *     null or an empty string if no prefix is needed.
 * @param {Array} filenames
 */
Exhibit.includeCssFiles = function(doc, urlPrefix, filenames) {
    var i;
    for (i = 0; i < filenames.length; i++) {
        if (urlPrefix !== null && urlPrefix !== "") {
            Exhibit.includeCssFile(doc, urlPrefix + filenames[i]);
        } else {
            Exhibit.includeCssFile(doc, filenames[i]);
        }
    }
};

/**
 * @static
 * @param {String} urlPrefix Path prefix to add to the list of filenames; use
 *     null or an empty string if no prefix is needed.
 * @param {Array} filenames
 * @param {Boolean} [serial]
 */
Exhibit.includeJavascriptFiles = function(urlPrefix, filenames, serial) {
    // no op
};

/**
 * @static
 * @param {String} urlPrefix Path prefix to add to the list of filenames; use
 *     null or an empty string if no prefix is needed.
 * @param {String} filename The remainder of the script URL following the
 *     urlPrefix; a script to add to Exhibit's ordered loading.
 * @param {Boolean} [serial] Whether to wait for a script to load before
 *      loading the next in line.  True by default.
 */
Exhibit.includeJavascriptFile = function(urlPrefix, filename, serial) {
    // no op
};

/**
 * @static
 * @returns {String}
 */
Exhibit.generateDelayID = function() {
    return "delay" + Math.round(Math.random()*100000);
};

/**
 * Does very little in light of RequireJS.  Eliminate if possible.
 * 
 * @static
 */
Exhibit.load = function() {
    var i, j, k, o, dep, url, paramTypes, scr, docHead, style, linkElmts, link;

    paramTypes = {
        "bundle": Boolean,
        "js": Array,
        "postLoad": Boolean,
        "css": Array,
        "autoCreate": Boolean,
        "safe": Boolean,
        "babel": String,
        "backstage": String,
        "locale": String,
        "persist": Boolean
    };

    if (typeof Exhibit_urlPrefix === "string") {
        Exhibit.urlPrefix = Exhibit_urlPrefix;
        if (Object.prototype.hasOwnProperty.call(
            window,
            "Exhibit_parameters"
        )) {
            Exhibit.parseURLParameters(Exhibit_parameters,
                                       Exhibit.params,
                                       paramTypes);
        }
    } else {
        // url = Exhibit.findScript(document, "/exhibit-api.js");
        // Exhibit.urlPrefix = url.substr(0, url.indexOf("exhibit-api.js"));
        // Exhibit.parseURLParameters(url, Exhibit.params, paramTypes);
        Exhibit.urlPrefix = "http://localhost/~ryanlee/dev/src/";
    }

    if (typeof Exhibit.params.babel !== "undefined") {
        Exhibit.babelPrefix = Exhibit.params.babel;
    }

    // Using the <link> version takes precedence; this is a holdover from
    // the Babel-based importer where only Babel's translator URL mattered,
    // but here the root of Babel is more important.
    // <link rel="exhibit/babel-translator" src="..." />
    //   or
    // <link rel="exhibit-babel" src="..." />
    // will do it.
    linkElmts = document.getElementsByTagName("link");
    for (i = 0; i < linkElmts.length; i++) {
        link = linkElmts[i];
        if (link.rel.search(/\b(exhibit\/babel-translator|exhibit-babel)\b/) > 0) {
            Exhibit.babelPrefix = link.href.replace(/\/translator\/$/, "");
        }
    }

    if (Exhibit.params.bundle) {
        Exhibit.scripts = ["exhibit-scripted-bundle.js"];
        Exhibit.styles = ["styles/exhibit-scripted-bundle.css"];
    }
    
    if (typeof Exhibit.params.backstage !== "undefined") {
        // If using Backstage, force non-auto creation and force Backstage
        // to load after Exhibit.  If the Backstage install also includes
        // Babel, the Backstage scripts should set Exhibit.babelPrefix.
        Exhibit.params.autoCreate = false;
        Exhibit.scripts = Exhibit.scripts.concat(Exhibit.params.backstage);
    }

    // @@@ write up different script inclusion, won't work here

    // load styles first
    docHead = document.getElementsByTagName("head")[0];
    for (i = 0; i < Exhibit.styles.length; i++) {
        style = document.createElement("link");
        style.setAttribute("rel", "stylesheet");
        style.setAttribute("type", "text/css");
        style.setAttribute("href", Exhibit.urlPrefix + Exhibit.styles[i]);
        docHead.appendChild(style);
    }
};

Exhibit.load();

    // end define
    return Exhibit;
});
