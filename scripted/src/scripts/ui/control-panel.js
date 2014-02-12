/**
 * @fileOverview Provides a holding place for Exhibit-wide controls.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../exhibit-core",
    "../util/settings",
    "../ui/ui-context",
    "./views/view-panel",
    "./views/view",
    "./widgets/bookmark-widget",
    "./widgets/reset-history-widget"
], function($, Exhibit, SettingsUtilities, UIContext, ViewPanel, View, BookmarkWidget, ResetHistoryWidget) {
/**
 * @class
 * @constructor
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 */
var ControlPanel = function(elmt, uiContext) {
    this._uiContext = uiContext;
    this._widgets = [];
    this._div = elmt;
    this._settings = {};
    this._hovering = false;
    this._id = null;
    this._registered = false;
    this._childOpen = false;
    this._createdAsDefault = false;
};

/**
 * @static
 * @private
 */
ControlPanel._settingSpecs = {
    "showBookmark":         { type: "boolean", defaultValue: true },
    "developerMode":        { type: "boolean", defaultvalue: false },
    "hoverReveal":          { type: "boolean", defaultValue: false }
};

/**
 * @private
 * @constant
 */
ControlPanel._registryKey = "controlPanel";

/**
 * @static
 * @param {Object} configuration
 * @param {Element} elmt
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.ControlPanel}
 */
ControlPanel.create = function(configuration, elmt, uiContext) {
    var panel = new ControlPanel(
        elmt,
        UIContext.create(configuration, uiContext)
    );
    ControlPanel._configure(panel, configuration);
    panel._setIdentifier();
    panel.register();
    panel._initializeUI();
    return panel;
};

/**
 * @static
 * @param {Element} div
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.Coordinator}
 */
ControlPanel.createFromDOM = function(configElmt, containerElmt, uiContext) {
    var configuration, panel;
    configuration = Exhibit.getConfigurationFromDOM(configElmt);
    panel = new ControlPanel(
        (typeof containerElmt !== "undefined" && containerElmt !== null) ?
            containerElmt :
            configElmt,
        UIContext.createFromDOM(configElmt, uiContext)
    );
    ControlPanel._configureFromDOM(panel, configuration);
    panel._setIdentifier();
    panel.register();
    panel._initializeUI();
    return panel;
};

/**
 * @static
 * @private
 * @param {Exhibit.ControlPanel} panel
 * @param {Object} configuration
 */
ControlPanel._configure = function(panel, configuration) {
    SettingsUtilities.collectSettings(
        configuration,
        ControlPanel._settingSpecs,
        panel._settings
    );
};

/**
 * @static
 * @private
 * @param {Exhibit.ControlPanel} panel
 * @param {Object} configuration
 */
ControlPanel._configureFromDOM = function(panel, configuration) {
    SettingsUtilities.collectSettingsFromDOM(
        panel._div,
        ControlPanel._settingSpecs,
        panel._settings
    );
};

/**
 * @private
 * @param {jQuery.Event} evt
 * @param {Exhibit.Registry} reg
 */
ControlPanel.registerComponent = function(evt, reg) {
    if (!reg.hasRegistry(ControlPanel._registryKey)) {
        reg.createRegistry(ControlPanel._registryKey);
    }
};

/**
 * @static
 * @param {jQuery.Event} evt
 * @param {jQuery} elmt
 */
ControlPanel.mouseOutsideElmt = function(evt, elmt) {
    var coords = $(elmt).offset();
    return (
        evt.pageX < coords.left
            || evt.pageX > coords.left + $(elmt).outerWidth()
            || evt.pageY < coords.top
            || evt.pageY > coords.top + $(elmt).outerHeight()
    );
};

/**
 * @private
 */
ControlPanel.prototype._initializeUI = function() {
    var widget, self;
    self = this;
    if (this._settings.hoverReveal) {
        $(this.getContainer()).fadeTo(1, 0);
        $(this.getContainer()).bind("mouseover", function(evt) {
            self._hovering = true;
            $(this).fadeTo("fast", 1);
        });
        $(document.body).bind("mousemove", function(evt) {
            if (self._hovering
                && !self._childOpen
                && ControlPanel.mouseOutsideElmt(
                    evt,
                    self.getContainer()
                )) {
                self._hovering = false;
                $(self.getContainer()).fadeTo("fast", 0);
            }
        });
    }
    if (this._settings.showBookmark) {
        widget = BookmarkWidget.create(
            { },
            this.getContainer(),
            this._uiContext
        );
        this.addWidget(widget, true);
    }
    if (this._settings.developerMode) {
        widget = ResetHistoryWidget.create(
            { },
            this.getContainer(),
            this._uiContext
        );
        this.addWidget(widget, true);
    }
    $(this.getContainer()).addClass("exhibit-controlPanel");
};

