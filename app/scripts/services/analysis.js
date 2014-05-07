'use strict';

angular.module('webappApp')
  .service('Analysis', function Analysis() {
    var sampleWithReplacement = function(array) {
      var idx, rv = [];
      for(idx = 0; idx < array.length; idx+=1) {
        rv.push(array[Math.floor(Math.random() * array.length)]);
      }
      return rv;
    };

    // Takes an array of { x: <num>, y: <num>, w: <num> } objects and performs
    // linear least squares regression. Returns an object { m: <num>, c: <num> }
    // where m is the slope of the fitted line and c its intercept. Both will be
    // null if points.length < 2.
    //
    // In the input, w is a weight to apply to that sample. If omitted or null
    // it is assumed to be '1'.
    this.regress = function(points) {
      if(!points || !points.length || points.length < 2) {
        return { m: null, c: null };
      }

      // Form matrices X and y where y is a list of ys and rows of X are
      // [x 1]. This is in preparation for least squares optimisation.
      var y = [], X = [], XtX, Xty, b, weight;
      angular.forEach(points, function(pt) {
        weight = (pt.w !== undefined && pt.w !== null) ? pt.w : 1;
        y.push(weight * pt.y);
        X.push([weight * pt.x, weight]);
      });

      // Least squares solution is b where (X' X) b = X' y
      XtX = numeric.dot(numeric.transpose(X), X);
      Xty = numeric.dot(numeric.transpose(X), y);
      b = numeric.solve(XtX, Xty);

      return { m: b[0], c: b[1] };
    };

    this.evaluateRegression = function(regression, x) {
      return regression.m * x + regression.c;
    };

    this.regressBootstrap = function(points, options) {
      var sampleIdx, regressions = [];

      options = angular.extend({
        bootstrapSamples: 100,
      }, options);

      for(sampleIdx=0; sampleIdx<options.bootstrapSamples; sampleIdx+=1) {
        regressions.push(this.regress(sampleWithReplacement(points)));
      }

      return regressions;
    };

    this.evaluateBootstrapRegression = function(bootstrapRegression, x) {
      var squaredSum = 0, sum = 0, sample, idx, variance, mean;
      for(idx = 0; idx<bootstrapRegression.length; idx += 1) {
        sample = this.evaluateRegression(bootstrapRegression[idx], x);
        squaredSum += sample * sample;
        sum += sample;
      }

      mean = sum / bootstrapRegression.length;
      variance = Math.max(0, (squaredSum / bootstrapRegression.length) - mean*mean);

      return { mu: mean, sigma: Math.sqrt(variance) };
    };
  });
