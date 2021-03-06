'use strict';

angular
  .module('webappApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'gapi.client',
    'highcharts-ng',
    'xeditable',
    'ui.bootstrap'
  ])
  .run(function(editableOptions, editableThemes) {
    // Configure x-editable
    editableThemes.bs3.inputClass = 'input-sm';
    editableThemes.bs3.buttonsClass = 'btn-sm';
    editableOptions.theme = 'bs3';
  })
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/root.html',
      })
      // Show a given dataset keyed by id
      .when('/dataset/:sheetId', {
        templateUrl: 'views/dataset.html',
        controller: 'DatasetCtrl'
      })
      .when('/datasets', {
        templateUrl: 'views/datasetlist.html',
        controller: 'DatasetListCtrl',
        active: 'datasets'
      })
      .otherwise({
        redirectTo: '/',
      });

    // HACK to get base URL of web app. I'm sure there should be
    // some better way to do this.
    var baseUrl = document.URL.split('#')[0];
    if(baseUrl[baseUrl.length-1] === '/') {
      baseUrl = baseUrl.substr(0, baseUrl.length-1);
    }
  });
