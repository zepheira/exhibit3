/**
 * @fileOverview General utilities for Flot-based views.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "scripts/util/views",
    "../lib/jquery.flot.resize"
], function($, ViewUtilities) {
    var FlotUtilities = {};

    /**
     * @param {Exhibit.View} view
     * @param {String} viewClass
     */
    FlotUtilities.makeTooltipID = function(view, viewClass) {
        return "exhibit-" + view.getID() + "-" + viewClass + "-tooltip";
    };

    /**
     * @static
     * @param {Number} x
     * @param {Number} y
     * @param {String} id
     * @param {Array} args An array of arguments to supply to formatter.
     * @param {Function} formatter A function that takes the args array and
     *     is aware of how to turn them into the correct string.
     */
    FlotUtilities.showTooltip = function(x, y, id, args, formatter) {
        $('<div id="' + id + '"></div>')
            .addClass("exhibit-flotView-tooltip")
            .css({
                "top": y + 5,
                "left": x + 5,
            })
            .html(formatter(args))
            .appendTo("body");
    };

    /**
     * @static
     * @param {Number} x
     * @param {Number} y
     * @param {String} id
     */
    FlotUtilities.moveTooltip = function(x, y, id) {
        $("#" + id).css({
            "top": y + 5,
            "left": x + 5
        });
    };

    /**
     * @static
     * @param {String} id
     */
    FlotUtilities.removeTooltip = function(id) {
        $("#" + id).remove();
    };

    /**
     * @param {Element} div
     * @param {Exhibit.View} view
     * @param {Function} makeArgs
     * @param {Function} tooltipFormatter
     */
    FlotUtilities.setupHover = function(div, view,  makeArgs, tooltipFormatter) {
        $(div).data("previous", -1);
        $(div).bind("plothover", function(evt, pos, obj) {
            var key;
            if (obj) {
                key = obj.seriesIndex + ":" + obj.dataIndex;
                if ($(div).data("previous") !== key) {
                    $(div).data("previous", key);
                    FlotUtilities.removeTooltip(view._tooltipID);
                    view._plot.unhighlight();
                    view._plot.highlight(obj.series, obj.datapoint);
                    FlotUtilities.showTooltip(pos.pageX, pos.pageY, view._tooltipID, makeArgs(obj), tooltipFormatter);
                } else {
                    FlotUtilities.moveTooltip(pos.pageX, pos.pageY, view._tooltipID);
                }
            } else {
                view._plot.unhighlight();
                FlotUtilities.removeTooltip(view._tooltipID);
                $(div).data("previous", -1); 
            }
        });
            
        $(div).bind("mouseout", function(evt) {
            view._plot.unhighlight();
            FlotUtilities.removeTooltip(view._tooltipID);
            $(div).data("previous", -1);
        });
    }

    /**
     * @param {Element} div
     * @param {Exhibit.View} view
     * @param {Function} itemsAccessor
     */
    FlotUtilities.setupClick = function(div, view, itemsAccessor) {
        $(div).bind("plotclick", function(evt, pos, obj) {
            if (obj !== null) {
                ViewUtilities.openBubbleForItemsAtPoint(pos.pageX, pos.pageY, itemsAccessor(obj), view.getUIContext());
            }
        });        
    };
    
    return FlotUtilities;
});
