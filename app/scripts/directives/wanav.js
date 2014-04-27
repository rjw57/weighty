'use strict';

angular.module('webappApp')
  .directive('waNav', function () {
    return {
      templateUrl: 'wanav.html',
      restrict: 'E',
    };
  });
