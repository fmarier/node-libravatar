var tap = require("tap");
var test = tap.test;
var plan = tap.plan;

var libravatar = require('../lib/libravatar');

var COMMON_EMAIL        = 'whatever@wherever.whichever';
var COMMON_EMAIL_HASH   = 'a60fc0828e808b9a6a9d50f1792240c8';
var COMMON_EMAIL_DOMAIN = 'wherever.whichever';
var COMMON_OPENID        = 'http://example.com/id';
var COMMON_OPENID_HASH   = 'ce0064bb30c22b618f814c389e7941ce1bfff0659910523192868d2b71632c77';
var COMMON_OPENID_DOMAIN = 'example.com';
var COMMON_PREFIX_HTTP  = 'http://cdn.libravatar.org/avatar/';
var COMMON_PREFIX_HTTPS = 'https://seccdn.libravatar.org/avatar/';

function array_equal(t, result, expected, description) {
    t.equal(result[0], expected[0], description + ' [0]');
    t.equal(result[1], expected[1], description + ' [1]');
}

test("parsing of user identity", function (t) {
    var test1 = libravatar.parse_user_identity(null, null);
    var exp1 = [null, null];
    array_equal(t, test1, exp1, 'both parameters missing');

    var test2 = libravatar.parse_user_identity(COMMON_EMAIL, COMMON_OPENID);
    var exp2 = [COMMON_EMAIL_HASH, COMMON_EMAIL_DOMAIN];
    array_equal(t, test2, exp2, 'both parameters supplied');

    var test3 = libravatar.parse_user_identity(COMMON_EMAIL, null);
    var exp3 = [COMMON_EMAIL_HASH, COMMON_EMAIL_DOMAIN];
    array_equal(t, test3, exp3, 'standard email');

    var test4 = libravatar.parse_user_identity(null, COMMON_OPENID);
    var exp4 = [COMMON_OPENID_HASH, COMMON_OPENID_DOMAIN];
    array_equal(t, test4, exp4, 'standard openid');

    t.end();
});

test("parsing of email address", function (t) {
    var test1 = libravatar.parse_user_identity('', null);
    var exp1 = [null, null];
    array_equal(t, test1, exp1, 'empty email');

    var test2 = libravatar.parse_user_identity('username', null);
    var exp2 = [null, null];
    array_equal(t, test2, exp2, 'missing hostname');

    var test3 = libravatar.parse_user_identity('WHATEVER@wherever.whichever', null);
    var exp3 = [COMMON_EMAIL_HASH, COMMON_EMAIL_DOMAIN];
    array_equal(t, test3, exp3, 'uppercase username');

    var test4 = libravatar.parse_user_identity('Whatever@Wherever.whichever', null);
    var exp4 = [COMMON_EMAIL_HASH, COMMON_EMAIL_DOMAIN];
    array_equal(t, test4, exp4, 'mixed-case username and hostname');

    var test5 = libravatar.parse_user_identity(' Whatever@Wherever.whichever   ', null);
    var exp5 = [COMMON_EMAIL_HASH, COMMON_EMAIL_DOMAIN];
    array_equal(t, test5, exp5, 'untrimmed email');

    t.end();
});

test("parsing of openid urls", function (t) {
    var test1 = libravatar.parse_user_identity(null, '');
    var exp1 = [null, null];
    array_equal(t, test1, exp1, 'empty openid');

    var test2 = libravatar.parse_user_identity(null, 'url');
    var exp2 = [null, null];
    array_equal(t, test2, exp2, 'invalid url');

    var test3 = libravatar.parse_user_identity(null, 'http://example.COM/id');
    var exp3 = [COMMON_OPENID_HASH, COMMON_OPENID_DOMAIN];
    array_equal(t, test3, exp3, 'mixed-case hostname');

    var test4 = libravatar.parse_user_identity(null, '  HTTP://example.com/id  ');
    var exp4 = [COMMON_OPENID_HASH, COMMON_OPENID_DOMAIN];
    array_equal(t, test4, exp4, 'uppercase scheme');

    var test5 = libravatar.parse_user_identity(null, 'http://user:password@Example.com/id');
    var exp5 = ['e1cf8061371aa00b82c0cf0b9b1140546bc31cd4a15cb8adc84ad01823bdf71e', COMMON_OPENID_DOMAIN];
    array_equal(t, test5, exp5, 'lowercase basic auth');

    var test6 = libravatar.parse_user_identity(null, 'http://User:Password@Example.com/id');
    var exp6 = ['50f60bb4c1b47fffdd6e2ce65f8bf37b65a2fb960596fa6789ef7b0044b931a2', COMMON_OPENID_DOMAIN];
    array_equal(t, test6, exp6, 'mixed-case basic auth');

    var test7 = libravatar.parse_user_identity(null, 'http://openid.example.COM/id');
    var exp7 = ['a108913053c4949f18d9eef7a4a68f27591297cdd7a7e2e375702aa87b6d3c05', 'openid.example.com'];
    array_equal(t, test7, exp7, 'sub-domain');

    var test8 = libravatar.parse_user_identity(null, 'https://example.com/id');
    var exp8 = ['43e813cfff429662436728ef4fb1cc12bcf20414cab78811137f7d718c1ddedb', COMMON_OPENID_DOMAIN];
    array_equal(t, test8, exp8, 'https');

    var test9 = libravatar.parse_user_identity(null, 'http://example.com/ID');
    var exp9 = ['ad8ce775cc12cba9bb8af26e00f55c473a3fcd3f554595a5ad9dd924a546a448', COMMON_OPENID_DOMAIN];
    array_equal(t, test9, exp9, 'uppercase path');

    t.end();
});

test("parsing of openid urls", function (t) {
    var test1 = libravatar.compose_avatar_url('', '', '', false);
    var exp1 = COMMON_PREFIX_HTTP;
    t.equal(test1, exp1, 'degenerate http case');

    var test2 = libravatar.compose_avatar_url('', '', '', true);
    var exp2 = COMMON_PREFIX_HTTPS;
    t.equal(test2, exp2, 'degenerate https case');

    var test3 = libravatar.compose_avatar_url('', 'deadbeef', '', false);
    var exp3 = COMMON_PREFIX_HTTP + 'deadbeef';
    t.equal(test3, exp3, 'simple http hash');

    var test4 = libravatar.compose_avatar_url('avatar.example.com', 'deadbeef', '', false);
    var exp4 = 'http://avatar.example.com/avatar/deadbeef';
    t.equal(test4, exp4, 'federated http hash');

    var test5 = libravatar.compose_avatar_url('avatar.example.com', 'deadbeef', '?s=24', true);
    var exp5 = 'https://avatar.example.com/avatar/deadbeef?s=24';
    t.equal(test5, exp5, 'federated https hash with size');

    var test6 = libravatar.compose_avatar_url('', '12345678901234567890123456789012', '?d=404', true);
    var exp6 = COMMON_PREFIX_HTTPS + '12345678901234567890123456789012?d=404';
    t.equal(test6, exp6, 'common https hash with default');

    t.end();
});
