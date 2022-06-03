import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box } from 'grommet'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import { BrowserIcon, CloudIcon, GearTrainIcon, GitHubIcon, Stepper } from 'pluralsh-design-system'
import { Button, Div, Flex, H1, H2, P, Text } from 'honorable'
import { CSSTransition, Transition } from 'react-transition-group'

import { LoopingLogo } from '../utils/AnimatedLogo'

import { GqlError } from '../utils/Alert'

import { AUTH_URLS, CLOUD_SHELL, CREATE_SHELL, REBOOT_SHELL, SCM_TOKEN } from './query'
import { GITHUB_VALIDATIONS } from './scm/github'
import { WORKSPACE_VALIDATIONS, WorkspaceForm } from './WorkspaceForm'
import { Terminal } from './Terminal'
import { Exceptions, getExceptions } from './validation'
import { CLOUD_VALIDATIONS, ProviderForm, synopsis } from './cloud/provider'
import { SCM_VALIDATIONS, ScmInput } from './scm/ScmInput'
import { Github as GithubLogo, Gitlab as GitlabLogo } from './icons'

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

export function OAuthCallback({ provider }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data } = useQuery(SCM_TOKEN, {
    variables: {
      code: searchParams.get('code'),
      provider: provider.toUpperCase(),
    },
  })

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

function DemoStepper({ stepIndex = 0, ...props }) {
  const steps = [
    { stepTitle: 'Create a repository', IconComponent: GitHubIcon, iconSize: 30 },
    { stepTitle: <>Choose a&nbsp;cloud</>, IconComponent: CloudIcon },
    { stepTitle: 'Configure repository', IconComponent: GearTrainIcon },
    { stepTitle: <>Launch the&nbsp;app</>, IconComponent: BrowserIcon },
  ]

  return (
    <Stepper
      stepIndex={stepIndex}
      steps={steps}
      {...props}
    />
  )
}

function CardButton(props) {
  return (
    <Button
      flex="1 1 100%"
      p={1.5}
      display="flex"
      alignContent="center"
      justify="center"
      backgroundColor="fill-two"
      border="1px solid border-fill-two"
      _hover={{ background: 'fill-two-hover' }}
      _active={{ background: 'fill-two-selected' }}
      mx={1}
      {...props}
    />
  )
}

function CreateARepoCard({ data }) {
  const urls = data?.scmAuthorization
  console.log('data.scma', urls)

  return (
    <Div
      backgroundColor="fill-one"
      border="1px solid border"
      borderRadius="normal"
      p={2}
      pt={1}
    >
      <H1
        body2
        lineHeight="24px"
        fontWeight={400}
        textTransform="uppercase"
        letterSpacing="1px"
        color="text-xlight"
        mb={0.5}
      >
        Create a repository
      </H1>
      <P mb={1}>
        We use GitOps to manage your application’s state. Use one of the following providers to get started.
      </P>
      <Flex mx={-1}>
        {urls?.map(({ provider, url }) => {
          let providerLogo = null
          let providerName = provider.toLowerCase
          switch (provider.toLowerCase()) {
            case 'github':
              providerName = 'GitHub'
              providerLogo = <GithubLogo />
              break
            case 'gitlab':
              providerName = 'Gitlab'
              providerLogo = <GitlabLogo />
              break
          }

          return (
            <CardButton
              onClick={() => {
                // START <<Remove this after dev>>
                const devTokens = {
                  // GITLAB: '',
                  GITHUB: 'b11776d43c92ddeec643',
                }
                if (process.env.NODE_ENV !== 'production' && devTokens[provider]) {
                  console.log('going to ', `/oauth/callback/${provider.toLowerCase()}/shell?code=${devTokens[provider]}`)
                  window.location = `/oauth/callback/${provider.toLowerCase()}/shell?code=${devTokens[provider]}`
                }
                else {
                  // END <<Remove this after dev>>
                  window.location = url
                }
              }}
            >
              <Div
                mx="auto"
                maxWidth={40}
                maxHeight={40}
              >
                { providerLogo }
              </Div>
              <Text
                body1
                mt={1}
              >
                Create a { providerName } repo
              </Text>
            </CardButton>
          )
        })}
      </Flex>
    </Div>
  )
}

