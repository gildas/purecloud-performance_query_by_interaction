'use strict';
var chai = require('chai');
var chai_promise = require('chai-as-promised');
chai.use(chai_promise);
var assert = chai.assert;
var expect = chai.expect;
var Redis = require('ioredis');
var redis = new Redis(6379, 'redis');

describe('Redis', () => {
  it('should write simple data', (done) => {
    redis.set('foo', 'bar');
    redis.get('foo', (err, result) => {
      expect(result).to.equal('bar');
      done(err);
    });
  });
});
