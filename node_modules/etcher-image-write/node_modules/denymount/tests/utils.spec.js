var chai = require('chai');
var utils = require('../lib/utils');

describe('Utils', function() {

  describe('.getDeviceBSDName()', function() {

    it('should return the BSD name given a full path to a device', function() {
      chai.expect(utils.getDeviceBSDName('/dev/disk2')).to.equal('disk2');
    });

    it('should return the same thing given a BSD name', function() {
      chai.expect(utils.getDeviceBSDName('disk2')).to.equal('disk2');
    });

    it('should return the BSD name given a full path to a raw device', function() {
      chai.expect(utils.getDeviceBSDName('/dev/rdisk2')).to.equal('disk2');
    });

    it('should return the BSD name given a raw device name', function() {
      chai.expect(utils.getDeviceBSDName('rdisk2')).to.equal('disk2');
    });

  });

});
