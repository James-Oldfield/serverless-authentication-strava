'use strict';

let config = require('serverless-authentication').config;
let auth = require('../lib');
let nock = require('nock');

describe('Example authentication', () => {
  describe('Signin', () => {
    it('test signin with default params', () => {
      let providerConfig = config('example');
      auth.signin(providerConfig, {}, (err, data) => {
        expect(err).to.be.null;
        expect(data.url).to.equal('https://auth.laardee.com/oauth?client_id=fb-mock-id&redirect_uri=https://api-id.execute-api.eu-west-1.amazonaws.com/dev/callback/example&response_type=code&scope=profile');
      });
    });

    it('tests signin with scope and state params', () => {
      let providerConfig = config('example');
      auth.signin(providerConfig, {scope: 'profile email', state: '123456'}, (err, data) => {
        expect(err).to.be.null;
        expect(data.url).to.equal('https://auth.laardee.com/oauth?client_id=fb-mock-id&redirect_uri=https://api-id.execute-api.eu-west-1.amazonaws.com/dev/callback/example&response_type=code&scope=profile email&state=123456');
      });
    });
  });

  describe('Callback', () => {
    before(() => {
      let providerConfig = config('example');
      nock('https://auth.laardee.com')
        .post('/oauth/token')
        .query({
          client_id: providerConfig.id,
          redirect_uri: providerConfig.redirect_uri,
          client_secret: providerConfig.secret,
          code: 'code'
        })
        .reply(200, {
          access_token: 'access-token-123'
        });

      nock('https://api.laardee.com')
        .get('/me')
        .query({access_token: 'access-token-123'})
        .reply(200, {
          id: 'user-id-1',
          displayName: 'Eetu Tuomala',
          emails: [
            {
              value: 'email@test.com'
            }
          ],
          image: {
            url: 'https://avatars3.githubusercontent.com/u/4726921?v=3&s=460'
          }
        });
    });
    it('should return profile', (done) => {
      let providerConfig = config('google');
      auth.callback({code: 'code', state: 'state'}, providerConfig, (err, profile) => {
        expect(profile.id).to.equal('user-id-1');
        expect(profile.name).to.equal('Eetu Tuomala');
        expect(profile.email).to.equal('email@test.com');
        expect(profile.picture).to.equal('https://avatars3.githubusercontent.com/u/4726921?v=3&s=460');
        expect(profile.provider).to.equal('example');
        done(err);
      })
    });
  });
});