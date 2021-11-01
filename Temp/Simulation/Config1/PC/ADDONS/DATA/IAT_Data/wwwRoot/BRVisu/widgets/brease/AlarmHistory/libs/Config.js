define(function () {
    
    'use strict';   
    
    /**
     * @class widgets.brease.AlarmHistory.libs.Config
     * @extends core.javascript.Object
     * @override widgets.brease.AlarmHistory
     */

    /**
     * @cfg {DirectoryPath} imagePrefix=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @groupRefId Icons
     * @groupOrder 1
     * Path to the image used for the images in the category. The images have to specifed in the backend at the MpAlarmX. See help for more information.
     */

    /**
     * @cfg {ImageType} imageSuffix='.png'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @groupRefId Icons
     * @groupOrder 1
     * File extension used for the images in the category. The image names have to specifed in the backend at the MpAlarmX. See help for more information.
     */

    /**
     * @cfg {ImagePath} imageInactive=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @groupRefId Icons
     * @groupOrder 1
     * Path to the image used for state "Inactive". If no image is defined, a predefined image will be used.
     */

    /**
     * @cfg {ImagePath} imageActive=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @groupRefId Icons
     * @groupOrder 1
     * Path to the image used for state "Active". If no image is defined, a predefined image will be used.
     */

    /**
     * @cfg {ImagePath} imageAcknowledged=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @groupRefId Icons
     * @groupOrder 2
     * Path to the image used for state "Acknowledged". If no image is defined, a predefined image will be used.
     */

    /**
     * @cfg {ImagePath} imageUnacknowledged=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * @groupRefId Icons
     * @groupOrder 3
     * Path to the image used for state "unacknowledged". If no image is defined, a predefined image will be used.
     */

    /**
     * @cfg {MpComIdentType} mpLink=''
     * @iatStudioExposed
     * @bindable
     * @not_projectable
     * @iatCategory Data
     * Link to a MpAlarmXHistory component
     */
        
    return {
        rowsPerFetch: 1000,
        fetchInterval: 1000,
        imagePrefix: '',
        imageSuffix: '.png',
        imageActive: '',
        imageAcknowledged: '',
        imageInactive: '',
        imageUnacknowledged: '',
        mpLink: '',
        type: 'AlarmHistory',
        config: {
            columns: [],
            columnWidths: [],
            columnTypes: {
                ad1: 'str',
                ad2: 'str',
                cat: 'int',
                cod: 'int',
                ins: 'int',
                mes: 'str',
                nam: 'str',
                sco: 'str',
                sev: 'int',
                stn: 'int',
                sto: 'int',
                tim: 'date'
            },
            style: [],
            order: [],
            hidden: { data: 'RecordIndex' },
            filter: [],
            sort: [],
            original: {
                order: []
            }
        }
    };
});
