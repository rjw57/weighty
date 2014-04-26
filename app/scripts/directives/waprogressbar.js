'use strict';

angular.module('webappApp')
  .directive('waProgressBar', function () {
    return {
      restrict: 'E',
      templateUrl: 'templates/waprogressbar.html',
      link: function postLink(scope, element, attrs) {
        scope.min = 0;
        scope.max = 100;
        scope.value = 50;
      },
    };
  });
