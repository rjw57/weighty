'use strict';

angular.module('webappApp')
  .directive('waProgressBar', function () {
    return {
      restrict: 'E',
      templateUrl: 'templates/waprogressbar.html',
      scope: { min: '@', max: '@', value: '@' },
      link: function postLink(scope, element, attrs) {
      },
    };
  });
