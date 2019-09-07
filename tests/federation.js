const test = require('tap').test
const libravatar = require('../lib/libravatar')

test('sanitization of invalid SRV responses', t => {
  const test1 = libravatar.sanitized_target([null, null], false)
  const exp1 = null
  t.equal(test1, exp1, 'both parameters missing')

  const test2 = libravatar.sanitized_target([null, 80], false)
  const exp2 = null
  t.equal(test2, exp2, 'first parameter missing')

  const test3 = libravatar.sanitized_target(['example.com', null], true)
  const exp3 = null
  t.equal(test3, exp3, 'second parameter missing')

  const test4 = libravatar.sanitized_target(['example.com', 0], false)
  const exp4 = null
  t.equal(test4, exp4, 'port too small')

  const test5 = libravatar.sanitized_target(['example.com', 70000], true)
  const exp5 = null
  t.equal(test5, exp5, 'port too big')

  const test6 = libravatar.sanitized_target(['exam$ple.com', 80], false)
  const exp6 = null
  t.equal(test6, exp6, 'invalid hostname')

  const test7 = libravatar.sanitized_target(['example.com', 'abc'], true)
  const exp7 = null
  t.equal(test7, exp7, 'invalid port')

  t.end()
})

test('sanitization of valid SRV responses', t => {
  const test1 = libravatar.sanitized_target(['example.com', 80], false)
  const exp1 = 'example.com'
  t.equal(test1, exp1, 'normal http')

  const test2 = libravatar.sanitized_target(['example.com', 443], true)
  const exp2 = 'example.com'
  t.equal(test2, exp2, 'normal https')

  const test3 = libravatar.sanitized_target(['example.org', 8080], false)
  const exp3 = 'example.org:8080'
  t.equal(test3, exp3, 'weird http')

  const test4 = libravatar.sanitized_target(['example.org', 44300], true)
  const exp4 = 'example.org:44300'
  t.equal(test4, exp4, 'weird https')

  t.end()
})

const array_equal = (t, result, expected, description) => {
  t.equal(result[0], expected[0], description + ' [0]')
  t.equal(result[1], expected[1], description + ' [1]')
}

test('ordering of invalid SRV hostnames', t => {
  const test1 = libravatar.srv_hostname([])
  const exp1 = [null, null]
  array_equal(t, test1, exp1, 'empty array')

  const test2 = libravatar.srv_hostname([{ name: null, port: null }])
  const exp2 = [null, null]
  array_equal(t, test2, exp2, 'single empty array')

  t.end()
})

test('ordering of valid SRV hostnames on priority', t => {
  const test1 = libravatar.srv_hostname([{ name: 'example.com', port: 81 }])
  const exp1 = ['example.com', 81]
  array_equal(t, test1, exp1, 'single hostname')

  const test2 = libravatar.srv_hostname([
    { name: 'a.example.org', port: 81, priority: 0, weight: 0 },
    { name: 'b.example.org', port: 82, priority: 10, weight: 0 },
  ])
  const exp2 = ['a.example.org', 81]
  array_equal(t, test2, exp2, 'two hostnames')

  const test3 = libravatar.srv_hostname([
    { name: 'a.example.org', port: 81, priority: 10, weight: 0 },
    { name: 'b.example.org', port: 82, priority: 1, weight: 0 },
    { name: 'c.example.org', port: 83, priority: 10, weight: 0 },
    { name: 'd.example.org', port: 84, priority: 10, weight: 0 },
  ])
  const exp3 = ['b.example.org', 82]
  array_equal(t, test3, exp3, 'four hostnames')

  t.end()
})

test('ordering of valid SRV hostnames on weight', t => {
  const original_random = Math.random

  Math.random = () => {
    return 0.6
  }
  const test1 = libravatar.srv_hostname([
    { name: 'a.example.org', port: 81, priority: 10, weight: 1 },
    { name: 'b.example.org', port: 82, priority: 10, weight: 5 },
    { name: 'c.example.org', port: 83, priority: 10, weight: 10 },
    { name: 'd.example.org', port: 84, priority: 10, weight: 50 },
    { name: 'e.example.org', port: 85, priority: 10, weight: 0 },
  ])
  const exp1 = ['d.example.org', 84]
  array_equal(t, test1, exp1, 'random 1')

  Math.random = () => {
    return 0.2
  }
  const test2 = libravatar.srv_hostname([
    { name: 'a.example.org', port: 81, priority: 10, weight: 40 },
    { name: 'b.example.org', port: 82, priority: 10, weight: 0 },
    { name: 'c.example.org', port: 83, priority: 10, weight: 0 },
    { name: 'e.example.org', port: 85, priority: 10, weight: 0 },
  ])
  const exp2 = ['a.example.org', 81]
  array_equal(t, test2, exp2, 'random 2')

  Math.random = () => {
    return 0.4
  }
  const test3 = libravatar.srv_hostname([
    { name: 'a.example.org', port: 81, priority: 10, weight: 1 },
    { name: 'b.example.org', port: 82, priority: 10, weight: 0 },
    { name: 'c.example.org', port: 83, priority: 10, weight: 0 },
    { name: 'e.example.org', port: 85, priority: 10, weight: 0 },
  ])
  const exp3 = ['e.example.org', 85]
  array_equal(t, test3, exp3, 'random 3')

  Math.random = () => {
    return 0.3
  }
  const test4 = libravatar.srv_hostname([
    { name: 'a.example.org', port: 81, priority: 10, weight: 0 },
    { name: 'b.example.org', port: 82, priority: 10, weight: 0 },
    { name: 'c.example.org', port: 83, priority: 10, weight: 10 },
    { name: 'e.example.org', port: 85, priority: 10, weight: 0 },
  ])
  const exp4 = ['c.example.org', 83]
  array_equal(t, test4, exp4, 'random 4')

  Math.random = () => {
    return 0.8
  }
  const test5 = libravatar.srv_hostname([
    { name: 'a.example.org', port: 81, priority: 10, weight: 1 },
    { name: 'b.example.org', port: 82, priority: 10, weight: 5 },
    { name: 'c.example.org', port: 83, priority: 10, weight: 10 },
    { name: 'd.example.org', port: 84, priority: 10, weight: 30 },
    { name: 'e.example.org', port: 85, priority: 10, weight: 50 },
    { name: 'f.example.org', port: 86, priority: 10, weight: 0 },
  ])
  const exp5 = ['e.example.org', 85]
  array_equal(t, test5, exp5, 'random 5')

  Math.random = original_random
  t.end()
})

test('ordering of valid SRV hostnames on weight', t => {
  const test1 = libravatar.service_name(null, false)
  const exp1 = null
  t.equal(test1, exp1, 'degenerate case')

  const test2 = libravatar.service_name('example.com', false)
  const exp2 = '_avatars._tcp.example.com'
  t.equal(test2, exp2, 'simple domain over http')

  const test3 = libravatar.service_name('example.org', true)
  const exp3 = '_avatars-sec._tcp.example.org'
  t.equal(test3, exp3, 'simple domain over https')

  const test4 = libravatar.service_name('example.co.nz', false)
  const exp4 = '_avatars._tcp.example.co.nz'
  t.equal(test4, exp4, 'longer domain over http')

  t.end()
})
