/**
 * @fileOverview View panel functions and UI.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "exhibit",
    "util/localizer",
    "util/debug",
    "util/history",
    "ui/ui",
    "ui/views/tile-view",
    "lib/jquery.simile.dom"
], function($, Exhibit, _, Debug, EHistory, UI, TileView) {
/**
 * @constructor
 * @class
 * @param {Element} div
 * @param {Exhibit.UIContext} uiContext
 */
var ViewPanel = function(div, uiContext) {
    this._uiContext = uiContext;
    this._div = div;
    this._uiContextCache = {};
    
    this._viewConstructors = [];
    this._viewConfigs = [];
    this._viewLabels = [];
    this._viewTooltips = [];
    this._viewDomConfigs = [];
    
    this._viewIndex = 0;
    this._view = null;

    this._registered = false;
};

/**
 * @private
 * @constant
 */
ViewPanel._registryKey = "viewPanel";

/**
 * @private
 * @param {jQuery.Event} evt
 * @param {Exhibit.Registry} reg
 */
ViewPanel._registerComponent = function(evt, reg) {
    if (!reg.hasRegistry(ViewPanel._registryKey)) {
        reg.createRegistry(ViewPanel._registryKey);
    }
};

/**
 * @param {Object} configuration
 * @param {Element} div
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ViewPanel}
 */
ViewPanel.create = function(configuration, div, uiContext) {
    var viewPanel, i, viewConfig, viewClass, label, tooltip, id, viewClassName;
    viewPanel = new ViewPanel(div, uiContext);
    
    if (typeof configuration.views !== "undefined") {
        for (i = 0; i < configuration.views.length; i++) {
            viewConfig = configuration.views[i];
            
            viewClass = (typeof view.viewClass !== "undefined") ?
                view.viewClass :
                TileView;
            if (typeof viewClass === "string") {
                viewClassName = viewClass;
                viewClass = UI.viewClassNameToViewClass(viewClass);
            }
            
            label = null;
            if (typeof viewConfig.viewLabel !== "undefined") {
                label = viewConfig.viewLabel;
            } else if (typeof viewConfig.label !== "undefined") {
                label = viewConfig.label;
            } else if (ViewPanel.getViewLabel(viewClassName) !== null) {
                label = ViewPanel.getViewLabel(viewClassName);
            } else if (typeof viewClassName !== "undefined") {
                label = viewClassName;
            } else {
                label = _("%viewPanel.noViewLabel");
            }
            
            // @@@ if viewClassName is null, Tile View will come up as the
            //     default in all cases but this one, where the tooltip used
            //     is just the view name again.  There were hacks here too
            //     eval()-like to be future proof.  To get tooltip and view to
            //     match in the default case is going to take some work.
            tooltip = null;
            if (typeof viewConfig.tooltip !== "undefined") {
                tooltip = viewConfig.tooltip;
            } else if (ViewPanel.getViewTooltip(viewClassName) !== null) {
                tooltip = ViewPanel.getViewTooltip(viewClassName);
            } else {
                tooltip = label;
            }
            
            viewPanel._viewConstructors.push(viewClass);
            viewPanel._viewConfigs.push(viewConfig);
            viewPanel._viewLabels.push(label);
            viewPanel._viewTooltips.push(tooltip);
            viewPanel._viewDomConfigs.push(null);
        }
    }
    
    if (typeof configuration.initialView !== "undefined") {
        viewPanel._viewIndex = configuration.initialView;
    }
    
    viewPanel._setIdentifier();
    viewPanel.register();
    viewPanel._internalValidate();
    viewPanel._initializeUI();
    
    return viewPanel;
};

/**
 * @param {Element} div
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ViewPanel}
 */
