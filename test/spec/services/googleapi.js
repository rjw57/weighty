'use strict';

describe('Service: Googleapi', function () {

  // load the service's module
  beforeEach(module('webappApp'));

  // instantiate service
  var Googleapi;
  beforeEach(inject(function (_Googleapi_) {
    Googleapi = _Googleapi_;
  }));

  it('should do something', function () {
    expect(!!Googleapi).toBe(true);
  });

});
