import { createElement, useCallback, useEffect, useState } from 'react'
import { Box, Text } from 'grommet'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { BrowserIcon, EyeIcon as CloudIcon, GearTrainIcon, GitHubIcon, StatusIpIcon } from 'pluralsh-design-system'
import { Button, Div, Flex, Style } from 'honorable'

import { LoopingLogo } from '../utils/AnimatedLogo'

import { GqlError } from '../utils/Alert'

import { METHOD_ICONS } from '../users/OauthEnabler'

import { AUTH_URLS, CLOUD_SHELL, CREATE_SHELL, REBOOT_SHELL, SCM_TOKEN } from './query'
import { GITHUB_VALIDATIONS } from './scm/github'
import { WORKSPACE_VALIDATIONS, WorkspaceForm } from './WorkspaceForm'
import { Terminal } from './Terminal'
import { Exceptions, getExceptions } from './validation'
import { CLOUD_VALIDATIONS, ProviderForm, synopsis } from './cloud/provider'
import { SCM_VALIDATIONS, ScmInput } from './scm/ScmInput'

const SECTIONS = {
  git: ['cloud', null],
  cloud: ['workspace', 'git'],
  workspace: ['finish', 'cloud'],
  finish: [null, 'workspace'],
}

const VALIDATIONS = {
  git: GITHUB_VALIDATIONS,
  workspace: WORKSPACE_VALIDATIONS,
}

function SynopsisTable({ items, width }) {
  return (
    <Box
      gap="xsmall"
      border={{ side: 'between' }}
    >
      {items.map(({ name, value }) => (
        <Box
          direction="row"
          key={name}
          gap="small"
          align="center"
        >
          <Box
            flex={false}
            width={width || '120px'}
          >
            <Text
              size="small"
              weight={500}
            >
              {name}
            </Text>
          </Box>
          <Box fill="horizontal">{value}</Box>
        </Box>
      ))}
    </Box>
  )
}

function SynopsisSection({ header, children }) {
  return (
    <Box
      pad="small"
      round="xsmall"
      background="card"
      gap="xsmall"
    >
      <Box
        direction="row"
        justify="center"
      >
        <Text
          size="small"
          weight={500}
        >{header}
        </Text>
      </Box>
      {children}
    </Box>
  )
}

function SecondaryButton({ label, onClick }) {
  return (
    <Button
      background="sidebarHover"
      label={label}
      onClick={onClick}
    />
  )
}

function Synopsis({ scm, credentials, workspace, provider, demo }) {
  return (
    <Box gap="small">
      <Text size="small">You've completed the configuration for your shell, but let's verify everything looks good just to be safe</Text>
      <Box
        gap="medium"
        direction="row"
      >
        <SynopsisSection header="Git Setup">
          <SynopsisTable
            width="80px"
            items={[{ name: 'Repository', value: scm.org ? `${scm.org}/${scm.name}` : scm.name }]}
          />
        </SynopsisSection>
        {!demo && (
          <SynopsisSection header="Cloud Credentials">
            <SynopsisTable items={synopsis({ provider, credentials, workspace })} />
          </SynopsisSection>
        )}
        <SynopsisSection header="Workspace">
          <SynopsisTable
            width="100px"
            items={[
              { name: 'Cluster', value: workspace.cluster },
              { name: 'Bucket Prefix', value: workspace.bucketPrefix },
              { name: 'Subdomain', value: workspace.subdomain },
            ]}
          />
        </SynopsisSection>
      </Box>
    </Box>
  )
}

export function Header({ text }) {
  return (
    <Box
      fill="horizontal"
      align="center"
      pad="small"
    >
      <Text
        size="small"
        weight={500}
      >{text}
      </Text>
    </Box>
  )
}

function getValidations(provider, scmProvider, section) {
  if (section === 'cloud') return CLOUD_VALIDATIONS[provider]
  if (section === 'git') return SCM_VALIDATIONS[scmProvider]

  return VALIDATIONS[section]
}

