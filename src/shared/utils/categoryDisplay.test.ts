import { describe, expect, it } from 'vitest'
import { displayCategoryName } from './categoryDisplay'

describe('displayCategoryName', () => {
  it('uses the canonical participant-facing CH02 name', () => {
    expect(displayCategoryName({ code: 'CH02', name: '캠퍼스 주파수' })).toBe(
      '멋쟁이사자처럼',
    )
  })
})
