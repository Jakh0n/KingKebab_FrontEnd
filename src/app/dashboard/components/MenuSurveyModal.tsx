'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SurveyResponses } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'

const INTRO =
  'We are planning to improve our menu and possibly remove some dishes. Since you work with customers every day, your opinion is very important. Please answer the questions below.'

const QUESTIONS: { key: keyof SurveyResponses; label: string; placeholder: string; rows?: number }[] = [
  {
    key: 'shouldRemove',
    label: 'Which dish do you think should be removed from the menu?',
    placeholder: 'Name of the dish',
  },
  {
    key: 'mostTimeOrDifficult',
    label: 'Which dish takes the most time or is difficult to prepare?',
    placeholder: 'Name of the dish',
  },
  {
    key: 'customersLikeLeast',
    label: 'Which dish do customers seem to like the least?',
    placeholder: 'Name of the dish',
  },
  {
    key: 'removeOneAndWhy',
    label: 'If we had to remove one dish from the menu, which one would you choose and why?',
    placeholder: 'Dish name and your reason...',
    rows: 3,
  },
  {
    key: 'suggestionsOrRecommendations',
    label: 'Do you have any suggestions or recommendations? Please write them here.',
    placeholder: 'Your suggestions...',
    rows: 4,
  },
]

const END_MESSAGE =
  'Thank you for your feedback. Your opinion will help us improve our menu and service.'

export interface MenuSurveyModalProps {
  isOpen: boolean
  onComplete: () => void
  onSubmit: (responses: SurveyResponses) => Promise<void>
}

const initialResponses: SurveyResponses = {
  suggestionsOrRecommendations: '',
  shouldRemove: '',
  mostTimeOrDifficult: '',
  customersLikeLeast: '',
  removeOneAndWhy: '',
}

export function MenuSurveyModal({ isOpen, onComplete, onSubmit }: MenuSurveyModalProps) {
  const [formData, setFormData] = useState<SurveyResponses>(initialResponses)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (key: keyof SurveyResponses, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const allFilled = QUESTIONS.every((q) => formData[q.key].trim().length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allFilled) {
      toast.error('Please answer all questions')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(formData)
      toast.success(END_MESSAGE)
      onComplete()
    } catch {
      toast.error('Failed to submit survey. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) return
      }}
    >
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="max-h-[90vh] overflow-y-auto bg-[#1A1F2E] border-[#2A3447] text-white sm:max-w-[560px]"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            Menu Improvement Survey
          </DialogTitle>
          <DialogDescription className="text-gray-400">{INTRO}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label htmlFor={q.key} className="text-sm text-gray-200">
                {q.label}
              </Label>
              {q.rows ? (
                <textarea
                  id={q.key}
                  value={formData[q.key]}
                  onChange={(e) => handleChange(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  rows={q.rows}
                  className="w-full rounded-md border border-[#2A3447] bg-[#0E1422] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#4E7BEE] focus:outline-none focus:ring-1 focus:ring-[#4E7BEE]"
                  required
                />
              ) : (
                <input
                  id={q.key}
                  type="text"
                  value={formData[q.key]}
                  onChange={(e) => handleChange(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full rounded-md border border-[#2A3447] bg-[#0E1422] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#4E7BEE] focus:outline-none focus:ring-1 focus:ring-[#4E7BEE]"
                  required
                />
              )}
            </div>
          ))}
          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={!allFilled || submitting}
              className="bg-[#4E7BEE] hover:bg-[#4E7BEE]/90 text-white"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
