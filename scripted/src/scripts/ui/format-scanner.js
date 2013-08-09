define([
    "../util/localizer",
    "../data/expression-parser"
], function(_, ExpressionParser) {
/**
 * @class
 * @constructor
 * @param {String} text
 * @param {Number} startIndex
 */
var FormatScanner = function(text, startIndex) {
    this._text = text + " "; // make it easier to parse
    this._maxIndex = text.length;
    this._index = startIndex;
    this.next();
};

/**
 * @constant
 */
FormatScanner.DELIMITER     = 0;
/**
 * @constant
 */
FormatScanner.NUMBER        = 1;
/**
 * @constant
 */
FormatScanner.STRING        = 2;
/**
 * @constant
 */
FormatScanner.IDENTIFIER    = 3;
/**
 * @constant
 */
FormatScanner.URL           = 4;
/**
 * @constant
 */
FormatScanner.EXPRESSION    = 5;
/**
 * @constant
 */
FormatScanner.COLOR         = 6;

/**
 * @returns {Object}
 */
FormatScanner.prototype.token = function() {
    return this._token;
};

/**
 * @returns {Number}
 */
FormatScanner.prototype.index = function() {
    return this._index;
};

/**
 *
 */
FormatScanner.prototype.next = function() {
    this._token = null;

    var self, skipSpaces, i, c1, c2, identifier, openParen, closeParen, j, o, expression;
    
    self = this;
    skipSpaces = function(x) {
        while (x < self._maxIndex &&
            " \t\r\n".indexOf(self._text.charAt(x)) >= 0) {
            
            x++;
        }
        return x;
    };
    this._index = skipSpaces(this._index);
    
    if (this._index < this._maxIndex) {
        c1 = this._text.charAt(this._index);
        c2 = this._text.charAt(this._index + 1);
        
        if ("{}(),:;".indexOf(c1) >= 0) {
            this._token = {
                type:   FormatScanner.DELIMITER,
                value:  c1,
                start:  this._index,
                end:    this._index + 1
            };
            this._index++;
        } else if ("\"'".indexOf(c1) >= 0) { // quoted strings
            i = this._index + 1;
            while (i < this._maxIndex) {
                if (this._text.charAt(i) === c1 && this._text.charAt(i - 1) !== "\\") {
                    break;
                }
                i++;
            }
            
            if (i < this._maxIndex) {
                this._token = {
                    type:   FormatScanner.STRING,
                    value:  this._text.substring(this._index + 1, i).replace(/\\'/g, "'").replace(/\\"/g, '"'),
                    start:  this._index,
                    end:    i + 1
                };
                this._index = i + 1;
            } else {
                throw new Error(_("%format.error.unterminatedString", this._index));
            }
        } else if (c1 === "#") { // color
            i = this._index + 1;
            while (i < this._maxIndex && this._isHexDigit(this._text.charAt(i))) {
                i++;
            }
            
            this._token = {
                type:   FormatScanner.COLOR,
                value:  this._text.substring(this._index, i),
                start:  this._index,
                end:    i
            };
            this._index = i;
        } else if (this._isDigit(c1)) { // number
            i = this._index;
            while (i < this._maxIndex && this._isDigit(this._text.charAt(i))) {
                i++;
            }
            
            if (i < this._maxIndex && this._text.charAt(i) === ".") {
                i++;
                while (i < this._maxIndex && this._isDigit(this._text.charAt(i))) {
                    i++;
                }
            }
            
            this._token = {
                type:   FormatScanner.NUMBER,
                value:  parseFloat(this._text.substring(this._index, i)),
                start:  this._index,
                end:    i
            };
            this._index = i;
        } else { // identifier
            i = this._index;
            while (i < this._maxIndex) {
                j = this._text.substr(i).search(/\W/);
                if (j > 0) {
                    i += j;
                } else if ("-".indexOf(this._text.charAt(i)) >= 0) {
                    i++;
                } else {
                    break;
                }
            }
            
            identifier = this._text.substring(this._index, i);
            if (identifier === "url") {
                openParen = skipSpaces(i);
                if (this._text.charAt(openParen) === "(") {
                    closeParen = this._text.indexOf(")", openParen);
                    if (closeParen > 0) {
                        this._token = {
                            type:   FormatScanner.URL,
                            value:  this._text.substring(openParen + 1, closeParen),
                            start:  this._index,
                            end:    closeParen + 1
                        };
                        this._index = closeParen + 1;
                    } else {
                        throw new Error(_("%format.error.missingCloseURL", this._index));
                    }
                }
            } else if (identifier === "expression") {
                openParen = skipSpaces(i);
                if (this._text.charAt(openParen) === "(") {
                    o = {};
                    expression = ExpressionParser.parse(this._text, openParen + 1, o);
                    
                    closeParen = skipSpaces(o.index);
                    if (this._text.charAt(closeParen) === ")") {
                        this._token = {
                            type:   FormatScanner.EXPRESSION,
                            value:  expression,
                            start:  this._index,
                            end:    closeParen + 1
                        };
                        this._index = closeParen + 1;
                    } else {
                        throw new Error("Missing ) to close expression at " + o.index);
                    }
                }
            } else {
                this._token = {
                    type:   FormatScanner.IDENTIFIER,
                    value:  identifier,
                    start:  this._index,
                    end:    i
                };
                this._index = i;
            }
        }
    }
};

/**
 * @param {String} c
 * @returns {Boolean}
 */
FormatScanner.prototype._isDigit = function(c) {
    return "0123456789".indexOf(c) >= 0;
};

/**
 * @param {String} c
 * @returns {Boolean}
 */
FormatScanner.prototype._isHexDigit = function(c) {
    return "0123456789abcdefABCDEF".indexOf(c) >= 0;
};

    // end define
    return FormatScanner;
});
