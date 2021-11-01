/*global module,process*/
(function () {
    'use strict';

    var write = process.stdout.write.bind(process.stdout);

    function log(str) {
        write(str + '\n', 'utf8');
    }

    module.exports = {

        init: function init() {
            var now = new Date();
            this.startTime = now.getTime();
            log('[' + this.startTime + '][' + now.toLocaleString('de') + '.' + now.getMilliseconds() + '] start');

            this.originalExit = process.exit;
            process.exit = this.exit.bind(this);
        },

        exit: function exit(exitCode) {

            var now = new Date();
            this.endTime = now.getTime();
            log('[' + this.startTime + '][' + now.toLocaleString('de') + '.' + now.getMilliseconds() + '] exit, code=' + exitCode + '\ntime:' + (this.endTime - this.startTime) + 'ms');

            process.exit = this.originalExit;
            this.originalExit(exitCode);
        }

    };

})();
