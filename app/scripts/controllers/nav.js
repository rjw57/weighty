'use strict';

angular.module('webappApp')
  .controller('NavCtrl', function ($scope, GoogleApi) {
    $scope.login = GoogleApi.login;
    $scope.logout = GoogleApi.logout;
  });
