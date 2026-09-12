// 기존 팀원 영역을 수정하지 않고 현재 브랜치의 소스 품질을 검사한다.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'public/mockServiceWorker.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
)
