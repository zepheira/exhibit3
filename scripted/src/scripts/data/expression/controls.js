/**
 * @fileOverview Implementation of query language control features.
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "../../util/set",
    "./collection"
], function(Set, ExpressionCollection) {
/**
 * @namespace
 */
var Controls = {};

Controls["if"] = {
    f: function(
        args,
        roots, 
        rootValueTypes, 
        defaultRootName, 
        database
    ) {
        var conditionCollection = args[0].evaluate(roots, rootValueTypes, defaultRootName, database), condition;
        condition = false;
        conditionCollection.forEachValue(function(v) {
            if (v) {
                condition = true;
                return true;
            }
        });
        
        if (condition) {
            return args[1].evaluate(roots, rootValueTypes, defaultRootName, database);
        } else {
            return args[2].evaluate(roots, rootValueTypes, defaultRootName, database);
        }
    }
};

Controls.foreach = {
    f: function(
        args,
        roots, 
        rootValueTypes, 
        defaultRootName, 
        database
    ) {
        var collection, oldValue, oldValueType, results, valueType;
        collection = args[0].evaluate(roots, rootValueTypes, defaultRootName, database);
        
        oldValue = roots.value;
        oldValueType = rootValueTypes.value;
        rootValueTypes.value = collection.valueType;
        
        results = [];
        valueType = "text";
        
        collection.forEachValue(function(element) {
            roots.value = element;
            
            var collection2 = args[1].evaluate(roots, rootValueTypes, defaultRootName, database);
            valueType = collection2.valueType;
            
            collection2.forEachValue(function(result) {
                results.push(result);
            });
        });
        
        roots.value = oldValue;
        rootValueTypes.value = oldValueType;
        
        return new ExpressionCollection(results, valueType);
    }
};

Controls["default"] = {
    f: function(
        args,
        roots, 
        rootValueTypes, 
        defaultRootName, 
        database
    ) {
        var i, collection;
        for (i = 0; i < args.length; i++) {
            collection = args[i].evaluate(roots, rootValueTypes, defaultRootName, database);
            if (collection.size > 0) {
                return collection;
            }
        }
        return new ExpressionCollection([], "text");
    }
};

Controls.filter = {
    f: function(
        args,
        roots,
        rootValueTypes,
        defaultRootName,
        database
    ) {
        var collection, oldValue, oldValueType, results;
        collection = args[0].evaluate(roots, rootValueTypes, defaultRootName, database);
       
        oldValue = roots.value;
        oldValueType = rootValueTypes.value;
       
        results = new Set();
        rootValueTypes.value = collection.valueType;
       
        collection.forEachValue(function(element) {
            roots.value = element;
           
            var collection2 = args[1].evaluate(roots, rootValueTypes, defaultRootName, database);
            if (collection2.size > 0 && collection2.contains("true")) {
                results.add(element);
            }
        });
       
        roots.value = oldValue;
        rootValueTypes.value = oldValueType;
       
        return new ExpressionCollection(results, collection.valueType);
    }
};

    // end define
    return Controls;
});
