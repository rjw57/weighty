'use strict';

angular.module('webappApp')
  .controller('MainCtrl', function ($scope, $rootScope, Token) {
    // Google login via OAuth
    $scope.accessToken = Token.get();

    $scope.login = function() {
      /* global alert */
      /* jshint camelcase: false */
      Token.getTokenByPopup()
        .then(function(params) {
          // Success getting token from popup.

          // Verify the token before setting it, to avoid the confused deputy problem.
          Token.verifyAsync(params.access_token).
            then(function() {
              $rootScope.$apply(function() {
                $scope.accessToken = params.access_token;
                $scope.expiresIn = params.expires_in;
                Token.set(params.access_token);
              });
            }, function() {
              // FIXME: add diagnostics box
              alert('Failed to verify token.');
            });

        }, function() {
          // FIXME: add diagnostics box
          // Failure getting token from popup.
          alert('Failed to get token from popup.');
        });
    };

    // unauthenticating is a *lot* easier :)
    $scope.logout = function() {
      $scope.accessToken = null;
      Token.clear();
    };

    var DAYS = 1000*60*60*24;

    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    // MOCK weight data
    $scope.targetWeight = 100;
    $scope.targetDate = new Date();
    $scope.weights = [];

    d3.tsv('data/mockdata.tsv')
      .row(function(d) {
        return {
          date: d3.time.format('%d/%m/%Y').parse(d.date),
          weight: +d.weight
        };
      })
      .get(function(err, data) {
        $scope.$apply(function() {
          $scope.weights = data;

          // HACK
          $scope.targetDate = new Date($scope.weights[0].date.getTime() + 100*DAYS);
        });
      });

    $scope.$watch('weights', function() {
      $scope.goal = [];

      // Update cached start and current weights
      if(!$scope.weights || $scope.weights.length === 0) {
        return;
      }

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