ViewPanel.createFromDOM = function(div, uiContext) {
    var viewPanel, role, viewClass, viewClassName, viewLabel, tooltip, label, id, initialView, n;
    viewPanel = new ViewPanel(div, uiContext.asParentFromDOM(div, false));
    
    $(div).children().each(function(index, elmt) {
        $(this).hide();
        role = Exhibit.getRoleAttribute(this);
        if (role === "view") {
            viewClass = TileView;
            viewClassName = Exhibit.getAttribute(this, "viewClass");
            if (typeof viewClassName !== "undefined" && viewClassName !== null && viewClassName.length > 0) {
                viewClass = UI.viewClassNameToViewClass(viewClassName);
                if (typeof viewClass === "undefined" || viewClass === null) {
                    Debug.warn(_("%viewPanel.error.unknownView", viewClassName));
                }
            }

            viewLabel = Exhibit.getAttribute(this, "viewLabel");
            label = (typeof viewLabel !== "undefined" && viewLabel !== null && viewLabel.length > 0) ?
                viewLabel :
                Exhibit.getAttribute(this, "label");
            tooltip = Exhibit.getAttribute(this, "title");
                
            if (typeof label === "undefined" || label === null) {
                if (ViewPanel.getViewLabel(viewClassName) !== null) {
                    label = ViewPanel.getViewLabel(viewClassName);
                } else if (typeof viewClassName !== "undefined") {
                    label = viewClassName;
                } else {
                    label = _("%viewPanel.noViewLabel");
                }
            }

            // @@@ see note in above create method
            if (typeof tooltip === "undefined" || tooltip === null) {
                if (ViewPanel.getViewTooltip(viewClassName) !== null) {
                    tooltip = ViewPanel.getViewTooltip(viewClassName);
                } else {
                    tooltip = label;
                }
            }
            
            viewPanel._viewConstructors.push(viewClass);
            viewPanel._viewConfigs.push(null);
            viewPanel._viewLabels.push(label);
            viewPanel._viewTooltips.push(tooltip);
            viewPanel._viewDomConfigs.push(this);
        }
    });
    
    initialView = Exhibit.getAttribute(div, "initialView");
    if (typeof initialView !== "undefined" && initialView !== null && initialView.length > 0) {
        try {
            n = parseInt(initialView, 10);
            if (!isNaN(n)) {
                viewPanel._viewIndex = n;
            }
        } catch (e) {
        }
    }
    
    viewPanel._setIdentifier();
    viewPanel.register();
    viewPanel._internalValidate();
    viewPanel._initializeUI();
    
    return viewPanel;
};

/**
 * @static
 * @param {String} viewClass
 * @returns {String}
 */
ViewPanel.getViewLabel = function(viewClass) {
    return ViewPanel._getLocalized(viewClass, "label");
};

/**
 * @static
 * @param {String} viewClass
 * @returns {String}
 */
ViewPanel.getViewTooltip = function(viewClass) {
    return ViewPanel._getLocalized(viewClass, "tooltip");
};

/**
 * @static
 * @param {String} viewClass
 * @param {String} type
 * @returns {String}
 */
ViewPanel._getLocalized = function(viewClass, type) {
    if (typeof viewClass === "undefined" || viewClass === null) {
        return null;
    } else {
        // normalize the view class name
        if (viewClass.indexOf("View") === -1) {
            viewClass += "View";
        }
        // @@@ may not need this with requirejs renaming
        if (viewClass.indexOf("Exhibit.") === 0) {
            viewClass = viewClass.substring("Exhibit.".length);
        }
        return _("%" + viewClass + "." + type);
    }
};

/**
 *
 */
ViewPanel.prototype.dispose = function() {
    if (this._view !== null) {
        this._view.dispose();
        this._view = null;
    }
    
    $(this._div).empty();
    
    this.unregister();
    this._uiContext.dispose();
    this._uiContext = null;
    this._div = null;
};

/**
 * @returns {jQuery}
 */
ViewPanel.prototype.getContainer = function() {
    return $(this._div);
};

/**
 *
 */
ViewPanel.prototype._setIdentifier = function() {
    this._id = $(this._div).attr("id");

    if (typeof this._id === "undefined" || this._id === null) {
        this._id = ViewPanel._registryKey
            + "-"
            + this._uiContext.getCollection().getID()
            + "-"
            + this._uiContext.getMain().getRegistry().generateIdentifier(
                ViewPanel._registryKey
            );
    }
};

/**
 * 
 */
ViewPanel.prototype.register = function() {
    if (!this._uiContext.getMain().getRegistry().isRegistered(
        ViewPanel._registryKey,
        this.getID()
    )) {
        this._uiContext.getMain().getRegistry().register(
            ViewPanel._registryKey,
            this.getID(),
            this
        );
        this._registered = true;
    }
};

/**
 *
 */
ViewPanel.prototype.unregister = function() {
    this._uiContext.getMain().getRegistry().unregister(
        ViewPanel._registryKey,
        this.getID()
    );
    this._registered = false;
};

/**
 * @returns {String}
 */
ViewPanel.prototype.getID = function() {
    return this._id;
};

/**
 *
 */
ViewPanel.prototype._internalValidate = function() {
    if (this._viewConstructors.length === 0) {
        this._viewConstructors.push(TileView);
        this._viewConfigs.push({});
        this._viewLabels.push(_("%TileView.label"));
        this._viewTooltips.push(_("%TileView.tooltip"));
        this._viewDomConfigs.push(null);
    }
    
    this._viewIndex = 
        Math.max(0, Math.min(this._viewIndex, this._viewConstructors.length - 1));
};

/**
 *
 */
ViewPanel.prototype._initializeUI = function() {
    var div, self;
    div = $("<div>");
    if ($(this._div).children().length > 0) {
        $(this._div).prepend(div);
    } else {
        $(this._div).append(div);
    }
    
    self = this;
    this._dom = ViewPanel.constructDom(
        $(this._div).children().get(0),
        this._viewLabels,
        this._viewTooltips,
        function(index) {
            self._selectView(index);
        }
    );
    
    this._createView();
};

/**
 *
 */
