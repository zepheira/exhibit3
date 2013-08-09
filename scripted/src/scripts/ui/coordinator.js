/**
 * @fileOverview Helps bind and trigger events between views.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["./ui-context"], function(UIContext) {
/**
 * @constructor
 * @class
 * @param {Exhibit.UIContext} uiContext
 */
var Coordinator = function(uiContext) {
    this._uiContext = uiContext;
    this._listeners = [];
};

/**
 * @static
 * @param {Object} configuration
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.Coordinator}
 */
Coordinator.create = function(configuration, uiContext) {
    return new Coordinator(uiContext);
};

/**
 * @static
 * @param {Element} div
 * @param {Exhibit.UIContext} uiContext
 * @returns {Exhibit.Coordinator}
 */
Coordinator.createFromDOM = function(div, uiContext) {
    return new Coordinator(UIContext.createFromDOM(div, uiContext, false));
};

/**
 *
 */
Coordinator.prototype.dispose = function() {
    this._uiContext.dispose();
    this._uiContext = null;
};

/**
 * @param {Function} callback
 * @returns {Exhibit.Coordinator._Listener}
 */
Coordinator.prototype.addListener = function(callback) {
    var listener = new Coordinator._Listener(this, callback);
    this._listeners.push(listener);
    
    return listener;
};

/**
 * @param {Exhibit.Coordinator._Listener} listener
 */
Coordinator.prototype._removeListener = function(listener) {
    var i;
    for (i = 0; i < this._listeners.length; i++) {
        if (this._listeners[i] === listener) {
            this._listeners.splice(i, 1);
            return;
        }
    }
};

/**
 * @param {Exhibit.Coordinator._Listener} listener
 * @param {Object} o
 */
Coordinator.prototype._fire = function(listener, o) {
    var i, listener2;
    for (i = 0; i < this._listeners.length; i++) {
        listener2 = this._listeners[i];
        if (listener2 !== listener) {
            listener2._callback(o);
        }
    }
};

/**
 * @constructor
 * @class
 * @param {Exhibit.Coordinator} coordinator
 * @param {Function} callback
 */
Coordinator._Listener = function(coordinator, callback) {
    this._coordinator = coordinator;
    this._callback = callback;
};

/**
 */
Coordinator._Listener.prototype.dispose = function() {
    this._coordinator._removeListener(this);
};

/**
 * @param {Object} o
 */
Coordinator._Listener.prototype.fire = function(o) {
    this._coordinator._fire(this, o);
};

    // end define
    return Coordinator;
});
