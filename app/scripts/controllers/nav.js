'use strict';

angular.module('webappApp')
  .controller('NavCtrl', function ($scope, $route, GoogleApi) {
    $scope.me = null;

    // Record active tab on route change
    $scope.$on('$routeChangeSuccess', function() {
      $scope.active = $route.current.active;
    });

    $scope.$watch('accessToken', function() {
      if(!$scope.accessToken) {
        $scope.me = null;
        return;
      }

      // get user info when we have a token
      GoogleApi.get('https://www.googleapis.com/plus/v1/people/me')
        .success(function(data) { $scope.me = data; });
    });
  });
