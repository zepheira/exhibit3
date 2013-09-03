/**
 * @fileOverview Generate a histgoram
 * @author SkyeWM
 * @author Qing Lyne Gao
 * @author Karan Sagar
 * @author Margaret Leibovic
 * @author <a href="mailto:ryanlee@zepheira.com">Ryan Lee</a>
 */

define([
    "lib/jquery"
], function($) {
    var Histogram = {};

    /**
     * @param {Element|jQuery} el
     * @param {Number} width
     * @param {Number} height
     * @returns {jQuery}
     */
    Histogram.create = function(el, width, height) {
        var histo = $(el)
            .css({
                "width": width,
                "height": height
            });
        return histo;
    };

    /**
     * @param {Array} data
     * @param {Element|jQuery} histogram
     * @param {Boolean} horizontal
     * @returns {jQuery}
     */
    Histogram.update = function(data, histogram, horizontal) {
        var len, max, width, maxHeight, ratio, i, height, bar;

        len = data.length;
        max = Math.max.apply(Math, data);
        if (!isFinite(max)) {
            return null;
        }

        if (horizontal) {
            width = $(histogram).width() / len; // width of each bar
            maxHeight = $(histogram).height();
            ratio = maxHeight / max;

            $(histogram).empty();
            
            for (i = 0; i < len; i++) {
                height = Math.ceil(data[i] * ratio);
                bar = $("<div>")
                    .width(width)
                    .height(height)
                    .css({
                        "position": "absolute",
                        "top": maxHeight - height,
                        "left": i * width
                    });
                if (height === 0) {
                    bar.hide();
                }
                $(histogram).append(bar);
            }
        } else {
            width = $(histogram).height() / len;
            maxHeight = $(histogram).width();
            ratio = maxHeight / max;

            $(histogram).empty();

            for (i = 0; i < len; i++) {
                height = Math.round(data[i] * ratio);
                bar = $("<div>")
                    .height(width)
                    .width(height)
                    .css({
                        "position": "absolute",
                        "left": 0,
                        "top": i * width
                    });
                $(histogram).append(bar);
            }
        }

        return $(histogram);
    };

    return Histogram;
});
