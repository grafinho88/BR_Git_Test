/*global define*/
define([
    'widgets/brease/TableWidget/libs/Model',
    'brease/enum/Enum'
], function (SuperClass, Enum) {

    'use strict';

    /**
     * @class widgets.brease.AlarmHistory.libs.Model
     * Class for storing data and manipulating this data
     */

    var defaultSettings = {},

        ModelClass = SuperClass.extend(function Model(widget) {
            SuperClass.apply(this, arguments);
            this.widget = widget;
            this.categories = [];
            this.currentData = [];
            this.firstConnection = true;
            
            //Throttle the retrieving of new data so we dont spam the backend with request,
            //try to collect these and send at an interval instead
            this.sendDataThrottle = _.throttle(this._sendData, this.settings.fetchInterval);
        }, defaultSettings),

        p = ModelClass.prototype;

    /**
     * @method updateNextData
     * @private
     * Updates the data model but without calling the rerender function of the table, only updates the data in the datatable
     * @param {Object} telegram
     */
    p.updateNextData = function (telegram) {
        if ((this.prevTelegram && this.prevTelegram.parameter.ToRecordIndex >= telegram.parameter.FromRecordIndex) || this.prevTelegram === undefined) {
            this.updateTable(telegram.data);
            //Add Alarm pictures to the alarm list and fix timestamp at the same time
            for (var itr = 0; itr < telegram.data.length; itr += 1) {
                telegram.data[itr] = this._fixItem(telegram.data[itr]);
            }
            this.prevTelegram = telegram;
            this.updateFixedData(telegram.data);
            this.widget.renderer.updateNextData(telegram.data);
        }
    };

    /**
     * @method updateTable
     * @private
     * This method will store the retrieved data in the variable currentData.
     * It will then create a dictionary with the specified key of the two
     * arrays and then merge these together. This way no double entries will
     * be allowed. New data will overwrite old data.
     *
     * @param {Object[]} data An array of data as defined by the /docs/MpAlarmHistory_WidgetConnection.docx
     */
    p.updateTable = function (data) {
        this.currentData = this.currentData.concat($.extend(true, [], data));
        this.currentData = this._discardData(this.currentData);
    };

    /**
     * @method updateFixedData
     * @private
     * This method will store the retrieved data in the variable currentData.
     * It will then create a dictionary with the specified key of the two
     * arrays and then merge these together. This way no double entries will
     * be allowed. New data will overwrite old data.
     *
     * @param {Object[]} data An array of data as defined by the /docs/MpAlarmHistory_WidgetConnection.docx
     */
    p.updateFixedData = function (data) {
        this.data = this.data.concat($.extend(true, [], data));
    };

    /**
     * @method prepareData
     * @private
     * This method will go through the stored in the this.data variable and fix the image paths for the columns Status Old, Status New, Categories
     * and the timestamp for Timestamp column. This data will overwrite the original data so that it can be displayed as the user has defined in the
     * property grid. The function will then call the updateData method which will update the DataTable with the latest data.
     */
    p.prepareData = function (data) {

        //Add Alarm pictures to the alarm list and fix timestamp at the same time
        for (var itr = 0; itr < data.length; itr += 1) {
            this.data.push(this._fixItem(data[itr]));
        }

        //To minimize the number of iterations where we repeat the fixItem for new data
        //we only check new data.
        this.data = this._discardData(this.data);
        if (!brease.config.editMode) {
            this.widget.renderer.updateData();
        }
    };

    p._discardData = function (data) {
        if (data.length > 0) {
            data = _.uniqBy(data, 'RecordIndex');
            var firstItem = this.widget.settings.firstItem;
            if (this.getLowestRowIndex(data) < firstItem) {
                data = _.remove(data, function (n) { return n.RecordIndex >= firstItem; });
            }
        }
        return data;
    };

    /**
     * @method prepareTelegram
     * @private
     * This method will go through the stored in the this.data variable and fix the image paths for the columns Status Old, Status New, Categories
     * and the timestamp for Timestamp column. This data will overwrite the original data so that it can be displayed as the user has defined in the
     * property grid. The function will then call the updateData method which will update the DataTable with the latest data.
     */
    p.prepareTelegram = function (data) {
        this.telegram = $.extend(true, {}, data);

        //Add Alarm pictures to the alarm list and fix timestamp at the same time
        for (var itr = 0; itr < this.telegram.length; itr += 1) {
            this.telegram[itr] = this._fixItem(this.telegram[itr]);
        }

    };

    /**
     * @method setMockData
     * Only to be called in the editor. Will grab some mock data to display in the editor.
     */
    p.setMockData = function () {
        if (!brease.config.editMode) { return false; }
        this.fetchData(_mockEditorData());
    };

    /**
     * @method getInstanceId
     * This method get's an integer and returns the instance id from the row on that position.
     * @param {Integer} selectedIndex the current poistion of the original data to be returned
     * @returns {String} the instance id of the row given by the selected index
     */
    p.getInstanceId = function (selectedIndex) {
        return this.currentData[selectedIndex].ins;
    };

    /**
     * @method setData
     * intermediary function to handle the telegram in the correct place.
     * @param {Object} telegram
     */
    p.setData = function (telegram) {
        switch (telegram.methodID) {
            case 'GetCategoryList':
                this.setCategories(telegram);
                break;
            default:
                this.fetchData(telegram);
                break;
        }
    };

    /**
     * @method setCategories
     * This method retrieves a telegram with data about the available categories in the backend, it removes duplicates and
     * stores these in a parameter so that when the filter dialog is opened these values will be available.
     * @param {Object} telegram data telegram from backend
     */
    p.setCategories = function (telegram) {
        this.categories = $.extend(true, [], _.uniq(telegram.data));
    };

    /**
     * @method resetTable
     * This method resets the data that has been stored and updates the renderer so that the table becomes empty.
     */
    p.resetTable = function () {
        this.data = [];
        this.currentData = [];
        this.categories = [];
        this.widget.renderer.updateData();
    };

    /**
     * @method fetchData
     * @private
     * The fetchData is the brain behind the AlarmHistory. It will decided where data should go, if more should be retrieved. When the methodId for the telegram is
     * 'GetUpdateCount' the method will start fetching data if
     * non is available, interrupt the data fetch if new data has been made available in the backend, continue fetching data where it left of if a page change is
     * made while loading data, or if it should reset the fetch from the very beginning (for example at a language change). If data is returned with the methodId
     * 'GetAlarmHistory' then the data is passed to a function that stores the data and continues the retrieve.
     * @param {Object} telegram
     */
    p.fetchData = function (telegram) {
        if (telegram === null) { return; }
        var telegramCopy = $.extend(true, {}, telegram);

        if (telegramCopy.methodID === 'GetUpdateCount') {
            //Start
            this.widget._showBusyIndicator();
            if (this.widget.settings.counter === 0) {
                this.startFetch(telegramCopy);

            //Reset data if telegram data is 0
            } else if (telegramCopy.data.ActualId === 0) {
                this.resetFetch();
            //Refetches data if value is less than the largest audit value we recieve
            } else if (telegramCopy.data.ActualId < this.widget.settings.counter) {
                this._updateCounters(telegram.data);
                this.reFetchData();
            //If new audit is set while fetching data
            } else {
                this.continueFetch(telegramCopy);
            }
        } else if (telegramCopy.methodID === 'GetAlarmHistory') {
            if (telegramCopy.parameter.NextData) {
                this.updateNextData(telegramCopy);
            } else {
                this.getData(telegramCopy);
            }
        }
    };

    /**
     * @method startFetch
     * @private
     * when there is no data stored, the telegram will receive the total number of rows in the backend on the data parameter, this is used to set the counter
     * to how far we need to count before all data is stored in the front end. Observer though that the count is down and not up - we end on 0. After that the
     * currentIteration is set to 0, and the figure out from where to where in the dataset we should get data from. It all depends on the number of rows and
     * the number of rows we allow per fetch (currently at 1000 rows). Then the sendData to stitch together the necessary telegram the backend needs to
     * return the right data set.
     * @param {Object} telegram
     */
    p.startFetch = function (telegram) {
        this._updateCounters(telegram.data);
        this.getFrom = telegram.data.ActualId;
        this.getTo = telegram.data.ActualId - this.settings.rowsPerFetch;
        this.sendData(this.getFrom, this.getTo);
    };

    /**
     * @method continueFetch
     * We continue fetching data where we stopped
     * @param {Object} telegram
     */
    p.continueFetch = function (telegram) {
        this.getFrom = telegram.data.ActualId;
        this.getTo = this.getHighestRowIndex(); //this.widget.settings.counter;
        this._updateCounters(telegram.data);
        
        if (this.currentData.length > this.data.length) {
            this.prepareData($.extend(true, [], this.currentData));   
        }
        this.sendDataThrottle();
    };

    /**
     * @method reFetchData
     * This method can be called when all stored data should be reset to scratch and new data retrieved from the backend. One such example is at a
     * language change as the old language needs to be removed from the table. It will however not purge the table from data.
     */
    p.reFetchData = function () {
        this._resetData();
        this.resetTable();
        if (this.widget.settings.counter > 0) {
            this.widget._showBusyIndicator();
            this.getFrom = this.widget.settings.counter;
            this.getTo = this.widget.settings.counter - this.widget.settings.rowsPerFetch;
            this.sendData(this.getFrom, this.getTo);
        }
    };

    /**
     * @method resetFetch
     * The resetFetch takes values one step further and resets every variable in the fetch algorithm before also resetting the table and displaying an
     * empty table.
     */
    p.resetFetch = function () {
        this._resetData();
        this.widget.settings.counter = 0;
        this.resetTable();
    };

    /**
     * @method fetchNextData
     * this method will fetch the next set of data, i.e. the next 1000 rows.
     * @param {Boolean} force this parameter forces a read from the backend if set to true
     */
    p.fetchNextData = function (force) {
        this.getFrom = this._getFromData();
        this.getTo = this._getToData();
        this.sendData(this.getFrom, this.getTo, true, force);
    };

    /**
     * @method _resetData
     * @private
     * This method will reset data, should be called by reFetchData and resetFetch
     */
    p._resetData = function () {
        this.currentIteration = 0;
        this.prevTelegram = undefined;
        this.getFrom = this.settings.rowsPerFetch;
        this.getTo = 0;
        this.data = [];
        this.currentData = [];
    };

    /**
     * @method getData
     * stores the data it has just recieved by calling the updateTable. It then increases the iteration, recalculates the to and from variables so that the next
     * iteration and sends a telegram to get the next data set. If there are no more datasets then it will call for a preparation of data before displaying it in
     * the DataTables.
     * @param {Object} telegram
     */
    p.getData = function (telegram) {
        this.widget.settings.langChanged = false;
        this.updateTable(telegram.data);
        this.prepareData(telegram.data);
    };
    p.getLowestRowIndex = function (data) {
        var min = 0;
        if (data.length > 0) {
            min = _.minBy(data, 'RecordIndex').RecordIndex;
        }
        return min;
    };

    p.getHighestRowIndex = function () {
        var max = 0;
        if (this.currentData.length > 0) {
            max = _.maxBy(this.currentData, 'RecordIndex').RecordIndex;
        }
        return max;
    };

    /**
     * @method _getFromData
     * Returns the value from where the data should be selected
     * @returns {UInteger}
     */
    p._getFromData = function () {
        return (this.currentData.length > 0) ? _.minBy(this.currentData, 'RecordIndex').RecordIndex - 1 : this.settings.rowsPerFetch;
    };
    /**
     * @method _getToData
     * Returns the value to where the data should be selected
     * @returns {UInteger}
     */
    p._getToData = function () {
        return (this.currentData.length > 0) ? Math.max(_.minBy(this.currentData, 'RecordIndex').RecordIndex - this.settings.rowsPerFetch - 1, 0) : 0;
    };

    /**
     * @method getDataForItem
     * This method get's an integer and returns the object row from the row on that position.
     * @param {Integer} item the current poistion of the original data to be returned
     * @returns {Object} row in the data table of original data
     */
    p.getDataForItem = function (item) {
        return this.currentData[item];
    };

    p._sendData = function () {
        this.sendData(this.getFrom, this.getTo);
    };

    /**
     * @method sendData
     * From is the higher number, to is the lower number
     * @param {Integer} from the number from where in the dataset we get data
     * @param {Integer} to the number form where to in the dataset we get data
     * @param {Boolean} nextData boolean to indicate if an extra parameter is to be added that is used by the front end to determine if data should be added or appended
     * @param {Boolean} force if set to true, all values will be disregarded and a GetList will be sent to the backend no matter what
     */
    p.sendData = function (from, to, nextData, force) {
        to = Math.max(to, this.settings.firstItem);
        var params = { 'FromRecordIndex': from, 'ToRecordIndex': to };
        if (nextData) {
            params['NextData'] = true;
        }
        if (force || from >= this.settings.firstItem) {
            if (brease.config.preLoadingState) return;
            this.widget.linkHandler.sendRequestAndProvideCallback('GetAlarmHistory', this.widget._updateData, undefined, params);
        } else {
            this.widget._hideBusyIndicator();
        }
    };

    /**
     * @method getCategories
     * This method will send a telegram to the backend to get a list of all categories
     */
    p.getCategories = function () {
        if (brease.config.preLoadingState) return;
        this.widget.linkHandler.sendRequestAndProvideCallback('GetCategoryList', this.widget._updateData);
    };

    p.sendAckData = function (telegram, ackAllFlag) {
        this.ackAllFlag = (ackAllFlag !== undefined) ? ackAllFlag : false;
        this.widget.submitMpLinkData(telegram);
    };

    p._fixItem = function (item) {
        item.stn = this._addSVGToRow(item.stn);
        item.sto = this._addSVGToRow(item.sto);
        item.cat = this._fixCategory(item.cat);
        item.tim = this._fixTimestamp(item.tim);
        return item;
    };

    p._updateCounters = function (counter) {
        this.widget.settings.counter = counter.ActualId;
        this._updateOldestId(counter.OldestId);
        this.setTotalNumberOfPages();
    };

    p._updateOldestId = function (OldestId) {
        if (OldestId === undefined) return;
        this.widget.settings.firstItem = OldestId;
    };

    p.setTotalNumberOfPages = function () {
        var totalNumberOfItems = Math.abs(this.widget.settings.counter - this.widget.settings.firstItem + 1);
        this.internal.totalPages = Math.ceil(totalNumberOfItems / this.settings.itemsPerPage);
    };

    p.getTotalNumberOfPages = function () {
        return this.internal.totalPages;
    };

    p._addSVGToRow = function (sta) {

        if (isNaN(sta)) {
            //get nested number if anything else is sent in
            sta = parseInt(sta.match(/>[0-9]</)[0].match(/[0-9]/)[0]);
        }

        var img = '';
        if (sta === 1) {
            img = (this.widget.settings.imageActive === '') ? 'widgets/brease/AlarmHistory/assets/act.svg' : this.widget.settings.imageActive;
        } else if (sta === 2) {
            img = (this.widget.settings.imageInactive === '') ? 'widgets/brease/AlarmHistory/assets/inact.svg' : this.widget.settings.imageInactive;
        } else if (sta === 3) {
            img = (this.widget.settings.imageAcknowledged === '') ? 'widgets/brease/AlarmHistory/assets/ack.svg' : this.widget.settings.imageAcknowledged;
        } else if (sta === 4) {
            img = (this.widget.settings.imageUnacknowledged === '') ? 'widgets/brease/AlarmHistory/assets/unack.svg' : this.widget.settings.imageUnacknowledged;
        }

        return "<img src='" + img + "' /><div class='stateIdent'>" + sta + '</div>';
    };

    /**
     * @method _fixCategory
     * @private
     * This method will change the category to the image path that the category will need where the image is stored.
     * Then add it to the image tag and return this.
     * @param {String} cat the category for a given row
     * @returns {String} Image tag in the format of a string to be used in the datatable
     */
    p._fixCategory = function (cat) {
        var img = '';
        if (brease.config.editMode) {
            img = '<img src="widgets/brease/AlarmHistory/assets/' + cat + '.svg" /><div class="catIdent">' + cat + '</div>';
        } else if (cat.length > 0 && this.widget.settings.imagePrefix.length > 0) {
            img = '<img src="' + this.widget.settings.imagePrefix + cat + this.widget.settings.imageSuffix + '" /><div class="catIdent">' + cat + '</div>';
        } else if (cat.length > 0) {
            img = '<img src="" /><div class="catIdent">' + cat + '</div>';
        }
        return img;
    };
    
    /**
     * @method suspend
     * method that adds the possibility to suspend of information. Can be overridden in the derived widgets if necessary.
     */
    p.suspend = function () {
        this.sendDataThrottle.cancel();
    };
    
    /**
     * @method dispose
     * method that adds the possibility to dipose of information. Can be overridden in the derived widgets if necessary.
     */
    p.dispose = function () {
        this.sendDataThrottle.cancel();
    };

    /**
     * @method _mockEditorData
     * @private
     * @returns {Object} telegram for editor, not to be used in runtime
     */
    function _mockEditorData() {
        var mockData = {
            'data': [
                { 'RecordIndex': 0, 'ins': 0, 'ad1': '', 'ad2': '', 'cat': 'cat0', 'cod': 10, 'mes': 'All these alarms are mocked and are in no way real', 'nam': 'Mocked Alarm', 'sco': '', 'sev': 1, 'stn': 2, 'sto': 1, 'tim': '1970-01-01T00:00:00.000Z' },
                { 'RecordIndex': 1, 'ins': 1, 'ad1': '', 'ad2': '', 'cat': 'cat1', 'cod': 2000, 'mes': 'Mocked:  Temperature level is critical ', 'nam': 'Mocked:  TemperatureCritical', 'sco': '', 'sev': 1, 'stn': 4, 'sto': 3, 'tim': '1970-01-01T11:33:15.141Z' },
                { 'RecordIndex': 2, 'ins': 2, 'ad1': '', 'ad2': '', 'cat': 'cat1', 'cod': 2001, 'mes': 'Mocked:  Temperature level is high', 'nam': 'Mocked:  TemperatureHigh', 'sco': '', 'sev': 2, 'stn': 2, 'sto': 1, 'tim': '1970-01-01T11:33:15.141Z' },
                { 'RecordIndex': 3, 'ins': 3, 'ad1': '', 'ad2': '', 'cat': 'cat2', 'cod': 0, 'mes': 'Mocked:  Initialization failed,  temperatureerror', 'nam': 'Mocked:  InitializationError', 'sco': 'gAxisBasic', 'sev': 2, 'stn': 3, 'sto': 2, 'tim': '1970-01-01T11:31:56.541Z' },
                { 'RecordIndex': 4, 'ins': 4, 'ad1': '', 'ad2': '', 'cat': 'cat2', 'cod': 0, 'mes': 'Mocked:  General axis error', 'nam': 'Mocked:  GeneralDriveError', 'sco': 'gAxisBasic', 'sev': 1, 'stn': 4, 'sto': 3, 'tim': '1970-01-01T11:31:56.341Z' },
                { 'RecordIndex': 5, 'ins': 5, 'ad1': '', 'ad2': '', 'cat': 'cat0', 'cod': 0, 'mes': 'Mocked:  Sequence import failed', 'nam': 'Mocked:  ImportFailed', 'sco': 'gSequencer', 'sev': 1, 'stn': 4, 'sto': 3, 'tim': '1970-01-01T11:31:55.741Z' },
                { 'RecordIndex': 6, 'ins': 6, 'ad1': '', 'ad2': '', 'cat': 'cat0', 'cod': 0, 'mes': 'Mocked:  Sequence import failed', 'nam': 'Mocked:  ImportFailed', 'sco': 'gSequencer', 'sev': 1, 'stn': 3, 'sto': 2, 'tim': '1970-01-01T11:31:55.865Z' }
            ],
            'parameter': {},
            'methodID': 'GetAlarmHistory',
            'response': 'OK'
        };

        return mockData;
    }

    return ModelClass;

});