/**
 *
 */
ControlPanel.prototype._setIdentifier = function() {
    this._id = $(this._div).attr("id");
    if (typeof this._id === "undefined" || this._id === null) {
        this._id = ControlPanel._registryKey
            + "-"
            + this._uiContext.getCollection().getID()
            + "-"
            + this._uiContext.getMain().getRegistry().generateIdentifier(
                ControlPanel._registryKey
            );
    }
};

/**
 *
 */
ControlPanel.prototype.register = function() {
    if (!this._uiContext.getMain().getRegistry().isRegistered(
        ControlPanel._registryKey,
        this.getID()
    )) {
        this._uiContext.getMain().getRegistry().register(
            ControlPanel._registryKey,
            this.getID(),
            this
        );
        this._registered = true;
    }
};

/**
 *
 */
ControlPanel.prototype.unregister = function() {
    this._uiContext.getMain().getRegistry().unregister(
        ControlPanel._registryKey,
        this.getID()
    );
    this._registered = false;
};

/**
 * @returns {jQuery}
 */
ControlPanel.prototype.getContainer = function() {
    return $(this._div);
};

/**
 * @returns {String}
 */
ControlPanel.prototype.getID = function() {
    return this._id;
};

/**
 *
 */
ControlPanel.prototype.childOpened = function() {
    this._childOpen = true;
};

/**
 *
 */
ControlPanel.prototype.childClosed = function() {
    this._childOpen = false;
};

/**
 * 
 */
ControlPanel.prototype.setCreatedAsDefault = function() {
    var self;
    self = this;
    this._createdAsDefault = true;
    $(this._div).hide();
    $(document).one("exhibitConfigured.exhibit", function(evt, ex) {
        var keys, component, i, place;
        component = ViewPanel._registryKey;
        keys = ex.getRegistry().getKeys(component);
        if (keys.length === 0) {
            component = View._registryKey;
            keys = ex.getRegistry().getKeys(component);
        }
        if (keys.length !== 0) {
            // Places default control panel before the "first" one - ideally,
            // this is the first of its kind presentationally to the user,
            // but it may not be.  If not, authors should be placing it
            // themselves.
            place = ex.getRegistry().get(component, keys[0]);
            if (typeof place._div !== "undefined") {
                $(place._div).before(self._div);
                $(self._div).show();
            }
        }
    });
};

/**
 * @returns {Boolean}
 */
ControlPanel.prototype.createdAsDefault = function() {
    return this._createdAsDefault;
};

/**
 *
 */
ControlPanel.prototype.dispose = function() {
    this.unregister();
    this._uiContext.dispose();
    this._uiContext = null;
    this._div = null;
    this._widgets = null;
    this._settings = null;
};

/**
 * @param {Object} widget
 * @param {Boolean} initial
 */
ControlPanel.prototype.addWidget = function(widget, initial) {
    this._widgets.push(widget);
    if (typeof widget.setControlPanel === "function") {
        widget.setControlPanel(this);
    }
    if (typeof initial === "undefined" || !initial) {
        this.reconstruct();
    }
};

/**
 * @param {Object} widget
 * @returns {Object}
 */
ControlPanel.prototype.removeWidget = function(widget) {
    var i, removed;
    removed = null;
    for (i = 0; i < this._widgets.length; i++) {
        if (this._widgets[i] === widget) {
            removed = this._widgets.splice(i, 1);
            break;
        }
    }
    this.reconstruct();
    return removed;
};

/**
 *
 */
ControlPanel.prototype.reconstruct = function() {
    var i;
    $(this._div).empty();
    for (i = 0; i < this._widgets.length; i++) {
        if (typeof this._widgets[i].reconstruct === "function") {
            this._widgets[i].reconstruct(this);
        }
    }
};

$(document).on(
    "registerComponents.exhibit",
    ControlPanel.registerComponent
);

    // end define
    return ControlPanel;
});
