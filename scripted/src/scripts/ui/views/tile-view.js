/**
 * @fileOverview Tile view functions and UI.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "exhibit",
    "util/settings",
    "util/history",
    "ui/views/view",
    "ui/views/ordered-view-frame",
    "lib/jquery.simile.dom"
], function($, Exhibit, SettingsUtilities, EHistory, View, OrderedViewFrame) {
/**
 * @constructor
 * @class
 * @param {Element} containerElement
 * @param {Exhibit.UIContext} uiContext
 */ 
var TileView = function(containerElmt, uiContext) {
    var view = this;
    $.extend(this, new View(
        "tile",
        containerElmt,
        uiContext
    ));
    this.addSettingSpecs(TileView._settingSpecs);

    this._onItemsChanged = function() {
        // @@@this will ignore the stored state, which is odd
        // it should probably replace the state after doing this - 
        // or forget it since this will always ignore the stored state,
        // correctly
        view._orderedViewFrame._settings.page = 0;
        view._reconstruct();
    };
    $(uiContext.getCollection().getElement()).bind(
        "onItemsChanged.exhibit",
        view._onItemsChanged
    );

    this._orderedViewFrame = new OrderedViewFrame(uiContext);
    this._orderedViewFrame.parentReconstruct = function() {
        view._reconstruct();
    };
    this._orderedViewFrame.parentHistoryAction = function(child, state, title) {
        EHistory.pushComponentState(
            view,
            View.getRegistryKey(),
            view.exportState(view.makeStateWithSub(child, state)),
            title,
            true
        );
    };

    this.register();
};

/**
 * @constant
 */
TileView._settingSpecs = { };

/**
 * @param {Object} configuration
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.TileView}
 */
TileView.create = function(configuration, containerElmt, uiContext) {
    var view = new TileView(
        containerElmt,
        uiContext.asParentFromConfig(configuration)
    );
    
    SettingsUtilities.collectSettings(
        configuration, view.getSettingSpecs(), view._settings);
        
    view._orderedViewFrame.configure(configuration);

    view._initializeUI();
    return view;
};

/**
 * @param {Element} configElmt
 * @param {Element} containerElmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.TileView}
 */
TileView.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration, view;
    configuration = Exhibit.getConfigurationFromDOM(configElmt);
    view = new TileView(
        typeof containerElmt !== "undefined" && containerElmt !== null ?
            containerElmt :
            configElmt,
        uiContext.asParentFromDOM(configElmt)
    );
    
    SettingsUtilities.collectSettingsFromDOM(
        configElmt, view.getSettingSpecs(), view._settings);
    SettingsUtilities.collectSettings(
        configuration, view.getSettingSpecs(), view._settings);
    
    view._orderedViewFrame.configureFromDOM(configElmt);
    view._orderedViewFrame.configure(configuration);
    view._initializeUI();
    return view;
};

/**
 *
 */
TileView.prototype.dispose = function() {
    var view = this;
    $(this.getUIContext().getCollection().getElement()).unbind(
        "onItemsChanged.exhibit",
        view._onItemsChanged
    );

    this._orderedViewFrame.dispose();
    this._orderedViewFrame = null;
    this._dom = null;

    this._dispose();
};

/**
 *
 */
TileView.prototype._initializeUI = function() {
    var self, template;

    self = this;
    
    $(this.getContainer()).empty();
    self._initializeViewUI(function() {
        return $(self._dom.bodyDiv).html();
    });

    template = {
        elmt: this.getContainer(),
        children: [
            {   tag: "div",
                field: "headerDiv"
            },
            {   tag: "div",
                "class": "exhibit-collectionView-body",
                field: "bodyDiv"
            },
            {   tag: "div",
                field: "footerDiv"
            }
        ]
    };
    this._dom = $.simileDOM("template", template);
    this._orderedViewFrame._divHeader = this._dom.headerDiv;
    this._orderedViewFrame._divFooter = this._dom.footerDiv;
    this._orderedViewFrame.initializeUI();

    View.addViewState(
        this.getID(),
        this.exportState()
    );

    this._reconstruct();
};

/**
 *
 */
