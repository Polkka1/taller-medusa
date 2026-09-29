import React from "react"

import { IconProps } from "types/icon"

const Paw: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...attributes}
    >
      <ellipse cx="6" cy="9.5" rx="2.2" ry="2.8" transform="rotate(-18 6 9.5)" />
      <ellipse cx="10" cy="5.5" rx="2.2" ry="2.9" transform="rotate(-6 10 5.5)" />
      <ellipse cx="14.5" cy="5.5" rx="2.2" ry="2.9" transform="rotate(8 14.5 5.5)" />
      <ellipse cx="18.4" cy="9.6" rx="2.2" ry="2.8" transform="rotate(20 18.4 9.6)" />
      <path d="M12.2 11.2c-2.7 0-6 3.4-6 6.3 0 1.9 1.4 2.9 3.1 2.9 1.2 0 2-.6 2.9-.6.9 0 1.7.6 2.9.6 1.7 0 3.1-1 3.1-2.9 0-2.9-3.3-6.3-6-6.3Z" />
    </svg>
  )
}

export default Paw
