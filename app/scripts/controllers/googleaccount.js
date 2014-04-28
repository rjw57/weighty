'use strict';

angular.module('webappApp')
  .controller('GoogleAccountCtrl', function ($scope, GoogleApi) {
    var updateTokens = function() {
      console.log('Google API token state changed');
      console.log('Token:', GoogleApi.accessToken);
      console.log('Signed in:', !!GoogleApi.accessToken);
      $scope.accessToken = GoogleApi.accessToken;
      $scope.accessTokenExpiry = GoogleApi.expiryDate;
      $scope.isSignedIn = !!GoogleApi.accessToken;
    };

    $scope.$on('googleApiStateChanged', updateTokens);
    $scope.doLogin = function() { GoogleApi.login(); };
    $scope.doLogout = function() { GoogleApi.logout(); };

    $scope.$watch('isSignedIn', function() {
      if(!$scope.isSignedIn) {
        $scope.me = null;
        return;
      }

      // get user info when we're signed in
      GoogleApi.get('https://www.googleapis.com/plus/v1/people/me')
        .success(function(data) { $scope.me = data; });
    });

    updateTokens();
  });
