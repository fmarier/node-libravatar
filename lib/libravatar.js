/*
 * node-libravatar: node.js module for Libravatar
 *
 * Copyright (C) 2011, 2012 Francois Marier <francois@libravatar.org>
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

const
crypto = require('crypto'),
dns = require('dns'),
querystring = require('querystring'),
url = require('url');

const BASE_URL = 'http://cdn.libravatar.org/avatar/';
const SECURE_BASE_URL = 'https://seccdn.libravatar.org/avatar/';
const SERVICE_BASE = '_avatars._tcp';
const SECURE_SERVICE_BASE = '_avatars-sec._tcp';

/*
 * Return the right (target, port) pair from a list of SRV records.
 */
function srv_hostname(records) {
    if (records.length < 1) {
        return [null, null];
    }

    if (1 === records.length) {
        return [ records[0]['name'], records[0]['port'] ];
    }

    // Keep only the servers in the top priority
    var priority_records = [];
    var total_weight = 0;
    var top_priority = records[0]['priority']; // highest priority = lowest number

    records.forEach(function (srv_record) {
        if (srv_record['priority'] <= top_priority) { // ignore lower priority records
            if (srv_record['priority'] < top_priority) {
                // reset the array (srv_record has higher priority)
                top_priority = srv_record['priority'];
                total_weight = 0;
                priority_records = [];
            }

            total_weight += srv_record['weight'];

            if (srv_record['weight'] > 0) {
                priority_records.push([total_weight, srv_record]);
            } else {
                // zero-weigth elements must come first
                priority_records.unshift([0, srv_record]);
            }
        }
    });

    if (1 === priority_records.length) {
        var srv_record = priority_records[0][1];
        return [ srv_record['name'], srv_record['port'] ];
    }

    // Select first record according to RFC2782 weight
    // ordering algorithm (page 3)
    var random_number = Math.floor(Math.random() * (total_weight + 1));

    for (var i = 0; i < priority_records.length; i++) {
        var weighted_index = priority_records[i][0];
        var target = priority_records[i][1];

        if (weighted_index >= random_number) {
            return [ target['name'], target['port'] ];
        }
    }

    console.log('There is something wrong with our SRV weight ordering algorithm');
    return [null, null];
}

/*
 * Ensure we are getting a (mostly) valid hostname and port number
 * from the DNS resolver and return the final hostname:port string.
 */
function sanitized_target(target_components, https) {
    var target = target_components[0];
    var port = parseInt(target_components[1]);

    if (target === null || isNaN(port)) {
        return null;
    }

    if (port < 1 || port > 65535) {
        return null;
    }

    if (target.search(/^[0-9a-zA-Z\-.]+$/) === -1) {
        return null;
    }

    if (target && ((https && port != 443) || (!https && port != 80))) {
        return target + ':' + port;
    } else {
        return target;
    }
}

/*
 * Generate user hash based on the email address or OpenID and return
 * it along with the relevant domain.
 */
function parse_user_identity(email, openid) {
    var hash = null, domain = null;

    if (email != null) {
        var lowercase_value = email.trim().toLowerCase();
        var email_parts = lowercase_value.split('@');
        if (email_parts.length > 1) {
            domain = email_parts[email_parts.length - 1];
            hash = crypto.createHash('md5').update(lowercase_value).digest('hex');
        }
    } else if (openid != null) {
        var parsed_url = url.parse(openid);
        if (parsed_url.protocol && parsed_url.hostname) {
            var normalized_url = parsed_url.protocol.toLowerCase();
            normalized_url += parsed_url.slashes ? '//' : '';
            if (parsed_url.auth) {
                normalized_url += parsed_url.auth + '@';
            }
            normalized_url += parsed_url.hostname.toLowerCase();
            normalized_url += parsed_url.pathname;

            domain = parsed_url.hostname.toLowerCase();
            hash = crypto.createHash('sha256').update(normalized_url).digest('hex');
        }
    }

    return [hash, domain];
}

/*
 * Return the DNS service to query for a given domain and scheme.
 */
function service_name(domain, https) {
    if (domain) {
        return (https ? SECURE_SERVICE_BASE : SERVICE_BASE) + '.' + domain;
    }
    return null;
}

/*
 * Assemble the final avatar URL based on the provided components.
 */
function compose_avatar_url(delegation_server, avatar_hash, query_string, https) {
    var base_url = (https && SECURE_BASE_URL) || BASE_URL;

    if (delegation_server) {
        if (https) {
            base_url = 'https://' + delegation_server + '/avatar/';
        } else {
            base_url = 'http://' + delegation_server + '/avatar/';
        }
    }

    return base_url + avatar_hash + query_string;
}

var libravatar = module.exports = {
    // These ones are exported for the unit tests only
    sanitized_target: sanitized_target,
    srv_hostname: srv_hostname,
    parse_user_identity: parse_user_identity,
    service_name: service_name,
    compose_avatar_url: compose_avatar_url,

    url: function (options, callback) {
        var identity = parse_user_identity(options.email, options.openid);
        var hash = identity[0];
        var domain = identity[1];
        var https = options.https || false;

        if (hash) {
            delete(options.email);
            delete(options.openid);
            delete(options.https);
            var query_data = querystring.stringify(options);
            var query = (query_data && "?" + query_data) || "";

            dns.resolveSrv(service_name(domain, https), function (err, addresses) {
                var delegation_server;
                if (null === err) {
                    delegation_server = sanitized_target(srv_hostname(addresses), https);
                }

                callback(null, compose_avatar_url(delegation_server, hash, query, https));
            });
        } else {
            callback('An email or an OpenID must be provided.', null);
        }
    }
};