TileView.prototype._reconstruct = function() {
    var view, state, closeGroups, i;
    view = this;
    state = {
        div:            this._dom.bodyDiv,
        contents:       null,
        groupDoms:      [],
        groupCounts:    []
    };

    closeGroups = function(groupLevel) {
        for (i = groupLevel; i < state.groupDoms.length; i++) {
            $(state.groupDoms[i].countSpan).html(state.groupCounts[i]);
        }
        state.groupDoms = state.groupDoms.slice(0, groupLevel);
        state.groupCounts = state.groupCounts.slice(0, groupLevel);

        if (groupLevel > 0 && groupLevel <= state.groupDoms.length) {
            state.div = state.groupDoms[groupLevel - 1].contentDiv;
        } else {
            state.div = view._dom.bodyDiv;
        }
        state.contents = null;
    };

    this._orderedViewFrame.onNewGroup = function(groupSortKey, keyType, groupLevel) {
        closeGroups(groupLevel);

        var groupDom = TileView.constructGroup(groupLevel, groupSortKey);

        $(state.div).append(groupDom.elmt);
        state.div = groupDom.contentDiv;

        state.groupDoms.push(groupDom);
        state.groupCounts.push(0);
    };

    this._orderedViewFrame.onNewItem = function(itemID, index) {
        var i, itemLensItem, itemLens;
        if (typeof state.contents === "undefined" || state.contents === null) {
            state.contents = TileView.constructList();
            $(state.div).append(state.contents);
        }

        for (i = 0; i < state.groupCounts.length; i++) {
            state.groupCounts[i]++;
        }

        itemLensItem = $("<li>");
        itemLens = view.getUIContext().getLensRegistry().createLens(itemID, itemLensItem, view.getUIContext());
        state.contents.append(itemLensItem);
    };

    $(this.getContainer()).hide();

    $(this._dom.bodyDiv).empty();
    this._orderedViewFrame.reconstruct();
    closeGroups(0);

    $(this.getContainer()).show();
};

/**
 * @returns {Object}
 */
TileView.prototype.makeState = function() {
    return {};
};

/**
 * @param {String} sub
 * @param {Object} state
 * @returns {Object}
 */
TileView.prototype.makeStateWithSub = function(sub, state) {
    var original;
    original = this.makeState();
    original[sub] = state;
    return original;
};

/**
 * @param {Object} state
 * @returns {Object}
 */
TileView.prototype.exportState = function(state) {
    if (typeof state === "undefined" || state === null) {
        return this.makeStateWithSub(this._orderedViewFrame._historyKey,
                                     this._orderedViewFrame.exportState());
    } else {
        return state;
    }
};

/**
 * @param {Object} state
 * @param {Object} state.orderedViewFrame
 */
TileView.prototype.importState = function(state) {
    if (this._orderedViewFrame !== null && this.stateDiffers(state)) {
        this._orderedViewFrame.importState(state.orderedViewFrame);
    }
};

/**
 * @param {Object} state
 * @param {Object} state.orderedViewFrame
 * @returns {Boolean}
 */
TileView.prototype.stateDiffers = function(state) {
    if (typeof state.orderedViewFrame !== "undefined") {
        return this._orderedViewFrame.stateDiffers(state.orderedViewFrame);
    } else {
        return false;
    }
};

/**
 * @static
 * @param {Number} groupLevel
 * @param {String} label
 * @returns {Element}
 */
TileView.constructGroup = function(groupLevel, label) {
    var template = {
        tag: "div",
        "class": "exhibit-collectionView-group",
        children: [
            {   tag: "h" + (groupLevel + 1),
                children: [
                    label,
                    {   tag:        "span",
                        "class":  "exhibit-collectionView-group-count",
                        children: [
                            " (",
                            {   tag: "span",
                                field: "countSpan"
                            },
                            ")"
                        ]
                    }
                ],
                field: "header"
            },
            {   tag: "div",
                "class": "exhibit-collectionView-group-content",
                field: "contentDiv"
            }
        ]
    };
    return $.simileDOM("template", template);
};

/**
 * @returns {jQuery}
 */
TileView.constructList = function() {
    return $("<ol>").addClass("exhibit-tileView-body");
};

    // end define
    return TileView;
});
