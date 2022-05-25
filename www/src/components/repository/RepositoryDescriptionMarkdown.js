import React, { memo } from 'react'
import { Markdown } from 'grommet'
import {
} from 'pluralsh-design-system'
import { A, Blockquote, Box, Code, H1, H2, H3, H4, H5, H6, 
  Li, Ol, Ul } from 'honorable'

import MultilineCode from '../utils/Code'

function MdImg({ src, gitUrl, ...props }) {
  // Convert local image paths to full path on github
  // Only works if primary git branch is named "master"
  if (src && !src.match(/^https*/)) {
    src = `${gitUrl}/raw/master/${src}`
  }

  return (
    <img
      src={src}
      maxWidth="100%"
      display="inline"
      {...props}
    />
  )
}

function MdP({ ...props }) {
  return <p {...props} />
}

function getLastStringChild(children) {
  let lastChild = null
  React.Children.forEach(children, child => {
    if (typeof child === 'string') {
      lastChild = child
    }
    else if (child.props && child.props.children) {
      lastChild = getLastStringChild(child.props.children)
    }
  })
  if (!lastChild) {
    console.log('lastChild', lastChild)
  }

  return lastChild
}

function MdPre({ children, ...props }) {
  let lang
  console.log('children', children)
  if (children.props?.className?.startsWith('lang-')) {
    console.log('found className', children.props.className)
    lang = children.props.className.slice(5)
  }

  return (
    <Box mb={1}>
      <MultilineCode
        language={lang}
        {...props}
      >{getLastStringChild(children) || ''}
      </MultilineCode>
    </Box>
  )
}

const codeStyle = {
  background: 'background-light',
  borderRadius: '4px',
}

export default memo(({ text, gitUrl }) => (
  <Markdown
    components={{
      blockquote: {
        component: Blockquote,
        props: {
          borderLeft: '4px solid',
          borderColor: 'border',
          mx: 0,
          pl: '1em',
        } },
      ul: { component: Ul, props: { pl: '2em' } },
      ol: { component: Ol, props: { pl: '2em' } },
      li: { component: Li, props: { mt: 0.25 } },
      h1: { component: H1, props: { mt: 2, mb: 0.5 } },
      h2: { component: H2, props: { mt: 2, mb: 0.5 } },
      h3: { component: H3, props: { mt: 2, mb: 0.5 } },
      h4: { component: H4, props: { mt: 2, mb: 0.5 } },
      h5: { component: H5, props: { mt: 2, mb: 0.5 } },
      h6: { component: H6, props: { mt: 2, mb: 0.5 } },
      img: {
        component: MdImg,
        props: {
          gitUrl, style: { maxWidth: '100%' },
        },
      },
      p: { component: MdP },
      a: {
        component: A,
        props: {
          display: 'inline', color: 'text-light', size: 'small', target: '_blank',
        },
      },
      span: { props: { style: { verticalAlign: 'bottom' } } },
      code: {
        component: Code,
        props: {
          ...codeStyle,
          ...{
            mx: '0.2em',
            px: '0.3em',
            py: '0.25em',
          },
        } },
      pre: {
        component: MdPre,
        props: {
          ...codeStyle, ...{ px: '1em', py: '0.65em' },
        },
      },
    }}
  >
    {text}
  </Markdown>
))
