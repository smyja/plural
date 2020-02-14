import { gql } from 'apollo-boost'

export const BuildFragment = gql`
  fragment BuildFragment on Build {
    id
    repository
    type
    status
    insertedAt
    completedAt
  }
`;

export const CommandFragment = gql`
  fragment CommandFragment on Command {
    id
    command
    exitCode
    stdout
    completedAt
    insertedAt
  }
`;

export const BUILDS_Q = gql`
  query Builds($cursor: String) {
    builds(first: 15, after: $cursor) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          ...BuildFragment
        }
      }
    }
  }
  ${BuildFragment}
`;

export const BUILD_Q = gql`
  query Build($buildId: ID!) {
    build(id: $buildId) {
      ...BuildFragment
      commands {
        ...CommandFragment
      }
    }
  }
  ${BuildFragment}
  ${CommandFragment}
`;

export const CREATE_BUILD = gql`
  mutation CreateBuild($attributes: BuildAttributes!) {
    createBuild(attributes: $attributes) {
      ...BuildFragment
    }
  }
  ${BuildFragment}
`;

export const BUILD_SUB = gql`
  subscription {
    buildDelta {
      delta
      payload {
        ...BuildFragment
      }
    }
  }
  ${BuildFragment}
`;

export const COMMAND_SUB = gql`
  subscription {
    commandDelta {
      delta
      payload {
        ...CommandFragment
      }
    }
  }
  ${CommandFragment}
`;