export function CloudShell({ oAuthCallback }) {
  const { data } = useQuery(AUTH_URLS)
  const { data: shellData } = useQuery(CLOUD_SHELL, { fetchPolicy: 'cache-and-network' })
  const [mutation] = useMutation(REBOOT_SHELL)
  const [created, setCreated] = useState(false)
  const [splashTimerDone, setSplashTimerDone] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const splashWaitTime = 1200

  useEffect(() => {
    setTimeout(() => {
      setSplashTimerDone(true)
    }, splashWaitTime)
  }, [])

  useEffect(() => {
    if (shellData && shellData.shell && !shellData.shell.alive) {
      mutation()
      setCreated(true)
    }
  }, [shellData, setCreated, mutation])

  const showSplashScreen = useMemo(
    () => (!shellData || !data || !splashTimerDone),
    [shellData, data, splashTimerDone]
  )
  if ((shellData && shellData.shell) || created) return <Terminal />

  const logoSizeBig = 48
  const logoSizeSmall = 40
  const logoSize = showSplashScreen ? logoSizeBig : logoSizeSmall

  const fadeTransitionStyles = {
    entering: { opacity: 1 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
  }

  const splashTranslate = 'calc(50vh - (110px))'

  const logoTranslateTransition = {
    '&, &.enter, &.enter-active, &.enter-done, &.exit': {
      transform: `translateY(${splashTranslate})`,
    },
    '&.exit-active': {
      transition: 'all 0.6s cubic-bezier(0.5, 0, 0.5, 1)',
    },
    '&.exit-active, &.exit-done': {
      transform: 'translateY(0)',
    },
  }

  const logoScaleTransition = {
    '&, .enter &, .enter-active &, .enter-done &, .exit &': {
      transform: `scale(0.${logoSizeBig})`,
    },
    '.exit-active &': {
      transition: 'all 0.6s cubic-bezier(0.5, 0, 0.5, 1)',
    },
    '.exit-active &, .exit-done &': {
      transform: `scale(0.${logoSizeSmall})`,
    },
  }

  const splashEnterTransitions = {
    opacity: 0,
    transform: 'translateY(30px)',
    '.appear &, .enter &': {
      opacity: 0,
      transform: 'translateY(30px)',
    },
    '.appear-active &, .enter-active &': {
      transition: 'all 0.7s ease',
    },
    '.appear-active &, .enter-active &, .appear-done &, .enter-done': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  }
  const splashLogoTransitions = {
    ...splashEnterTransitions,
    '.appear-active &, .enter-active &': {
      transition: 'all 0.7s ease',
      transitionDelay: '0.1s',
    },
    '.appear &, .enter &': {
      opacity: 0,
      transform: 'translateY(30px) scale(0.5)',
    },
    '.appear-active &, .enter-active &, .appear-done &, .enter-done': {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
    },
    '.exit &, .exit-active &, .exit-done &': {
      opacity: 1,
      transform: 'none',
    },
  }
  const splashTextTransitions = {
    ...splashEnterTransitions,
    '.exit &': {
      opacity: 1,
      transform: 'translateY(0)',
    },
    '.exit-active &': {
      transition: 'all 0.3s ease',
    },
    '.exit-active &, .exit-done &': {
      opacity: 0,
    },
    '.exit-done &': {
      visibility: 'hidden',
    },
  }

  return (
    <Flex
      width="100%"
      alignItems="center"
      flexDirection="column"
      mt={3}
    >
      <CSSTransition
        in={showSplashScreen}
        appear
        timeout={1000}
      >
        <Div
          position="relative"
          zIndex={1}
          {...logoTranslateTransition}
        >
          <Flex
            width="100%"
            justify="center"
            {...splashLogoTransitions}
          >
            <Div
              width={logoSizeSmall}
              height={logoSizeSmall}
              transform={`scale(0.${logoSize})`}
              {...logoScaleTransition}
            >
              <LoopingLogo
                light
                still
                height={logoSize}
                scale={1}
              />
            </Div>
          </Flex>
        </Div>
          
      </CSSTransition>
      <CSSTransition
        in={showSplashScreen}
        appear
        timeout={1000}
      >
        <Div
          transform={`translateY(${splashTranslate})`}
          position="relative"
          width="100%"
          height={0}
        >
          <H2
            position="absolute"
            mt={`-${logoSizeBig - logoSizeSmall}px`}
            pt={3}
            fontSize={60}
            lineHeight="115%"
            fontWeight="500"
            letterSpacing="-1px"
            width="100%"
            fontFamily="'Monument Semi-Mono', 'Monument'"
            textAlign="center"
            {...splashTextTransitions}
          >
            Welcome to Plural
          </H2>
        </Div>
      </CSSTransition>
      <Transition
        in={!showSplashScreen}
        mountOnEnter
        unmountOnExit
        timeout={1000}
      >
        {transitionState => (
          <Div
            position="relative"
            zIndex="0"
            width="100%"
            maxWidth={640}
            mt={2}
            px={2}
            transition="all 0.6s ease"
            opacity={0}
            className={transitionState}
            {...fadeTransitionStyles[transitionState]}
          >
            <Div mb={3}>
              <DemoStepper stepIndex={stepIndex} />
            </Div>
            <CreateARepoCard data={data} />
          </Div>
        )}
      </Transition>
    </Flex>
  )
}
