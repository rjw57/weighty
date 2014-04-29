'use strict';

angular.module('webappApp')
  .controller('DatasetCtrl', function ($scope, $routeParams, $http, $document) {
    // useful constants
    var DAYS = 1000*60*60*24;
    var WORKSHEETS_FEED_SCHEMA = 'http://schemas.google.com/spreadsheets/2006#worksheetsfeed';
    var SSHEETS_FEED_BASE = 'https://spreadsheets.google.com/feeds/spreadsheets/';
    var LIST_FEED_SCHEMA = 'http://schemas.google.com/spreadsheets/2006#listfeed';
    var POST_SCHEMA = 'http://schemas.google.com/g/2005#post';
    var VIEW_LINK = 'alternate';
    var GSX_SCHEMA = 'http://schemas.google.com/spreadsheets/2006/extended';
    //var CELL_FEED_SCHEMA = 'http://schemas.google.com/spreadsheets/2006#cellfeed';

    $scope.loaded = false;
    $scope.loading = false;

    // We need a sheet id to continue
    if(!$routeParams.sheetId) {
      return;
    }

    var authHeaders = {};
    $scope.$watch('accessToken', function() {
      // jshint camelcase: false

      if(!$scope.accessToken) {
        authHeaders = {};
        return;
      }

      authHeaders = {
        'Authorization': $scope.accessToken.token_type + ' ' + $scope.accessToken.access_token,
      };

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
      $http.get(SSHEETS_FEED_BASE + $routeParams.sheetId, {
          responseType: 'document',
          headers: authHeaders,
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

      $http.get($scope.spreadsheetLinks[WORKSHEETS_FEED_SCHEMA], {
        responseType: 'document',
        headers: authHeaders,
      })
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
      $scope.listFeedLinks = {};

      if(!$scope.worksheets || $scope.worksheets.length === 0) { return; }

      // Data is stored in the first worksheet
      $http.get($scope.worksheets[0].links[LIST_FEED_SCHEMA], {
        responseType: 'document',
        headers: authHeaders,
      })
        .success(function(data) {
          $scope.listFeedLinks = {};
          angular.forEach(angular.element(data).find('link'), function(link) {
            link = angular.element(link);
            $scope.listFeedLinks[link.attr('rel')] = link.attr('href');
          });

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

    var createListEntry = function(obj) {
      var entry, field;

      entry = $document[0].implementation
        .createDocument('http://www.w3.org/2005/Atom', 'entry');
      angular.forEach(obj, function(v, k) {
        field = $document[0].createElementNS(
            'http://schemas.google.com/spreadsheets/2006/extended', 'gsx:' + k);
        field.textContent = '' + v;
        entry.documentElement.appendChild(field);
      });

      return new XMLSerializer().serializeToString(entry);
    };

    $scope.submitNewMeasurement = function(newMeasurement) {
      if(!$scope.listFeedLinks || !$scope.listFeedLinks[POST_SCHEMA]) { return; }

      console.log('new measurement', newMeasurement);

      var body = createListEntry({
        weight: newMeasurement.weight,
        timestamp: Date.now(),
      });

      $http.post($scope.listFeedLinks[POST_SCHEMA], body, {
        responseType: 'document',
        headers: angular.extend(authHeaders, {
          'Content-Type': 'application/atom+xml;charset=UTF-8',
        }),
      }).success(function() {
        console.log('success... refresh');
      });
    };
  });
