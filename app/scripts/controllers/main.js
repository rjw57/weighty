'use strict';

angular.module('webappApp')
  .controller('MainCtrl', function ($scope) {
    var DAYS = 1000*60*60*24;

    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    // MOCK weight data
    $scope.targetWeight = 80
    $scope.targetDate = new Date(Date.now() + 7*DAYS);
    $scope.weightRecords = [
        { date: new Date(Date.now() - 4*DAYS), weight: 117 },
        { date: new Date(Date.now() - 3*DAYS), weight: 113 },
        { date: new Date(Date.now() - 2*DAYS), weight: 110 },
        { date: new Date(Date.now() - 1*DAYS), weight: 100 },
    ];

    // Update targets
  });
