import type { Category } from '../api/types'

export const displayCategoryName = (category: Pick<Category, 'code' | 'name'>) =>
  category.code === 'CH02' ? '멋쟁이사자처럼' : category.name
