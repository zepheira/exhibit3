/**
 * @fileOverview Format parsing
 * @author David Huynh
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "util/localizer",
    "ui/format-scanner"
], function(_, FormatScanner) {
/**
 * @namespace
 */
var FormatParser = {};

/**
 * @constant
 */
FormatParser._valueTypes = {
    "list" : true,
    "number" : true,
    "date" : true,
    "item" : true,
    "text" : true,
    "url" : true,
    "image" : true,
    "currency" : true
};

/**
 * @static
 * @param {Exhibit.UIContext} uiContext
 * @param {String} s
 * @param {Number} startIndex
 * @param {Object} results
 * @returns {Number}
 */
FormatParser.parse = function(uiContext, s, startIndex, results) {
    startIndex = startIndex || 0;
    results = results || {};
    
    var scanner = new FormatScanner(s, startIndex);
    try {
        return FormatParser._internalParse(uiContext, scanner, results, false);
    } finally {
        results.index = scanner.token() !== null ? scanner.token().start : scanner.index();
    }
};

/**
 * @param {Exhibit.UIContext} uiContext
 * @param {String} s
 * @param {Number} startIndex
 * @param {Object} results
 * @returns {Number}
 */ 
FormatParser.parseSeveral = function(uiContext, s, startIndex, results) {
    startIndex = startIndex || 0;
    results = results || {};
    
    var scanner = new FormatScanner(s, startIndex);
    try {
        return FormatParser._internalParse(uiContext, scanner, results, true);
    } finally {
        results.index = scanner.token() !== null ? scanner.token().start : scanner.index();
    }
};

/**
 * @param {Exhibit.UIContext} uiContext
 * @param {Exhibit.FormatScanner} scanner
 * @param {Object} results
 * @param {Boolean} several
 * @returns {}
 */
