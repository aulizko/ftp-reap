'use strict';

var _ = require('lodash');

var RANDOM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit nullam imperdiet vehicula diam ut luctus'.split(' ');
var RANDOM_EXT = 'js json yaml zip sql jpg png gif jpeg'.split(' ');

exports.createSetOfDummyFiles = function (listSize) {
    var result = [];

    for (var i = 0; i < listSize; i++) {
        result.push({
            type: '-', // file
            name: _.sample(RANDOM_WORDS) + '.' + _.sample((RANDOM_EXT)),
            target: undefined,
            sticky: false,
            rights: { user: 'rwx', group: 'rwx', other: 'rw' },
            owner: 'root',
            group: 'root',
            size: 4096,
            date: new Date('2012-05-19T00:00')
        });
    }

    return result;
};

exports.createDummyFolder = function () {
    return {
        type: 'd', // file
        name: _.sample(RANDOM_WORDS),
        target: undefined,
        sticky: true,
        rights: { user: 'rwx', group: 'rwx', other: 'rw' },
        owner: 'root',
        group: 'root',
        size: 4096,
        date: new Date('2012-05-19T00:00')
    };
};
