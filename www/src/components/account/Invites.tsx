import { useMutation, useQuery } from '@apollo/client'
import moment from 'moment'
import { useContext, useEffect, useState } from 'react'
import { Div, Flex, Text } from 'honorable'
import { ThemeContext } from 'styled-components'
import { SearchIcon } from '@pluralsh/design-system'

import { useOutletContext } from 'react-router-dom'

import ListInput from '../utils/ListInput'
import { Placeholder } from '../utils/Placeholder'
import CopyableButton from '../utils/CopyableButton'
import { List, ListItem } from '../utils/List'
import {
  extendConnection,
  removeConnection,
  updateCache,
} from '../../utils/graphql'
import { DeleteIconButton } from '../utils/IconButtons'
import { StandardScroller } from '../utils/SmoothScroller'

import LoadingIndicator from '../utils/LoadingIndicator'

import { Confirm } from '../utils/Confirm'

import { DELETE_INVITE, INVITES_Q } from './queries'
import { inviteLink } from './utils'

function DeleteInvite({ invite }: any) {
  const [confirm, setConfirm] = useState(false)
  const [mutation, { loading, error }] = useMutation(DELETE_INVITE, {
    variables: { id: invite.id },
    onCompleted: () => setConfirm(false),
    update: (cache, { data: { deleteInvite } }) =>
      updateCache(cache, {
        query: INVITES_Q,
        variables: {},
        update: (invites) => removeConnection(invites, deleteInvite, 'invites'),
      }),
  })

  return (
    <>
      <DeleteIconButton onClick={() => setConfirm(true)} />
      <Confirm
        open={confirm}
        close={() => setConfirm(false)}
        title="Delete Invite?"
        text="You can always recreate it if you want"
        destructive
        submit={() => mutation()}
        loading={loading}
        error={error}
      />
    </>
  )
}

function InviteLink({ invite }: any) {
  if (!invite.secureId) return <Div>Email sent to user</Div>

  return (
    <CopyableButton
      secondary
      small
      copyText={inviteLink(invite)}
    >
      Copy invite link
    </CopyableButton>
  )
}

function Invite(invite: any) {
  const theme = useContext(ThemeContext)
  const { email, insertedAt } = invite

  return (
    <Flex
      width="100%"
      flexDirection="row"
      gap="large"
      alignItems="center"
    >
      <Text
        {...(theme.partials.text.body1Bold as any)}
        flexGrow={1}
      >
        {email}
      </Text>
      <Text
        caption
        color="text-xlight"
      >
        {`Created ${moment(insertedAt).format('lll')}`}
      </Text>
      <InviteLink invite={invite} />
      <DeleteInvite invite={invite} />
    </Flex>
  )
}

export function Invites() {
  const [q, setQ] = useState('')
  const [listRef, setListRef] = useState<any>(null)
  const { data, loading, fetchMore, refetch } = useQuery(INVITES_Q, {
    variables: { q },
    fetchPolicy: 'cache-and-network',
  })
  const [dataCache, setDataCache] = useState(data)
  const outletContext = useOutletContext() as Record<string, any>

  if (outletContext?.refetchInvites) {
    outletContext.refetchInvites.current = refetch
  }

  useEffect(() => {
    if (data) {
      setDataCache(data)
    }
  }, [data])

  const {
    invites: { pageInfo, edges },
  } = data || dataCache || { invites: {} }

  return (
    <List>
      <ListInput
        width="100%"
        value={q}
        placeholder="Search an invite"
        startIcon={<SearchIcon color="text-light" />}
        onChange={({ target: { value } }) => setQ(value)}
        flexGrow={0}
      />
      <Div
        flexGrow={1}
        width="100%"
      >
        {!data && !dataCache ? (
          <LoadingIndicator />
        ) : (
          <StandardScroller
            listRef={listRef}
            setListRef={setListRef}
            hasNextPage={pageInfo.hasNextPage}
            items={edges}
            mapper={({ node }, { prev, next }) => (
              <ListItem
                key={node.id}
                first={!prev.node}
                last={!next.node}
              >
                <Invite {...node} />
              </ListItem>
            )}
            loading={loading}
            placeholder={Placeholder}
            loadNextPage={() =>
              pageInfo.hasNextPage &&
              fetchMore({
                variables: { cursor: pageInfo.endCursor },
                updateQuery: (prev, { fetchMoreResult: { invites } }) =>
                  extendConnection(prev, invites, 'invites'),
              })
            }
          />
        )}
      </Div>
    </List>
  )
}
