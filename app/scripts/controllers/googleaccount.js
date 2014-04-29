'use strict';

angular.module('webappApp')
  .controller('GoogleAccountCtrl', function ($scope, $window, gapi) {
    // jshint camelcase: false
    var authParams = {
      client_id: '266506267940-nk8rt8rdrpb8l5j098ugl2v04m6evujn.apps.googleusercontent.com',
      scope: [
        'https://www.googleapis.com/auth/plus.me', // access basic user info
        'https://www.googleapis.com/auth/drive.file', // create and access files we create
        'https://spreadsheets.google.com/feeds', // spreadsheets API
      ],
    };

    $scope.doLogin = function(options) {
      options = angular.extend(options || {}, authParams);
      console.log('Authorising with parameters:', options);
      gapi.auth.authorize(options)
        .then(function(params) {
          // success
          console.log('Authorization token obtained:', params);
          $scope.accessTokenExpiry = new Date(Date.now() + (params.expires_in * 1000));
          $scope.isSignedIn = true;
        }, function() {
          // For some reason auth failed
          $scope.accessTokenExpiry = null;
          $scope.isSignedIn = false;
        });
    };

    $scope.doLogout = function() {
      $scope.accessTokenExpiry = null;
      $scope.isSignedIn = false;
      $window.gapi.auth.setToken(null);
    };

    // Try an immediate-mode login when the authorization system is ready
    gapi.auth.init().then(function() {
      $scope.doLogin({ immediate: true });
    });

    $scope.$watch('isSignedIn', function() {
      if(!$scope.isSignedIn) {
        $scope.me = null;
        return;
      }

      // get user info when we're signed in
      console.log('requesting...');
      $window.gapi.client.request({
        path: 'plus/v1/people/me',
        callback: function(jsonResp) {
          console.log(jsonResp);
          if(jsonResp.kind !== 'plus#person') { return; }
          $scope.$apply(function() {
            $scope.me = jsonResp;
          });
        },
      });
    });
  });
