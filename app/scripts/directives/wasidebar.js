'use strict';

angular.module('webappApp')
  .directive('waSidebar', function () {
    return {
      templateUrl: 'partials/sidebar.html',
      restrict: 'E',
    };
  });
