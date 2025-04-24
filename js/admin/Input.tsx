import React from 'react'

export default function Input(props) {
  const { select } = props
  const nextProps = { ...props }
  delete nextProps.select
  return (
    <input
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.target.blur()
        }
      }}
      {...(select
        ? {
            onFocus: (e) => e.target.select(),
          }
        : {})}
      {...nextProps}
    />
  )
}
