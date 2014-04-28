'use strict';

angular.module('webappApp')
  .controller('DatasetCtrl', function ($scope, $routeParams, GoogleApi) {
    // useful constants
    var DAYS = 1000*60*60*24;
    var WORKSHEETS_FEED_SCHEMA = 'http://schemas.google.com/spreadsheets/2006#worksheetsfeed';
    var SSHEETS_FEED_BASE = 'https://spreadsheets.google.com/feeds/spreadsheets/';
    var LIST_FEED_SCHEMA = 'http://schemas.google.com/spreadsheets/2006#listfeed';
    var VIEW_LINK = 'alternate';
    var GSX_SCHEMA = 'http://schemas.google.com/spreadsheets/2006/extended';
    //var CELL_FEED_SCHEMA = 'http://schemas.google.com/spreadsheets/2006#cellfeed';

    $scope.loaded = false;
    $scope.loading = false;

    // We need a sheet id to continue
    if(!$routeParams.sheetId) {
      return;
    }

    $scope.$watch('isSignedIn', function() {
      // MOCK weight data
      $scope.name = '';
      $scope.targetWeight = 100;
      $scope.targetDate = new Date();
      $scope.weights = [];
      $scope.loaded = false;
      $scope.loading = false;

      // We require the user to be logged in to go further
      if(!$scope.isSignedIn) { return; }
      $scope.loading = true;

      // Kick off a request to the spreadsheet API.
      GoogleApi.get(SSHEETS_FEED_BASE + $routeParams.sheetId, {
          responseType: 'document',
        })
        .success(function(data) {
          data = angular.element(data);

          // Extract spreasheet name
          $scope.name = data.find('title').text();

          // Extract spreasheet links
          $scope.spreadsheetLinks = {};
          angular.forEach(data.find('link'), function(link) {
            link = angular.element(link);
            $scope.spreadsheetLinks[link.attr('rel')] = link.attr('href');
          });
        })
        .error(function() {
          $scope.loading = false;
        });
    });

    // We have a new sheet...
    $scope.$watch('spreadsheetLinks', function() {
      if(!$scope.spreadsheetLinks || !$scope.spreadsheetLinks[WORKSHEETS_FEED_SCHEMA]) { return; }

      $scope.spreadsheetViewLink = $scope.spreadsheetLinks[VIEW_LINK];

      GoogleApi.get($scope.spreadsheetLinks[WORKSHEETS_FEED_SCHEMA], { responseType: 'document' })
        .success(function(data) {
          $scope.worksheets = [];

          // Store links for each worksheet
          angular.forEach(angular.element(data).find('entry'), function(entry) {
            var wsLinks = {};
            entry = angular.element(entry);
            angular.forEach(entry.find('link'), function(link) {
              link = angular.element(link);
              wsLinks[link.attr('rel')] = link.attr('href');
            });
            $scope.worksheets.push({ links: wsLinks });
          });
        })
        .error(function() {
          $scope.loading = false;
        });
    });

    // We have some new worksheet links...
    $scope.$watch('worksheets', function() {
      if(!$scope.worksheets || $scope.worksheets.length === 0) { return; }

      // Data is stored in the first worksheet
      GoogleApi.get($scope.worksheets[0].links[LIST_FEED_SCHEMA], { responseType: 'document' })
        .success(function(data) {
          $scope.weights = [];
          angular.forEach(angular.element(data).find('entry'), function(entry) {
            var timestamp, weight, date;

            // Data are stored in text properties of nodes. Note use of '+' as a
            // cast-to-number equivalent.
            timestamp = +angular.element(
              entry.getElementsByTagNameNS(GSX_SCHEMA, 'timestamp')).text();
            weight = +angular.element(
              entry.getElementsByTagNameNS(GSX_SCHEMA, 'weight')).text();
            date = new Date(timestamp);

            $scope.weights.push({ date: date, weight: weight });

            $scope.loaded = true;
            $scope.loading = false;
          });
        })
        .error(function() {
          $scope.loading = false;
        });
    });

    $scope.$watch('weights', function() {
      $scope.goal = [];

      // Update cached start and current weights
      if(!$scope.weights || $scope.weights.length === 0) {
        return;
      }

      // HACK
      $scope.targetDate = new Date($scope.weights[0].date.getTime() + 100*DAYS);

      $scope.startWeight = $scope.weights[0].weight;
      $scope.currentWeight = $scope.weights[$scope.weights.length-1].weight;
      $scope.progress = 1 -
        ($scope.currentWeight-$scope.targetWeight) / ($scope.startWeight-$scope.targetWeight);

      var startDate = $scope.weights[0].date.getTime(),
        targetDate = $scope.targetDate.getTime(),
        startLogWeight = Math.log($scope.startWeight),
        targetLogWeight = Math.log($scope.targetWeight);

      // Update goal
      for(var t = startDate; t <= targetDate; t += Math.min(DAYS, (targetDate-startDate) / 100)) {
        var lambda = (t - startDate) / (targetDate - startDate);
        $scope.goal.push({
          date: new Date(t),
          weight: Math.exp(lambda * targetLogWeight + (1-lambda) * startLogWeight),
        });
      }
    });
  });
