/**
 * @fileOverview Instance of Exhibit.Exporter for tab-separated values.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "util/localizer",
    "data/exporter"
], function($, _, Exporter) {
/**
 * @namespace
 */
var TSV = {
    _mimeType: "text/tab-separated-values",
    exporter: null
};

/**
 * @param {String} s
 * @param {Exhibit.Database} database
 * @returns {String}
 */
TSV.wrap = function(s, database) {
    var header, i, allProperties, propertyID, property, valueType;

    header = "";

    allProperties = database.getAllProperties();
    for (i = 0; i < allProperties.length; i++) {
        propertyID = allProperties[i];
        property = database.getProperty(propertyID);
        valueType = property.getValueType();
        header += propertyID + ":" + valueType + "\t";
    }

    return header + "\n" + s;
};

/**
 * @param {String} s
 * @returns {String}
 */
TSV.wrapOne = function(s, first, last) {
    return s + "\n";
};

/**
 * @param {String} itemID
 * @param {Object} o
 * @returns {String}
 */
TSV.exportOne = function(itemID, o) {
    var prop, s = "";

    for (prop in o) {
        if (o.hasOwnProperty(prop)) {
            s += o[prop].join("; ") + "\t";
        }
    }

    return s;
};

/**
 * @private
 */
TSV._register = function() {
    TSV.exporter = new Exporter(
        TSV._mimeType,
        _("%export.tsvExporterLabel"),
        TSV.wrap,
        TSV.wrapOne,
        TSV.exportOne
    );
};

$(document).one(
    "registerExporters.exhibit",
    TSV._register
);

    // end define
    return TSV;
});
