/**
 * Created by Zillion on 2018/3/18.
 */

/*
const { Issuer } = require('openid-client');
Issuer.discover('https://172.16.0.102:3000') // => Promise
    .then(function (googleIssuer) {
        console.log('Discovered issuer %s', googleIssuer);
    });*/

/*
* Steam OpenID Provider
Steam can act as an OpenID provider.
This allows your application to authenticate a user's SteamID
without requiring them to enter their Steam username or password
on your site (which would be a violation of the API Terms of Use.)
Just download an OpenID library for your language and platform of choice and
 use https://steamcommunity.com/openid as the provider.
 The returned Claimed ID will contain the user's 64-bit SteamID. The Claimed ID
  format is: https://steamcommunity.com/openid/id/<steamid>
*
* */
const { Issuer } = require('openid-client');
Issuer.discover('https://steamcommunity.com/openid') // => Promise
    .then(function (googleIssuer) {
        console.log('Discovered issuer %s', googleIssuer);
    });