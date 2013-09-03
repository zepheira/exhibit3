/**
 * @fileOverview Slider UI facet for numeric ranges
 * @author SkyeWM
 * @author Qing Lyne Gao
 * @author David Huynh
 * @author Karan Sagar
 * @author David Karger
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../../exhibit-core",
    "../../util/localizer",
    "../../util/debug",
    "../../util/set",
    "../../util/settings",
    "../../util/facets",
    "../../util/history",
    "../../util/histogram",
    "../../data/database/range-index",
    "../../data/expression-parser",
    "../ui-context",
    "./facet",
    "lib/jquery.nouislider"
], function($, Exhibit, _, Debug, Set, SettingsUtilities, FacetUtilities, EHistory, Histogram, RangeIndex, ExpressionParser, UIContext, Facet) {
    var SliderFacet = function(containerElmt, uiContext) {
        var self = this;
        $.extend(
            this,
            new Facet("slider", containerElmt, uiContext)
        );
        this.addSettingSpecs(SliderFacet._settingSpecs);

        this._showMissing = null;
        this._histogram = null;
        this._slider = null;
        this._dom = null;
        this._cache = null;
        this._rangeIndex = null;

        // currently selected range
        this._range = {
            "min": null,
            "max": null
        };
        // total range of slider
        this._maxRange = {
            "min": null,
            "max": null
        };

        this._onRootItemsChanged = function() {
            if (typeof self._rangeIndex !== "undefined") {
                delete self._rangeIndex;
            }
        };
        $(uiContext.getCollection().getElement()).bind(
            "onRootItemsChanged.exhibit",
            this._onRootItemsChanged
        );
    };
    
    SliderFacet._settingSpecs = {
        "precision": { "type": "float", "defaultValue": 1 },
        "histogram": { "type": "boolean", "defaultValue": true },
        "height": { "type": "int", "defaultValue": 14 },
        "width": { "type": "int", "defaultValue": 150 },
        "horizontal": { "type": "boolean", "defaultValue": true },
        "inputText": { "type": "boolean", "defaultValue": true  },
        "showMissing": { "type": "boolean", "defaultValue": true },
        "selection": { "type": "float", "dimensions": 2 }
    };
    
    /**
     * @static
     * @param {Object} configuration
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.SliderFacet}
     */
    SliderFacet.create = function(configuration, containerElmt, uiContext) {
        var facet, thisUIContext;
        thisUIContext = UIContext.create(configuration, uiContext);
        facet = new SliderFacet(containerElmt, uiContext);
        
        SliderFacet._configure(facet, configuration);
        
        facet._initializeUI();
        thisUIContext.getCollection().addFacet(facet);
        
        return facet;
    };
    
    /**
     * @static
     * @param {Element} configElmt
     * @param {Element} containerElmt
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.SliderFacet}
     */
    SliderFacet.createFromDOM = function(configElmt, containerElmt, uiContext) {
        var configuration, thisUIContext, facet, expressionString, selection, showMissing, i;
        configuration = Exhibit.getConfigurationFromDOM(configElmt);
        thisUIContext = UIContext.createFromDOM(configElmt, uiContext);
        facet = new SliderFacet(
	        (typeof containerElmt !== "undefined" && containerElmt !== null) ?
                containerElmt : configElmt,
	        thisUIContext
        );
	    
        SettingsUtilities.collectSettingsFromDOM(configElmt, facet.getSettingSpecs(), facet._settings);
        
        try {
            expressionString = Exhibit.getAttribute(configElmt, "expression");
            if (typeof expressionString !== "undefined" && expressionString !== null && expressionString.length > 0) {
                facet.setExpression(ExpressionParser.parse(expressionString));
                facet.setExpressionString(expressionString);
            }
            
            showMissing = Exhibit.getAttribute(configElmt, "showMissing");
            
            if (showMissing !== null && showMissing.length > 0) {
                facet._showMissing = (showMissing === "true");
            } else {
                facet._showMissing = true;
            }
            
            if (typeof facet._settings.selection !== "undefined") {
                selection = facet._settings.selection;
                facet._range = {
                    "min": selection[0],
                    "max": selection[1]
                };
            }
        } catch (e) {
            Debug.exception(e, _("%facets.error.configuration", "SliderFacet"));
        }
	    
        SliderFacet._configure(facet, configuration);
        facet._initializeUI();
        thisUIContext.getCollection().addFacet(facet);
        facet.register();
        
        return facet;
    };
    
    /**
     * @static
     * @private
     * @param {Exhibit.SliderFacet} facet
     * @param {Object} configuration
     */
    SliderFacet._configure = function(facet, configuration) {
        var selection, i, segment, property;
        SettingsUtilities.collectSettings(configuration, facet.getSettingSpecs(), facet._settings);

        if (typeof configuration.expression !== "undefined") {
            facet.setExpressionString(configuration.expression);
            facet.setExpression(ExpressionParser.parse(configuration.expression));
        }
        if (typeof configuration.selection !== "undefined") {
            selection = configuration.selection;
            facet._range = {
                "min": selection[0],
                "max": selection[1]
            };
        }
        
        if (typeof configuration.showMissing !== "undefined") {
 		    facet._showMissing = configuration.showMissing;
        }
	    
        if (typeof facet._settings.facetLabel === "undefined") {
		    if (facet.getExpression() !== null && facet.getExpression().isPath()) {
		        segment = facet.getExpression().getPath().getLastSegment();
		        property = facet.getUIContext().getDatabase().getProperty(segment.property);
		        if (typeof property !== "undefined" && property !== null) {
				    facet._settings.facetLabel = segment.forward ? property.getLabel() : property.getReverseLabel();
		        }
		    }
		}
	    
        facet._maxRange = facet._getMaxRange();

        facet._cache = new FacetUtilities.Cache(
            facet.getUIContext().getDatabase(),
            facet.getUIContext().getCollection(),
            facet.getExpression()
        );
    };

    /**
     *
     */
    SliderFacet.prototype.dispose = function() {
        $(this.getUIContext().getCollection().getElement()).unbind(
            "onRootItemsChanged.exhibit",
            this._onRootItemsChanged
        );

        this._cache.dispose();
        this._cache = null;
        this._slider = null;
        this._dom = null;
        this._settings = null;
        this._range = null;
        this._maxRange = null;
        this._rangeIndex = null;
    };

    /**
     *
     */
    SliderFacet.prototype._initializeUI = function() {
        var self, onSlide, label;
        self = this;
        
        this._dom = $.simileDOM(
            "string",
            this.getContainer(),
            '<div class="exhibit-facet-header">' +
                '<span class="exhibit-facet-header-title">' + this._settings.facetLabel + '</span>' +
                '</div>' +
                (self._settings.histogram ? 
                 '<div class="exhibit-slider-histogram" id="histogram"></div>' : '') +
                '<form id="sliderForm">'+
                '<div class="exhibit-slider noUiSlider" id="slider"></div>' +
                '<div class="exhibit-slider-display">' +
                '<input type="text" id="minDisplay"></input> - <input type="text" id="maxDisplay"></input>' + 
                '</div>' +
                '</form>'
        );

        if (!self._settings.inputText) {
            $(self._dom.minDisplay).prop("disabled", "disabled");
            $(self._dom.maxDisplay).prop("disabled", "disabled");
        }

        this._slider = $(this._dom.slider)
            .css({
                "width": this._settings.width
            })
            .noUiSlider({
                "range": [self._maxRange.min, self._maxRange.max],
                "start": [self._maxRange.min, self._maxRange.max],
                "handles": 2,
                "connect": true,
                "orientation": self._settings.horizontal ? "horizontal" : "vertical",
                "serialization": {
                    "resolution": self._settings.precision,
                    "to": [self._dom.minDisplay, self._dom.maxDisplay]
                }
            });

        onSlide = function(evt) {
            var values = $(self._slider).val();
            label = _("%facets.numeric.rangeWords", values[0], values[1]);
            EHistory.pushComponentState(
                self,
                Facet.getRegistryKey(),
                {"range": {"min": values[0], "max": values[1]}},
                _("%facets.facetSelectOnlyActionTitle", label, self.getLabel()),
                true
            );
        };

        $(self._dom.sliderForm).on("change", onSlide);

        this._histogram = Histogram.create(this._dom.histogram, this._settings.width, this._settings.height);

        // @@@ make vertical work
    };
    
    /**
     * @returns {Boolean}
     */
    SliderFacet.prototype.hasRestrictions = function() {
        return (this._range.min !== null && this._range.min !== this._maxRange.min) || (this._range.max !== null && this._range.max !== this._maxRange.max);
    };
    
    /**
     * @param {} items
     */
    SliderFacet.prototype.update = function(items) {
        var data, n, range, missingCount, database, path, i, rangeIndex;
        if (this._settings.histogram) {
		    data = [];
            // number of bars on histogram
		    n = 75;
            // range represented by each bar
		    range = (this._maxRange.max - this._maxRange.min) / n;
	        missingCount = 0;
		    database = this.getUIContext().getDatabase();
	        
	        if (this._showMissing) {
	            missingCount = this._cache.getItemsMissingValue(items).size();
	        }
	        if (this.getExpression().isPath()) {
		        path = this.getExpression().getPath();
			
			    for (i = 0; i < n; i++) {
			        data[i] = path.rangeBackward(this._maxRange.min+i*range, this._maxRange.min+(i+1)*range, false, items,database).values.size()+missingCount;
				}
		    } else {
		        this._buildRangeIndex();
		        rangeIndex = this._rangeIndex;
		        
		        for (i = 0; i < n; i++){ 
		            data[i] = rangeIndex.getSubjectsInRange(this._maxRange.min+i*range, this._maxRange.min+(i+1)*range, false, null, items).size()+missingCount;
			    }
		    }
		    Histogram.update(data, this._histogram, this._settings.horizontal);
        }
        this._slider.val([this._range.min, this._range.max]);
    };

    /**
     * @param {Exhibit.Set} items
     * @returns {Exhibit.Set}
     */
    SliderFacet.prototype.restrict = function(items) {
        var set, path, database;
        
        if (!this.hasRestrictions()) {
	        return items;
        }
        
        set = new Set();
        if (this.getExpression().isPath()) {
		    path = this.getExpression().getPath();
    	    database = this.getUIContext().getDatabase();
    	    set = path.rangeBackward(this._range.min, this._range.max, false, items, database).values;
		} else {
		    this._buildRangeIndex();
		    set = this._rangeIndex.getSubjectsInRange(this._range.min, this._range.max, false, null, items);
	    }
	    
	    if (this._showMissing) {
            this._cache.getItemsMissingValue(items, set);
        }
        
        return set;
    };

    /**
     *
     */
    SliderFacet.prototype._getMaxRange = function() {
        var path, database, propertyID, property, rangeIndex;
	    if (this.getExpression().getPath()) {
	        path = this.getExpression().getPath();
	        database = this.getUIContext().getDatabase();
	        propertyID = path.getLastSegment().property;
	        property = database.getProperty(propertyID);
	        rangeIndex = property.getRangeIndex();
	    } else {
	  	    this._buildRangeIndex();
		    rangeIndex = this._rangeIndex;	
	    }

        return {
            "min": rangeIndex.getMin(),
            "max": rangeIndex.getMax()
        };
    };

    /**
     *
     */
    SliderFacet.prototype._buildRangeIndex = function() {
        var expression, database, getter;
        if (this._rangeIndex === null) {
            expression = this.getExpression();
            database = this.getUIContext().getDatabase();
            getter = function(item, f) {
                expression.evaluateOnItem(item, database).values.visit(function(value) {
                    if (typeof value !== "number") {
                        value = parseFloat(value);
                    }
                    if (!isNaN(value)) {
                        f(value);
                    }
                });
            };
            this._rangeIndex = new Database._RangeIndex(
                this.getUIContext().getCollection().getAllItems(),
                getter
            );
        }
    };

    /**
     * @param {Object} range
     * @param {Number} range.min
     * @param {Number} range.max
     */
    SliderFacet.prototype.applyRestrictions = function(range) {
        this._range = range;
        this._notifyCollection();
    };

    /**
     *
     */
    SliderFacet.prototype._notifyCollection = function() {
        this.getUIContext().getCollection().onFacetUpdated(this);
    };

    /**
     *
     */
    SliderFacet.prototype.clearAllRestrictions = function() {
        this._slider.val([this._maxRange.min, this._maxRange.max]);
        this._range = this._maxRange;
        this._notifyCollection();
    };

    /**
     *
     */
    SliderFacet.prototype.exportEmptyState = function() {
        return this._exportState(true);
    };

    /**
     *
     */
    SliderFacet.prototype.exportState = function() {
        return this._exportState(false);
    };

    /**
     * @param {Boolean} empty
     * @returns {Object}
     */
    SliderFacet.prototype._exportState = function(empty) {
        var r = {
            "min": null,
            "max": null
        };
        
        if (!empty) {
            r = this._range;
        }

        return {
            "range": r
        };
    };

    /**
     * @param {Object} state
     * @param {Object} state.range
     */
    SliderFacet.prototype.importState = function(state) {
        if (this.stateDiffers(state)) {
            if (state.range.min === null) {
                this.clearAllRestrictions();
            } else {
                this.applyRestrictions(state.range);
            }
        }
    };

    /**
     * @param {Object} state
     * @param {Object} state.range
     */
    SliderFacet.prototype.stateDiffers = function(state) {
        if ((state.range.min === null && this._range.min !== null) || (state.range.min !== null && this._range.min === null)) {
            return true;
        } else if (state.range.min !== null && this._range.min !== null) {
            if (state.range.min !== this._range.min || state.range.max !== this._range.max) {
                return true;
            }
        }

        return false;
    };

    return SliderFacet;
});
