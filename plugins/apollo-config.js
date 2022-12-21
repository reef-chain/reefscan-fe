import { split } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { getMainDefinition } from 'apollo-utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { network } from '../frontend.config.js'

export default (ctx) => {
  const httpLink = new HttpLink({ uri: network.backendHttp })

  // Create the subscription websocket link with graphql-ws
  const wsLink = new GraphQLWsLink(
    createClient({
      url: network.backendWs,
    })
  )

  const link = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    httpLink
  )

  return {
    link,
    cache: new InMemoryCache(),
    httpEndpoint: network.backendHttp,
    wsEndpoint: network.backendWs,
    websocketsOnly: true,
  }
}
