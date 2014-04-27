'use strict';

describe('Directive: waSidebar', function () {

  // load the directive's module
  beforeEach(module('webappApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<wa-sidebar></wa-sidebar>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the waSidebar directive');
  }));
});
