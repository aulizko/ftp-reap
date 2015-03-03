/* global describe, it */
/*eslint-disable no-unused-expressions*/
//noinspection BadExpressionStatementJS
'use strict';

var _ = require('lodash');
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
var Reaper = require('../src/reaper.es6.js');
var FtpWorker = require('../src/ftp-worker.es6.js');

describe('Reaper', function () {
    var reaper;

    beforeEach(function () {
        reaper = new Reaper();
    });

    afterEach(function () {
        reaper = null;
    });

    describe('#constructor()', function () {
        it('should create inner workers property', function () {
            expect(reaper.workers).to.not.be.an('undefined');
            expect(reaper.workers).to.be.an.instanceof(Array);
        });
        it('should create __maxAge inner property', function () {
            expect(reaper.__maxAge).to.not.be.an('undefined');
            expect(reaper.__maxAge).to.equal(null);
        });
    });

    describe('#watch()', function () {
        it('should create new FtpWorker for every argument', function () {
            expect(reaper.workers.length).to.equal(0);
            reaper.watch({host: 'host'});
            expect(reaper.workers.length).to.equal(1);
            expect(reaper.workers[0]).to.be.an.instanceof(FtpWorker);

            reaper.watch({host: '1'}, {host: '2'});
            expect(reaper.workers.length).to.equal(3);
            expect(reaper.workers[1]).to.be.an.instanceof(FtpWorker);
            expect(reaper.workers[2]).to.be.an.instanceof(FtpWorker);
        });

        it('should set maxAge to worker if it is already set at Reaper', function () {
            var validMaxAge = 200;
            reaper.maxAge(validMaxAge);

            reaper.watch({host: 'host'});
            expect(reaper.workers[0].maxAge).to.equal(validMaxAge);
        });
    });

    describe('#maxAge()', function () {
        it('should allow to enter integer as milliseconds count', function () {
            reaper.maxAge(200);
            expect(reaper.__maxAge).to.equal(200);
        });

        it('should allow to enter human-readable string and parse it', function () {
            reaper.maxAge('3 days');
            expect(reaper.__maxAge).to.equal(259200000);
        });

        it('should set maxAge to it\'s workers pool', function () {
            reaper.watch({host: 'host'});

            reaper.maxAge('3 days');
            expect(reaper.workers[0].__maxAge).to.equal(259200000);
        });
    });

    describe('#run()', function () {
        it('should run method #run() for all workers in paraller', function (done) {
            var mocks = [];
            _.times(3, function () {
                var ftpWorkerApi = {run: function () {}};
                var ftpWorkerMock = sinon.mock(ftpWorkerApi);
                ftpWorkerMock.expects('run').once().returns(Promise.resolve(true));
                reaper.workers.push(ftpWorkerApi);
                mocks.push(ftpWorkerMock);
            });

            reaper.run().then(function () {
                mocks.forEach(function (workerMock) {
                    workerMock.verify();
                });
                done();
            }).catch(done);
        });

        it('should return thenable object', function () {
            _.times(3, function () {
                var ftpWorkerApi = {run: function () {return true;}};
                var ftpWorkerMock = sinon.mock(ftpWorkerApi);
                ftpWorkerMock.expects('run').once();
                reaper.workers.push(ftpWorkerMock);
            });

            expect(reaper.run()).to.respondTo('then');
        });
    });
});
