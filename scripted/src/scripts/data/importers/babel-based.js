/**
 * @fileOverview Babel service-based data conversion and import.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "exhibit",
    "data/importer"
], function($, Exhibit, Importer) {
    var BabelBased;
/**
 * @namespace
 */
BabelBased = {
    _importer: null,

    _mimeTypeToReader: {
        "application/rdf+xml" : "rdf-xml",
        "application/n3" : "n3",
        
        "application/msexcel" : "xls",
        "application/x-msexcel" : "xls",
        "application/x-ms-excel" : "xls",
        "application/vnd.ms-excel" : "xls",
        "application/x-excel" : "xls",
        "application/xls" : "xls",
        "application/x-xls" : "xls",
        
        "application/x-bibtex" : "bibtex"        
    },

    _translatorPrefix: (typeof Exhibit.babelPrefix !== "undefined") ?
        Exhibit.babelPrefix + "translator?" :
        undefined
};

/**
 * @param {String} url
 * @param {Object} s
 * @param {Function} callback
 */
BabelBased.parse = function(url, s, callback) {
    if (typeof callback === "function") {
        callback(s);
    }
};

/**
 * @param {String} url
 * @param {String} mimeType
 * @returns {String}
 */
BabelBased.makeURL = function(url, mimeType) {
    if (typeof BabelBased._translatorPrefix === "undefined") {
        return null;
    }

    var reader, writer;
    reader = BabelBased._defaultReader;
    writer = BabelBased._defaultWriter;

    if (typeof BabelBased._mimeTypeToReader[mimeType] !== "undefined") {
        reader = BabelBased._mimeTypeToReader[mimeType];
    }

    if (reader === "bibtex") {
        writer = "bibtex-exhibit-jsonp";
    }

    return BabelBased._translatorPrefix + [
        "reader=" + reader,
        "writer=" + writer,
        "url=" + encodeURIComponent(url)
    ].join("&");
};

/**
 * @private
 * @static
 * @param {jQuery.Event} evt
 * @param {Exhibit.Registry} reg
 */
BabelBased._register = function(evt, reg) {
    if (typeof BabelBased._translatorPrefix === "undefined") {
        return;
    }

    var types, type;
    types = [];
    for (type in BabelBased._mimeTypeToReader) {
        if (BabelBased._mimeTypeToReader.hasOwnProperty(type)) {
            types.push(type);
        }
    }
    
    BabelBased._importer = new Importer(
        types,
        "babel",
        BabelBased.parse
    );
};

$(document).one(
    "registerImporters.exhibit",
    BabelBased._register
);

    // end define
    return BabelBased;
});
