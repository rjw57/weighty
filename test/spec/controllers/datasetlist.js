'use strict';

describe('Controller: DatasetListCtrl', function () {

  // load the controller's module
  beforeEach(module('webappApp'));

  var DatasetlistCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    DatasetlistCtrl = $controller('DatasetlistCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
