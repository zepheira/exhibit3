/**
 * @fileOverview Instance of Exhibit.Exporter for BibTex.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "util/localizer",
    "util/persistence",
    "data/exporter"
], function($, _, Persistence, Exporter) {
/**
 * @namespace
 */
var BibTex = {
    /**
     * @private
     * @constant
     */
    _excludeProperties: {
        "pub-type": true,
        "type": true,
        "uri": true,
        "key": true
    },
    _mimeType: "application/x-bibtex",
    exporter: null
};

/**
 * @param {String} s
 * @returns {String}
 */
BibTex.wrap = function(s) {
    return s;
};

/**
 * @param {String} s
 * @returns {String}
 */
BibTex.wrapOne = function(s, first, last) {
    return s + "\n";
};

/**
 * @param {String} itemID
 * @param {Object} o
 * @returns {String}
 */
BibTex.exportOne = function(itemID, o) {
    var type, key, prop, s = "";

    if (typeof o["pub-type"] !== "undefined") {
        type = o["pub-type"];
    } else if (typeof o.type !== "undefined") {
        type = o.type;
    }

    if (typeof o.key !== "undefined") {
        key = o.key;
    } else {
        key = itemID;
    }

    key = key.replace(/[\s,]/g, "-");

    s += "@" + type + "{" + key + ",\n";

    for (prop in o) {
        if (o.hasOwnProperty(prop)) {
            if (typeof BibTex._excludeProperties[prop] === "undefined") {
                s += "\t" + (prop === "label" ?
                         "title" :
                         prop) + " = \"";
                s += o[prop].join(" and ") + "\",\n";
            }
        }
    }

    s += "\torigin = \"" + Persistence.getItemLink(itemID) + "\"\n";
    s += "}\n";

    return s;
};

/**
 * @private
 */
BibTex._register = function() {
    BibTex.exporter = new Exporter(
        BibTex._mimeType,
        _("%export.bibtexExporterLabel"),
        BibTex.wrap,
        BibTex.wrapOne,
        BibTex.exportOne
    );
};

$(document).one(
    "registerExporters.exhibit",
    BibTex._register
);

    // end define
    return BibTex;
});
