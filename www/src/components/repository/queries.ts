import { gql } from '@apollo/client'

import {
  ArtifactFragment,
  InstallationFragment,
  RepoFragment,
  StepFragment,
  TestFragment,
} from '../../models/repo'
import { ChartFragment } from '../../models/chart'
import { TerraformFragment } from '../../models/terraform'
import { DockerRepoFragment } from '../../models/docker'
import { RecipeFragment } from '../../models/recipe'
import { PageInfo } from '../../models/misc'
import { RolloutFragment } from '../../models/upgrades'
import { OIDCProvider } from '../../models/oauth'

export const CREATE_REPOSITORY_MUTATION = gql`
  mutation CreateRepository(
    $repositoryId: ID!
    $attributes: RepositoryAttributes!
  ) {
    createRepository(id: $repositoryId, attributes: $attributes) {
      ...RepoFragment
    }
  }
  ${RepoFragment}
`

export const UPDATE_REPOSITORY_MUTATION = gql`
  mutation UpdateRepository(
    $repositoryId: ID!
    $attributes: RepositoryAttributes!
  ) {
    updateRepository(repositoryId: $repositoryId, attributes: $attributes) {
      ...RepoFragment
      tags {
        tag
      }
      documentation
      community {
        discord
        slack
        homepage
        gitUrl
        twitter
      }
    }
  }
  ${RepoFragment}
`

export const REPOSITORY_QUERY = gql`
  query Repository($repositoryId: ID, $name: String) {
    repository(id: $repositoryId, name: $name) {
      ...RepoFragment
      editable
      publicKey
      secrets
      artifacts {
        ...ArtifactFragment
      }
      installation {
        ...InstallationFragment
        oidcProvider {
          ...OIDCProvider
        }
      }
      tags {
        tag
      }
      readme
      mainBranch
      gitUrl
      homepage
      license {
        name
        url
      }
      documentation
      community {
        discord
        slack
        homepage
        gitUrl
        twitter
      }
    }
  }
  ${RepoFragment}
  ${ArtifactFragment}
  ${InstallationFragment}
  ${OIDCProvider}
`

export const RECIPES_QUERY = gql`
  query RepositoryRecipes($repositoryId: ID!, $cursor: String) {
    recipes(repositoryId: $repositoryId, first: 100, after: $cursor) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          ...RecipeFragment
        }
      }
    }
  }
  ${PageInfo}
  ${RecipeFragment}
`

export const CHARTS_QUERY = gql`
  query RepositoryCharts($repositoryId: ID!, $cursor: String) {
    charts(repositoryId: $repositoryId, first: 12, after: $cursor) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          ...ChartFragment
        }
      }
    }
  }
  ${PageInfo}
  ${ChartFragment}
`

export const TERRAFORM_QUERY = gql`
  query RepositoryTerraform($repositoryId: ID!, $cursor: String) {
    terraform(repositoryId: $repositoryId, first: 12, after: $cursor) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          ...TerraformFragment
        }
      }
    }
  }
  ${PageInfo}
  ${TerraformFragment}
`
export const DOCKER_QUERY = gql`
  query RepositoryDocker($repositoryId: ID!, $cursor: String) {
    dockerRepositories(repositoryId: $repositoryId, first: 12, after: $cursor) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          ...DockerRepoFragment
        }
      }
    }
  }
  ${PageInfo}
  ${DockerRepoFragment}
`
export const TESTS_QUERY = gql`
  query RespositoryTests($repositoryId: ID, $cursor: String) {
    tests(after: $cursor, first: 12, repositoryId: $repositoryId) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          ...TestFragment
        }
      }
    }
  }
  ${PageInfo}
  ${TestFragment}
`

export const TEST_LOGS_SUBSCRIPTION = gql`
  subscription RepositoryTestLogs($testId: ID!) {
    testLogs(testId: $testId) {
      step {
        ...StepFragment
      }
      logs
    }
  }
  ${StepFragment}
`

export const DEPLOYMENTS_QUERY = gql`
  query RepositoryRollouts($repositoryId: ID!, $cursor: String) {
    rollouts(repositoryId: $repositoryId, after: $cursor, first: 12) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          ...RolloutFragment
        }
      }
    }
  }
  ${PageInfo}
  ${RolloutFragment}
`

export const DELETE_INSTALLATION_MUTATION = gql`
  mutation DeleteInstallation($id: ID!) {
    deleteInstallation(id: $id) {
      ...InstallationFragment
    }
  }
  ${InstallationFragment}
`

export const UPDATE_INSTALLATION = gql`
  mutation UpdateInstallation($id: ID!, $attributes: InstallationAttributes!) {
    updateInstallation(id: $id, attributes: $attributes) {
      ...InstallationFragment
    }
  }
  ${InstallationFragment}
`

export const TAGS_SEARCH_QUERY = gql`
  query Tags($q: String, $cursor: String, $first: Int) {
    tags(type: REPOSITORIES, first: $first, after: $cursor, q: $q) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          tag
          count
        }
      }
    }
  }
  ${PageInfo}
`

export const ROLLOUTS = gql`
  query Rollouts($repositoryId: ID!, $cursor: String) {
    rollouts(repositoryId: $repositoryId, after: $cursor, first: 50) {
      pageInfo {
        ...PageInfo
      }
      edges {
        node {
          ...RolloutFragment
        }
      }
    }
  }
  ${PageInfo}
  ${RolloutFragment}
`

export const ROLLOUT_SUB = gql`
  subscription Rollout($repositoryId: ID!) {
    rolloutDelta(repositoryId: $repositoryId) {
      delta
      payload {
        ...RolloutFragment
      }
    }
  }
  ${RolloutFragment}
`
