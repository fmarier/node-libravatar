test:
	./node_modules/.bin/jsonlint < package.json > /dev/null
	./node_modules/.bin/tap tests/*.js

announce:
	interactive-freecode-submit node-libravatar

upload: test
	HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= npm publish
