import { useState } from 'react'
import { useQuery } from '@apollo/client'

import { Box } from 'grommet'

import { useOutletContext } from 'react-router-dom'

import { PageTitle } from 'pluralsh-design-system'

import { Div } from 'honorable'

import { Table, TableData, TableRow } from '../../utils/Table'

import { extendConnection } from '../../../utils/graphql'
import { StandardScroller } from '../../utils/SmoothScroller'

import { DEFERRED_UPDATES } from '../queries'

import { LoopingLogo } from '../../utils/AnimatedLogo'
import { Date } from '../../utils/Date'

export default function PackageUpdateQueue() {
  const { helmChart, terraformChart } = useOutletContext()
  const chartInst = helmChart?.installation?.id
  const tfInst = terraformChart?.installation?.id

  const [listRef, setListRef] = useState(null)
  const { data, loading, fetchMore } = useQuery(DEFERRED_UPDATES, {
    variables: { chartInst, tfInst },
    fetchPolicy: 'cache-and-network',
  })

  if (!data) return <LoopingLogo />

  const { edges, pageInfo } = data.deferredUpdates

  return (
    <Box
      fill
      flex={false}
      pad="medium"
      gap="small"
    >
      <PageTitle heading="Update queue" />
      {edges?.length ? (
        <Table
          headers={['Version', 'Dequeueable at', 'Created', 'Attempts']}
          sizes={['30%', '30%', '30%', '10%']}
          background="fill-one"
          width="100%"
          height="100%"
        >
          <Box fill>
            <StandardScroller
              listRef={listRef}
              setListRef={setListRef}
              refreshKey={chartInst || tfInst}
              hasNextPage={pageInfo.hasNextPage}
              items={edges}
              loading={loading}
              mapper={({ node }, { next }) => (
                <TableRow last={!next.node}>
                  <TableData>{node.deferred.version.version}</TableData>
                  <TableData><Date date={node.deferred.dequeueAt} /></TableData>
                  <TableData><Date date={node.deferred.insertedAt} /></TableData>
                  <TableData>{node.deferred.attempts}</TableData>
                </TableRow>
              )}
              loadNextPage={() => pageInfo.hasNextPage && fetchMore({
                variables: { cursor: pageInfo.endCursor },
                updateQuery: (prev, { fetchMoreResult: { deferredUpdates } }) => (
                  extendConnection(prev, deferredUpdates, 'deferredUpdates')
                ),
              })}
            />
          </Box>
        </Table>
      ) : (
        <Div body2>No updates queued.</Div>
      )}
    </Box>
  )
}