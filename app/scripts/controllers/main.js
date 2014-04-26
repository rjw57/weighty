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
    $scope.weightRecords = [];

    d3.tsv('mockdata.tsv')
      .row(function(d) { return {
        date: d3.time.format('%d/%m/%Y').parse(d.date),
        weight: +d.weight
      } })
      .get(function(err, data) { $scope.$apply(function() {
        $scope.weightRecords = data;
      }); });
  });
