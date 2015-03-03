/* global describe, it */
/*eslint-disable no-unused-expressions*/
//noinspection BadExpressionStatementJS
'use strict';

var FtpWorker = require('../src/ftp-worker.es6.js');
var helpers = require('./helpers');
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
/*eslint-disable no-undef*/
var Promise = require('native-or-bluebird');
/*eslint-enable no-undef*/
var path = require('path');

describe('Worker', function () {
    describe('#constructor', function () {
        it('should explicitely set maxAge to null', function () {
            var worker = new FtpWorker({host: 'alala'});
            expect(worker.maxAge).to.equal(null);
        });

        it('should throw an error if connection.host is not provided', function () {
            function initializeWorkerWithoutHost () {
                return new FtpWorker({port: 21});
            }

            expect(initializeWorkerWithoutHost).to.throw(/No ftp host found at params/);
        });

        it('should store connection as inner property', function () {
            var connection = {
                host: 'example.org',
                path: '/path/to/my/dir',
                port: 80
            };

            var worker = new FtpWorker(connection);

            expect(worker.connection).to.deep.equal(worker.connection);
        });

        it('should instantiate inner ftp-client', function () {
            var FtpClient = require('ftp');
            var worker = new FtpWorker({host: '1'});

            expect(worker.client).to.be.an.instanceof(FtpClient);
        });
    });

    describe('#maxAge', function () {
        var worker;

        beforeEach(function () {
            worker = new FtpWorker({host: 1});
        });

        it('should be null by default', function () {
            expect(worker.maxAge).to.equal(null);
        });

        it('should allow to change with assignment operand', function () {
            worker.maxAge = 10;
            expect(worker.maxAge).to.equal(10);
        });
    });

    describe('#__judge()', function () {
        var worker;

        beforeEach(function () {
            worker = new FtpWorker({host: 1});
        });

        it('should always return false, if maxAge wasn\'t set', function () {
            var files = helpers.createSetOfDummyFiles(3);

            files.forEach(function (file) {
                expect(worker.__judge(file)).to.equal(false);
            });
        });

        it('should return true, if file date property is too old', function () {
            var file = {
                date: new Date('2012-05-19T00:00')
            };

            worker.maxAge = 10;

            expect(worker.__judge(file)).to.equal(true);
        });

        it('should return false, if file date is not too old', function () {
            var file = {
                date: new Date()
            };

            worker.maxAge = 3000;

            expect(worker.__judge(file)).to.equal(false);
        });
    });

    describe('#run()', function () {
        it('should return thenable object', function () {
            var worker = new FtpWorker({host: 1});
            sinon.stub(worker.client, 'connect');

            expect(worker.run()).to.respondTo('then');
        });

        it('should install listeners on FtpClient instance events', function (done) {
            var worker = new FtpWorker({host: 'ftp.mozilla.org'});
            var connectStub = sinon.stub(worker.client, 'connect');
            var onStub = sinon.stub(worker.client, 'on');

            worker.run(); // no need for asynchronous check

            expect(connectStub).to.have.callCount(1);

            expect(onStub).to.have.callCount(3);
            expect(onStub).to.have.calledWith('ready');
            expect(onStub).to.have.calledWith('error');
            expect(onStub).to.have.calledWith('end');

            connectStub.restore();
            onStub.restore();
            done();
        });
    });

    describe('#__reapDirectory()', function () {
        var worker;

        beforeEach(function () {
            worker = new FtpWorker({host: 1});
        });

        it('should call __listDirectory once', function (done) {
            var listDirectoryStub = sinon.stub(worker, '__listDirectory');
            listDirectoryStub.returns([]);

            worker.__reapDirectory('/').then(function () {
                expect(listDirectoryStub).to.have.callCount(1);
                expect(listDirectoryStub).to.have.calledWith('/');

                listDirectoryStub.restore();
                done();
            }).catch(done);
        });

        it('should call __processFile on every file that __listDirectory returned', function (done) {
            var files = helpers.createSetOfDummyFiles(5);

            var processFileStub = sinon.stub(worker, '__processFile', function () {return false;});
            var listDirectoryStub = sinon.stub(worker, '__listDirectory', function () {
                return files;
            });

            worker.__reapDirectory('/').then(function () {
                expect(listDirectoryStub).to.have.calledOnce.calledWith('/');
                expect(processFileStub).to.have.callCount(5).calledWith(sinon.match.object, '/');

                listDirectoryStub.restore();
                processFileStub.restore();
                done();
            }).catch(done);
        });

        it('should call itself recursively on child directories', function (done) {
            var entries = helpers.createSetOfDummyFiles(1);
            var dummyFolder = helpers.createDummyFolder();
            dummyFolder.name = 'tmp';
            entries = entries.concat([dummyFolder]);

            var listDirectoryStub = sinon.stub(worker, '__listDirectory');
            listDirectoryStub.withArgs('/').returns(entries);
            listDirectoryStub.withArgs('/tmp').returns([]);
            var reapDirectorySpy = sinon.spy(worker, '__reapDirectory');

            worker.__reapDirectory('/').then(function () {
                expect(listDirectoryStub).to.have.callCount(2);
                expect(listDirectoryStub).to.have.calledWith('/');
                expect(listDirectoryStub).to.have.calledWith('/tmp');

                expect(reapDirectorySpy).to.have.callCount(2);
                expect(reapDirectorySpy).to.have.calledWith('/');
                expect(reapDirectorySpy).to.have.calledWith('/tmp');

                listDirectoryStub.restore();
                reapDirectorySpy.restore();
                done();
            }).catch(done);
        });

        it('should return array of file processing results', function (done) {
            var entries = helpers.createSetOfDummyFiles(5);
            var dummyFolder = helpers.createDummyFolder();
            dummyFolder.name = 'tmp';
            entries = entries.concat([dummyFolder]);
            entries[0].date = new Date();
            var subFolderEntries = helpers.createSetOfDummyFiles(3);
            subFolderEntries[0].date = new Date();
            worker.maxAge = 500;

            var listDirectoryStub = sinon.stub(worker, '__listDirectory');
            listDirectoryStub.withArgs('/').returns(entries);
            listDirectoryStub.withArgs('/tmp').returns(subFolderEntries);
            var reapDirectorySpy = sinon.spy(worker, '__reapDirectory');

            var deleteFileStub = sinon.stub(worker, '__deleteFile', function () {
                return true;
            });

            worker.__reapDirectory('/').then(function (result) {
                expect(listDirectoryStub).to.have.callCount(2);
                expect(listDirectoryStub).to.have.calledWith('/');
                expect(listDirectoryStub).to.have.calledWith('/tmp');

                expect(reapDirectorySpy).to.have.callCount(2);
                expect(reapDirectorySpy).to.have.calledWith('/');
                expect(reapDirectorySpy).to.have.calledWith('/tmp');
                expect(result).to.eql([false, true, true, true, true, [false, true, true]]);

                expect(deleteFileStub).to.have.callCount(6);

                listDirectoryStub.restore();
                reapDirectorySpy.restore();
                deleteFileStub.restore();
                done();
            }).catch(done);
        });

        it('should pass list directory error on the level higher', function (done) {
            var listDirectoryStub = sinon.stub(worker, '__listDirectory');
            listDirectoryStub.throws(new Error('list directory error'));

            worker.__reapDirectory('/').then(function () {
                // o_O look, no error, ma!
                done(new Error('Test failed'));
            }).catch(function (err) {
                expect(err).to.not.be.an('undefined');
                expect(err.message).to.equal('list directory error');
                listDirectoryStub.restore();
                done();
            });
        });
    });

    describe('#__processFile()', function () {
        var worker;

        beforeEach(function () {
            worker = new FtpWorker({host: 1});
        });

        it('should call __reapDirectory on directory entry', function (done) {
            var reapDirectoryStub = sinon.stub(worker, '__reapDirectory');
            var dummyFolder = helpers.createDummyFolder();
            dummyFolder.name = 'tmp';
            reapDirectoryStub.withArgs('/tmp').returns([]);

            worker.__processFile(dummyFolder, '/').then(function () {
                expect(reapDirectoryStub).to.have.callCount(1);
                expect(reapDirectoryStub).to.have.calledWith('/tmp');

                reapDirectoryStub.restore();
                done();
            });
        });

        it('should return false on files that are not too old', function (done) {
            var file = helpers.createSetOfDummyFiles(1)[0];
            file.date = new Date();
            worker.maxAge = 200;

            worker.__processFile(file, '/').then(function (result) {
                expect(result).to.equal(false);
                done();
            });
        });

        it('should call __deleteFile() on outdated files', function (done) {
            var files = helpers.createSetOfDummyFiles(10);
            var deleteFileStub = sinon.stub(worker, '__deleteFile');
            deleteFileStub.returns(true);
            worker.maxAge = 200;

            Promise.all(files.map(function (file) {
                return worker.__processFile(file, '/');
            })).then(function () {
                expect(deleteFileStub).to.have.callCount(10);
                files.forEach(function (file) {
                    expect(deleteFileStub).to.have.calledWith(path.join('/', file.name));
                });
                deleteFileStub.restore();
                done();
            });
        });
    });
});
