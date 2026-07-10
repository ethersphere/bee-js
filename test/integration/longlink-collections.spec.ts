import { batch, makeBee } from '../utils'

const bee = makeBee()

interface TestFile {
  name: string
  content: string
}

async function uploadAndVerifyCollection(files: TestFile[]): Promise<void> {
  const fileObjects = files.map(f => new File([f.content], f.name, { type: 'text/plain' }))
  const result = await bee.collection.uploadFromFileList(batch(), fileObjects)
  expect(result.reference).toBeTruthy()

  for (const { name, content } of files) {
    const downloaded = await bee.file.download(result.reference, name)
    expect(downloaded.data.toUtf8()).toBe(content)
  }
}

// Builds a path with N segments of 30 'a' chars each plus leaf 'f.ts' (4 chars).
// Total = 31N + 4 chars.
// N=1..3  → normal  (total ≤ 100)
// N=4..8  → USTAR   (valid split: prefix=30*(N-3)-1 ≤ 155, name=97)
// N≥9     → longlink (no split satisfies both prefix ≤ 155 and name ≤ 100)
function deepPath(n: number): string {
  return Array.from({ length: n }, () => 'a'.repeat(30)).join('/') + '/f.ts'
}

test('upload containing all three tar path formats (normal, USTAR, longlink)', async () => {
  await uploadAndVerifyCollection([
    // Normal: total ≤ 100 chars — stored directly in the tar name field
    { name: 'index.html', content: 'normal-1' },
    { name: 'src/main.ts', content: 'normal-2' },
    { name: 'assets/styles/theme.css', content: 'normal-3' },
    { name: 'src/components/Button.tsx', content: 'normal-4' },
    { name: 'a'.repeat(96) + '.txt', content: 'normal-5' }, // exactly 100 chars

    // USTAR: path > 100, a valid prefix (≤ 155) / name (≤ 100) split exists
    { name: 'a'.repeat(95) + '/' + 'b'.repeat(10), content: 'ustar-1' }, // 106 total
    { name: 'a'.repeat(120) + '/' + 'b'.repeat(60), content: 'ustar-2' }, // 181 total
    { name: 'a'.repeat(155) + '/' + 'b'.repeat(50), content: 'ustar-3' }, // 206 total
    { name: 'a'.repeat(155) + '/' + 'b'.repeat(100), content: 'ustar-4' }, // 256 — USTAR max

    // LongLink: no valid USTAR split exists — GNU ././@LongLink entry required
    { name: 'a'.repeat(101), content: 'longlink-1' }, // bare filename > 100
    { name: 'src/' + 'a'.repeat(101), content: 'longlink-2' }, // name portion > 100
    { name: 'a'.repeat(156) + '/' + 'b'.repeat(50), content: 'longlink-3' }, // prefix > 155
    { name: 'a'.repeat(155) + '/' + 'b'.repeat(101), content: 'longlink-4' }, // 257 total
    { name: 'a'.repeat(100) + '/' + 'b'.repeat(100) + '/' + 'c'.repeat(60), content: 'longlink-5' },
  ])
})

test('web application folder with realistically long component and asset names', async () => {
  const authComponent = 'UserAuthenticationWithOAuthAndMFAComponent.tsx' // 46 chars
  const registrationSchema = 'UserRegistrationFormValidationSchemaWithCustomMessages.ts' // 57 chars
  const deepFeaturePath = 'packages/feature-authentication/src/components/forms/validations/' // 65 chars

  await uploadAndVerifyCollection([
    // Root config — short paths
    { name: 'package.json', content: '{}' },
    { name: 'tsconfig.json', content: '{}' },
    { name: 'README.md', content: '# Project' },

    // Typical source paths — normal (under 100 chars total)
    { name: 'src/index.ts', content: 'index' },
    { name: 'src/App.tsx', content: 'app' },
    { name: `src/components/${authComponent}`, content: 'auth component' }, // 62 chars
    { name: `src/schemas/${registrationSchema}`, content: 'schema' }, // 69 chars

    // Deep monorepo paths — USTAR range
    { name: `${deepFeaturePath}${registrationSchema}`, content: 'deep schema' }, // 122 chars, prefix=64, name=57
    { name: 'a'.repeat(110) + '/' + 'b'.repeat(40), content: 'ustar-mono-1' }, // 151 total
    { name: 'a'.repeat(150) + '/' + 'b'.repeat(80), content: 'ustar-mono-2' }, // 231 total

    // Filenames that exceed the 100-char tar name limit — GNU LongLink required
    { name: 'src/' + 'a'.repeat(101), content: 'longlink-comp-1' },
    { name: 'src/components/' + 'b'.repeat(101), content: 'longlink-comp-2' },
    { name: `${deepFeaturePath}` + 'c'.repeat(101), content: 'longlink-schema' }, // prefix=64, name=101

    // Total path so long no split fits within USTAR limits
    { name: 'a'.repeat(80) + '/' + 'b'.repeat(80) + '/' + 'c'.repeat(80) + '/d.ts', content: 'longlink-triple' },
  ])
})

