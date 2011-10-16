/*
 * node-libravatar: NodeJS module for Libravatar
 *
 * Copyright (C) 2011 Francois Marier <francois@libravatar.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE."
 */

var crypto = require('crypto');
var dns = require('dns');
var querystring = require('querystring');
var url = require('url');

var BASE_URL = 'http://cdn.libravatar.org/avatar/';
var SECURE_BASE_URL = 'https://seccdn.libravatar.org/avatar/';

/*
 * Return the right (target, port) pair from a list of SRV records.
 */
function srv_hostname(records) {
    if (records.length < 1) {
        return new Array(null, null);
    }

    if (1 == records.length) {
        var srv_record = records[0];
        return new Array(srv_record['name'], srv_record['port']);
    }

    // Keep only the servers in the top priority
    var priority_records = new Array();
    var total_weight = 0;
    var top_priority = records[0]['priority']; // highest priority = lowest number

    for (var srv_record in records) {
        if (srv_record['priority'] > top_priority) {
            // ignore the record (srv_record has lower priority)
            continue;
        }
        else if (srv_record['priority'] < top_priority) {
            // reset the asrv_recorday (srv_record has higher priority)
            top_priority = srv_record['priority'];
            total_weight = 0;
            priority_records = [];
        }

        total_weight += srv_record['weight'];

        if (srv_record['weight'] > 0) {
            priority_records.push(new Array(total_weight, srv_record));
        }
        else {
            // zero-weigth elements must come first
            priority_records.unshift(new Array(0, srv_record));
        }
    }

    if (1 == len(priority_records)) {
        srv_record = priority_records[0][1];
        return new Array(srv_record['name'], srv_record['port']);
    }

    // Select first record according to RFC2782 weight
    // ordering algorithm (page 3)
    var random_number = Math.floor(Math.random() * (total_weight - 0 + 1)) + min;

    for (var record in priority_records) {
        var weighted_index = record[0];
        var target = record[1];

        if (weighted_index >= random_number) {
            return new Array(target['name'], target['port']);
        }
    }

    console.log('There is something wrong with our SRV weight ordering algorithm');
    return new Array(null, null);
}

/*
 * Ensure we are getting a (mostly) valid hostname and port number
 * from the DNS resolver and return the final hostname:port string.
 */
function sanitized_target(target_components, https) {
    var target = target_components[0];
    var port = parseInt(target_components[1]);

    if (null == target || null == port) {
        return null;
    }

    if (port < 1 || port > 65535) {
        return null;
    }

    if (target.search(/^[0-9a-zA-Z\-.]+$/) == -1) {
        return null;
    }

    if (target && ((https && port != 443) || (!https && port != 80))) {
        return target + ':' + port;
    }
    else {
        return target;
    }
}

var libravatar = module.exports = {
    url: function (email, openid, options, https, callback) {
        var hash = null, domain = null;

        if (email != null) {
            var email_parts = email.split('@');
            domain = email_parts[email_parts.length - 1];
            hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
        }
        else if (openid != null) {
            var parsed_url = url.parse(openid);
            var normalized_url = parsed_url.protocol.toLowerCase();
            normalized_url += parsed_url.slashes ? '//' : '';
            normalized_url += parsed_url.hostname.toLowerCase();
            normalized_url += parsed_url.pathname;

            domain = parsed_url.hostname;
            hash = crypto.createHash('sha256').update(normalized_url).digest('hex');
        }

        if (null == hash) { // email and openid both missing
            callback(null);
        }

        var query_data = querystring.stringify(options);
        var query = (query_data && "?" + query_data) || "";

        var service_name = (https ? '_avatars-sec' : '_avatars') + '._tcp.' + domain;
        dns.resolveSrv(service_name, function (err, addresses) {
            var base_url = (https && SECURE_BASE_URL) || BASE_URL;

            var delegation_server = null;
            if (null == err) {
                var delegation_server = sanitized_target(srv_hostname(addresses), https);
            }

            if (delegation_server != null) {
                if (https) {
                    base_url = 'https://' + delegation_server + '/avatar/';
                }
                else {
                    base_url = 'http://' + delegation_server + '/avatar/';
                }
            }

            callback(base_url + hash + query);
        });
    }
};
