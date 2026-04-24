import { Input } from './input'

interface TimePickerProps {
	value: string
	onChange: (time: string) => void
	className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
	return (
		<Input
			type='time'
			value={value}
			onChange={e => onChange(e.target.value)}
			className={className}
		/>
	)
}