FormatParser._internalParse = function(uiContext, scanner, results, several) {
    var Scanner, token, next, makePosition, enterSetting, checkKeywords, parseNumber, parseInteger, parseNonnegativeInteger, parseString, parseURL, parseExpression, parseExpressionOrString, parseChoices, parseFlags, parseSetting, parseSettingList, parseRule, parseRuleList;
    Scanner = FormatScanner;
    token = scanner.token();
    next = function() { scanner.next(); token = scanner.token(); };
    makePosition = function() {
        return token !== null ?
            token.start :
            scanner.index();
    };
    enterSetting = function(valueType, settingName, value) {
        uiContext.putSetting("format/" + valueType + "/" + settingName, value);
    };
    checkKeywords = function(valueType, settingName, keywords) {
        if (token !== null &&
            token.type !== Scanner.IDENTIFIER &&
            typeof keywords[token.value] !== "undefined") {
            enterSetting(valueType, settingName, keywords[token.value]);
            next();
            return false;
        }
        return true;
    };
    
    parseNumber = function(valueType, settingName, keywords) {
        if (checkKeywords(valueType, settingName, keywords)) {
            if (typeof token === "undefined" || token === null || token.type !== Scanner.NUMBER) {
                throw new Error(_("%format.error.missingNumber", makePosition()));
            }
            enterSetting(valueType, settingName, token.value);
            next();
        }
    };
    parseInteger = function(valueType, settingName, keywords) {
        if (checkKeywords(valueType, settingName, keywords)) {
            if (typeof token === "undefined" || token === null || token.type !== Scanner.NUMBER) {
                throw new Error(_("%format.error.missingInteger", makePosition()));
            }
            enterSetting(valueType, settingName, Math.round(token.value));
            next();
        }
    };
    parseNonnegativeInteger = function(valueType, settingName, keywords) {
        if (checkKeywords(valueType, settingName, keywords)) {
            if (typeof token === "undefined" || token === null || token.type !== Scanner.NUMBER || token.value < 0) {
                throw new Error(_("%format.error.missingNonNegativeInteger",  makePosition()));
            }
            enterSetting(valueType, settingName, Math.round(token.value));
            next();
        }
    };
    parseString = function(valueType, settingName, keywords) {
        if (checkKeywords(valueType, settingName, keywords)) {
            if (typeof token === "undefined" || token === null || token.type !== Scanner.STRING) {
                throw new Error(_("%format.error.missingString", makePosition()));
            }
            enterSetting(valueType, settingName, token.value);
            next();
        }
    };
    parseURL = function(valueType, settingName, keywords) {
        if (checkKeywords(valueType, settingName, keywords)) {
            if (typeof token === "undefined" || token === null || token.type !== Scanner.URL) {
                throw new Error(_("%format.error.missingURL", makePosition()));
            }
            enterSetting(valueType, settingName, token.value);
            next();
        }
    };
    parseExpression = function(valueType, settingName, keywords) {
        if (checkKeywords(valueType, settingName, keywords)) {
            if (typeof token === "undefined" || token === null || token.type !== Scanner.EXPRESSION) {
                throw new Error(_("%format.error.missingExpression", makePosition()));
            }
            enterSetting(valueType, settingName, token.value);
            next();
        }
    };
    parseExpressionOrString = function(valueType, settingName, keywords) {
        if (checkKeywords(valueType, settingName, keywords)) {
            if (typeof token === "undefined" || token === null || (token.type !== Scanner.EXPRESSION && token.type !== Scanner.STRING)) {
                throw new Error(_("%format.error.missingExpressionOrString", makePosition()));
            }
            enterSetting(valueType, settingName, token.value);
            next();
        }
    };
    parseChoices = function(valueType, settingName, choices) {
        var i;
        if (typeof token === "undefined" || token === null || token.type !== Scanner.IDENTIFIER) {
            throw new Error(_("%format.error.missingOption", makePosition()));
        }
        for (i = 0; i < choices.length; i++) {
            if (token.value === choices[i]) {
                enterSetting(valueType, settingName, token.value);
                next();
                return;
            }
        }
        throw new Error(_("%format.error.unsupportedOption", token.value, settingName, valueType, makePosition()));
    };
    parseFlags = function(valueType, settingName, flags, counterFlags) {
        var i, flagSet, counterFlagSet;
        while (token !== null && token.type === Scanner.IDENTIFIER) {
            flagSet = false;
            counterFlagSet = false;
            for (i = 0; i < flags.length && !flagSet; i++) {
                if (token.value === flags[i]) {
                    enterSetting(valueType, settingName + "/" + token.value, true);
                    next();
                    flagSet = true;
                }
            }
            if (!flagSet && typeof counterFlags[token.value] !== "undefined") {
                enterSetting(valueType, settingName + "/" + counterFlags[token.value], false);
                next();
                counterFlagSet = true;
            }
            if (!counterFlagSet) {
                throw new Error(_("%format.error.unsupportedFlag", token.value, settingName, valueType, makePosition()));
            }
        }
    };
    
    parseSetting = function(valueType, settingName) {
        switch (valueType) {
        case "number":
            switch (settingName) {
            case "decimal-digits":
                parseNonnegativeInteger(valueType, settingName, { "default": -1 });
                return;
            }
            break;
        case "date":
            switch (settingName) {
            case "time-zone":
                parseNumber(valueType, settingName, { "default" : null });
                return;
            case "show":
                parseChoices(valueType, settingName, [ "date", "time", "date-time" ]);
                return;
            case "mode":
                parseChoices(valueType, settingName, [ "short", "medium", "long", "full" ]);
                enterSetting(valueType, "template", null); // mode and template are exclusive
                return;
            case "template":
                parseString(valueType, settingName, {});
                enterSetting(valueType, "mode", null); // mode and template are exclusive
                return;
            }
            break;
        case "boolean":
            break;
        case "text":
            switch (settingName) {
            case "max-length":
                parseInteger(valueType, settingName, { "none" : 0 });
                return;
            }
            break;
        case "image":
            switch (settingName) {
            case "tooltip":
                parseExpressionOrString(valueType, settingName, { "none" : null });
                return;
            case "max-width":
            case "max-height":
                parseInteger(valueType, settingName, { "none" : -1 });
                return;
            }
            break;
        case "url":
            switch (settingName) {
            case "target":
                parseString(valueType, settingName, { "none" : null });
                return;
            case "external-icon":
                parseURL(valueType, settingName, { "none" : null });
                return;
            }
            break;
        case "item":
            switch (settingName) {
            case "title":
                parseExpression(valueType, settingName, { "default" : null });
                return;
            }
            break;
        case "currency":
            switch (settingName) {
            case "negative-format":
                parseFlags(valueType, settingName, 
                    [ "red", "parentheses", "signed" ], 
                    { "unsigned" : "signed", "no-parenthesis" : "parentheses", "black" : "red" }
                );
                return;
            case "symbol":
                parseString(valueType, settingName, { "default" : "$", "none" : null });
                return;
            case "symbol-placement":
                parseChoices(valueType, settingName, [ "first", "last", "after-sign" ]);
                return;
            case "decimal-digits":
                parseNonnegativeInteger(valueType, settingName, { "default" : -1 });
                return;
            }
            break;
        case "list":
            switch (settingName) {
            case "separator":
            case "last-separator":
            case "pair-separator":
            case "empty-text":
                parseString(valueType, settingName, {});
                return;
            }
            break;
        }
        throw new Error(_("%format.error.unsupportedSetting", settingName, valueType, makePosition()));
    };
    parseSettingList = function(valueType) {

        while (token !== null && token.type === Scanner.IDENTIFIER) {
            var settingName = token.value;

            next();
            

            if (typeof token === "undefined" || token === null || token.type !== Scanner.DELIMITER || token.value !== ":") {
                throw new Error(_("%format.error.missingColon", makePosition()));
            }
            next();
            
            parseSetting(valueType, settingName);
            

            if (typeof token === "undefined" || token === null || token.type !== Scanner.DELIMITER || token.value !== ";") {
                break;
            } else {
                next();
            }
        }

    };
    parseRule = function() {
        if (typeof token === "undefined" || token === null || token.type !== Scanner.IDENTIFIER) {
            throw new Error(_("%format.error.missingValueType", makePosition()));
        }
        
        var valueType = token.value;
        if (typeof FormatParser._valueTypes[valueType] === "undefined") {
            throw new Error(_("%format.error.unsupportedValueType", valueType, makePosition()));
        }
        next();
        
        if (token !== null && token.type === Scanner.DELIMITER && token.value === "{") {
            next();
            parseSettingList(valueType);
            
            if (typeof token === "undefined" || token === null || token.type !== Scanner.DELIMITER || token.value !== "}") {
                throw new Error(_("%format.error.missingBrace", makePosition()));
            }
            next();
        }
        return valueType;
    };
    parseRuleList = function() {
        var valueType = "text";
        while (token !== null && token.type === Scanner.IDENTIFIER) {
            valueType = parseRule();
        }
        return valueType;
    };
    
    if (several) {
        return parseRuleList();
    } else {
        return parseRule();
    }
};

    // end define
    return FormatParser;
});
