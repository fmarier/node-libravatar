test:
	json_verify < package.json

upload: test
	HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= npm publish
