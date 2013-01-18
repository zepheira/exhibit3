/**
 * @fileOverview Instance of Exhibit.Exporter for Exhibit JSON.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "data/exporter",
    "util/localizer"
], function($, Exporter, _) {
    var ExhibitJSONExporter;

/**
 * @namespace
 */
ExhibitJSONExporter = {
    _mimeType: "application/json",
    exporter: null
};

/**
 * @param {String} s
 * @returns {String}
 */
ExhibitJSONExporter.wrap = function(s) {
    return "{\n" +
        "    \"items\": [\n" +
            s +
        "    ]\n" +
        "}\n";
};

/**
 * @param {String} s
 * @param {Boolean} first
 * @param {Boolean} last
 * @returns {String}
 */
ExhibitJSONExporter.wrapOne = function(s, first, last) {
    return s + (last ? "" : ",")  +"\n";
};

/**
 * @param {String} itemID
 * @param {Object} o
 * @returns {String}
 * @depends JSON
 */
ExhibitJSONExporter.exportOne = function(itemID, o) {
    return JSON.stringify(o);
};

/**
 * @private
 */
ExhibitJSONExporter._register = function() {
    ExhibitJSONExporter.exporter = new Exporter(
        ExhibitJSONExporter._mimeType,
        _("%export.exhibitJsonExporterLabel"),
        ExhibitJSONExporter.wrap,
        ExhibitJSONExporter.wrapOne,
        ExhibitJSONExporter.exportOne
    );
};

$(document).one(
    "registerExporters.exhibit",
    ExhibitJSONExporter._register
);

    // end define
    return ExhibitJSONExporter;
});