function CreateShell({ accessToken, onCreate, provider: scmProvider }) {
  const [demo, setDemo] = useState(null)
  const [section, setSection] = useState('git')
  const [provider, setProvider] = useState('AWS')
  const [scm, setScm] = useState({ name: '', provider: scmProvider, token: accessToken })
  const [credentials, setCredentials] = useState({})
  const [workspace, setWorkspace] = useState({})
  const [mutation, { loading, error: gqlError }] = useMutation(CREATE_SHELL, {
    variables: { attributes: { credentials, workspace, scm, provider, demoId: demo && demo.id } },
    onCompleted: onCreate,
  })

  const doSetProvider = useCallback(provider => {
    setProvider(provider)
    setCredentials({})
    setWorkspace({ ...workspace, region: null })
  }, [setProvider, setCredentials, setWorkspace, workspace])

  const next = useCallback(() => {
    const hasNext = !!SECTIONS[section][0]
    if (hasNext) setSection(SECTIONS[section][0])
    if (!hasNext) mutation()
  }, [section, mutation])

  const validations = getValidations(provider, scmProvider, section)
  const { error, exceptions } = getExceptions(validations, { credentials, workspace, scm })

  return (
    <Box
      style={{ overflow: 'auto', height: '100%', width: '100%' }}
      background="background"
      align="center"
      justify="center"
      pad="small"
    >
      <Box
        flex={false}
        gap="small"
        width={section !== 'finish' ? '50%' : null}
      >
        {exceptions && (!demo || section !== 'cloud') && <Exceptions exceptions={exceptions} />}
        {gqlError && (
          <GqlError
            error={gqlError}
            header="Failed to create shell"
          />
        )}
        {section === 'git' && (
          <>
            <Header text="Git Setup" />
            <ScmInput
              provider={scmProvider}
              accessToken={accessToken}
              scm={scm}
              setScm={setScm}
            />
          </>
        )}
        {section === 'cloud' && (
          <ProviderForm
            provider={provider}
            setProvider={doSetProvider}
            workspace={workspace}
            setWorkspace={setWorkspace}
            credentials={credentials}
            setCredentials={setCredentials}
            demo={demo}
            setDemo={setDemo}
            next={next}
          />
        )}
        {section === 'workspace' && (
          <>
            <Header text="Workspace" />
            <WorkspaceForm
              demo={demo}
              workspace={workspace}
              setWorkspace={setWorkspace}
            />
          </>
        )}
        {section === 'finish' && (
          <Synopsis
            provider={provider}
            workspace={workspace}
            credentials={credentials}
            demo={demo}
            scm={scm}
          />
        )}
        <Box
          direction="row"
          justify="end"
          gap="small"
        >
          {SECTIONS[section][1] && (
            <SecondaryButton
              label="Previous"
              onClick={() => setSection(SECTIONS[section][1])}
            />
          )}
          <Button
            onClick={next}
            border={!!error}
            disabled={error}
            loading={loading}
            label={section !== 'finish' ? 'Next' : 'Create'}
          />
        </Box>
      </Box>
    </Box>
  )
}

export function OAuthCallback() {
  const loc = useLocation()
  const navigate = useNavigate()
  const { provider } = useParams()
  const params = new URLSearchParams(loc.search)
  const { data } = useQuery(SCM_TOKEN, { variables: { code: params.get('code'), provider: provider.toUpperCase() } })

  if (!data) return <LoopingLogo dark />

  console.log(data)

  return (
    <Box
      background="background"
      fill
      align="center"
      justify="center"
    >
      <CreateShell
        accessToken={data.scmToken}
        provider={provider.toUpperCase()}
        onCreate={() => navigate('/shell')}
      />
    </Box>
  )
}

function StepperStep({ isActive = false, isComplete = false, title, renderIcon }) {

  const bounceEase = 'cubic-bezier(.37,1.4,.62,1)'
  const shownClassName = 'shown'
  const completeIconStyles = {
    opacity: '0',
    transform: 'scale(0)',
    transition: 'all 0.2s ease',
    [`&.${shownClassName}`]: {
      transform: 'scale(1)',
      opacity: '1',
      transition: `transform 0.3s ${bounceEase}, opacity 0.1s ease`,
      transitionDelay: '0.1s',
    },
  }

  return (
    <Div
      width="92px"
      flexGrow={0}
    >
      <Div
        position="relative"
        width="48px"
        height="48px"
        marginLeft="auto"
        marginRight="auto"
        borderRadius="1000px"
        backgroundColor="fill-one"
        border={`1px solid ${isActive ? 'grey.50' : 'grey.800'}`}
        transition="all 0.2s ease"
        transitionDelay="0.1"
      >
        <Flex
          width="100%"
          height="100%"
          position="absolute"
          justifyContent="center"
          alignItems="center"
          className={isComplete ? '' : shownClassName}
          {...completeIconStyles}
        >
          {renderIcon(isActive ? '#E9ECF0' : '#9096A2')}
        </Flex>
        <Flex
          width="100%"
          height="100%"
          position="absolute"
          justifyContent="center"
          alignItems="center"
          className={isComplete ? shownClassName : ''}
          {...completeIconStyles}
        >
          <StatusIpIcon
            color="#17E86E"
            size="24"
          />
        </Flex>
      </Div>
      <Div
        mt="12px"
        textAlign="center"
        fontSize="14px"
        lineHeight="20px"
        color={isActive ? 'text' : 'text-xlight'}
        transition="all 0.2s ease"
        transitionDelay="0.1"
      >{title}
      </Div>
    </Div>
  )
}

