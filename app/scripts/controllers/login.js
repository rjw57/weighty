'use strict';

angular.module('webappApp')
  .controller('LoginCtrl', function ($scope, $location, GoogleApi) {
    // Watch for a successful login
    $scope.$watch('accessToken', function() {
      if(!$scope.accessToken) { return; }
      $location.path('/');
    });

    $scope.doLogin = GoogleApi.login;
  });
