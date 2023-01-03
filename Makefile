
ifeq ($(net), testnet)
	ARGS=--build-arg GQL_WS_URI=ws://localhost:4350/graphql\
	--build-arg GQL_HTTP_URI=http://localhost:4350/graphql\
	--build-arg NODE_WS=wss://rpc.reefscan.com/ws\
	--build-arg VERIFICATOR_API=http://localhost:8000/api/verificator/submit-verification\
	--build-arg NETWORK_ID=reef-testnet\
	--build-arg NETWORK_LABEL=Testnet
else
	ARGS=--build-arg GQL_WS_URI=wss://squid.subsquid.io/reef-explorer/graphql\
	 --build-arg GQL_HTTP_URI=https://squid.subsquid.io/reef-explorer/graphql\
	 --build-arg NODE_WS=wss://rpc.reefscan.com/ws\
	 --build-arg VERIFICATOR_API=https://reefscan.com/api/verificator/submit-verification\
	 --build-arg NETWORK_ID=reef\
	 --build-arg NETWORK_LABEL=Mainnet
#	ARGS=$$(cat .env.mainnet | while read line; do out+="--build-arg $$line"; done; echo "$$out"; out="")
endif

#
#up:
# 	docker run --rm --name reefscan-fe-$(net)-$(env) -p 127.0.0.1:8001:80 reefscan-fe-$(net)-$(env)

build:
	docker build -t reefscan-fe-$(net)-$(env) -f Dockerfile-${env} --no-cache $(ARGS) .

tag:
	docker tag reefscan-fe-mainnet-prod us-central1-docker.pkg.dev/reef-chain/reef-dck/reefscan-fe

push:
	docker push us-central1-docker.pkg.dev/reef-chain/reef-dck/reefscan-fe
