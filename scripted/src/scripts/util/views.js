/**
 * @fileOverview View helper functions and utilities.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "./localizer",
    "../ui/widgets/collection-summary-widget",
    "../ui/widgets/resizable-div-widget",
    "../ui/widgets/legend-widget",
    "../ui/widgets/legend-gradient-widget"
], function($, _, CollectionSummaryWidget, ResizableDivWidget, LegendWidget, LegendGradientWidget) {
/**
 * @namespace
 */
var ViewUtilities = {};

    /**
     * @static
     * @param {Number} x
     * @param {Number} y
     * @param {Array} arrayOfItemIDs
     * @param {Exhibit.UIContext} uiContext
     */
    ViewUtilities.openBubbleForItemsAtPoint = function(x, y, arrayOfItemIDs, uiContext) {
        var bubble;
        bubble = $.simileBubble(
            "createBubbleForPoint",
            x,
            y,
            uiContext.getSetting("bubbleWidth"), // px
            uiContext.getSetting("bubbleHeight") // px
        );
        ViewUtilities.fillBubbleWithItems(bubble.content, arrayOfItemIDs, null, uiContext);
    };

    /**
     * @static
     * @param {Element} anchorElmt
     * @param {Array} arrayOfItemIDs
     * @param {Exhibit.UIContext} uiContext
     */
    ViewUtilities.openBubbleForItems = function(anchorElmt, arrayOfItemIDs, uiContext) {
        var coords;
        coords = $(anchorElmt).offset();
        ViewUtilities.openBubbleForItemsAtPoint(
            coords.left + Math.round(anchorElmt.offsetWidth / 2),
            coords.top + Math.round(anchorElmt.offsetHeight / 2),
            arrayOfItemIDs,
            uiContext
        );
    };

/**
 * @@@ possibly take and return jQuery instead of elements
 * @static
 * @param {Element} bubbleElmt
 * @param {Array} arrayOfItemIDs
 * @param {Exhibit.Expression._Impl} labelExpression
 * @param {Exhibit.UIContext} uiContext
 * @returns {Element}
 */
ViewUtilities.fillBubbleWithItems = function(bubbleElmt, arrayOfItemIDs, labelExpression, uiContext) {
    var ul, i, makeItem, itemLensDiv, itemLens;
    if (typeof bubbleElmt === "undefined" || bubbleElmt === null) {
        bubbleElmt = $("<div>");
    }
    
    if (arrayOfItemIDs.length > 1) {
        $(bubbleElmt).addClass("exhibit-views-bubbleWithItems");
        
        ul = $("<ul>");
        makeItem = function(elmt) {
            $("<li>")
                .append(elmt)
                .appendTo(ul);
        };
        if (typeof labelExpression !== "undefined" && labelExpression !== null) {
            uiContext.putSetting("format/item/title", labelExpression);
        }
        for (i = 0; i < arrayOfItemIDs.length; i++) {
            uiContext.format(arrayOfItemIDs[i], "item", makeItem);
        }
        $(bubbleElmt).append(ul);
    } else {
        itemLensDiv = $("<div>").get(0);
        itemLens = uiContext.getLensRegistry().createLens(arrayOfItemIDs[0], itemLensDiv, uiContext);
        $(bubbleElmt).append(itemLensDiv);
    }
    
    return $(bubbleElmt).get(0);
};

/**
 * @static
 * @param {Element} div
 * @param {Exhibit.UIContext} uiContext
 * @param {Boolean} showSummary
 * @param {Object} resizableDivWidgetSettings
 * @param {Object} legendWidgetSettings
 * @returns {Object}
 */
ViewUtilities.constructPlottingViewDom = function(
    div,
    uiContext, 
    showSummary,
    resizableDivWidgetSettings, 
    legendWidgetSettings
) { 
    var dom = $.simileDOM("string",
        div,
        '<div class="exhibit-views-header">' +
            (showSummary ? '<div id="collectionSummaryDiv"></div>' : "") +
            '<div id="unplottableMessageDiv" class="exhibit-views-unplottableMessage"></div>' +
        "</div>" +
        '<div id="resizableDiv"></div>' +
        '<div id="legendDiv"></div>',
        {}
    );
    
    if (showSummary) {
        dom.collectionSummaryWidget = CollectionSummaryWidget.create(
            {}, 
            dom.collectionSummaryDiv, 
            uiContext
        );
    }
    
    dom.resizableDivWidget = ResizableDivWidget.create(
        resizableDivWidgetSettings,
        dom.resizableDiv, 
        uiContext
    );
    dom.plotContainer = dom.resizableDivWidget.getContentDiv();
    
    dom.legendWidget = LegendWidget.create(
        legendWidgetSettings,
        dom.legendDiv, 
        uiContext
    );

    if (legendWidgetSettings.colorGradient === true) {
        dom.legendGradientWidget = LegendGradientWidget.create(
            dom.legendDiv,
            uiContext
        );
    }
    
    dom.setUnplottableMessage = function(totalCount, unplottableItems) {
        ViewUtilities._setUnplottableMessage(dom, totalCount, unplottableItems, uiContext);
    };
    dom.dispose = function() {
        if (showSummary) {
            dom.collectionSummaryWidget.dispose();
        }
        dom.resizableDivWidget.dispose();
        dom.legendWidget.dispose();
    };

    return dom;
};

/**
 * @static
 * @param {Object} dom
 * @param {Number} totalCount
 * @param {Array} unplottableItems
 * @param {Exhibit.UIContext} uiContext
 */
ViewUtilities._setUnplottableMessage = function(dom, totalCount, unplottableItems, uiContext) {
    var div;
    div = dom.unplottableMessageDiv;
    if (unplottableItems.length === 0) {
        $(div).hide();
    } else {
        $(div).empty();
    
        dom = $.simileDOM("string",
            div,
            ViewUtilities.unplottableMessageFormatter(totalCount, unplottableItems),
            {}
        );
        $(dom.unplottableCountLink).bind("click", function(evt) {
            ViewUtilities.openBubbleForItems(evt.target, unplottableItems, uiContext);
        });
        $(div).show();
    }
};

/**
 * @param {Number} totalCount
 * @param {Array} unplottableItems
 */
ViewUtilities.unplottableMessageFormatter = function(totalCount, unplottableItems) {
    var count = unplottableItems.length;
    return _("%views.unplottableTemplate", count, _(count === 1 ? "%views.resultLabel" : "%views.resultsLabel"), totalCount);
};

/**
 * Return labels for sort ordering based on value type; "text" is the base
 * case that is assumed to always exist in the localization utiltiies.
 * @param {String} valueType
 * @returns {Object} An object of the form { "ascending": label,
 *      "descending": label}
 */
ViewUtilities.getSortLabels = function(valueType) {
    var asc, desc, labels, makeKey;
    makeKey = function(v, dir) {
        return "%database.sortLabels." + v + "." + dir;
    };
    asc = _(makeKey(valueType, "ascending"));
    if (typeof asc !== "undefined" && asc !== null) {
        labels = {
            "ascending": asc,
            "descending": _(makeKey(valueType, "descending"))
        };
    } else {
        labels = ViewUtilities.getSortLabels("text");
    }
    return labels;
};

/**
 * @param {Number} index
 * @returns {String}
 */
ViewUtilities.makePagingActionTitle = function(index) {
    return _("%orderedViewFrame.pagingActionTitle", index + 1);
};

/**
 * @param {Number} index
 * @returns {String}
 */
ViewUtilities.makePagingLinkTooltip = function(index) {
    return _("%orderedViewFrame.pagingLinkTooltip", index + 1);
};

    // end define
    return ViewUtilities;
});
