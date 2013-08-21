/**
 * @fileOverview Methods for converting Exhibit 2.2.0 JSON into
 *     valid JSON 2.0.  If the existing Exhibit JSON import fails
 *     it will offer this as an option via confirmation dialog.  This tool
 *     should not be included under normal operation, only when upgrading
 *     and your data fails to load.  There is an evil call to eval leftover
 *     from Exhibit 2.x days.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "lib/json2",
    "ui/widgets/toolbox-widget"
], function($, JSON, ToolboxWidget) {
/**
 * @namespace
 */
var InvalidJSON = {};

/**
 * @param {String} url
 */
InvalidJSON.process = function(url) {
    InvalidJSON.get(
        url,
        InvalidJSON.onSuccess
    );
};

/**
 * The imprecise method Exhibit 2.2.0 used to process JSON.
 * @param {String} json
 * @returns {Object}
 */
InvalidJSON.parseJSON = function(json) {
    return eval("(" + json + ")");
};

/**
 * @param {String} url
 * @param {String} json
 * @returns {String}
 */
InvalidJSON.makeValid = function(url, json) {
    try {
        return JSON.stringify(InvalidJSON.parseJSON(json), null, "\t");
    } catch(e) {
        $(document).trigger(
            "error.exhibit",
            [e, "Failed to convert."]
        );
    }
};

/**
 * @param {String} url
 * @param {Function} callback
 */
InvalidJSON.get = function(url, callback) {
    $.ajax({
        "url": url,
        "dataType": "text",
        "success": function(s, t, j) {
            callback(url, s, t, j);
        }
    });
};

/**
 * @param {String} url
 * @param {String} s
 * @param {String} textStatus
 * @param {jQuery.XmlHttpRequest} jqxhr
 */
InvalidJSON.onSuccess = function(url, s, textStatus, jqxhr) {
    InvalidJSON.show(
        url,
        InvalidJSON.makeValid(url, s)
    );
};

/**
 * @param {String} url
 * @param {String} json
 */
InvalidJSON.show = function(url, json) {
    var valid = json + "\n// " + url + "\n";
    ToolboxWidget.createExportDialogBox(valid).open();
};

// Initialize
$(document).one("localeLoaded.exhibit", function(evt) {
    $('link[rel="exhibit/data"][type="application/json"],link[rel="exhibit-data"][type="application/json"]')
        .each(function(idx) {
            InvalidJSON.process($(this).attr("href"));
        });
});

    // end define
    return InvalidJSON;
});