function StepperStepConnection({ isActive = false }) {
  return (
    <Div
      width="10px"
      flexGrow="1"
      margin="0 -11px"
      height="1px"
      marginTop="24px"
      backgroundColor="border"
      position="relative"
      aria-hidden="true"
    >
      <Div
        position="absolute"
        left="0"
        top="0"
        height="100%"
        backgroundColor="text"
        width={isActive ? '100%' : '0'}
        transition="width 0.1s ease-out"
      />
    </Div>
  )
}

function Stepper({ stepIndex, steps }) {
  return (
    <Flex
      width="100%"
      justifyContent="space-between"
    >
      {steps.map((step, index) => (
        <>
          <StepperStep
            isActive={stepIndex === index}
            isComplete={stepIndex > index}
            title={step.title}
            renderIcon={color => (
              <step.icon
                size={step.iconSize || '24px'}
                color={color}
              />
            )}
          />
          {index < steps.length - 1 && <StepperStepConnection isActive={stepIndex > index} />}
        </>
      ))}
    </Flex>
  )
}

function DemoStepper({ stepIndex = 0 }) {
  return (
    <Stepper
      stepIndex={stepIndex}
      steps={[
        {
          title: (<>Create a repository</>), icon: GitHubIcon,
        },
        {
          title: (<>Choose a cloud</>), icon: CloudIcon,
        },
        {
          title: (<>Create a repository</>), icon: GearTrainIcon,
        },
        {
          title: (<>Launch the app</>), icon: BrowserIcon,
        },
      ]}
    />
  )
}

export function CloudShell() {
  const { data } = useQuery(AUTH_URLS)
  const { data: shellData } = useQuery(CLOUD_SHELL, { fetchPolicy: 'cache-and-network' })
  const [mutation] = useMutation(REBOOT_SHELL)
  const [created, setCreated] = useState(false)
  const [splashTimerDone, setSplashTimerDone] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    setTimeout(() => {
      setSplashTimerDone(true)
    }, 1)
  }, [])

  useEffect(() => {
    if (shellData && shellData.shell && !shellData.shell.alive) {
      mutation()
      setCreated(true)
    }
  }, [shellData, setCreated, mutation])

  if (!shellData || !data || !splashTimerDone) return <LoopingLogo dark />

  if ((shellData && shellData.shell) || created) return <Terminal />

  const urls = data.scmAuthorization

  return (
    <Flex
      width="100%"
      justifyContent="center"
    >
      <Div
        width="100%"
        maxWidth="600px"
      >
        <DemoStepper stepIndex={stepIndex} />
        <Button onClick={() => setStepIndex(stepIndex + 1)}>Step forward</Button>
        <Button onClick={() => setStepIndex(stepIndex - 1)}>Step backward</Button>
        <Box
          background="background"
          fill
          align="center"
          justify="center"
          gap="xsmall"
        >
          {urls.map(({ provider, url }) => (
            <Box
              flex={false}
              pad="small"
              round="xsmall"
              direction="row"
              gap="small"
              border
              align="center"
              hoverIndicator="card"
              onClick={() => {
                window.location = url
              }}
            >
              {createElement(METHOD_ICONS[provider], { size: '15px' })}
              <Text
                size="small"
                weight={500}
              >
                Log in with {provider.toLowerCase()} to start
              </Text>
            </Box>
          ))}
        </Box>
      </Div>
      
    </Flex>
  )
}
