import { split } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { getMainDefinition } from 'apollo-utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { network } from '../frontend.config.js'
import * as dotenv from 'dotenv'
dotenv.config()

export default (ctx) => {
  const httpLink = new HttpLink({ uri: network.backendHttp })
console.log(
  'WSSSSSSSSSSSSS=',network.backendWs, ' process.env=',process.env.GQL_WS_URI
)
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
    defaultHttpLink: false,
    websocketsOnly: true,
  }
}
