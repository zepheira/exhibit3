define([
    "lib/jquery",
    "util/bookmark",
    "util/history",
    "util/persistence"
], function($, Bookmark, EHistory, Persistence) {
    /**
     * @depends History.js
     * @param {Exhibit._Impl} ex
     * @param {Boolean} persist Expected to be true in production mode; set to
     *     false while in developer mode to prevent reading from history.
     */
    EHistory.init = function(ex, persist) {
        var state, types, i, j, keys, component;

        if (typeof History !== "undefined" && History.enabled) {
            EHistory.enabled = true;
            EHistory._originalTitle = document.title;
            EHistory._originalLocation = Persistence.getURLWithoutQueryAndHash();
            EHistory._registry = ex.getRegistry();

            $(window).bind("statechange", EHistory.stateListener);
            if (Bookmark.runBookmark()) {
                Bookmark.implementBookmark(Bookmark.state);
            } else {
                if (!persist) {
                    EHistory.eraseState();
                }
                EHistory._processEmptyState();
                EHistory.stateListener();
            }
        }
    };

    return EHistory;
});
