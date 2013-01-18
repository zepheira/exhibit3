/**
 * @fileOverview Local interface to a history manager.
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "util/ui",
    "lib/jquery.history",
    "lib/jquery.history.shim"
], function($, UIUtilities) {
/**
 * @namespace For history management related methods.
 */
var EHistory = {
    /**
     * Whether the history module is available.
     */
    enabled: false,

    /**
     * @private
     */
    _state: 0,

    /**
     * @private
     */
    _originalTitle: "",

    /**
     * @private
     */
    _originalLocation: "",
    
    /**
     * @private
     */
    _registry: null,

    /**
     * @private
     * @constant
     */
    _activeTypes: [ "facet", "view", "viewPanel" ]
};

/**
 * @private
 * @static
 */
EHistory._processEmptyState = function() {
    var state, types, reg, keys, component, i, j;
    types = EHistory._activeTypes;
    reg = EHistory._registry;
    state = EHistory.getState();
    if (typeof state.data.components === "undefined") {
        state.data.components = {};
        state.data.state = EHistory._state;
        for (i = 0; i < types.length; i++) {
            keys = reg.getKeys(types[i]);
            for (j = 0; j < keys.length; j++) {
                component = reg.get(types[i], keys[j]);
                if (typeof component.exportState === "function") {
                    state.data.components[keys[j]] = {};
                    state.data.components[keys[j]].type = types[i];
                    state.data.components[keys[j]].state = component.exportState();
                }
            }
        }
        EHistory.replaceState(state.data);
    }
};

/**
 * @param {jQuery.Event} evt
 */
EHistory.stateListener = function(evt) {
    var fullState, components, key, id, componentState, component;

    fullState = EHistory.getState();

    if (fullState.data.lengthy) {
        UIUtilities.showBusyIndicator();
    }

    components = fullState.data.components;
    for (key in components) {
        if (components.hasOwnProperty(key)) {
            componentState = components[key].state;
            component = EHistory._registry.get(components[key].type, key);
            if (component !== null &&
                typeof component.importState === "function") {
                // @@@ not every component is immediately available
                component.importState(componentState);
            }
        }
    }
    EHistory._state = fullState.data.state || 0;

    if (fullState.data.lengthy) {
        UIUtilities.hideBusyIndicator();
    }
};

/**
 * Catch up for components that aren't immediately available.
 *
 * @param {jQuery.Event} evt
 * @param {String} type
 * @param {String} id
 */
EHistory.componentStateListener = function(evt, type, id) {
    var fullState, components, componentState, component;
    fullState = EHistory.getState();
    if (fullState !== null) {
        components = fullState.data.components;
        if (typeof components[id] !== "undefined") {
            componentState = components[id].state;
            component = EHistory._registry.get(type, id);
            if (component !== null &&
                typeof component.importState === "function") {
                // @@@ not every component is immediately available
                // @@@ some components should be considered disposed of
                component.importState(componentState);
            }
        }
    }
};

/**
 * Passes through to History.js History.getState function.
 *
 * @static
 * @returns {Object}
 */
EHistory.getState = function() {
    if (EHistory.enabled) {
        return History.getState();
    } else {
        return null;
    }
};

/**
 * @static
 * @param {Object} state
 * @param {Object} component
 * @param {Exhibit.Registry} registry
 * @param {Object} data
 * @param {Boolean} lengthy
 * @returns {Object}
 */
EHistory.setComponentState = function(state, component, registry, data, lengthy) {
    if (typeof state === "undefined" || state === null) {
        state = { "data": { "components": {} } };
    }

    if (typeof state.data === "undefined") {
        state.data = { "components": {} };
    }
    if (typeof state.data.components === "undefined") {
        state.data.components = {};
    }

    state.data.lengthy = lengthy;
    state.data.components[component.getID()] = {
        "type": registry,
        "state": data
    };

    return state;
};

/**
 * @static
 * @param {Object} component
 * @param {Exhibit.Registry} registry
 * @param {Object} data
 * @param {String} subtitle
 * @param {Boolean} lengthy
 */
EHistory.pushComponentState = function(component, registry, data, subtitle, lengthy) {
    var state = EHistory.getState();
    EHistory.setComponentState(state, component, registry, data, lengthy);
    EHistory.pushState(state.data, subtitle);
};

/**
 * Passes through to History.js History.pushState function.
 * 
 * @static
 * @param {Object} data
 * @param {String} subtitle
 */
EHistory.pushState = function(data, subtitle) {
    var title, url;

    if (EHistory.enabled) {
        EHistory._state++;
        data.state = EHistory._state;

        title = EHistory._originalTitle;

        if (typeof subtitle !== "undefined" &&
            subtitle !== null &&
            subtitle !== "") {
            title += " {" + subtitle + "}";
        }
        
        url = EHistory._originalLocation;
        
        History.pushState(data, title, url);
    }
};

/**
 * Passes through to History.js History.replaceState function.
 * 
 * @static
 * @param {Object} data
 * @param {String} subtitle
 * @param {String} url
 */
EHistory.replaceState = function(data, subtitle, url) {
    var title, currentState;

    if (EHistory.enabled) {
        currentState = EHistory.getState();
        title = EHistory._originalTitle;

        if (typeof subtitle !== "undefined" &&
            subtitle !== null &&
            subtitle !== "") {
            title += " {" + subtitle + "}";
        } else {
            if (typeof currentState.title !== "undefined") {
                title = EHistory.getState().title;
            }
        }

        if ((typeof url === "undefined" || url === null) &&
            typeof currentState.url !== "undefined") {
            url = currentState.url;
        }
        
        History.replaceState(data, title, url);
    }
};

/**
 * Pushes an empty state into the history state tracker so the next refresh
 * will start from scratch.
 * 
 * @static
 */
EHistory.eraseState = function() {
    EHistory.pushState({});
};

$(document).bind(
    "importReady.exhibit",
    EHistory.componentStateListener
);

    // end define
    return EHistory;
});
