import React from 'react'
import Admin from './Admin.jsx'
import { clone } from '../utils/object.js'

const clean = (data) => {
  data.sections = data.sections.filter(Boolean).map((section) => {
    return {
      ...section,
      columns: section.columns?.filter(Boolean) || [],
    }
  })
  return data
}

const App = ({ data, setData, sections, slug }) => {
  const [internal, setInternal] = React.useState(data)
  const originalData = React.useRef(clone(data))
  React.useEffect(() => {
    setInternal(data)
  }, [data])
  const revert = () => {
    setInternal(originalData.current)
    setData(originalData.current)
  }
  return (
    <Admin
      data={internal}
      revert={revert}
      setData={(newData) => {
        setInternal(clean(newData))
        setData(clean(newData))
      }}
      sections={sections}
      slug={slug}
    />
  )
}

export default App
