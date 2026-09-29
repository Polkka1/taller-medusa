import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  // Values come back alphabetically; the rank keeps sizes and weights in
  // their natural order (small to large). Unranked values keep their position.
  const rankOf = (value: { rank?: number | null }) =>
    value.rank ?? Number.MAX_SAFE_INTEGER
  const filteredOptions = [...(option.values ?? [])]
    .sort((a, b) => rankOf(a) - rankOf(b))
    .map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm font-semibold">Elige {title.toLowerCase()}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-semi text-plum h-10 rounded-full p-2 flex-1 ",
                {
                  "border-pastel-lavender-700 bg-pastel-lavender-200": v === current,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
