import React from 'react'
import Admin from './Admin.jsx'

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
  React.useEffect(() => {
    setInternal(data)
  }, [data])
  return (
    <Admin
      data={internal}
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
