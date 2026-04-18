import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/outline";
import { Fragment, useEffect, useMemo, useState } from "react"
import Label from "./Label";

export default function Select({
   label,
   options = [],
   onSelect = () => {},
   multiple = false,
   placeholder,
   value
}) {
   const [selectedOption, setSelectedOption] = useState(multiple ? [] : options[0])
   const isControlled = value !== undefined
   const selectedValue = isControlled ? value : selectedOption

   /**
    * Keep the single-select fallback aligned with the first option when options change.
    */
   useEffect(() => {
      if (isControlled || multiple || selectedOption || options.length === 0) return
      setSelectedOption(options[0])
   }, [isControlled, multiple, options, selectedOption])

   const buttonLabel = useMemo(() => {
      if (multiple) {
         if (!selectedValue.length) return placeholder || "Select one or more"
         if (selectedValue.length <= 2) return selectedValue.map((option) => option.label).join(", ")
         return `${selectedValue.length} selected`
      }

      return selectedValue?.label || placeholder || "Select an option"
   }, [multiple, placeholder, selectedValue])

   const getNormalisedMultiValue = (nextValue) => {
      if (Array.isArray(nextValue)) return nextValue

      const currentValues = Array.isArray(selectedValue) ? selectedValue : []
      const isAlreadySelected = currentValues.some((option) => option.value === nextValue?.value)

      if (isAlreadySelected) {
         return currentValues.filter((option) => option.value !== nextValue.value)
      }

      return currentValues.concat(nextValue)
   }

   const handleChange = (nextValue) => {
      const resolvedValue = multiple ? getNormalisedMultiValue(nextValue) : nextValue

      if (!isControlled) {
         setSelectedOption(resolvedValue)
      }

      onSelect(resolvedValue)
   }

   return (
      <Listbox value={selectedValue} onChange={handleChange} multiple={multiple} by="value">
         <div className="relative">
            {label && <Label>{label}</Label>}
            <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-sm text-left bg-white rounded-md border border-gray-200 cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500">
               <span className="block truncate capitalize">{buttonLabel}</span>
               <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
               </span>
            </Listbox.Button>
            <Transition
               as={Fragment}
               leave="transition ease-in duration-100"
               leaveFrom="opacity-100"
               leaveTo="opacity-0"
            >
               <Listbox.Options className="absolute z-10 w-full p-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {multiple && selectedValue.length > 0 && (
                     <div className="sticky top-0 z-10 rounded-md border border-sky-100 bg-sky-50/95 px-3 py-2 backdrop-blur">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                           Selected
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                           {selectedValue.map((option) => (
                              <span
                                 key={`selected-${option.value}`}
                                 className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-800"
                              >
                                 {option.label}
                              </span>
                           ))}
                        </div>
                     </div>
                  )}
                  {options?.map((option) => (
                     <Listbox.Option
                        key={option.value}
                        value={option}
                        className={({ active, selected }) =>
                           `${selected
                              ? active
                                 ? "bg-sky-200 text-sky-950"
                                 : "bg-sky-50 text-sky-900"
                              : active
                                 ? "bg-blue-100 text-blue-900"
                                 : "text-gray-900"}
                           cursor-default select-none relative rounded-md py-2 pl-10 pr-4`
                        }
                     >
                        {({ active, selected }) => (
                           <>
                              <span className={`${selected ? 'font-semibold' : 'font-normal'} block truncate capitalize`}>
                                 {option.label}
                              </span>
                              {selected ? (
                                 <span className={`${active ? 'text-sky-700' : 'text-sky-600'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                                    <CheckIcon className="h-5 w-5" />
                                 </span>
                              ) : null}
                           </>
                        )}
                     </Listbox.Option>
                  ))}
               </Listbox.Options>
            </Transition>
         </div>
      </Listbox>
   )
}
