/*global module,process,__dirname*/
(function () {
    'use strict';

    /* custom reporter for xunit
    * creates xml and json report
    */
    var path = require('path'),
        fs = require('fs'),
        grunt = require('grunt'),
        reporterUtils = require(path.resolve(__dirname, 'utils_reporter'));

    function xmlName(name) {
        name = name.replace(/&/g, '&amp;');
        name = name.replace(/\n/g, '\\n');
        name = name.replace(/"/g, '&quot;');
        name = name.replace(/>/g, '&gt;');
        name = name.replace(/</g, '&lt;');
        var index = name.indexOf(' ');
        if (index !== -1) {
            var part1 = name.substring(0, index),
                part2 = name.substring(index);
            name = part1 + part2.replace(/\./g, '-');
        }
        return name;
    }

    function createTestcases(suite) {
        var time = 0,
            xml = '';

        suite.testcases.forEach(function (testcase) {
            var caseTime = (testcase.time !== undefined) ? testcase.time : 0;
            xml += '<testcase classname="' + xmlName(testcase.classname) + '" name="' + xmlName(testcase.name) + '" time="' + caseTime / 1000 + '">';
            if (testcase.error) {
                xml += '<failure><![CDATA[' + testcase.error.message + ']]></failure>';
            }
            xml += '</testcase>';
            time += caseTime;
        });

        return { time: time, xml: xml };
    }

    function createReport(objReport) {
        var xml = '<?xml version="1.0" encoding="UTF-8"?><testsuites>';
        for (var suiteName in objReport) {
            var suite = objReport[suiteName],
                testcases = createTestcases(suite);
            xml += '<testsuite name="' + xmlName(suiteName) + '" errors="0" tests="' + suite.tests + '" failures="' + suite.failures + '" time="' + testcases.time / 1000 + '">';
            xml += testcases.xml;
            xml += '</testsuite>';
        }
        return xml + '</testsuites>';
    }

    function Reporter(reportDir, resultPath, coverageFileName) {

        // reportDir = Build/reports
        // resultPath = jasmine/JUnit/Core-Results
        // coverageFileName = 'coverage'
        
        var resultFile = resultPath.substring(resultPath.lastIndexOf('/') + 1);
        this.reportDir = reportDir;
        this.resultDir = path.resolve(reportDir, resultPath.substring(0, resultPath.lastIndexOf('/')));
        this.jasmineDir = path.resolve(reportDir, resultPath.substring(0, resultPath.indexOf('/')));
        this.resultFile = path.resolve(this.resultDir, resultFile);
        this.coverageFileName = coverageFileName;

        this.out = process.stdout;

        // this.out.write('reportDir:' + this.reportDir + '\n');
        // this.out.write('resultDir:' + this.resultDir + '\n');
        // this.out.write('jasmineDir:' + this.jasmineDir + '\n');
        // this.out.write('resultFile:' + this.resultFile + '\n');
        // this.out.write('coverageFileName:' + this.coverageFileName + '\n');

        this.total = 0;
        this.passed = 0;
        this.objReport = {};
        this.metadata = {};
        this.failures = [];
        this.previous = Date.now();
    }

    Reporter.prototype = {
        report: function report(prefix, data) {
            if (data !== undefined) {
                if (!this.start) {
                    this.start = Date.now();
                }
                this.total += 1;
                var status = data.passed ? 'ok' : 'failed';
                var strOut = ((data.name && typeof data.name.trim === 'function') ? data.name.trim().replace(/\|/g, '') : '') + '\n';
                strOut = strOut.replace(/ +/g, ' ');
                if (data.passed) {
                    this.passed += 1;
                } else {
                    this.failures.push(strOut + ((data.error) ? data.error.message : 'fail without error') + '\n'); 
                }
                if (this.metadata.jenkins === false || status === 'failed') {
                    this.out.write(prefix + ' | ' + status + ' | ' + strOut);
                }
                
                //reporterUtils.testcase(this.objReport, data.name, data.passed, data.error, data.runDuration);
                // as data.runDuration = 0, we try to calculate time
                // time of first testcase is too long, as it includes some startup time
                var now = Date.now();
                reporterUtils.testcase(this.objReport, data.name, data.passed, data.error, now - this.previous);
                this.previous = now;
            }
        },
        finish: function finish() {

            if (!fs.existsSync(this.jasmineDir)) {
                fs.mkdirSync(this.jasmineDir);
            }
            if (!fs.existsSync(this.resultDir)) {
                fs.mkdirSync(this.resultDir);
            }
            fs.writeFileSync(this.resultFile + '.xml', createReport(this.objReport));
            if (this.metadata.jenkins === false) {
                fs.writeFileSync(this.resultFile + '.json', JSON.stringify(this.objReport));
            }
            if (this.metadata.userAgent) {
                this.out.write('userAgent:' + this.metadata.userAgent + '\n');
                this.out.write('window:' + this.metadata.innerWidth + 'x' + this.metadata.innerHeight + '\n');
                this.out.write('url:' + this.metadata.url + '\n');
            }
            this.out.write(this.passed + ' of ' + this.total + ' tests passed\n');
            this.out.write('finished in ' + ((Date.now() - this.start) / 1000) + 's\n');
            if (this.passed < this.total) {
                if (grunt.config.get('isWidgetFactory') === false) {
                    grunt.log.warn('failures:' + (this.total - this.passed) + '\n' + this.failures.join(''));
                } else {
                    this.out.write('failures:' + (this.total - this.passed) + '\n' + this.failures.join('')); 
                } 
            }
        },
        reportMetadata: function reportMetadata(tag, data) {
            if (tag === 'mappView') {
                this.metadata = data;
            }
            if (tag === 'log') {
                this.out.write('log:' + data);
            }
            if (tag === 'coverage') {
                var coverage = data.coverage,
                    heat = parseInt(data.heat, 10);
                this.out.write(((heat !== 0) ? '[heat' + heat + ']' : '') + 'coverage received\n');

                var coverageDir = this.reportDir;
                var coverageFileName = this.coverageFileName + ((heat !== 0) ? heat : '') + '.json';
                var coverageFile = path.resolve(this.reportDir, coverageFileName);
                
                this.out.write('write coverageFile:' + coverageFile + '\n');

                if (!fs.existsSync(coverageDir)) {
                    fs.mkdirSync(coverageDir);
                }
                fs.writeFile(coverageFile, coverage, (err) => {
                    if (err) throw err;
                });
            }
            this.previous = Date.now();
        }
    };
  
    module.exports = Reporter;
})();
