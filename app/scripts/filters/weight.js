'use strict';

angular.module('webappApp')
  .filter('weight', function () {
    return function (input) {
      return input + 'kg';
    };
  });
