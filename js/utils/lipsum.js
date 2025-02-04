const words =
  'lorem ipsum dolor sit amet consectetur adipiscing elit ut eget turpis dolor id elementum urna sed arcu magna accumsan volutpat tristique eu rhoncus at lectus quisque lacus ante semper in feugiat vitae commodo non mauris quisque vel sem sem maecenas pellentesque ultrices tristique fusce nibh enim porta in convallis id consequat quis purus fusce iaculis enim id mauris mollis id accumsan ipsum sagittis quisque in pharetra magna integer a mattis mauris nulla condimentum molestie massa a malesuada diam rutrum vel suspendisse fermentum lacus id erat volutpat cursus donec at felis ante eget cursus risus nunc in odio nec mi gravida rutrum nec pulvinar turpis quisque id tellus sem nunc sed dui quis mi tristique viverra'.split(
    ' '
  )

const rand = (len) => Math.floor(Math.random() * len)
const range = (min, max) => rand(max - min + 1) + min
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

const generateText = (min, max, generator, joiner = ' ') => {
  const count = typeof max === 'number' ? range(min, max) : min
  return Array.from({ length: count }, generator).join(joiner)
}

export const generateWords = (min = 1, max, cap = false) => {
  if (min < 1) return ''
  const text = generateText(min, max, () => words[rand(words.length)])
  return cap ? capitalize(text) : text
}

export const generateSentences = (min = 8, max) => {
  if (min < 1) return ''
  const count = typeof max === 'number' ? range(min, max) : min
  const commaPosition = rand(2) ? rand(count - 1) : null
  const sentence = generateText(
    count,
    null,
    (i) => `${words[rand(words.length)]}${i === commaPosition ? ',' : ''}`
  )
  return capitalize(sentence.trim()) + '.'
}

export const generateParagraphs = (min = 40, max) => {
  if (min < 1) return ''
  const count = typeof max === 'number' ? range(min, max) : min
  const sentences = Math.floor(count / 8)
  const rest = count % 8
  let paragraph = generateText(sentences, null, () => generateSentences(8), ' ')
  if (rest) paragraph += ' ' + generateSentences(rest)
  return paragraph.trim()
}
