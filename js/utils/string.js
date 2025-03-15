export const addTrailingSlash = (str) => (!/\/$/.test(str) ? `${str}/` : str)
export const removeTrailingSlash = (str) => str.replace(/\/$/, '')
export const capitalize = (str) => str[0].toUpperCase() + str.slice(1)
