'use strict';

angular.module('webappApp')
  .controller('DatasetCtrl', function ($scope, $routeParams, $log, dataset, Analysis) {
    // useful constants
    var DAYS = 1000*60*60*24;

    // True iff we're currently loading a dataset
    $scope.loading = false;

    // We need a sheet id to continue
    if(!$routeParams.sheetId) {
      return;
    }

    // Add a new measurement
    $scope.submitNewMeasurement = function(measurement) {
      if(!$scope.verifiedDatasetId) { return; }
      $log.info('got new measurement:', measurement.weight);

      dataset.addRow({
        id: $scope.verifiedDatasetId,
        timestamp: Date.now(),
        weight: measurement.weight
      }).then(function() {
        $log.info('new measurement added');
        $scope.reloadDataset();
      }, function(err) {
        $log.error('error adding new measurement', err);
      });
    };

    // Load a dataset into the $scope.weights
    $scope.reloadDataset = function() {
      $log.info('(Re-)loading dataset', $scope.verifiedDatasetId);

      if(!$scope.verifiedDatasetId) {
        $scope.weights = [];
        return;
      }

      $scope.loading = true;
      dataset.get($scope.verifiedDatasetId).then(function(weights) {
        $scope.weights = weights;
        $scope.loading = false;
      }, function(err) {
        $log.error('Could not get dataset:', err);
      });
    };

    // Wait for login before verifying
    $scope.$watch('isSignedIn', function() {
      if(!$scope.isSignedIn) {
        $scope.verifiedDatasetId = null;
        return;
      }

      // Verify dataset
      $scope.loading = true;
      dataset.verifyDatasetId($routeParams.sheetId).then(function(dataset) {
        $log.info('dataset id ' + dataset.id + ' has been verified');
        $scope.verifiedDatasetId = dataset.id;
        $scope.name = dataset.title;
      }, function(err) {
        $log.error('Dataset failed verification:', err);
        $scope.loading = false;
      });
    });

    // When we have a verified dataset id, (re-)load it
    $scope.$watch('verifiedDatasetId', function() {
      $scope.reloadDataset();
    });

    // Watch for new weights and re-compute derived metrics
    $scope.$watch('weights', function() {
      $log.info('new weights available');
      $scope.goal = [];

      // Update cached start and current weights
      if(!$scope.weights || $scope.weights.length === 0) {
        return;
      }

      // HACK
      $scope.targetDate = new Date(Date.parse('Oct 01, 2014'));
      $scope.targetWeight = 77;
      $log.info('target date: ' + $scope.targetDate);
      $log.info('target weight: ' + $scope.targetWeight);

      $scope.startWeight = $scope.weights[0].weight;
      $scope.currentWeight = $scope.weights[$scope.weights.length-1].weight;
      $scope.progress = 1 -
        ($scope.currentWeight-$scope.targetWeight) / ($scope.startWeight-$scope.targetWeight);

      var currentDate = Date.now() + 31*DAYS;
      var startDate = $scope.weights[0].date.getTime(),
        endDate = $scope.weights[$scope.weights.length - 1].date.getTime(),
        targetDate = $scope.targetDate.getTime(),
        startLogWeight = Math.log($scope.startWeight),
        targetLogWeight = Math.log($scope.targetWeight);

      var lastPlotDate = Math.max(currentDate, targetDate);
      // var lastPlotDate = Math.min(currentDate, targetDate);

      var regressPoints = [];
      angular.forEach($scope.weights, function(w) {
        regressPoints.push({
          x: w.date.getTime(),
          y: Math.log(w.weight),
          w: Math.exp(-Math.max(0, endDate - w.date.getTime()) / (14*DAYS)),
        });
      });

      var trendRegression = Analysis.regress(regressPoints);
      var trendBootstrapRegression = Analysis.regressBootstrap(regressPoints);

      var t, lambda, trendWeight, trendBootstrapWeight, trendMinWeight, trendMaxWeight;

      $scope.trend = null;
      $scope.trendMin = null;
      $scope.trendMax = null;
      if(trendRegression.m !== null) {
        // Update trend
        $scope.trend = [];
        $scope.trendMin = [];
        $scope.trendMax = [];
        for(t = Math.max(startDate, endDate-14*DAYS);
            t <= lastPlotDate;
            t += Math.min(DAYS, (targetDate-startDate) / 100))
        {
          trendWeight = Math.exp(Analysis.evaluateRegression(trendRegression, t));
          trendBootstrapWeight = Analysis.evaluateBootstrapRegression(trendBootstrapRegression, t);

          trendMinWeight = Math.exp(trendBootstrapWeight.mu - 3*trendBootstrapWeight.sigma);
          trendMaxWeight = Math.exp(trendBootstrapWeight.mu + 3*trendBootstrapWeight.sigma);
          $log.info(trendWeight, trendMinWeight, trendMaxWeight);

          if(trendWeight >= $scope.targetWeight) {
            $scope.trend.push({
              date: new Date(t),
              weight: trendWeight,
            });
          }

          if(trendMinWeight >= $scope.targetWeight) {
            $scope.trendMin.push({
              date: new Date(t),
              weight: trendMinWeight,
            });
          }

          if(trendMaxWeight >= $scope.targetWeight) {
            $scope.trendMax.push({
              date: new Date(t),
              weight: trendMaxWeight,
            });
          }
        }
      }

      // Update goal
      for(t = startDate; t <= lastPlotDate; t += Math.min(DAYS, (targetDate-startDate) / 100)) {
        lambda = (t - startDate) / (targetDate - startDate);
        $scope.goal.push({
          date: new Date(t),
          weight: Math.exp(lambda * targetLogWeight + (1-lambda) * startLogWeight),
        });
      }
    });
  });
