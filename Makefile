
ifeq ($(env), prod)
	ARGS=--build-arg GQL_WS_URI=ws://localhost:4350/graphql --build-arg GQL_HTTP_URI=http://localhost:4350/graphql --build-arg NODE_WS=wss://rpc.reefscan.com/ws --build-arg VERIFICATOR_API=http://localhost:8000/api/verificator/submit-verification
#	ARGS=$$(cat .env.mainnet | while read line; do out+="--build-arg $$line"; done; echo "$$out"; out="")

else
	ARGS=--build-arg GQL_WS_URI=ws://localhost:4350/graphql --build-arg GQL_HTTP_URI=http://localhost:4350/graphql --build-arg NODE_WS=wss://rpc.reefscan.com/ws --build-arg VERIFICATOR_API=http://localhost:8000/api/verificator/submit-verification
endif

#
# up:
# 	export $$(cat .env.$(net) | xargs) && docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) up -d $(services)

build:
	docker build -t reefscan-fe-$(net)-$(env) -f Dockerfile-${env} $(ARGS) .

# execute:
# 	export $$(cat .env.$(net) | xargs) && docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) $(cmd) $(services)
#
# down:
# 	export $$(cat .env.$(net) | xargs) && docker-compose -p reef-explorer-$(net)-$(env) -f $(COMPOSE-MANIFEST) down
#
# populate:
# 	export $$(cat .env | xargs) && docker-compose -f resources/docker-compose-populate.yml run --rm populate
#
# purge:
# 	$(foreach volume,$(VOLUMES),docker volume rm reef-explorer-$(net)-$(env)_$(volume);)
#
# hasura:
# 	export $$(cat .env | xargs) && cd db/hasura && hasura console --admin-secret $$GQL_ADMIN_PW
