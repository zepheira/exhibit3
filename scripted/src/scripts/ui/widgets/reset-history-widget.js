/**
 * @fileOverview Development widget to assist with resetting history, which
 *     can get in an odd state if the Exhibit is being designed.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */
define([
    "lib/jquery",
    "exhibit",
    "util/history",
    "util/ui",
    "ui/ui-context"
], function($, Exhibit, EHistory, UIUtilities, UIContext) {
/**
 * @constructor
 * @class
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext 
 */
var ResetHistoryWidget = function(containerElmt, uiContext) {
    this._containerElmt = containerElmt;
    this._uiContext = uiContext;
    this._settings = {};
};

/**
 * @static
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ResetHistoryWidget}
 */
ResetHistoryWidget.create = function(configuration, elmt, uiContext) {
    var widget = new ResetHistoryWidget(
        elmt,
        UIContext.create(configuration, uiContext)
    );
    ResetHistoryWidget._configure(widget, configuration);
    widget._initializeUI();
    return widget;
};

/**
 * @static
 * @param {Element} configElmt
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ResetHistoryWidget}
 */
ResetHistoryWidget.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration, widget;
    configuration = Exhibit.getConfigurationFromDOM(configElmt);
    widget = new ResetHistoryWidget(
        (typeof containerElmt !== "undefined" && containerElmt !== null) ?
            containerElmt : configElmt,
        UIContext.createFromDOM(configElmt, uiContext)
    );
    ResetHistoryWidget._configure(widget, configuration);
    widget._initializeUI();
    return widget;
};

/**
 * @static
 * @private
 * @param {Exhibit.ResetHistoryWidget} widget
 * @param {Object} configuration
 */
ResetHistoryWidget._configure = function(widget, configuration) {
};

/**
 * Sets the history to its initial, empty state and reloads the page.
 * @static
 */
ResetHistoryWidget.resetHistory = function() {
    EHistory.eraseState();
    window.location.reload();
};

/**
 *
 */
ResetHistoryWidget.prototype._initializeUI = function() {
    var img;

    img = UIUtilities.createTranslucentImage("images/reset-history-icon.png");
    $(img)
        .attr("class", "exhibit-resetHistoryWidget-button")
        .attr("title", "Click to clear state and refresh window")
        .bind("click", function(evt) {
            ResetHistoryWidget.resetHistory();
        });
    $(this._containerElmt).append(img);
};

/**
 * @public
 * @param {Exhibit.ControlPanel} panel
 */
ResetHistoryWidget.prototype.reconstruct = function(panel) {
    this._initializeUI();
};

/**
 *
 */
ResetHistoryWidget.prototype.dispose = function() {
    this._uiContext.dispose();
    this._uiContext = null;
    this._div = null;
    this._settings = null;
};

    // end define
    return ResetHistoryWidget;
});