ViewPanel.prototype._createView = function() {
    var viewContainer, viewDiv, index, context;
    viewContainer = this._dom.getViewContainer();
    $(viewContainer).empty();

    viewDiv = $("<div>");
    $(viewContainer).append(viewDiv);
    
    index = this._viewIndex;
    context = this._uiContextCache[index] || this._uiContext;
    try {
        if (this._viewDomConfigs[index] !== null) {
            this._view = this._viewConstructors[index].createFromDOM(
                this._viewDomConfigs[index],
                viewContainer, 
                context
            );
        } else {
            this._view = this._viewConstructors[index].create(
                this._viewConfigs[index],
                viewContainer, 
                context
            );
        }
    } catch (e) {
        Debug.log(_("%viewPanel.error.failedViewCreate", this._viewLabels[index], index));
        Debug.exception(e);
    }
    
    this._uiContextCache[index] = this._view.getUIContext();
    this._view.setLabel(this._viewLabels[index]);
    this._view.setViewPanel(this);

    this._dom.setViewIndex(index);
};

/**
 * @param {Number} newIndex
 */
ViewPanel.prototype._switchView = function(newIndex) {
    $(this.getContainer()).trigger(
        "onBeforeViewPanelSwitch.exhibit",
        [ this._viewIndex ]
    );
    if (this._view !== null) {
        this._view.dispose();
        this._view = null;
    }
    this._viewIndex = newIndex;
    this._createView();
    $(this.getContainer()).trigger(
        "onAfterViewPanelSwitch.exhibit",
        [ this._viewIndex, this._view ]
    );
};

/**
 * @param {Number} newIndex
 */
ViewPanel.prototype._selectView = function(newIndex) {
    var oldIndex, self;
    oldIndex = this._viewIndex;
    self = this;
    EHistory.pushComponentState(
        this,
        ViewPanel._registryKey,
        this.exportState(this.makeState(newIndex)),
        _("%viewPanel.selectViewActionTitle", self._viewLabels[newIndex]),
        true
    );
};

/**
 * @param {Element} div
 * @param {Array} viewLabels
 * @param {Array} viewTooltips
 * @param {Function} onSelectView
 */
ViewPanel.constructDom = function(
    div,
    viewLabels,
    viewTooltips,
    onSelectView
) {
    var template, dom;
    template = {
        "elmt": div,
        "class": "exhibit-viewPanel exhibit-ui-protection",
        "children": [
            {   "tag":    "div",
                "class":  "exhibit-viewPanel-viewSelection",
                "field":  "viewSelectionDiv"
            },
            {   "tag":    "div",
                "class":  "exhibit-viewPanel-viewContainer",
                "field":  "viewContainerDiv"
            }
        ]
    };
    dom = $.simileDOM("template", template);
    dom.getViewContainer = function() {
        return dom.viewContainerDiv;
    };
    dom.setViewIndex = function(index) {
        var appendView, i;
        if (viewLabels.length > 1) {
            $(dom.viewSelectionDiv).empty();
            
            appendView = function(i) {
                var selected, span, handler;
                selected = (i === index);
                if (i > 0) {
                    $(dom.viewSelectionDiv).append(_("%viewPanel.viewSeparator"));
                }
                
                span = $("<span>");
                span.attr("class", selected ? 
                          "exhibit-viewPanel-viewSelection-selectedView" :
                          "exhibit-viewPanel-viewSelection-view")
                    .attr("title", viewTooltips[i])
                    .html(viewLabels[i]);
                
                if (!selected) {
                    handler = function(evt) {
                        onSelectView(i);
                        evt.preventDefault();
                        evt.stopPropagation();
                    };
                    span.bind("click", handler);
                }
                $(dom.viewSelectionDiv).append(span);
            };
            
            for (i = 0; i < viewLabels.length; i++) {
                appendView(i);
            }
        }
    };
    
    return dom;
};

/**
 * @param {Object} state
 * @returns {Object} state
 */
ViewPanel.prototype.exportState = function(state) {
    if (typeof state === "undefined" || state === null) {
        return {
            "viewIndex": this._viewIndex
        };
    } else {
        return state;
    }
};

/**
 * @param {Object} state
 * @param {Number} state.viewIndex
 */
ViewPanel.prototype.importState = function(state) {
    if (this.stateDiffers(state)) {
        this._switchView(state.viewIndex);
    }
};

/**
 * @param {Number} viewIndex
 * @returns {Object}
 */
ViewPanel.prototype.makeState = function(viewIndex) {
    return {
        "viewIndex": viewIndex
    };
};

/**
 * @param {Object} state
 * @param {Number} state.viewIndex
 * @returns {Boolean}
 */
ViewPanel.prototype.stateDiffers = function(state) {
    return state.viewIndex !== this._viewIndex;
};

$(document).one(
    "registerComponents.exhibit",
    ViewPanel._registerComponent
);

    // end define
        return ViewPanel;
});
