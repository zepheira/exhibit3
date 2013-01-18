/**
 * @fileOverview Error reporting.  This file is not localized in order to
 *      keep errors in that system from interfering with this one.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define(["exhibit"], function(Exhibit) {
/**
 * @namespace
 */
var Debug = {
    silent: false
};

/**
 * @static
 * @param {String} msg
 */
Debug.log = function(msg) {
    var f;
    if (typeof window["console"] !== "undefined" &&
        typeof window.console["log"] === "function") {
        f = function(msg2) {
            console.log(msg2);
        };
    } else {
        f = function(msg2) {
            if (!Debug.silent) {
                alert(msg2);
            }
        };
    }
    Debug.log = f;
    f(msg);
};
    
/**
 * @static
 * @pararm {String} msg
 */
Debug.warn = function(msg) {
    var f;
    if (typeof window["console"] !== "undefined" &&
        typeof window.console["warn"] === "function") {
        f = function(msg2) {
            console.warn(msg2);
        };
    } else {
        f = function(msg2) {
            if (!Debug.silent) {
                alert(msg2);
            }
        };
    }
    Debug.warn = f;
    f(msg);
};

/**
 * @static
 * @param {Exception} e
 * @param {String} msg
 */
Debug.exception = function(e, msg) {
    var f, params = Exhibit.parseURLParameters();
    if (params.errors === "throw" || Exhibit.params.errors === "throw") {
        f = function(e2, msg2) {
            throw(e2);
        };
    } else if (typeof window["console"] !== "undefined" &&
               typeof window.console["error"] !== "undefined") {
        f = function(e2, msg2) {
            if (typeof msg2 !== "undefined" && msg2 !== null) {
                console.error(msg2 + " %o", e2);
            } else {
                console.error(e2);
            }
            throw(e2); // do not hide from browser's native debugging features
        };
    } else {
        f = function(e2, msg2) {
            if (!Debug.silent) {
                alert("Caught exception: " + msg2 + "\n\nDetails: " + (typeof e2["description"] !== "undefined" ? e2.description : e2));
            }
            throw(e2); // do not hide from browser's native debugging features
        };
    }
    Debug.exception = f;
    f(e, msg);
};
    
/**
 * @static
 * @param {Object} o
 * @returns {String}
 */
Debug.objectToString = function(o) {
    return Debug._objectToString(o, "");
};

/**
 * @static
 * @param {Object} o
 * @param {String} indent
 * @returns {String}
 */
Debug._objectToString = function(o, indent) {
    var indent2 = indent + " ", s, n;
    if (typeof o === "object") {
        s = "{";
        for (n in o) {
            if (o.hasOwnProperty(n)) {
                s += indent2 + n + ": " + Debug._objectToString(o[n], indent2) + "\n";
            }
        }
        s += indent + "}";
        return s;
    } else if (typeof o === "array") {
        s = "[";
        for (n = 0; n < o.length; n++) {
            s += Debug._objectToString(o[n], indent2) + "\n";
        }
        s += indent + "]";
        return s;
    } else if (typeof o === "function") {
        return indent + "{function}\n";
    } else {
        return o;
    }
};

    // end define
    return Debug;
});
