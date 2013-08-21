/**
 * @fileOverview Provide an easy way to attach classifications to a
 *     view with a legend widget.
 * @author David Huynh
 * @author Johan Sundström
 * @author Margaret Leibovic
 * @author David Karger
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "lib/jquery.simile.dom"
], function($) {
/**
 * @constructor
 * @class
 * @param {Object} configuration
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 */
var LegendWidget = function(configuration, containerElmt, uiContext) {
    this._configuration = configuration;
    this._div = containerElmt;
    this._uiContext = uiContext;
    
    this._colorMarkerGenerator = typeof configuration.colorMarkerGenerator !== "undefined" ?
        configuration.colorMarkerGenerator :
        LegendWidget._defaultColorMarkerGenerator;	 
	this._sizeMarkerGenerator = typeof configuration.sizeMarkerGenerator !== "undefined" ?
		configuration.sizeMarkerGenerator :
		LegendWidget._defaultSizeMarkerGenerator;
	this._iconMarkerGenerator = typeof configuration.iconMarkerGenerator !== "undefined" ?
		configuration.iconMarkerGenerator :
		LegendWidget._defaultIconMarkerGenerator;

    this._labelStyler = typeof configuration.labelStyler !== "undefined" ?
        configuration.labelStyler :
        LegendWidget._defaultColorLabelStyler;
    
    this._initializeUI();
};

/**
 * @static
 * @param {Object} configuration
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.LegendWidget}
 */
LegendWidget.create = function(configuration, containerElmt, uiContext) {
    return new LegendWidget(configuration, containerElmt, uiContext);
};

/**
 *
 */
LegendWidget.prototype.dispose = function() {
    $(this._div).empty();
    
    this._div = null;
    this._uiContext = null;
};

/**
 *
 */
LegendWidget.prototype._initializeUI = function() {
    $(this._div).attr("class", "exhibit-legendWidget");
    this.clear();
};

/**
 *
 */
LegendWidget.prototype.clear = function() {
    $(this._div).html('<div class="exhibit-color-legend"></div><div class="exhibit-size-legend"></div><div class="exhibit-icon-legend"></div>');
};

/**
 * @param {String} label
 * @param {String} type
 */
LegendWidget.prototype.addLegendLabel = function(label, type) {
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
	$('.exhibit-' + type + '-legend', this._div).append(dom.elmt);
};

/**
 * @param {} value
 * @param {String} label
 * @param {String} type
 */
LegendWidget.prototype.addEntry = function(value, label, type) {
    var dom, legendDiv;

	type = type || "color";
    label = (typeof label !== "string") ? label.toString() : label;
    legendDiv = $('.exhibit-' + type + '-legend', this._div);

    if (type === "color") {
		dom = $.simileDOM("string",
			"span",
			'<span id="marker"></span>&nbsp;' +
				'<span id="label" class="exhibit-legendWidget-entry-title">' + 
					label.replace(/\s+/g, "&nbsp;") + 
				"</span>" +
				"&nbsp;&nbsp; ",
			{ marker: this._colorMarkerGenerator(value) }
		);
	}

	if (type === "size") {
		dom = $.simileDOM("string",
			"span",
			'<span id="marker"></span>&nbsp;' +
				'<span id="label" class="exhibit-legendWidget-entry-title">' + 
					label.replace(/\s+/g, "&nbsp;") + 
				"</span>" +
				"&nbsp;&nbsp; ",
			{ marker: this._sizeMarkerGenerator(value) }
		);
	}

	if (type === "icon") {
		dom = $.simileDOM("string",
			"span",
			'<span id="marker"></span>&nbsp;' +
				'<span id="label" class="exhibit-legendWidget-entry-title">' + 
					label.replace(/\s+/g, "&nbsp;") + 
				"</span>" +
				"&nbsp; ",
			{ marker: this._iconMarkerGenerator(value) }
		);
	}
    $(dom.elmt).attr("class", "exhibit-legendWidget-entry");
    this._labelStyler(dom.label, value);
    $(legendDiv).append(dom.elmt);
};

/**
 * @static
 * @private
 * @param {} a
 * @param {} b
 * @returns {Number}
 */
LegendWidget._localeSort = function(a, b) {
    return a.localeCompare(b);
};

/**
 * @static
 * @private
 * @param {String} value
 * @returns {Element}
 */
LegendWidget._defaultColorMarkerGenerator = function(value) {
    var span;
    span = $("<span>")
        .attr("class", "exhibit-legendWidget-entry-swatch")
        .css("background", value)
        .html("&nbsp;&nbsp;");
    return span.get(0);
};

/** 
 * @static
 * @private
 * @param {Number} value
 * @returns {Element}
 */
LegendWidget._defaultSizeMarkerGenerator = function(value) {
    var span;
    span = $("<span>")
        .attr("class", "exhibit-legendWidget-entry-swatch")
        .height(value)
        .width(value)
        .css("background", "#C0C0C0")
        .html("&nbsp;&nbsp;");
    return span.get(0);
};

/**
 * @static
 * @private
 * @param {String} value
 * @returns {Element}
 */
LegendWidget._defaultIconMarkerGenerator = function(value) {
    var span;
    span = $("<span>")
        .append('<img src="'+value+'"/>');
    return span.get(0);
};

/**
 * @static
 * @private
 * @param {Element} elmt
 * @param {String} value
 */
LegendWidget._defaultColorLabelStyler = function(elmt, value) {
    // $(elmt).css("color", "#" + value);
};

    // end define
    return LegendWidget;
});
