'use strict';

angular.module('webappApp')
  .controller('NavCtrl', function ($scope, GoogleApi) {
    $scope.me = null;

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
