'use strict';

angular.module('webappApp')
  .directive('waProgressBar', function () {
    return {
      restrict: 'EAC',
      templateUrl: 'waprogressbar.html',
      scope: { min: '@', max: '@', value: '@' },
    };
  });
