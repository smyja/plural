import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Button, Scroller } from 'forge-core'
import { CurrentUserContext } from '../login/CurrentUser'
import { useMutation, useQuery } from 'react-apollo'
import { useHistory, useParams } from 'react-router'
import Markdown from './Markdown'
import { INCIDENT_Q, UPDATE_INCIDENT } from './queries'
import { Severity } from './Severity'
import { Box, Text, TextInput } from 'grommet'
import { Status } from './IncidentStatus'
import { MessageInput } from './MessageInput'
import { dateFormat } from '../../utils/date'
import moment from 'moment'
import { Chat, Close, Edit, Resources } from 'grommet-icons'
import SmoothScroller from '../utils/SmoothScroller'
import { Message } from './Message'
import { extendConnection } from '../../utils/graphql'
import { BreadcrumbsContext } from '../Breadcrumbs'
import { plainDeserialize, plainSerialize } from '../../utils/slate'
import { useEditor } from '../utils/hooks'
import { Editable, Slate } from 'slate-react'
import { TagInput } from '../repos/Tags'
import { AttachmentProvider, Dropzone } from './AttachmentProvider'
import { IncidentView } from './types'
import { FileEntry } from './File'
import { ViewSwitcher } from './ViewSwitcher'
import { Sidebar } from './Sidebar'
import { IncidentControls } from './IncidentControls'
import Avatar from '../users/Avatar'

export const canEdit = ({creator, owner}, {id}) => creator.id === id || owner.id === id

function EditButton({incidentId, editing}) {
  let history = useHistory()
  return (
    <Box pad='xsmall' round='xsmall' hoverIndicator='light-3' 
         onClick={() => history.push(editing ? `/incidents/${incidentId}` : `/incidents/${incidentId}/edit`)}>
      {editing ? <Close size='small' color='dark-6' /> : <Edit size='small' color='dark-6' />}
    </Box>
  )
}

function Empty() {
  return (
    <Box fill pad='medium' gap='small' align='center' justify='center' round='xsmall'>
      <Chat size='40px' />
      <Text size='small'>Get the conversation started</Text>
    </Box>
  )
}

function IncidentHeader({incident, editable, editing, mutation, attributes, setAttributes, updating}) {
  let history = useHistory()
  const [editorState, setEditorState] = useState(plainDeserialize(incident.description || ''))
  const editor = useEditor()
  const setDescription = useCallback((editorState) => {
    setEditorState(editorState)
    setAttributes({...attributes, description: plainSerialize(editorState)})
  }, [setAttributes, attributes, setEditorState])

  return (
    <Box flex={false} border={{color: 'light-4'}}>
      <Box direction='row' align='center' background='light-1' pad={{vertical: 'xsmall', horizontal: 'small'}} 
            border={{side: 'bottom', color: 'light-3'}} gap='xsmall' round={{corner: 'top', size: 'xsmall'}}>
        <Box fill='horizontal' direction='row' gap='xsmall'>
          <Text size='small' weight='bold'>{incident.creator.name}</Text>
          <Text size='small'>created on {dateFormat(moment(incident.insertedAt))}</Text>
        </Box>
        {!editing && <IncidentControls incident={incident} />}
        {editing && (
          <Box flex={false}>
            <Button label='Update' loading={updating} pad={{vertical: 'xsmall', horizontal: 'small'}} onClick={() => mutation({
              variables: {attributes: {...attributes, tags: attributes.tags.map((tag) => ({tag}))}},
              update: () => history.push(`/incidents/${incident.id}`)
            })} />
          </Box>
        )}
        {editable && <EditButton incidentId={incident.id} editing={editing} />}
      </Box>
      {!editing && <Box flex={false} gap='xsmall' border={{side: 'between', color: 'light-5'}}>
        <Box pad='small'>
          <Markdown text={incident.description || ''} />
        </Box>
        {incident.tags.length > 0 && <Box direction='row' gap='xsmall' align='center' pad='small'>
          {incident.tags.map(({tag}) => (
            <Box flex={false} round='xsmall' pad={{vertical: '1px', horizontal: 'xsmall'}} background='light-3'>
              <Text size='small'>{tag}</Text>
            </Box>
          ))}
        </Box>}
      </Box>}
      {editing && (
        <Box flex={false} gap='xsmall' border={{side: 'between', color: 'light-5'}}>
          <Box pad='small'>
            <Slate
              editor={editor}
              value={editorState}
              onChange={setDescription}>
              <Editable placeholder='Description of the incident (markdown allowed)' />
            </Slate>
          </Box>
          <Box direction='row' gap='small' align='center' pad='small'>
            <TagInput
              tags={attributes.tags || []}
              addTag={(tag) => setAttributes({...attributes, tags: [tag, ...(attributes.tags || [])]})}
              removeTag={(tag) => setAttributes({...attributes, tags: attributes.tags.filter((t) => t !== tag)})} />
          </Box>
        </Box>
      )}
    </Box>
  )
}

