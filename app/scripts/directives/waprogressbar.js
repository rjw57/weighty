'use strict';

angular.module('webappApp')
  .directive('waProgressBar', function () {
    return {
      restrict: 'E',
      templateUrl: 'waprogressbar.html',
      scope: { min: '@', max: '@', value: '@' },
    };
  });
