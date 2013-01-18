/**
 * @fileOverview
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "exhibit",
    "util/localizer",
    "data/importer",
    "util/ui"
], function($, Exhibit, _, Importer, UIUtilities) {
/**
 * @namespace
 */
var ExhibitJSONImporter = {
    _importer: null
};

/**
 * @param {String} url
 * @param {String} s
 * @param {Function} callback
 * @depends JSON
 */
ExhibitJSONImporter.parse = function(url, s, callback) {
    var o = null;

    try {
        o = JSON.parse(s);
    } catch(e) {
        UIUtilities.showJsonFileValidation(_("%general.badJsonMessage", url, e.message), url);
    }

    if (typeof callback === "function") {
        callback(o);
    }
};

/**
 * @private
 */
ExhibitJSONImporter._register = function() {
    ExhibitJSONImporter._importer = new Importer(
        "application/json",
        "get",
        ExhibitJSONImporter.parse
    );
};

$(document).one(
    "registerImporters.exhibit",
    ExhibitJSONImporter._register
);


    // end define
    return ExhibitJSONImporter;
});
