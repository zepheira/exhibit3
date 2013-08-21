/**
 * @fileOverview Instance of Exhibit.Exporter for RDF/XML.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery",
    "../../util/localizer",
    "../../util/persistence",
    "../exporter"
], function($, _, Persistence, Exporter) {
/**
 * @namespace
 */
var RDFXML = {
    _mimeType: "application/rdf+xml",
    exporter: null
};

/**
 * @param {String} s
 * @param {Object} prefixToBase
 * @returns {String}
 */
RDFXML.wrap = function(s, prefixToBase) {
    var s2, prefix;

    s2 = "<?xml version=\"1.0\"?>\n" +
        "<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"\n"+
        "\txmlns:exhibit=\"http://simile.mit.edu/2006/11/exhibit#\"";

    for (prefix in prefixToBase) {
        if (prefixToBase.hasOwnProperty(prefix)) {
            s2 += "\n\txmlns:" + prefix + "=\"" + prefixToBase[prefix] + "\"";
        }
    }

    s2 += ">\n" + s + "\n</rdf:RDF>\n";

    return s2;
};

/**
 * @param {String} s
 * @returns {String}
 */
RDFXML.wrapOne = function(s, first, last) {
    return s + "\n";
};

/**
 * @param {String} itemID
 * @param {Object} o
 * @param {Object} properties
 * @param {Object} propertyIDToQualifiedName
 * @param {Object} prefixToBase
 * @returns {String}
 */
RDFXML.exportOne = function(itemID, o, properties, propertyIDToQualifiedName, prefixToBase) {
    var s, uri, i, propertyID, valueType, propertyString, j, values, qname;
    uri = o.uri;
    s = "<rdf:Description rdf:about=\"" + uri + "\">\n";

    for (propertyID in o) {
        if (o.hasOwnProperty(propertyID) && typeof properties[propertyID] !== "undefined") {
            valueType = properties[propertyID].valueType;
            if (typeof propertyIDToQualifiedName[propertyID] !== "undefined") {
                qname = propertyIDToQualifiedName[propertyID];
                propertyString = qname.prefix + ":" + qname.localName;
            } else {
                propertyString = properties[propertyID].uri;
            }

            if (valueType === "item") {
                values = o[propertyID];
                for (j = 0; j < values.length; j++) {
                    s += "\t<" + propertyString + " rdf:resource=\"" + values[j] + "\" />\n";
                }
            } else if (propertyID !== "uri") {
                values = o[propertyID];
                for (j = 0; j < values.length; j++) {
                    s += "\t<" + propertyString + ">" + values[j] + "</" + propertyString + ">\n";
                }
            }
        }
    }
         
    s += "\t<exhibit:origin>" + Persistence.getItemLink(itemID) + "</exhibit:origin>\n";
    s += "</rdf:Description>";

    return s;
};

RDFXML.exportMany = function(set, database) {
    var propertyIDToQualifiedName, prefixToBase, s, self, properties, ps, i, p;
    propertyIDToQualifiedName = {};
    prefixToBase = {};
    s = "";
    self = this;
    database.getNamespaces(propertyIDToQualifiedName, prefixToBase);
    properties = {};
    ps = database.getAllProperties();
    for (i = 0; i < ps.length; i++) {
        p = database.getProperty(ps[i]);
        properties[ps[i]] = {};
        properties[ps[i]].valueType = p.getValueType();
        properties[ps[i]].uri = p.getURI();
    }
    set.visit(function(itemID) {
        s += self._wrapOne(self._exportOne(
            itemID,
            self.exportOneFromDatabase(itemID, database),
            properties,
            propertyIDToQualifiedName,
            prefixToBase
        ));
    });
    return this._wrap(s, prefixToBase);
};

/**
 * @private
 */
RDFXML._register = function() {
    RDFXML.exporter = new Exporter(
        RDFXML._mimeType,
        _("%export.rdfXmlExporterLabel"),
        RDFXML.wrap,
        RDFXML.wrapOne,
        RDFXML.exportOne,
        RDFXML.exportMany
    );
};

$(document).one(
    "registerExporters.exhibit",
    RDFXML._register
);

    // end define
    return RDFXML;
});
