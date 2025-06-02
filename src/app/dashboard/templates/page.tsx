import { TemplateList } from '@/components/dashboard/templates/template-list'

export default function TemplatesPage() {
  return (
    <div className="container mx-auto py-6">
      <TemplateList />
    </div>
  )
}

export const metadata = {
  title: 'Style Templates',
  description: 'Create and manage brand templates for your video exports'
} 