define(['widgets/brease/TableWidget/TableWidget',
    'widgets/brease/AlarmHistory/libs/Model',
    'widgets/brease/AlarmHistory/libs/Controller',
    'widgets/brease/AlarmHistory/libs/Config',
    'widgets/brease/AlarmHistory/libs/Renderer',
    'widgets/brease/common/MpLinkHandler/libs/MpLinkHandler'
], function (SuperClass, Model, Controller, AlarmConfig, Renderer, MpLinkHandler) {
    
    'use strict';

    /**
     * @class widgets.brease.AlarmHistory
     * @breaseNote 
     * @extends widgets.brease.TableWidget
     * @requires widgets.brease.AlarmHistoryStyle
     * @iatMeta studio:isContainer
     * true
     * 
     * @iatMeta category:Category
     * Data,Alarm
     *
     * @iatMeta description:short
     * AlarmHistory widget that connects to the MpAlarmXHistory to display a list of historic alarms
     * @iatMeta description:de
     * Das AlarmHistory-Widget bietet die notwendige Schnittstelle zu MpAlarmXHistory für die Auflistung der historischen Systemalarme
     * @iatMeta description:en
     * AlarmHistory widget that connects to the MpAlarmXHistory to display a list of historic alarms
     */

    /**
     * @event ItemClick
     * @iatStudioExposed
     * Fired when a row is clicked on.
     * @param {String} additionalInfo1
     * @param {String} additionalInfo2
     * @param {String} category
     * @param {Integer} code
     * @param {Integer} instanceID
     * @param {String} message
     * @param {String} name
     * @param {String} scope
     * @param {Integer} severity
     * @param {Integer} oldState
     * @param {Integer} newState
     * @param {String} timestamp
     * @param {String} horizontalPos horizontal position of click in pixel i.e '10px'
     * @param {String} verticalPos vertical position of click in pixel i.e '10px'
     */

    /**
     * @event ItemDoubleClick
     * @iatStudioExposed
     * Fired when a row is double clicked on.
     * @param {String} additionalInfo1
     * @param {String} additionalInfo2
     * @param {String} category
     * @param {Integer} code
     * @param {Integer} instanceID
     * @param {String} message
     * @param {String} name
     * @param {String} scope
     * @param {Integer} severity
     * @param {Integer} oldState
     * @param {Integer} newState
     * @param {String} timestamp
     * @param {String} horizontalPos horizontal position of click in pixel i.e '10px'
     * @param {String} verticalPos vertical position of click in pixel i.e '10px'
     */

    /**
     * @property {WidgetList} children=["widgets.brease.AlarmHistoryItem"]
     * @inheritdoc  
     */

    var defaultSettings = AlarmConfig,

        WidgetClass = SuperClass.extend(function AlarmHistory() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.initModel = function () {
        this.linkHandler = new MpLinkHandler(this);
        this.model = new Model(this);
        this.model.initialize();
    };

    p.initController = function () {
        this.controller = new Controller(this);
        this.controller.initialize();
    };

    p.initRenderer = function () {
        this.renderer = new Renderer(this);
        this.renderer.initialize();
    };

    /**
     * @method setImagePrefix
     * Sets imagePrefix
     * @param {DirectoryPath} imagePrefix
     */
    p.setImagePrefix = function (imagePrefix) {
        this.settings.imagePrefix = imagePrefix;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImagePrefix
     * Returns imagePrefix
     * @return {DirectoryPath}
     */
    p.getImagePrefix = function () {
        return this.settings.imagePrefix;
    };

    /**
     * @method setImageSuffix
     * Sets imageSuffix
     * @param {ImageType} imageSuffix
     */
    p.setImageSuffix = function (imageSuffix) {
        this.settings.imageSuffix = imageSuffix;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageSuffix
     * Returns imageSuffix
     * @return {ImageType}
     */
    p.getImageSuffix = function () {
        return this.settings.imageSuffix;
    };
    
    /**
     * @method setImageActive
     * Sets imageActive
     * @param {ImagePath} imageActive
     */
    p.setImageActive = function (imageActive) {
        this.settings.imageActive = imageActive;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageActive
     * Returns imageActive
     * @return {ImagePath}
     */
    p.getImageActive = function () {
        return this.settings.imageActive;
    };

    /**
     * @method setImageInactive
     * Sets imageInactive
     * @param {ImagePath} imageInactive
     */
    p.setImageInactive = function (imageInactive) {
        this.settings.imageInactive = imageInactive;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageInactive
     * Returns imageInactive
     * @return {ImagePath}
     */
    p.getImageInactive = function () {
        return this.settings.imageInactive;
    };

    /**
     * @method setImageAcknowledged
     * Sets imageAcknowledged
     * @param {ImagePath} imageAcknowledged
     */
    p.setImageAcknowledged = function (imageAcknowledged) {
        this.settings.imageAcknowledged = imageAcknowledged;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageAcknowledged
     * Returns imageAcknowledged
     * @return {ImagePath} imageAcknowledged
     */
    p.getImageAcknowledged = function () {
        return this.settings.imageAcknowledged;
    };

    /**
     * @method setImageUnacknowledged
     * Sets imageUnacknowledged
     * @param {ImagePath} imageUnacknowledged
     */
    p.setImageUnacknowledged = function (imageUnacknowledged) {
        this.settings.imageUnacknowledged = imageUnacknowledged;
        if (brease.config.editMode) {
            this.controller.updateData();
        }
    };

    /**
     * @method getImageUnacknowledged
     * Returns imageUnacknowledged
     * @return {ImagePath} imageUnacknowledged
     */
    p.getImageUnacknowledged = function () {
        return this.settings.imageUnacknowledged;
    };

    //---------------------------- MPLINK BEGIN ----------------------------

    /**
     * @method setMpLink
     * Data is received from 
     * @param {MpComIdentType} telegram
     */
    p.setMpLink = function (telegram) {
        //We do not want to deal with data transfer in precaching mode
        if (brease.config.preLoadingState) return;
        this.linkHandler.incomingMessage(telegram);
    };

    /**
     * @method getMpLink
     * At initialization it is called, it may not be called later
     * @return {Object}
     */
    p.getMpLink = function () {
        return this.settings.mpLink;
    };

    p._updateData = function (message, telegram) {
        if (!message.includes('Error')) {
            this.model.setData(telegram);
        }
    };

    //----------------------------- MPLINK END -----------------------------

    p.dispose = function () {
        this.controller._contentDeactivatedHandler();
        SuperClass.prototype.dispose.apply(this, arguments);
    };

    p.wake = function () {
        this.controller._addClassSpecificEventListeners(this.controller);
        SuperClass.prototype.wake.apply(this, arguments);
    };

    p.suspend = function () {
        this.controller._contentDeactivatedHandler();
        this.linkHandler.reset();
        SuperClass.prototype.suspend.apply(this, arguments);
    };

    return WidgetClass;
});