export function Messages({incident, loading, fetchMore}) {
  const [listRef, setListRef] = useState(null)
  const {messages: {pageInfo: {hasNextPage, endCursor}, edges}} = incident
  
  if (edges.length === 0) return <Empty />

  return (
    <SmoothScroller
      listRef={listRef}
      setListRef={setListRef}
      items={edges}
      mapper={({node}, next) => <Message message={node} next={next.node} />}
      loading={loading}
      loadNextPage={() => hasNextPage && fetchMore({
        variables: {cursor: endCursor},
        updateQuery: (prev, {fetchMoreResult: {incident: {messages}}}) => ({
          ...prev, incident: {...prev.incident, messages: extendConnection(prev.incident.messages, messages)},
        })
      })}
      hasNextPage={hasNextPage} />
  )
}

function NoFiles() {
  return (
    <Box fill pad='medium' gap='small' align='center' justify='center' round='xsmall'>
      <Resources size='40px' />
      <Text size='small'>No files uploaded yet</Text>
    </Box>
  )
}

function Files({incident, fetchMore}) {
  const {files: {pageInfo: {hasNextPage, endCursor}, edges}} = incident

  return (
    <Scroller
      id='files'
      style={{width: '100%', height: '100%', overflow: 'auto'}}
      edges={edges}
      emptyState={<NoFiles />}
      mapper={({node}, {node: next}) => <FileEntry file={node} next={next} />}
      onLoadMore={() => hasNextPage && fetchMore({
        variables: {fileCursor: endCursor},
        updateQuery: (prev, {fetchMoreResult: {incident: {files}}}) => ({
          ...prev, incident: {...prev.incident, files: extendConnection(prev.incident.files, files)},
        })
      })} />
  )
}

function IncidentOwner({incident: {owner}}) {
  return (
    <Box flex={false} direction='row' align='center' gap='xsmall'>
      <Text size='small'>Owner: </Text>
      <Avatar user={owner} size='30px' />
      <Text size='small' color='dark-3'>{owner.email}</Text>
    </Box>
  )
}

function IncidentInner({incident, fetchMore, loading, editing}) {
  let history = useHistory()
  const [view, setView] = useState(IncidentView.MSGS)
  const currentUser = useContext(CurrentUserContext)
  const editable = canEdit(incident, currentUser)
  const [attributes, setAttributes] = useState({
    description: incident.description, 
    title: incident.title,
    tags: incident.tags.map(({tag}) => tag)
  })
  const [mutation, {loading: updating}] = useMutation(UPDATE_INCIDENT, {
    variables: {id: incident.id, attributes: {...attributes, tags: attributes.tags.map((tag) => ({tag}))}},
    onCompleted: () => history.push(`/incidents/${incident.id}`)
  })

  return (
    <Box fill>
      <AttachmentProvider>
      <Box flex={false} pad='small' direction='row' align='center' gap='small' border={{side: 'bottom', color: 'light-5'}}>
        <Severity incident={incident} setSeverity={(severity) => mutation({variables: {attributes: {severity}}})} />
        {!editing && <Box fill='horizontal' direction='row' align='center' gap='xsmall'>
          <Text weight={500}>{incident.title}</Text>
        </Box>}
        {editing && (
          <Box fill='horizontal' direction='row' gap='small' align='center'>
            <TextInput value={attributes.title} onChange={({target: {value}}) => setAttributes({...attributes, title: value})} />
          </Box>
        )}
        {incident.owner && (<IncidentOwner incident={incident} />)}
        <Status incident={incident} setActive={(status) => mutation({variables: {attributes: {status}}})} />
      </Box>
      <Box fill direction='row'>
        <Box fill>
          <Box flex={false} pad={{horizontal: 'small'}} margin={{top: 'small'}}>
            <IncidentHeader 
              attributes={attributes}
              setAttributes={setAttributes}
              incident={incident} 
              editable={editable} 
              editing={editing} 
              updating={updating} 
              mutation={mutation} />
          </Box>
          <Box fill direction='row'>
            <ViewSwitcher view={view} setView={setView} />
            <Box fill>
              {view === IncidentView.FILES && (<Files incident={incident} fetchMore={fetchMore} />)}
              {view === IncidentView.MSGS && (
                <Dropzone>
                  <Messages 
                    updating={updating}
                    editing={editing}
                    mutation={mutation}
                    incident={incident} 
                    fetchMore={fetchMore} 
                    loading={loading} />
                </Dropzone>
              )}
            </Box>
          </Box>
          <MessageInput />
        </Box>
        <Sidebar incident={incident} fetchMore={fetchMore} />
      </Box>
      </AttachmentProvider>
    </Box>
  )
}

export function Incident({editing}) {
  const {incidentId} = useParams()
  const {data, loading, fetchMore} = useQuery(INCIDENT_Q, {variables: {id: incidentId}, fetchPolicy: 'cache-and-network'})
  const {setBreadcrumbs} = useContext(BreadcrumbsContext)
  useEffect(() => {
    setBreadcrumbs([{url: `/incidents`, text: 'incidents'}, {url: `/incidents/${incidentId}`, text: incidentId}])
  }, [setBreadcrumbs, incidentId])

  if (!data) return null

  return (
    <IncidentInner 
      editing={editing}
      incident={data.incident}
      fetchMore={fetchMore}
      loading={loading} />
  )
}
