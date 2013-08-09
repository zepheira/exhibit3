/**
 * @fileOverview Database creation utilities.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "../data/database",
    "../data/database/local"
], function(Database, DatabaseLocalImpl) {
    /**
     * @namespace Database utiltiies for Exhibit.
     */
    var DatabaseUtilities = {};

    /**
     * Instantiate an Exhibit database object.
     *
     * @static
     * @returns {Object}
     */
    DatabaseUtilities.create = function(type) {
        // @@@ This doesn't work with requirejs reorg.
        //  maybe use registration pattern instead of relying on namespace.
        if (typeof Database[type] !== "undefined") {
            return new Database[type]();
        } else {
            return new DatabaseLocalImpl();
        }
    };

    // end define
    return DatabaseUtilities;
});
