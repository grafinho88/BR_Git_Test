define([
    'widgets/brease/TableWidget/libs/Controller',
    'brease/events/BreaseEvent',
    'widgets/brease/AlarmHistory/libs/Dialogue'
], function (SuperClass, BreaseEvent, ConfigDialogue) {
    
    'use strict';
    /** 
     * @class widgets.brease.AlarmHistory.libs.Controller
     * Class for controlling user and widget input and directing this either to the model or the renderer directly.
     */

    var ControllerClass = SuperClass.extend(function Controller(widget) {
            SuperClass.call(this);
            this.widget = widget;
        }, null),

        p = ControllerClass.prototype;
        
    /**
     * @method _addClassSpecificEventListeners
     * @private
     * Adds the event listener for content activated handler to the document which will trigger when the content the AlarmHistory resides in get's
     * actived.
     * @param {Function} listener
     */
    p._addClassSpecificEventListeners = function (listener) {
        document.body.addEventListener(BreaseEvent.CONTENT_ACTIVATED, listener._bind('_contentActivatedHandler'));
    };

    /* Handler */
    /**
     * @method _contentActivatedHandler
     * @private
     * @param {Object} e
     * Removes the eventlistener for content activated, sets an error message if the binding to the mplink is missing,
     * finally subscribes to the method GetUpdateCount and retrieves the list of categories from the backend.
     */
    p._contentActivatedHandler = function (e) {
        if (e.detail.contentId === this.widget.settings.parentContentId && this) {
            document.body.removeEventListener(BreaseEvent.CONTENT_ACTIVATED, this._bind('_contentActivatedHandler'));
            if (this.widget.bindings === undefined || this.widget.bindings['mpLink'] === undefined) {
                this._setMissingBindingErrorMsg();
            }
            this.widget.linkHandler.subscribeWithCallback('GetUpdateCount', this.widget._updateData);
            this.widget.model.getCategories();
        }    
    };

    /**
     * @method _contentDeactivatedHandler
     * @private
     * This method get's called when the content get's deactivated. It will unsubscribe from the server with the method
     * GetUpdateCount
     */
    p._contentDeactivatedHandler = function () {
        this.widget.linkHandler.unSubscribe('GetUpdateCount');
    };

    /**
     * @method languageChanged
     * This method will force the model to refetch the data from the backend, so the data is available in the correct
     * langauge.
     */
    p.languageChanged = function () {
        this.widget.model.reFetchData();
    };

    /* Public methods */

    /**
     * @method getEventItem
     * @param {UInteger} item
     * @returns {Object}
     * This method will retrieve the original data (un altered by timestamps and images) for the given row index, and put it into an object with readable names
     * and return this.
     */
    p.getEventItem = function (item) {
        var data = this.widget.model.getRowFromCurrentData(item);

        var value = {
            'additionalInfo1': data.ad1,
            'additionalInfo2': data.ad2,
            'category': data.cat,
            'code': data.cod,
            'instanceID': data.ins,
            'message': data.mes,
            'name': data.nam,
            'scope': data.sco,
            'severity': data.sev,
            'oldState': data.sto,
            'newState': data.stn,
            'timestamp': data.tim.substring(0, 23) + 'Z'
        };
        return value;
    };

    /**
     * @method updateData
     * ONLY to be called in the editor
     * Set's mock data in the table and updates the renderer
     */
    p.updateData = function () {
        this.widget.model.setMockData();
        this.widget.renderer.updateData();
    };

    /**
     * @method 
     * This method serves as an interface method between the renderer and the model to transfer
     * data about the number of total pages available in the backend.
     */
    p.getTotalNumberOfPages = function () {
        return this.widget.model.getTotalNumberOfPages();
    };

    /**
     * @method openConf
     * This method instantiates a new configuration dialog and opens it with the type of configuration passed in the parameter
     * @param {String} type
     */
    p.openConf = function (type) {
        this.configDialogue = new ConfigDialogue(this.widget);
        this.configDialogue.open(type);
    };

    /**
     * @method _scrolledToBottom
     * @private
     * This method will be called by the TableWidget when the scrolling starts to approach the end of the scrollable area
     */
    p._scrolledToBottom = function () {
        if (this.internal.firstItr && !this.widget.settings.paging) {
            this.widget.renderer.draw();
            this.internal.firstItr = false;
        } else {
            this.widget.model.fetchNextData();
        }
    };
    
    return ControllerClass;
});
