import React from 'react'
import Admin from './Admin.jsx'

const clean = (data) => {
  return data.filter(Boolean).map((section) => {
    return {
      ...section,
      columns: section.columns?.filter(Boolean) || [],
    }
  })
}

const App = ({ data, setData, sections }) => {
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
    />
  )
}

export default App
