announce:
	interactive-freecode-submit node-libravatar

test:
	@( test -x /usr/bin/json_verify && json_verify < package.json ) || true
	npm test

upload: test
	HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= npm publish
