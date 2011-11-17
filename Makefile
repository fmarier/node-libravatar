test:
	json_verify < package.json
	node_modules/tap/bin/tap.js tests/*.js

upload: test
	HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= npm publish
