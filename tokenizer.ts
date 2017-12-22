export const openListDelimiters = ['(', '[']
export const closeListDelimiters = [')', ']']
export const listDelimiters = [
  ...openListDelimiters,
  ...closeListDelimiters,
]
export const stopChars = [...listDelimiters, ' ', '\n', '\t']
export const avoidChars = [' ', '\n', '\t']
export const stringDelimiters = [`'`, '"']

export const tokenize = code => {
  let tokens = []
  let chars = code.split('')
  let token = ''
  let stringFlag = false
  for (let i = 0, char; char = chars[i]; i++) {
    if (stringFlag || stopChars.indexOf(char) === -1) {
      if (stringDelimiters.indexOf(char) !== -1) {
        stringFlag = !stringFlag
      }
      if (stringFlag || avoidChars.indexOf(char) === -1) {
        token += char
      }
    } else {
      if (token !== '') {
        tokens.push(token)
      }
      if (avoidChars.indexOf(char) === -1) {
        tokens.push(char)
      }
      token = ''
    }
  }
  tokens = tokens
  return tokens
}
