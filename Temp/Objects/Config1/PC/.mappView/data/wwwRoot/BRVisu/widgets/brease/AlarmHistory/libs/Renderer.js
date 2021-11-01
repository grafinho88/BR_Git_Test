define([
    'widgets/brease/TableWidget/libs/Renderer',
    'brease/events/BreaseEvent'
], function (SuperClass, BreaseEvent) {
    
    'use strict';

    /** 
     * @class widgets.brease.AlarmHistory.libs.Renderer
     * Class for rendering the widget.
     */

    var RendererClass = SuperClass.extend(function Renderer(widget) {
            SuperClass.call(this);
            this.widget = widget;
        }, null),

        p = RendererClass.prototype;

    /**
     * @method setFilter
     * This method will pop the global jquery parameter for filters and apply the filtering algorithm for this specific TableWidget. 
     * As it would be impossible to keep track of which filter belongs to which TableWidget, especially when widgets are being disposed of etc, 
     * it is easier to call this method and set the filter right before filtering of data. So this method should be called before every redraw 
     * of the table. That way we can guarantee that the filter being applied to the TableWidget is the right one. THe only way to apply a filter 
     * though is by pushing a value to the the global jquery variable $.fn.dataTable.ext.search array. 
     * See: https://datatables.net/manual/plug-ins/search
     */
    p.setFilter = function () {
        var self = this;
        // if ($.fn.dataTable.ext.search.length !== 0) {
        if (!this.internal.filterSet) {
            //The function for filtering WILL ONLY BE CALLED IF THERE IS DATA IN THE TABLE!!!!
            $.fn.dataTable.ext.search.push(function (settings, data, dataIndex, row) {
                var elem = $(settings.nTable).closest('[data-brease-widget="widgets/brease/AlarmHistory"]')[0];
                if (!elem || elem.id !== self.widget.elem.id || self.widget.model.getPreparedData().length === 0) return true;

                var accVal = (self.widget.settings.config.filter.length === 0), accAnd = true;
                for (var i = 0; i < self.widget.settings.config.filter.length; i += 1) {
                    var fil = self.widget.settings.config.filter[i], compVal, origVal;
                    
                    var vals = self._getComparativeAndOriginalValue(fil, self.widget.model.currentData[dataIndex]); 
                    origVal = vals[1];
                    compVal = vals[0];
                    var val = self._getFilterStatement(origVal, fil.opVal, compVal);

                    //Split between whether we are in an 'OR' or 'AND' filter
                    if (fil.logVal === 1 || fil.logical === '') {
                        accVal = accVal || (accAnd && val);
                        accAnd = true;
                    } else if (fil.logVal === 0) {
                        accAnd = accAnd && val;
                    }
                    
                }
                return accVal;
            });
            this.internal.filterSet = true;
            this.internal.filterPos = $.fn.dataTable.ext.search.length - 1;
        }
    };

    /**
     * @method _getComparativeAndOriginalValue
     * @param {Object} fil
     * @param {String} fil.data
     * @param {Date|Integer|String} fil.comp
     * @param {Object} row
     * @returns {String[]}
     * This method will retrieve the comparative and original value from the row and filter given by the parameters and return in an array
     */
    p._getComparativeAndOriginalValue = function (fil, row) {
        var compVal, origVal;
        //Check if we are looking at time
        if (fil.data === 'tim') {
            compVal = this._fixTimestamp(fil.comp.split('Z')[0]).getTime();
            origVal = this._fixTimestamp(row.tim).getTime();
        } else if (fil.data === 'cat') {
            compVal = this.widget.model.categories[fil.comp];
            origVal = row[fil.data];
        } else {
            compVal = fil.comp;
            origVal = row[fil.data];
        }

        return [compVal, origVal];
    };

    /**
     * @method _colorMeBlue
     * @private
     * Colloquialism: color me blue - make me feel sad. Used in Blues music.
     * This method will iterate over the currently displayed data set in the data table and if a row fits the criteria selected in the styling dialog,
     * it will be given the style class that corresponds to this rule.
     */
    p._colorMeBlue = function () {
        
        if (this.widget.model.currentData === undefined || !this.dt.exists()) { return; }
        if (this.widget.model.currentData.length === 0) { return; }
        
        for (var j = 0; j < this.widget.el.find('tbody').children().length; j += 1) {
            for (var i = 0; i < this.widget.settings.config.style.length; i += 1) {

                var offset = (this.dt.getFilteredPage() * this.widget.settings.itemsPerPage) + j,
                    currRow = this.dt.getFilteredOffset(offset);
                if (currRow === undefined) {
                    continue;
                }
                var currSev = this.widget.model.currentData[currRow].sev,
                    currState = this.widget.model.currentData[currRow].stn,
                    rowEligible = this._rowEligibility(currState, currSev, this.widget.settings.config.style[i]);

                if (rowEligible) {
                    this.widget.el.find('tbody').children('tr:eq(' + j + ')').addClass('widgets_brease_AlarmHistoryStyle_style_style' + this.widget.settings.config.style[i].namePos);
                }

            }
        }
    };
    
    /**
     * @method _rowEligibility
     * Helper method for the _colorMeBlue function 
     * @private
     * @param {Integer} currState
     * @param {Integer} currSev
     * @param {Object} style
     * @param {Integer} style.statePos
     * @param {Boolean} style.sevOneUse
     * @param {Integer} style.sevOne
     * @param {Integer} style.sevOnePos
     * @param {Boolean} style.sevTwoUse
     * @param {Integer} style.sevTwo
     * @param {Integer} style.sevTwoPos
     * @param {Integer} style.sevTwoOp
     * @returns {Boolean}
     */
    p._rowEligibility = function (currState, currSev, style) {
        //First check state (act, act ack, inact)
        if (currState === style.statePos || style.statePos === 5) {
            if (style.sevOneUse && style.sevTwoUse && style.sevTwoOp === 0) {
                return this._getFilterStatement(currSev, style.sevOnePos, style.sevOne) && this._getFilterStatement(currSev, style.sevTwoPos, style.sevTwo);
            } else if (style.sevOneUse && style.sevTwoUse && style.sevTwoOp === 1) {
                return this._getFilterStatement(currSev, style.sevOnePos, style.sevOne) || this._getFilterStatement(currSev, style.sevTwoPos, style.sevTwo);
            } else if (style.sevOneUse && !style.sevTwoUse) {
                return this._getFilterStatement(currSev, style.sevOnePos, style.sevOne);
            } else {
                return true;
            }
        } else {
            return false;
        }

    };

    /**
     * @method _pageChange
     * Method to change the page via the actions specified in the widget class. It will 
     * get the currently displayed page, the last page that is part of the datatables, 
     * and finally it will forward this information to the controller.
     */
    p._pageChange = function () {
        if (this.dt.exists()) {
            var curr = this._getDataTablePageInfo().page + 1;
            var last = this.widget.controller.getTotalNumberOfPages();
            this.widget.controller._pageChange(curr, last);
        }
    };

    /**
     * @method 
     * @private
     * This method will update the total number of pages that are available to the
     * widget from the backend. If the number of pagination buttons are more than two
     * (Previous and Next) and there is no ellipsis available already; an ellipsis and
     * a last button (to navigate to load more data) will be added. If an ellipsis is
     * available the last button will just updated with the last available page from the
     * backend.
     */
    p._updateLastbutton = function () {
        if (this.internal.searchInProgress || this.widget.settings.filterConfiguration.length > 0) return;
        
        var nbrOfPages = this.widget.controller.getTotalNumberOfPages();
        if (this.widget.el.find('.paginate_button').length > 2) {
            if (this.widget.el.find('.ellipsis').length === 0 && this._getDataTablePageInfo().pages < nbrOfPages) {
                this._addEllipsis(nbrOfPages);
            } else {
                this.widget.el.find('.paginate_button:eq(-2)').text(nbrOfPages);
            }
        }
    };

    /**
     * @method 
     * @private
     * This method will add an ellipsis and a "navigation" pagination button to the pagination
     * buttons so more data can be retrieved. The eventhandler "one" is used so that jquery
     * removes it again as soon as it has been called.
     * @param {Integer} nbrOfPages the total number of pages available in the backend
     */
    p._addEllipsis = function (nbrOfPages) {
        $('<span class="ellipsis">...</span><a class="paginate_button widgets_brease_ToggleButton_style_default breaseButton"><span>' + nbrOfPages + '</span></a>')
            .one(BreaseEvent.CLICK, this._bind(this.widget.controller._scrolledToBottom))
            .insertBefore(this.widget.el.find('.paginate_button:last'));
    };

    return RendererClass;
});
