var tap = require("tap");
var test = tap.test;
var plan = tap.plan;

var libravatar = require('../lib/libravatar');

test("sanitization of invalid SRV responses", function (t) {
    var test1 = libravatar.sanitized_target(new Array(null, null), false);
    var exp1 = null;
    t.equal(test1, exp1, 'both parameters missing');

    var test2 = libravatar.sanitized_target(new Array(null, 80), false);
    var exp2 = null;
    t.equal(test2, exp2, 'first parameter missing');

    var test3 = libravatar.sanitized_target(new Array('example.com', null), true);
    var exp3 = null;
    t.equal(test3, exp3, 'second parameter missing');

    var test4 = libravatar.sanitized_target(new Array('example.com', 0), false);
    var exp4 = null;
    t.equal(test4, exp4, 'port too small');

    var test5 = libravatar.sanitized_target(new Array('example.com', 70000), true);
    var exp5 = null;
    t.equal(test5, exp5, 'port too big');

    var test6 = libravatar.sanitized_target(new Array('exam$ple.com', 80), false);
    var exp6 = null;
    t.equal(test6, exp6, 'invalid hostname');

    var test7 = libravatar.sanitized_target(new Array('example.com', 'abc'), true);
    var exp7 = null;
    t.equal(test7, exp7, 'invalid port');

    t.end();
});

test("sanitization of valid SRV responses", function (t) {
    var test1 = libravatar.sanitized_target(new Array('example.com', 80), false);
    var exp1 = 'example.com';
    t.equal(test1, exp1, 'normal http');

    var test2 = libravatar.sanitized_target(new Array('example.com', 443), true);
    var exp2 = 'example.com';
    t.equal(test2, exp2, 'normal https');

    var test3 = libravatar.sanitized_target(new Array('example.org', 8080), false);
    var exp3 = 'example.org:8080';
    t.equal(test3, exp3, 'weird http');

    var test4 = libravatar.sanitized_target(new Array('example.org', 44300), true);
    var exp4 = 'example.org:44300';
    t.equal(test2, exp2, 'weird https');

    t.end();
});

function array_equal(t, result, expected, description) {
    t.equal(result[0], expected[0], description + ' [0]');
    t.equal(result[1], expected[1], description + ' [1]');
}

test("ordering of invalid SRV hostnames", function (t) {
    var test1 = libravatar.srv_hostname(new Array());
    var exp1 = new Array(null, null);
    array_equal(t, test1, exp1, 'empty array');

    var test2 = libravatar.srv_hostname(new Array({name: null, port: null}));
    var exp2 = new Array(null, null);
    array_equal(t, test2, exp2, 'single empty array');

    t.end();
});

test("ordering of valid SRV hostnames on priority", function (t) {
    var test1 = libravatar.srv_hostname(new Array({name: 'example.com', port: 81}));
    var exp1 = new Array('example.com', 81);
    array_equal(t, test1, exp1, 'single hostname');

    var test2 = libravatar.srv_hostname(new Array({name: 'a.example.org', port: 81, priority: 0, weight: 0},
                                                  {name: 'b.example.org', port: 82, priority: 10, weight: 0}));
    var exp2 = new Array('a.example.org', 81);
    array_equal(t, test2, exp2, 'two hostnames');

    var test3 = libravatar.srv_hostname(new Array({name: 'a.example.org', port: 81, priority: 10, weight: 0},
                                                  {name: 'b.example.org', port: 82, priority: 1, weight: 0},
                                                  {name: 'c.example.org', port: 83, priority: 10, weight: 0},
                                                  {name: 'd.example.org', port: 84, priority: 10, weight: 0}));
    var exp3 = new Array('b.example.org', 82);
    array_equal(t, test3, exp3, 'four hostnames');

    t.end();
});

test("ordering of valid SRV hostnames on weight", function (t) {
    var test1 = libravatar.srv_hostname(new Array({name: 'a.example.org', port: 81, priority: 10, weight: 1},
                                                  {name: 'b.example.org', port: 82, priority: 10, weight: 5},
                                                  {name: 'c.example.org', port: 83, priority: 10, weight: 10},
                                                  {name: 'd.example.org', port: 84, priority: 10, weight: 50},
                                                  {name: 'e.example.org', port: 85, priority: 10, weight: 0}));
    var exp1 = new Array('d.example.org', 84);
    array_equal(t, test1, exp1, 'random 1');

    var test2 = libravatar.srv_hostname(new Array({name: 'a.example.org', port: 81, priority: 10, weight: 40},
                                                  {name: 'b.example.org', port: 82, priority: 10, weight: 0},
                                                  {name: 'c.example.org', port: 83, priority: 10, weight: 0},
                                                  {name: 'e.example.org', port: 85, priority: 10, weight: 0}));
    var exp2 = new Array('a.example.org', 81);
    array_equal(t, test2, exp2, 'random 2');

    var test3 = libravatar.srv_hostname(new Array({name: 'a.example.org', port: 81, priority: 10, weight: 1},
                                                  {name: 'b.example.org', port: 82, priority: 10, weight: 0},
                                                  {name: 'c.example.org', port: 83, priority: 10, weight: 0},
                                                  {name: 'e.example.org', port: 85, priority: 10, weight: 0}));
    var exp3 = new Array('b.example.org', 82);
    array_equal(t, test3, exp3, 'random 3');

    var test4 = libravatar.srv_hostname(new Array({name: 'a.example.org', port: 81, priority: 10, weight: 0},
                                                  {name: 'b.example.org', port: 82, priority: 10, weight: 0},
                                                  {name: 'c.example.org', port: 83, priority: 10, weight: 10},
                                                  {name: 'e.example.org', port: 85, priority: 10, weight: 0}));
    var exp4 = new Array('c.example.org', 83);
    array_equal(t, test4, exp4, 'random 4');

    var test5 = libravatar.srv_hostname(new Array({name: 'a.example.org', port: 81, priority: 10, weight: 1},
                                                  {name: 'b.example.org', port: 82, priority: 10, weight: 5},
                                                  {name: 'c.example.org', port: 83, priority: 10, weight: 10},
                                                  {name: 'd.example.org', port: 84, priority: 10, weight: 30},
                                                  {name: 'e.example.org', port: 85, priority: 10, weight: 50},
                                                  {name: 'f.example.org', port: 86, priority: 10, weight: 0}));
    var exp5 = new Array('e.example.org', 85);
    array_equal(t, test5, exp5, 'random 5');

    t.end();
});
