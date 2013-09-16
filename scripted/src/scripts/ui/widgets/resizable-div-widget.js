/**
 * @fileOverview Resizable element widget
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery", "../../util/ui"], function($, UIUtilities) {
/**
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 */
var ResizableDivWidget = function(configuration, elmt, uiContext) {
    this._div = elmt;
    this._configuration = configuration;
    if (typeof configuration.minHeight === "undefined") {
        configuration.minHeight = 10; // pixels
    }
    this._dragging = false;
    this._height = null;
    this._origin = null;
    this._ondrag = null;
    
    this._initializeUI();
};

/**
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ResizableDivWidget}
 */
ResizableDivWidget.create = function(configuration, elmt, uiContext) {
    return new ResizableDivWidget(configuration, elmt, uiContext);
};

/**
 *
 */
ResizableDivWidget.prototype.dispose = function() {
    $(this._div).empty();
    this._contentDiv = null;
    this._resizerDiv = null;
    this._div = null;
};

/**
 * @returns {Element}
 */
ResizableDivWidget.prototype.getContentDiv = function() {
    return this._contentDiv;
};

/**
 *
 */
ResizableDivWidget.prototype._initializeUI = function() {
    var self = this;
    
    $(this._div).html(
        "<div></div>" +
        '<div class="exhibit-resizableDivWidget-resizer">' +
            UIUtilities.createTranslucentImageHTML("images/down-arrow.png") +
            "</div>");
        
    this._contentDiv = $(this._div).children().get(0);
    this._resizerDiv = $(this._div).children().get(1);

    $(this._resizerDiv).bind("mousedown", function(evt) {
        if (self._dragging) {
            return;
        }
        self._dragging = true;
        self._height = $(self._contentDiv).height();
        self._origin = { "x": evt.pageX, "y": evt.pageY };

        self._ondrag = function(evt2) {
            var height = self._height + evt2.pageY - self._origin.y;
            evt.preventDefault();
            evt.stopPropagation();
            $(self._contentDiv).height(Math.max(
                height,
                self._configuration.minHeight
            ));
        };
        $(document).bind("mousemove", self._ondrag);

        self._dragdone = function(evt2) {
            self._dragging = false;
            $(document).unbind("mousemove", self._ondrag);
            $(document).unbind("mouseup", self._dragdone);
            $(document).unbind("keyup", self._escapedone);
            if (typeof self._configuration.onResize === "function") {
                self._configuration.onResize();
            }
        };
        $(document).one("mouseup", self._dragdone);

        self._escapedone = function(evt2) {
            if (evt2.keyCode == 27) {
                self._dragdone(evt2);
            }
        };
        $(document).one("keyup", self._escapedone);
    });
};

    // end define
    return ResizableDivWidget;
});
