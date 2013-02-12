/**
 * @fileOverview Widget for acquiring permalink to state of Exhibit.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

// @@@ integrate bit.ly or some other url shortener?

define([
    "lib/jquery",
    "exhibit",
    "util/localizer",
    "util/bookmark",
    "util/ui",
    "ui/ui-context"
], function($, Exhibit, _, Bookmark, UIUtilities, UIContext) {
/**
 * @class
 * @constructor
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 */
var BookmarkWidget = function(elmt, uiContext) {
    this._uiContext = uiContext;
    this._div = elmt;
    this._settings = {};
    this._controlPanel = null;
    this._popup = null;
};

/**
 * @static
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.BookmarkWidget}
 */
BookmarkWidget.create = function(configuration, elmt, uiContext) {
    var widget = new BookmarkWidget(
        elmt,
        UIContext.create(configuration, uiContext)
    );
    BookmarkWidget._configure(widget, configuration);
    widget._initializeUI();
    return widget;
};

/**
 * @static
 * @param {Element} configElmt
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.BookmarkWidget}
 */
BookmarkWidget.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration, widget;
    configuration = Exhibit.getConfigurationFromDOM(configElmt);
    widget = new BookmarkWidget(
        (typeof containerElmt !== "undefined" && containerElmt !== null) ?
            containerElmt : configElmt,
        UIContext.createFromDOM(configElmt, uiContext)
    );
    BookmarkWidget._configure(widget, configuration);
    widget._initializeUI();
    return widget;
};

/**
 * @static
 * @private
 * @param {Exhibit.BookmarkWidget} widget
 * @param {Object} configuration
 */
BookmarkWidget._configure = function(widget, configuration) {
};

/**
 *
 */
BookmarkWidget.prototype._initializeUI = function() {
    var popup;
    popup = $("<div>")
        .attr("class", "exhibit-bookmarkWidget-popup");
    this._fillPopup(popup);
    $(this.getContainer()).append(popup);
    this._popup = popup;
};

/**
 * @public
 * @param {Exhibit.ControlPanel} panel
 */
BookmarkWidget.prototype.reconstruct = function(panel) {
    this._popup = null;
    this._initializeUI();
};

/**
 * @param {jQuery} popup
 */
BookmarkWidget.prototype._fillPopup = function(popup) {
    var self, img;

    self = this;
    img = UIUtilities.createTranslucentImage("images/bookmark-icon.png");
    $(img)
        .attr("class", "exhibit-bookmarkWidget-button")
        .attr("title", _("%widget.bookmark.tooltip"))
        .bind("click", function(evt) {
            self._showBookmark(img, evt);
        })
        .appendTo(popup);
};

/**
 * @param {jQuery} elmt
 * @param {jQuery.Event} evt
 */
BookmarkWidget.prototype._showBookmark = function(elmt, evt) {
    var self, popupDom, el;
    self = this;
    self._controlPanel.childOpened();
    popupDom = UIUtilities.createPopupMenuDom(elmt);
    el = $('<input type="text" />').
        attr("value", Bookmark.generateBookmark()).
        attr("size", 40);
    $(popupDom.elmt).append($(el));
    $(popupDom.elmt).one("closed.exhibit", function(evt) {
        self.dismiss();
    });
    popupDom.open(evt);
    $(el).get(0).select();
};

/**
 * @returns {jQuery}
 */
BookmarkWidget.prototype.getContainer = function() {
    return $(this._div);
};

/**
 *
 */
BookmarkWidget.prototype.dispose = function() {
    this._uiContext.dispose();
    this._uiContext = null;
    this._div = null;
    this._settings = null;
};

/**
 * @param {Exhibit.ControlPanel} panel
 */
BookmarkWidget.prototype.setControlPanel = function(panel) {
    this._controlPanel = panel;
};

/**
 *
 */
BookmarkWidget.prototype.dismiss = function() {
    this._controlPanel.childClosed();
};

    // end define
    return BookmarkWidget;
});
