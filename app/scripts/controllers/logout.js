'use strict';

angular.module('webappApp')
  .controller('LogoutCtrl', function ($scope, $location, GoogleApi) {
    GoogleApi.logout();
    $location.path('/');
  });
