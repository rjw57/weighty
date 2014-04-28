'use strict';

// A service to manage logging in and out of the Google API.
angular.module('webappApp')
  .service('GoogleApi', function($http, $q, $rootScope, Token) {
    var GoogleApi = function() {
      this.accessToken = null;
      this.expiryDate = null;
      if(Token.get()) { this._verifyTokenAsync(Token.get()); }
      $rootScope.$broadcast('googleApiStateChanged');
    };

    // Start the verification process for a token returning a promise
    // which is fulfilled if the token verification succeeds otherwise
    // it fails.
    var verifyToken = function(token) {
      /* jshint camelcase: false */
      var deferred = $q.defer();

      console.log('Asked to verify:', token);
      if(token) {
        Token.verifyAsync(token)
          .then(function(params) {
            console.log('Token verification succeeded:', params);
            deferred.resolve(angular.extend({ accessToken: token }, params));
          }, function(err) {
            // FIXME: add diagnostics box
            deferred.reject(err);
          });
      } else {
        deferred.reject();
      }

      return deferred.promise;
    };

    // Verify token, update accessToken, etc appropriately and then broadcast
    // googleApiStateChanged on the rootScope.
    GoogleApi.prototype._verifyTokenAsync = function(token) {
      var self = this;

      verifyToken(token)
        .then(function(params) {

          // success
          self.accessToken = params.accessToken;
          self.expiryDate = new Date(Date.now() + (1000 * params.expires_in));

          Token.set(token);
          $rootScope.$broadcast('googleApiStateChanged');

          console.log('New token set with expiry date:', self.expiryDate);
        }, function() {
          // failure
          self.accessToken = null;
          self.expiryDate = null;
          Token.clear();
          $rootScope.$broadcast('googleApiStateChanged');
        });
    };

    GoogleApi.prototype.login = function() {
      var self = this;
      var deferred = $q.defer();

      Token.getTokenByPopup()
        .then(function(params) {
          // Success getting token from popup.

          // Verify the token before setting it, to avoid the confused deputy problem.
          self._verifyTokenAsync(params.access_token);
        }, function(err) {
          // FIXME: add diagnostics box
          // Failure getting token from popup.
          deferred.reject(err);
        });

      return deferred.promise;
    };

    // unauthenticating is a *lot* easier :)
    GoogleApi.prototype.logout = function() {
      this.accessToken = null;
      this.expiresIn = null;
      Token.clear();
      $rootScope.$broadcast('googleApiStateChanged');
    };

    GoogleApi.prototype.tokenHasExpired = function() {
      return Date.now() >= this.expiryDate.getTime();
    };

    GoogleApi.prototype.isSignedIn = function() {
      return !!this.accessToken && !this.tokenHasExpired();
    };

    // Make a request, authenticated if possible
    GoogleApi.prototype.http = function(config) {
      var self = this;

      // copy config
      var fullConfig = angular.extend({ headers: {} }, config);

      // set headers
      if(self.accessToken) {
        fullConfig.headers['Authorization'] = // jshint ignore:line
          'Bearer ' + self.accessToken;
      }

      return $http(fullConfig)
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
