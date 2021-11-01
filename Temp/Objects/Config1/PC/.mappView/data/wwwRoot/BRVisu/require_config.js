require.config({

    waitSeconds: 30,

    paths: {
        'text': 'libs/require_plugins/text',
        'css': 'libs/require_plugins/css',
        'css-build': 'libs/require_plugins/css-build',
        'requireLib': 'libs/require',
        'globalize': 'libs/globalize',
        'hammer': 'libs/hammer.min',
        'mappView': '../mappView',
        'ace': 'libs/ace'
    },

    shim: {
        'jquery': {
            exports: 'jquery'
        },
        'libs/lodash': {
            exports: '_'
        },
        'libs/jquery/jquery-ui-1.10.3.custom': ['jquery'],
        'libs/jquery/jquery-ui-1.10.4.custom': ['jquery']
    }
});
