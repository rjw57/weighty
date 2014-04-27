'use strict';

// A service to manage logging in and out of the Google API.
angular.module('webappApp')
  .service('GoogleApi', function($rootScope, $http, Token) {
    var GoogleApi = function() {
      $rootScope.accessToken = Token.get();
    };

    GoogleApi.prototype.login = function() {
      /* global alert */
      /* jshint camelcase: false */
      Token.getTokenByPopup()
        .then(function(params) {
          // Success getting token from popup.

          // Verify the token before setting it, to avoid the confused deputy problem.
          Token.verifyAsync(params.access_token).
            then(function() {
              $rootScope.$apply(function() {
                $rootScope.accessToken = params.access_token;
                $rootScope.expiresIn = params.expires_in;
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
    GoogleApi.prototype.logout = function() {
      $rootScope.accessToken = null;
      Token.clear();
    };

    // Make a request, authenticated if possible
    GoogleApi.prototype.http = function(config) {
      // copy config
      var fullConfig = angular.extend({ headers: {} }, config);

      // set headers
      if($rootScope.accessToken) {
        fullConfig.headers['Authorization'] = // jshint ignore:line
          'Bearer ' + $rootScope.accessToken;
      }

      return $http(fullConfig);
    };

    // Convenience wrappers
    GoogleApi.prototype.get = function(url, config) {
      return this.http(angular.extend({ method: 'GET', url: url }, config));
    };
    GoogleApi.prototype.post = function(url, data, config) {
      return this.http(angular.extend({ method: 'POST', url: url, data: data }, config));
    };

    return new GoogleApi();
  });
