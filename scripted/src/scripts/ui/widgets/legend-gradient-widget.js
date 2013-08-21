/**
 * @fileOverview Legend gradient widget.
 * @author Nina Guo
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "lib/jquery.simile.dom"
], function($) {
/**
 * @constructor
 * @class
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 */
var LegendGradientWidget = function(containerElmt, uiContext) {
    this._div = containerElmt;
    this._uiContext = uiContext;

    this._row1 = null;
    this._row2 = null;
    this._row3 = null;
    
    this._initializeUI();
};

/**
 * @static
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.LegendGradientWidget}
 */
LegendGradientWidget.create = function (containerElmt, uiContext) {
    return new LegendGradientWidget(containerElmt, uiContext);
};

/**
 * @private
 * @param {Object} point
 * @param {Number} point.red
 * @param {Number} point.green
 * @param {Number} point.blue
 * @returns {String}
 */
LegendGradientWidget.prototype._makeRGB = function(point) {
    return "rgb("
        + point.red + ","
        + point.green + ","
        + point.blue + ")";
};

/**
 * Elements in the array are objects with a red, green, blue, and value
 * property.  This should really have a class or classes to deal with it
 * instead of building it into one monolithic method.
 *
 * @param {Array} configuration
 */
LegendGradientWidget.prototype.addGradient = function(configuration) {
    var row1, row2, row3, sortObj, stepSize, counter, i, j, fraction, makeMouseoverHandler, makeMouseoutHandler;
    if (configuration.length < 2) {
        return;
    }

    sortObj = function(a, b) {
        return a.value - b.value;
    };

    row1 = this._row1;
    row2 = this._row2;
    row3 = this._row3;

    configuration.sort(sortObj);
    
    stepSize = (configuration[configuration.length - 1].value - configuration[0].value) / 50;
    counter = 0;

    makeMouseoverHandler = function(el, changeData) {
        return function(evt) {
            if (changeData) {
                $(row1).find("td").filter(function(i, e) {
                    return $(e).data("count") === $(el).data("count");
                })
                    .css("visibility", "visible")
                    .css("overflow", "visible");
            }
            $(el).css("border", "1.2px solid");
        };
    };

    makeMouseoutHandler = function(el, changeData) {
        return function(evt) {
            if (changeData) {
                $(row1).find("td").filter(function(i, e) {
                    return $(e).data("count") === $(el).data("count");
                })
                    .css("visibility", "hidden")
                    .css("overflow", "hidden");
            }
            $(el).css("border", "none");
        };
    };
    
    for (i = 0; i < configuration.length; i++) {
        $("<td>").appendTo(row1);

        $("<td>")
            .css("background-color", this._makeRGB(configuration[i]))
            .bind("mouseover", makeMouseoverHandler(this, false))
            .bind("mouseout", makeMouseoutHandler(this, false))
            .appendTo(row2);

        $("<td><div>" + configuration[i].value + "</div></td>")
            .appendTo(row3);
         
        for (j = configuration[i].value + stepSize;
             i < configuration.length - 1 && j < configuration[i+1].value;
             j += stepSize) {
            fraction = (j - configuration[i].value) / (configuration[i+1].value - configuration[i].value);

            $("<td>")
                .data("count", counter)
                .css("visibility", "hidden")
                .css("overflow", "hidden")
                .append($("<div>")
                        .append(Math.floor(j * 100) / 100)
                        .width(2))
                .appendTo(row1);

            $("<td>")
                .data("count", counter)
                .css("background-color",
                     this._makeRGB({
                         "red": Math.floor(configuration[i].red + fraction * (configuration[i+1].red - configuration[i].red)),
                         "green": Math.floor(configuration[i].green + fraction*(configuration[i+1].green - configuration[i].green)),
                         "blue": Math.floor(configuration[i].blue + fraction*(configuration[i+1].blue - configuration[i].blue))
                     }))
                .bind("mouseover", makeMouseoverHandler(this, true))
                .bind("mouseout", makeMouseoutHandler(this, true))
                .appendTo(row2);

            $("<td>").appendTo(row3);

            counter++;
        }
    }
};

/**
 * @param {String} color
 * @param {String} label
 */
LegendGradientWidget.prototype.addEntry = function(color, label) {
    $("<td>")
        .width("1.5em")
        .height("2em")
        .appendTo(this._row1);
    
    $("<td>").appendTo(this._row1);
    $("<td>").appendTo(this._row2);
    $("<td>").appendTo(this._row3);

    $("<td>")
        .css("background-color", color)
        .appendTo(this._row2);

    $("<td>")
        .append("<div>" + label + "</div>")
        .appendTo(this._row3);
};

/**
 * @param {String} label
 * @param {String} type
 */
LegendGradientWidget.prototype.addLegendLabel = function(label) {
    var dom;
	dom = $.simileDOM("string",
			"div",
			'<div class="legend-label">' +
				'<span class="label" class="exhibit-legendWidget-entry-title">' + 
					label.replace(/\s+/g, "&nbsp;") + 
				"</span>" +
			"&nbsp;&nbsp; </div>",
			{ }
		);
	$(dom.elmt).attr("class","exhibit-legendWidget-label");
	$(this._div).prepend(dom.elmt);
};

/**
 *
 */
LegendGradientWidget.prototype.dispose = function() {
    this.clear();
    
    this._div = null;
    this._uiContext = null;
};

/**
 *
 */
LegendGradientWidget.prototype._initializeUI = function() {
    var table, tbody, row1, row2, row3;

    this.clear();
    $(this._div).attr("class", "exhibit-legendGradientWidget");

    table = $("<table>")
        .width("80%")
        .css("margin-left", "auto")
        .css("margin-right", "auto")
        .css("empty-cells", "show")
        .attr("cellspacing", 0);
    
    tbody = $("<tbody>")
        .appendTo(table);
    
    row1 = $("<tr>")
        .height("2em")
        .appendTo(tbody);
    
    row2 = $("<tr>")
        .height("2em")
        .appendTo(tbody);
    
    row3 = $("<tr>")
        .height("2em")
        .appendTo(tbody);
    
    this._row1 = row1;
    this._row2 = row2;
    this._row3 = row3; 

    $(this._div).append(table);
};

/**
 *
 */
LegendGradientWidget.prototype.clear = function() {
    $(this._div).empty();
    this._row1 = null;
    this._row2 = null;
    this._row3 = null;
};

/**
 *
 */
LegendGradientWidget.prototype.reconstruct = function() {
    $(this._div).empty();
    this._initializeUI();
};

    // end define
    return LegendGradientWidget;
});
