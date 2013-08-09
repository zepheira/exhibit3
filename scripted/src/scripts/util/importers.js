define([
    "lib/jquery",
    "./localizer",
    "./debug",
    "./persistence",
    "./ui",
    "../data/importer",
    "../data/importers/jsonp",
    "../data/importers/babel-based"
], function($, _, Debug, Persistence, UIUtilities, Importer, JSONP, BabelBased) {

var ImporterUtilities = {};

/**
 * @param {Exhibit.Importer} importer
 * @param {Element|String} link
 * @param {Exhibit.Database} database
 * @param {Function} callback
 */
ImporterUtilities.load = function(importer, link, database, callback) {
    var resolver, url, postLoad, postParse;
    url = typeof link === "string" ? link : $(link).attr("href");
    url = Persistence.resolveURL(url);

    switch(importer._loadType) {
    case "babel":
        resolver = ImporterUtilities._loadBabel;
        break;
    case "jsonp":
        resolver = ImporterUtilities._loadJSONP;
        break;
    default:
        resolver = ImporterUtilities._loadURL;
        break;
    }

    postParse = function(o) {
        try {
            database.loadData(o, Persistence.getBaseURL(url));
        } catch(e) {
            Debug.exception(e);
            $(document).trigger("error.exhibit", [e, _("%import.couldNotLoad", url)]);
        } finally {
            if (typeof callback === "function") {
                callback();
            }
        }
    };

    postLoad = function(s, textStatus, jqxhr) {
        UIUtilities.hideBusyIndicator();
        try {
            importer._parse(url, s, postParse);
        } catch(e) {
            $(document).trigger("error.exhibit", [e, _("%import.couldNotParse", url)]);
        }
    };

    UIUtilities.showBusyIndicator();
    resolver(importer, url, database, postLoad, link);
};

/**
 * @param {Exhibit.Importer} importer
 * @param {String} url
 * @param {Exhibit.Database} database
 * @param {Function} callback
 */
ImporterUtilities._loadURL = function(importer, url, database, callback) {
    var callbackOrig = callback,
        fragmentStart = url.indexOf('#'),
        fragmentId = url.substring(fragmentStart),

        fError = function(jqxhr, textStatus, e) {
            var msg;
            if (Importer.checkFileURL(url) && jqxhr.status === 404) {
                msg = _("%import.missingOrFilesystem", url);
            } else {
                msg = _("%import.httpError", url, jqxhr.status);
            }
            $(document).trigger("error.exhibit", [e, msg]);
        };

    if ((fragmentStart >= 0) && (fragmentStart < url.length - 1)) {
        url = url.substring(0, fragmentStart);

        callback = function(data, status, jqxhr) {
            var msg,
                fragment = $(data).find(fragmentId)
	                          .andSelf()
	                          .filter(fragmentId);
            if (fragment.length < 1) {
                msg = _("%import.missingFragment", url);
                $(document).trigger("error.exhibit", [new Error(msg), msg]);
            } else {
                callbackOrig(fragment.text(), status, jqxhr);
            }
        };
    }

    $.ajax({
        "url": url,
        "dataType": "text",
        "error": fError,
        "success": callback
    });
};

/**
 * @param {Exhibit.Importer} importer
 * @param {String} url
 * @param {Exhibit.Database} database
 * @param {Function} callback
 * @param {Element} link
 */
ImporterUtilities._loadJSONP = function(importer, url, database, callback, link) {
    var charset, convertType, jsonpCallback, converter, fDone, fError, ajaxArgs;

    if (typeof link !== "string") {
        convertType = Exhibit.getAttribute(link, "converter");
        jsonpCallback = Exhibit.getAttribute(link, "jsonp-callback");
        charset = Exhibit.getAttribute(link, "charset");
    }

    converter = Importer._registry.get(
        JSONP._registryKey,
        convertType
    );

    if (converter !== null && typeof converter.preprocessURL !== "undefined") {
        url = converter.preprocessURL(url);
    }
    
    fDone = function(s, textStatus, jqxhr) {
        var json;
        if (converter !== null && typeof converter.transformJSON !== "undefined") {
            json = converter.transformJSON(s);
        } else {
            json = s;
        }
        callback(json, textStatus, jqxhr);
    };

    fError = function(jqxhr, textStatus, e) {
        var msg;
        msg = _(
            "%import.failedAccess",
            url,
            (typeof jqxhr.status !== "undefined") ? _("%import.failedAccessHttpStatus", jqxhr.status) : "");
        $(document).trigger("error.exhibit", [e, msg]);
    };

    ajaxArgs = {
        "url": url,
        "dataType": "jsonp",
        "success": fDone,
        "error": fError
    };

    if (jsonpCallback !== null) {
        ajaxArgs.jsonp = false;
        ajaxArgs.jsonpCallback = jsonpCallback;
    }

    if (charset !== null) {
        ajaxArgs.scriptCharset = charset;
    }

    $.ajax(ajaxArgs);
};

/**
 * @param {Exhibit.Importer} importer
 * @param {String} url
 * @param {Exhibit.Database} database
 * @param {Function} callback
 * @param {Element} link
 */
ImporterUtilities._loadBabel = function(importer, url, database, callback, link) {
    var mimeType = null;
    if (typeof link !== "string") {
        mimeType = $(link).attr("type");
    }
    ImporterUtilities._loadJSONP(
        BabelBased.makeURL(url, mimeType),
        database,
        callback,
        link
    );
};

    return ImporterUtilities;
});
