define([
    'widgets/brease/TableColumnWidget/TableColumnWidget',
    'brease/events/BreaseEvent',
    'brease/core/Types',
    'brease/enum/Enum'
], function (SuperClass, BreaseEvent, Types, Enum) {

    'use strict';

    /**
     * @class widgets.brease.AlarmHistoryItem
     * @extends widgets.brease.TableColumnWidget
     *
     * @iatMeta category:Category
     * Data
     *
     * @iatMeta description:short
     * AlarmHistoryItem, widget used to set the columns wanted to be shown in the AlarmHistory
     * @iatMeta description:de
     * Das AlarmHistoryItem-Widget stellt eine Spalte im AlarmHistory-Widget dar
     * @iatMeta description:en
     * AlarmHistoryItem, widget used to set the columns wanted to be shown in the AlarmHistory
     */

    /**
     * @property {WidgetList} parents=["widgets.brease.AlarmHistory"]
     * @inheritdoc  
     */

    /**
     * @cfg {brease.enum.AlarmHistoryItemType} columnType='message'
     * @iatStudioExposed
     * @iatCategory Behavior
     * Type the AlarmHistory column will display
     */

    var defaultSettings = {
            text: '',
            columnType: Enum.AlarmHistoryItemType.mes
        },

        WidgetClass = SuperClass.extend(function AlarmHistoryItem() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {
        SuperClass.prototype.init.call(this);
        this.el.addClass('breaseItem');
    };

    /**
     * @method setColumnType
     * Sets columnType
     * @param {brease.enum.AlarmHistoryItemType} columnType
     */
    p.setColumnType = function (columnType) {
        this.settings.columnType = columnType;
        var event = new CustomEvent('ColumnTypeChanged', { detail: { columnType: Enum.AlarmHistoryItemType.getKeyForValue(columnType) }, bubbles: true, cancelable: true });
        this.dispatchEvent(event);
    };

    /**
     * @method getColumnType 
     * Returns columnType.
     * @return {brease.enum.AlarmHistoryItemType}
     */
    p.getColumnType = function () {
        return this.settings.columnType;
    };

    p.getShortColumnType = function () {
        if (this.settings.columnType !== Enum.AlarmHistoryItemType.tim) {
            return { data: Enum.AlarmHistoryItemType.getKeyForValue(this.settings.columnType) };
        } else {
            return {
                data: Enum.AlarmHistoryItemType.getKeyForValue(this.settings.columnType),
                type: 'num',
                render: {
                    _: 'display',
                    sort: 'value'
                }
            };
        }
    };

    p.setData = function (telegram) {
        this.telegram = telegram;
    };

    return WidgetClass;
});
