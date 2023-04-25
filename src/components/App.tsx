import React from 'react'

type Props = {
  value?: number
}
const Demo = ({ value = 0 }: Props) => {
  return <div>{value}</div>
}

export default Demo
