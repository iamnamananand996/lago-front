import { Autocomplete, createFilterOptions } from '@mui/material'
import { Icon } from 'lago-design-system'
import _sortBy from 'lodash/sortBy'
import { HTMLAttributes, JSXElementConstructor, useMemo, useState } from 'react'

import { Chip } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import { MultipleComboBoxItemWrapper } from './MultipleComboBoxItemWrapper'
import { MultipleComboBoxList } from './MultipleComboBoxList'
import { MultipleComboBoxPopperFactory } from './MultipleComboBoxPopperFactory'
import {
  BasicMultipleComboBoxData,
  MultipleComboBoxData,
  MultipleComboBoxDataGrouped,
  MultipleComboBoxProps,
} from './types'

import { TextInput } from '../TextInput'

const DEFAULT_LIMIT_TAGS = 2

export const MultipleComboBox = ({
  data: rawData,
  value,
  disabled,
  sortValues = true,
  label,
  infoText,
  placeholder,
  name,
  helperText,
  error,
  PopperProps,
  className,
  freeSolo,
  emptyText,
  disableClearable = false,
  showOptionsOnlyWhenTyping = false,
  disableCloseOnSelect = false,
  forcePopupIcon = false,
  hideTags = false,
  renderGroupHeader,
  virtualized = true,
  limitTags,
  onChange,
}: MultipleComboBoxProps) => {
  const { translate } = useInternationalization()
  const [open, setOpen] = useState(false)

  // By default, we want to sort `options` alphabetically (by value)
  const data = useMemo(() => {
    return (
      sortValues
        ? _sortBy(rawData, (item: MultipleComboBoxData) => item.label ?? item.value)
        : rawData
    ) as MultipleComboBoxData[]
  }, [rawData, sortValues])

  const filter = createFilterOptions<MultipleComboBoxData>({
    stringify: (option) => option.label || option.value,
    trim: true,
  })

  return (
    <Autocomplete
      multiple
      className="w-full"
      sx={{
        /* Prevent dropdown and clear button to overlap input */
        '& .MuiAutocomplete-inputRoot': {
          paddingRight: '50px !important',
        },
        /* Fix the placement of the adornment elements */
        '& .MuiAutocomplete-endAdornment': {
          top: 'calc(50% - 12px)',

          '& .MuiButtonBase-root': {
            height: '24px',
            width: '24px',
            borderRadius: '8px',
          },
        },
      }}
      open={showOptionsOnlyWhenTyping ? open : undefined}
      onInputChange={
        showOptionsOnlyWhenTyping
          ? (_, typedValue) => {
              if (typedValue.length === 0) {
                if (open) setOpen(false)
              } else {
                if (!open) setOpen(true)
              }
            }
          : undefined
      }
      onClose={() => setOpen(false)}
      forcePopupIcon={forcePopupIcon}
      disableCloseOnSelect={disableCloseOnSelect}
      disableClearable={disableClearable}
      disabled={disabled}
      limitTags={limitTags || DEFAULT_LIMIT_TAGS}
      options={data}
      renderInput={(params) => (
        <TextInput
          {...params}
          className={tw('min-w-20', className)}
          infoText={infoText}
          error={error}
          helperText={helperText}
          label={label}
          name={name}
          placeholder={placeholder}
        />
      )}
      onChange={(_, newValue) => {
        // Format all values to have the correct format
        const formatedValues = newValue.map((val) => {
          if (typeof val === 'string') {
            return { value: val }
          }
          return val
        }) as (BasicMultipleComboBoxData | MultipleComboBoxDataGrouped)[]

        // If more than one value, remove last element if value already exists
        if (formatedValues.length > 1) {
          const lastElementValue = formatedValues[formatedValues.length - 1].value

          for (let i = 0; i < formatedValues.length - 1; i++) {
            const currentValue = formatedValues[i].value
            const isNotLastElement = i !== formatedValues.length - 1

            if (isNotLastElement && currentValue === lastElementValue) {
              formatedValues.length = formatedValues.length - 1
              break
            }
          }
        }

        onChange(formatedValues)
      }}
      value={value || undefined}
      renderTags={(tagValues, getTagProps) => {
        if (hideTags) {
          return null
        }

        return tagValues.map((option, index) => {
          const tagOptions = getTagProps({ index })

          return (
            <Chip
              {...tagOptions}
              className="my-2 ml-2 mr-0"
              key={tagOptions.key}
              label={option.label ?? option.value}
            />
          )
        })
      }}
      componentsProps={{
        clearIndicator: {
          className: tw('size-6 rounded-lg'),
        },
      }}
      clearIcon={<Icon name="close-circle-filled" />}
      popupIcon={<Icon name="chevron-up-down" />}
      noOptionsText={emptyText ?? translate('text_623b3acb8ee4e000ba87d082')}
      clearOnBlur
      freeSolo={freeSolo}
      isOptionEqualToValue={
        !data.length && freeSolo
          ? undefined
          : (option, val) => {
              return option?.value === val.value
            }
      }
      renderOption={(props, option, state) => {
        return (
          <MultipleComboBoxItemWrapper
            multipleComboBoxProps={props}
            id={`option-${option.value}`}
            key={`option-${option.value}`}
            option={option}
            selected={state.selected}
            virtualized={virtualized}
            addValueRedirectionUrl={option.addValueRedirectionUrl}
            {...props}
          />
        )
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params)

        const { inputValue } = params
        // Suggest the creation of a new value
        const isExisting = options.some(
          (option) => inputValue === option.value || inputValue === option.label,
        )

        if (inputValue !== '' && !isExisting && freeSolo) {
          filtered.push({
            customValue: true,
            value: inputValue,
            label: translate('text_65ef30711cfd3e0083135de8', { value: inputValue }),
          })
        }

        return filtered
      }}
      ListboxComponent={
        MultipleComboBoxList as unknown as JSXElementConstructor<HTMLAttributes<HTMLElement>>
      }
      ListboxProps={
        // @ts-expect-error we're using props from MultipleComboBoxList which are not reccognized by the Autocomplete MUI component
        { value, renderGroupHeader, virtualized }
      }
      PopperComponent={MultipleComboBoxPopperFactory(PopperProps)}
      getOptionDisabled={(option) => !!option?.disabled}
      getOptionLabel={(option) => {
        const optionForString =
          typeof option === 'string' ? data.find(({ value: val }) => val === option) : null

        if (typeof option === 'string') {
          if (optionForString) {
            return optionForString.label || optionForString.value
          }
          return option
        }
        return option.label || option.value
      }}
    />
  )
}
