import React, { useEffect, useMemo } from 'react'
import { Loading, Errors } from 'forge-core'
import { useParams, useLocation, useHistory } from 'react-router'
import { useMutation } from 'react-apollo'
import { CREATE_OAUTH } from './queries'
import { ParamToService } from './types'
import { Box, Text } from 'grommet'

function OauthError({error, service}) {
  return (
    <Box fill gap='small' pad='medium'>
      <Text size='small' weight='bold'>Error creating oauth integration with {service}</Text>
      <Errors errors={error} />
    </Box>
  )
}

export function OauthCreator() {
  let history = useHistory()
  const location = useLocation()
  const {service} = useParams()
  const {redirectUri, code} = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return {code: params.get('code'), redirectUri: `${window.location.origin}${window.location.pathname}`}
  }, [location])
  const [mutation, {loading, data, error}] = useMutation(CREATE_OAUTH, {
    variables: {attributes: {code, redirectUri, service: ParamToService[service]}}
  })

  useEffect(() => {
    mutation()
  }, [])

  useEffect(() => {
    if (!error && data) {
      history.push('/accounts/edit/integrations')
    }
  }, [data, error])

  if (loading) return <Loading />

  if (error) return <OauthError error={error} service={service} />

  return (
    <Box fill align='center' justify='center'>
      <Text size='small' weight='bold'>Created {service} oauth integration</Text>
    </Box>
  )
}