announce:
	interactive-freecode-submit node-libravatar

upload: test
	HTTP_PROXY= http_proxy= HTTPS_PROXY= https_proxy= npm publish