test('collection of files systematically stepping across the 100-char name boundary', async () => {
  await uploadAndVerifyCollection([
    // Bare filenames either side of 100 chars
    { name: 'a'.repeat(97), content: 'name-97' },
    { name: 'a'.repeat(98), content: 'name-98' },
    { name: 'a'.repeat(99), content: 'name-99' },
    { name: 'a'.repeat(100), content: 'name-100' }, // last that fits in name field without longlink
    { name: 'a'.repeat(101), content: 'name-101' }, // first that requires longlink
    { name: 'a'.repeat(102), content: 'name-102' },
    { name: 'a'.repeat(103), content: 'name-103' },
    { name: 'a'.repeat(104), content: 'name-104' },

    // Same boundary with a short directory prefix
    { name: 'dir/' + 'b'.repeat(97), content: 'prefixed-97' },
    { name: 'dir/' + 'b'.repeat(98), content: 'prefixed-98' },
    { name: 'dir/' + 'b'.repeat(99), content: 'prefixed-99' },
    { name: 'dir/' + 'b'.repeat(100), content: 'prefixed-100' }, // USTAR: prefix=3, name=100
    { name: 'dir/' + 'b'.repeat(101), content: 'prefixed-101' }, // longlink: name portion=101
    { name: 'dir/' + 'b'.repeat(102), content: 'prefixed-102' },
  ])
})

test('collection of files systematically stepping across the 256-char USTAR maximum', async () => {
  // Fix prefix at exactly 155 chars so the only variable is the name length
  const prefix = 'a'.repeat(155)

  await uploadAndVerifyCollection([
    { name: prefix + '/' + 'b'.repeat(97), content: 'total-253' }, // USTAR
    { name: prefix + '/' + 'b'.repeat(98), content: 'total-254' }, // USTAR
    { name: prefix + '/' + 'b'.repeat(99), content: 'total-255' }, // USTAR
    { name: prefix + '/' + 'b'.repeat(100), content: 'total-256' }, // USTAR max
    { name: prefix + '/' + 'b'.repeat(101), content: 'total-257' }, // longlink
    { name: prefix + '/' + 'b'.repeat(102), content: 'total-258' }, // longlink
    { name: prefix + '/' + 'b'.repeat(103), content: 'total-259' }, // longlink

    // Prefix one over the limit forces longlink regardless of name length
    { name: 'a'.repeat(156) + '/' + 'b'.repeat(97), content: 'prefix-156-name-97' },
    { name: 'a'.repeat(156) + '/' + 'b'.repeat(100), content: 'prefix-156-name-100' },
    { name: 'a'.repeat(160) + '/' + 'b'.repeat(60), content: 'prefix-160-name-60' },
  ])
})

test('deeply nested directory tree with escalating path depths', async () => {
  await uploadAndVerifyCollection([
    // Normal depths (total ≤ 100 chars)
    { name: deepPath(1), content: 'depth-1' }, // 35 chars
    { name: deepPath(2), content: 'depth-2' }, // 66 chars
    { name: deepPath(3), content: 'depth-3' }, // 97 chars

    // USTAR depths (valid prefix/name split exists)
    { name: deepPath(4), content: 'depth-4' }, // 128 chars (prefix=93, name=35)
    { name: deepPath(5), content: 'depth-5' }, // 159 chars (prefix=93, name=66)
    { name: deepPath(6), content: 'depth-6' }, // 190 chars (prefix=93, name=97)
    { name: deepPath(7), content: 'depth-7' }, // 221 chars (prefix=124, name=97)
    { name: deepPath(8), content: 'depth-8' }, // 252 chars (prefix=154, name=97)

    // Longlink depths (no valid split: any prefix≤155 forces name>100)
    { name: deepPath(9), content: 'depth-9' }, // 283 chars
    { name: deepPath(10), content: 'depth-10' }, // 314 chars
    { name: deepPath(12), content: 'depth-12' }, // 376 chars
  ])
})

test('large collection of exclusively longlink files', async () => {
  await uploadAndVerifyCollection([
    // Bare filenames well over 100 chars
    { name: 'a'.repeat(101), content: 'bare-101' },
    { name: 'b'.repeat(120), content: 'bare-120' },
    { name: 'c'.repeat(150), content: 'bare-150' },
    { name: 'd'.repeat(200), content: 'bare-200' },

    // Short directory + long filename
    { name: 'src/' + 'e'.repeat(101), content: 'dir-name-101' },
    { name: 'assets/images/' + 'f'.repeat(110), content: 'dir-name-110' },
    { name: 'packages/auth/src/' + 'g'.repeat(105), content: 'dir-name-105' },

    // Prefix exceeds 155
    { name: 'a'.repeat(156) + '/' + 'h'.repeat(10), content: 'prefix-156' },
    { name: 'a'.repeat(180) + '/' + 'i'.repeat(20), content: 'prefix-180' },

    // Total path length well over 256
    { name: 'a'.repeat(155) + '/' + 'j'.repeat(101), content: 'total-257' },
    { name: 'a'.repeat(155) + '/' + 'k'.repeat(150), content: 'total-306' },

    // Triply nested — every possible split gives either prefix > 155 or name > 100
    { name: 'a'.repeat(100) + '/' + 'b'.repeat(100) + '/' + 'c'.repeat(100), content: 'triple-nested' },
  ])
})
