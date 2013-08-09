/**
 * @fileOverview Instance of Exhibit.Exporter for Semantic MediaWiki text.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../../util/localizer",
    "../../util/persistence",
    "../exporter"
], function($, _, Persistence, Exporter) {
/**
 * @namespace
 */
var SemanticWikiText = {
    _type: "semantic-mediawiki",
    exporter: null
};

/**
 * @param {String} s
 * @param {Exhibit.Database} database
 * @returns {String}
 */
SemanticWikiText.wrap = function(s, database) {
    return s;
};

/**
 * @param {String} s
 * @returns {String}
 */
SemanticWikiText.wrapOne = function(s, first, last) {
    return s + "\n";
};

/**
 * @param {String} itemID
 * @param {Object} o
 * @param {Object} properties
 * @returns {String}
 */
SemanticWikiText.exportOne = function(itemID, o, properties) {
    var uri, prop, valueType, values, i, s = "";

    uri = o.uri;
    s += uri + "\n";

    for (prop in o) {
        if (o.hasOwnProperty(prop) && typeof properties[prop] !== "undefined") {
            valueType = properties[prop].valueType;
            values = o[prop];
            if (valueType === "item") {
                for (i = 0; i < values.length; i++) {
                    s += "[[" + prop + "::" + values[i] + "]]\n";
                }
            } else {
                for (i = 0; i < values.length; i++) {
                    s += "[[" + prop + ":=" + values[i] + "]]\n";
                }
            }
        }
    }

    s += "[[origin:=" + Persistence.getItemLink(itemID) + "]]\n\n";

    return s;
};

/**
 * @private
 */
SemanticWikiText._register = function() {
    SemanticWikiText.exporter = new Exporter(
        SemanticWikiText._type,
        _("%export.smwExporterLabel"),
        SemanticWikiText.wrap,
        SemanticWikiText.wrapOne,
        SemanticWikiText.exportOne
    );
};

$(document).one(
    "registerExporters.exhibit",
    SemanticWikiText._register
);

    // end define
    return SemanticWikiText;
});
