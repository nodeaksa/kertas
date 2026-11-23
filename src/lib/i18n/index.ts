import type { AppLabels, Language } from '@/types/kertas'
import { idLabels } from './id'
import { enLabels } from './en'

export { idLabels } from './id'
export { enLabels } from './en'

export const dictionaries: Record<Language, AppLabels> = {
    id: idLabels,
    en: enLabels,
}

export function getLabels(language: Language): AppLabels {
    return dictionaries[language] ?? idLabels
}
