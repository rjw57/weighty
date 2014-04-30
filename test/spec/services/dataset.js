'use strict';

describe('Service: Dataset', function () {

  // load the service's module
  beforeEach(module('webappApp'));

  // instantiate service
  var Dataset;
  beforeEach(inject(function (_Dataset_) {
    Dataset = _Dataset_;
  }));

  it('should do something', function () {
    expect(!!Dataset).toBe(true);
  });

});
