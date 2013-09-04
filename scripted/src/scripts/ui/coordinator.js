/**
 * @fileOverview Helps bind and trigger events between views.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["lib/jquery", "./ui-context"], function($, UIContext) {
    /**
     * @constructor
     * @class
     * @param {Exhibit.UIContext} uiContext
     */
    var Coordinator = function(uiContext, div) {
        this._listeners = [];

        var _div, _id, _uiContext, _registered, self, _setIdentifier;
        self = this;
        _div = div;
        _id = null;
        _uiContext = uiContext;
        _registered = false;

        this.getID = function() {
            return _id;
        };

        this.getUIContext = function() {
            return _uiContext;
        };

        this.getContainer = function() {
            return $(_div);
        };

        _setIdentifier = function() {
            if (typeof _div !== "undefined" && _div !== null) {
                _id = $(_div).attr("id");
            }
            if (typeof _id === "undefined" || _id === null) {
                _id = self.getUIContext().getCollection().getID()
                    + "-"
                    + self.getUIContext().getMain().getRegistry().generateIdentifier(Coordinator.getRegistryKey());
            }            
        };

        this.register = function() {
            this.getUIContext().getMain().getRegistry().register(
                Coordinator.getRegistryKey(),
                this.getID(),
                this
            );
            _registered = true;
        };

        this.unregister = function() {
            self.getUIContext().getMain().getRegistry().unregister(
                Coordinator.getRegistryKey(),
                self.getID()
            );
            _registered = false;
        };

        /**
         *
         */
        this.dispose = function() {
            // if instance defines _dispose for localized material, call it
            if (typeof this._dispose !== "undefined") {
                this._dispose();
            }
            this.unregister();
            this.getUIContext().dispose();
            _id = null;
            _div = null;
            _uiContext = null;
            self = null;
        };

        _setIdentifier();
    };

    Coordinator._registryKey = "coordinator";

    Coordinator.getRegistryKey = function() {
        return Coordinator._registryKey;
    };

    Coordinator.registerComponent = function(evt, reg) {
        if (!reg.hasRegistry(Coordinator.getRegistryKey())) {
            reg.createRegistry(Coordinator.getRegistryKey());
        }
    };

    /**
     * @static
     * @param {Object} configuration
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.Coordinator}
     */
    Coordinator.create = function(configuration, uiContext) {
        var coord = new Coordinator(uiContext);
        coord.register();
        return coord;
    };

    /**
     * @static
     * @param {Element} div
     * @param {Exhibit.UIContext} uiContext
     * @returns {Exhibit.Coordinator}
     */
    Coordinator.createFromDOM = function(div, uiContext) {
        var coord =  new Coordinator(UIContext.createFromDOM(div, uiContext, false), div);
        coord.register();
        return coord;
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

    $(document).one(
        "registerComponents.exhibit",
        Coordinator.registerComponent
    );
    
    return Coordinator;
});
